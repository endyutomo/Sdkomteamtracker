import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  user_id: string;
  activity_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
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

      const notifs = (data || []) as Notification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    } catch (error: any) {
      console.error('Error fetching notifications:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Check for due reminders
  const checkReminders = useCallback(async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();
      
      // Find activities with reminders that are due
      const { data: activities, error } = await supabase
        .from('activities')
        .select('id, customer_name, activity_type, date, reminder_at')
        .eq('user_id', user.id)
        .lte('reminder_at', now)
        .not('reminder_at', 'is', null);

      if (error) throw error;

      if (activities && activities.length > 0) {
        for (const activity of activities) {
          // Check if notification already exists for this activity
          const { data: existingNotif } = await supabase
            .from('notifications')
            .select('id')
            .eq('activity_id', activity.id)
            .eq('user_id', user.id)
            .single();

          if (!existingNotif) {
            // Create notification
            const activityTypeLabels: Record<string, string> = {
              visit: 'Kunjungan',
              call: 'Telepon',
              email: 'Email',
              meeting: 'Meeting',
              other: 'Lainnya'
            };

            await supabase.from('notifications').insert({
              user_id: user.id,
              activity_id: activity.id,
              title: `Reminder: ${activityTypeLabels[activity.activity_type] || activity.activity_type}`,
              message: `Aktivitas dengan ${activity.customer_name} dijadwalkan hari ini.`,
            });

            // Clear the reminder_at after notification created
            await supabase
              .from('activities')
              .update({ reminder_at: null })
              .eq('id', activity.id);

            // Show browser notification if permitted
            if (Notification.permission === 'granted') {
              new Notification(`Reminder: ${activityTypeLabels[activity.activity_type]}`, {
                body: `Aktivitas dengan ${activity.customer_name}`,
                icon: '/favicon.ico'
              });
            }

            // Also show toast
            toast.info(`Reminder: ${activity.customer_name}`, {
              description: `${activityTypeLabels[activity.activity_type]} dijadwalkan`,
            });
          }
        }
        
        // Refresh notifications
        fetchNotifications();
      }
    } catch (error: any) {
      console.error('Error checking reminders:', error.message);
    }
  }, [user, fetchNotifications]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error marking notification as read:', error.message);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error: any) {
      console.error('Error marking all as read:', error.message);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const notif = notifications.find(n => n.id === id);
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notif && !notif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error: any) {
      console.error('Error deleting notification:', error.message);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
    requestNotificationPermission();
  }, [fetchNotifications]);

  // Check reminders periodically (every minute)
  useEffect(() => {
    if (!user) return;

    checkReminders();
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [user, checkReminders]);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
