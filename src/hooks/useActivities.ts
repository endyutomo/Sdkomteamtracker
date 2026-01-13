import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DailyActivity, ActivityType, ActivityCategory, Collaboration, CollaborationPerson } from '@/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// Helper function to parse collaboration data from JSON
const parseCollaboration = (data: Json | null): Collaboration | undefined => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return undefined;

  const obj = data as Record<string, unknown>;

  return {
    division: (obj.division as 'presales' | 'other') || 'other',
    personId: obj.personId as string | undefined,
    personName: (obj.personName as string) || '',
    collaborators: Array.isArray(obj.collaborators)
      ? (obj.collaborators as CollaborationPerson[]).map(c => ({
          ...c,
          division: c.division || 'other'
        }))
      : undefined,
  };
};

export function useActivities() {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchActivities = useCallback(async () => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const mapped: DailyActivity[] = (data || []).map((a) => ({
        id: a.id,
        userId: a.user_id,
        date: new Date(a.date),
        category: a.category as ActivityCategory,
        personId: a.person_id || '',
        personName: a.person_name,
        activityType: a.activity_type as ActivityType,
        customerName: a.customer_name,
        project: a.project ?? undefined,
        opportunity: a.opportunity ?? undefined,
        notes: a.notes || '',
        collaboration: parseCollaboration(a.collaboration),
        photos: a.photos || [],
        latitude: a.latitude ?? undefined,
        longitude: a.longitude ?? undefined,
        locationName: a.location_name ?? undefined,
        reminderAt: a.reminder_at ? new Date(a.reminder_at) : null,
        createdAt: new Date(a.created_at),
      }));

      setActivities(mapped);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Gagal memuat data aktivitas');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const addActivity = async (activity: Omit<DailyActivity, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) return;

    try {
      // Cast activity_type as any to handle extended enum values not yet in auto-generated types
      const insertData = {
        user_id: user.id,
        date: activity.date instanceof Date
          ? activity.date.toISOString().split('T')[0]
          : String(activity.date),
        category: activity.category,
        person_id: activity.personId || null,
        person_name: activity.personName,
        activity_type: activity.activityType as any,
        customer_name: activity.customerName,
        project: activity.project || null,
        opportunity: activity.opportunity || null,
        notes: activity.notes,
        collaboration: activity.collaboration ? JSON.parse(JSON.stringify(activity.collaboration)) : null,
        photos: activity.photos || [],
        latitude: activity.latitude ?? null,
        longitude: activity.longitude ?? null,
        location_name: activity.locationName ?? null,
        reminder_at: activity.reminderAt instanceof Date
          ? activity.reminderAt.toISOString()
          : activity.reminderAt ?? null,
      };

      const { data, error } = await supabase
        .from('activities')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const newActivity: DailyActivity = {
        id: data.id,
        userId: data.user_id,
        date: new Date(data.date),
        category: data.category as ActivityCategory,
        personId: data.person_id || '',
        personName: data.person_name,
        activityType: data.activity_type as ActivityType,
        customerName: data.customer_name,
        project: data.project ?? undefined,
        opportunity: data.opportunity ?? undefined,
        notes: data.notes || '',
        collaboration: parseCollaboration(data.collaboration),
        photos: data.photos || [],
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
        locationName: data.location_name ?? undefined,
        reminderAt: data.reminder_at ? new Date(data.reminder_at) : null,
        createdAt: new Date(data.created_at),
      };

      setActivities((prev) => [newActivity, ...prev]);
      toast.success('Aktivitas berhasil ditambahkan');

      // Send notifications to collaborators
      if (activity.collaboration?.collaborators && activity.collaboration.collaborators.length > 0) {
        await sendCollaborationNotifications(
          activity.collaboration.collaborators,
          activity.personName,
          activity.customerName,
          activity.activityType,
          activity.date,
          data.id
        );
      }

      return newActivity;
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error('Gagal menambahkan aktivitas');
    }
  };

  // Send notifications to collaborators
  const sendCollaborationNotifications = async (
    collaborators: CollaborationPerson[],
    creatorName: string,
    customerName: string,
    activityType: ActivityType,
    activityDate: Date,
    activityId: string
  ) => {
    const activityTypeLabels: Record<string, string> = {
      visit: 'Kunjungan',
      call: 'Telepon',
      email: 'Email',
      meeting: 'Meeting',
      other: 'Lainnya'
    };

    for (const collab of collaborators) {
      // Find the user_id for this collaborator
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('id', collab.personId)
        .single();

      if (profile?.user_id) {
        const formattedDate = activityDate instanceof Date
          ? activityDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
          : new Date(activityDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        await supabase.from('notifications').insert({
          user_id: profile.user_id,
          activity_id: activityId,
          title: `Kolaborasi: ${activityTypeLabels[activityType] || activityType}`,
          message: `${creatorName} menambahkan Anda sebagai kolaborator untuk ${activityTypeLabels[activityType].toLowerCase()} dengan ${customerName} pada ${formattedDate}.`,
        });
      }
    }
  };

  const updateActivity = async (id: string, updates: Partial<Omit<DailyActivity, 'id' | 'createdAt'>>) => {
    try {
      const updateData: Record<string, unknown> = {};

      if (updates.date !== undefined) {
        updateData.date = updates.date instanceof Date
          ? updates.date.toISOString().split('T')[0]
          : updates.date;
      }
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.personId !== undefined) updateData.person_id = updates.personId || null;
      if (updates.personName !== undefined) updateData.person_name = updates.personName;
      if (updates.activityType !== undefined) updateData.activity_type = updates.activityType;
      if (updates.customerName !== undefined) updateData.customer_name = updates.customerName;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.project !== undefined) updateData.project = updates.project || null;
      if (updates.opportunity !== undefined) updateData.opportunity = updates.opportunity || null;
      if (updates.collaboration !== undefined) updateData.collaboration = updates.collaboration || null;
      if (updates.photos !== undefined) updateData.photos = updates.photos;
      if (updates.latitude !== undefined) updateData.latitude = updates.latitude ?? null;
      if (updates.longitude !== undefined) updateData.longitude = updates.longitude ?? null;
      if (updates.locationName !== undefined) updateData.location_name = updates.locationName ?? null;
      if (updates.reminderAt !== undefined) {
        updateData.reminder_at = updates.reminderAt instanceof Date
          ? updates.reminderAt.toISOString()
          : updates.reminderAt ?? null;
      }

      const { error } = await supabase
        .from('activities')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setActivities((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
      );
      toast.success('Aktivitas berhasil diperbarui');
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Gagal memperbarui aktivitas');
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      const { error } = await supabase.from('activities').delete().eq('id', id);

      if (error) throw error;

      setActivities((prev) => prev.filter((a) => a.id !== id));
      toast.success('Aktivitas berhasil dihapus');
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Gagal menghapus aktivitas');
    }
  };

  return {
    activities,
    loading,
    addActivity,
    updateActivity,
    deleteActivity,
    refetch: fetchActivities,
    getAvailableYears: useCallback(() => {
      const years = activities.map(a => new Date(a.date).getFullYear());
      return [...new Set(years)].sort((a, b) => b - a);
    }, [activities]),
    getMonthlyActivityTrend: useCallback((year: number) => {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
        'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
      ];

      return months.map((monthName, index) => {
        const month = index + 1;
        const monthActivities = activities.filter(a => {
          const d = new Date(a.date);
          return d.getFullYear() === year && (d.getMonth() + 1) === month;
        });

        const salesCount = monthActivities.filter(a => a.category === 'sales').length;
        const presalesCount = monthActivities.filter(a => a.category === 'presales').length;

        return {
          month: monthName,
          sales: salesCount,
          presales: presalesCount,
          total: salesCount + presalesCount,
        };
      });
    }, [activities]),
  };
}
