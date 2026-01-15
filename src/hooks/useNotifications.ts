import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Notification } from '@/types/notifications';
import { toast } from 'sonner';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifs = (data || []).map(n => ({
        ...n,
        created_at: new Date(n.created_at),
        updated_at: new Date(n.updated_at),
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast.error('Gagal memuat notifikasi');
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = {
            ...payload.new,
            created_at: new Date(payload.new.created_at),
            updated_at: new Date(payload.new.updated_at),
          } as Notification;

          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast notification
          toast.info(newNotif.title, {
            description: newNotif.message,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNotif = {
            ...payload.new,
            created_at: new Date(payload.new.created_at),
            updated_at: new Date(payload.new.updated_at),
          } as Notification;

          setNotifications(prev =>
            prev.map(n => (n.id === updatedNotif.id ? updatedNotif : n))
          );

          // Update unread count
          setUnreadCount(prev => {
            const wasUnread = !payload.old.read;
            const isNowRead = updatedNotif.read;
            if (wasUnread && isNowRead) return prev - 1;
            if (!wasUnread && !isNowRead) return prev + 1;
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
          if (!payload.old.read) {
            setUnreadCount(prev => prev - 1);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast.error('Gagal menandai notifikasi sebagai dibaca');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      toast.success('Semua notifikasi ditandai sebagai dibaca');
    } catch (error: any) {
      console.error('Error marking all as read:', error);
      toast.error('Gagal menandai semua notifikasi');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      toast.success('Notifikasi dihapus');
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast.error('Gagal menghapus notifikasi');
    }
  };

  // Accept booking
  const acceptBooking = async (notificationId: string, bookingId: string) => {
    try {
      // 1. Update booking acceptance_status
      const { error: bookingError } = await supabase
        .from('driver_bookings')
        .update({
          acceptance_status: 'accepted',
          status: 'confirmed',
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // 2. Get shipment_id from booking
      const { data: booking, error: fetchError } = await supabase
        .from('driver_bookings')
        .select('shipment_id')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      // 3. Update shipment status to 'booked'
      const { error: shipmentError } = await supabase
        .from('shipments')
        .update({ status: 'booked' })
        .eq('id', booking.shipment_id);

      if (shipmentError) throw shipmentError;

      // 4. Mark notification as action_taken
      const { error: notifError } = await supabase
        .from('notifications')
        .update({
          read: true,
          action_taken: true,
        })
        .eq('id', notificationId);

      if (notifError) throw notifError;

      toast.success('Booking diterima! Pengiriman telah ditugaskan kepada Anda.');
      return true;
    } catch (error: any) {
      console.error('Error accepting booking:', error);
      toast.error('Gagal menerima booking: ' + error.message);
      return false;
    }
  };

  // Reject booking
  const rejectBooking = async (notificationId: string, bookingId: string, reason?: string) => {
    try {
      // 1. Update booking acceptance_status
      const { error: bookingError } = await supabase
        .from('driver_bookings')
        .update({
          acceptance_status: 'rejected',
          status: 'cancelled',
          notes: reason || 'Ditolak oleh driver',
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // 2. Mark notification as action_taken
      const { error: notifError } = await supabase
        .from('notifications')
        .update({
          read: true,
          action_taken: true,
        })
        .eq('id', notificationId);

      if (notifError) throw notifError;

      toast.success('Booking ditolak. Backoffice akan diberi tahu.');
      return true;
    } catch (error: any) {
      console.error('Error rejecting booking:', error);
      toast.error('Gagal menolak booking: ' + error.message);
      return false;
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    acceptBooking,
    rejectBooking,
    refetch: fetchNotifications,
  };
}
