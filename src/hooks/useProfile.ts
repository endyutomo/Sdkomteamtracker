// Profile hook for managing user profiles
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { profileSchema } from '@/lib/validations';

export type DivisionType = 'sales' | 'presales' | 'manager';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  jabatan: string | null;
  division: DivisionType;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data as Profile);
        setIsManager(data.division === 'manager');

        // Check if user is superadmin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        setIsSuperadmin(roleData?.role === 'superadmin');
      } else {
        setProfile(null);
        setIsManager(false);
        setIsSuperadmin(false);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchAllProfiles = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllProfiles((data || []) as Profile[]);
    } catch (error: any) {
      console.error('Error fetching all profiles:', error.message);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    // Fetch all profiles when profile is loaded (for managers to see team)
    if (profile) {
      fetchAllProfiles();
    }
  }, [profile, fetchAllProfiles]);

  const createProfile = async (profileData: { name: string; jabatan: string; division: DivisionType }) => {
    if (!user) return;

    // Validate input
    const validation = profileSchema.safeParse(profileData);
    if (!validation.success) {
      toast({
        title: 'Error',
        description: validation.error.errors[0]?.message || 'Data tidak valid',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          name: validation.data.name,
          jabatan: validation.data.jabatan,
          division: validation.data.division,
        })
        .select()
        .single();

      if (error) throw error;

      // Also create user role
      await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'user',
        });

      setProfile(data as Profile);
      setIsManager(data.division === 'manager');
      toast({
        title: 'Berhasil',
        description: 'Profile berhasil dibuat',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateProfile = async (id: string, updates: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    // Validate input
    const partialSchema = profileSchema.partial();
    const validation = partialSchema.safeParse(updates);
    if (!validation.success) {
      toast({
        title: 'Error',
        description: validation.error.errors[0]?.message || 'Data tidak valid',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(validation.data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (profile?.id === id) {
        setProfile(data as Profile);
        setIsManager(data.division === 'manager');
      }

      if (isManager) {
        fetchAllProfiles();
      }

      toast({
        title: 'Berhasil',
        description: 'Profile berhasil diupdate',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const deleteProfile = async (id: string) => {
    try {
      // First get the user_id from the profile
      const profileToDelete = allProfiles.find(p => p.id === id);
      if (!profileToDelete) {
        toast({
          title: 'Error',
          description: 'Profile tidak ditemukan',
          variant: 'destructive',
        });
        return;
      }

      // Call Edge Function to delete user completely
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({ targetUserId: profileToDelete.user_id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menghapus user');
      }

      if (isManager) {
        fetchAllProfiles();
      }

      toast({
        title: 'Berhasil',
        description: 'User berhasil dihapus sepenuhnya dari sistem',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    profile,
    allProfiles,
    loading,
    isManager,
    isSuperadmin,
    createProfile,
    updateProfile,
    deleteProfile,
    refetch: fetchProfile,
    refetchAll: fetchAllProfiles,
  };
}
