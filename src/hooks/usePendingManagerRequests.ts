import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface PendingManagerRequest {
  id: string;
  user_id: string;
  name: string;
  jabatan: string | null;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export function usePendingManagerRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<PendingManagerRequest[]>([]);
  const [myRequest, setMyRequest] = useState<PendingManagerRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pending_manager_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const typedData = (data || []) as PendingManagerRequest[];
      setRequests(typedData);
      
      // Find current user's pending request
      const userRequest = typedData.find(r => r.user_id === user.id && r.status === 'pending');
      setMyRequest(userRequest || null);
    } catch (error: any) {
      console.error('Error fetching pending requests:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (data: { name: string; jabatan: string; email: string }) => {
    if (!user) return null;

    try {
      const { data: newRequest, error } = await supabase
        .from('pending_manager_requests')
        .insert({
          user_id: user.id,
          name: data.name,
          jabatan: data.jabatan || null,
          email: data.email,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for superadmin
      const { data: superadminRole } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'superadmin')
        .maybeSingle();

      if (superadminRole) {
        await supabase.from('notifications').insert({
          user_id: superadminRole.user_id,
          title: 'Permintaan Pendaftaran Manager',
          message: `${data.name} meminta untuk didaftarkan sebagai Manager. Email: ${data.email}`,
        });
      }

      setMyRequest(newRequest as PendingManagerRequest);
      toast.success('Permintaan pendaftaran manager telah dikirim. Menunggu persetujuan superadmin.');
      return newRequest as PendingManagerRequest;
    } catch (error: any) {
      console.error('Error creating request:', error.message);
      toast.error('Gagal mengirim permintaan');
      return null;
    }
  };

  const approveRequest = async (requestId: string) => {
    if (!user) return false;

    try {
      // Get the request details
      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      // Update request status
      const { error: updateError } = await supabase
        .from('pending_manager_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create the profile with manager division
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: request.user_id,
          name: request.name,
          jabatan: request.jabatan,
          division: 'manager',
        });

      if (profileError) throw profileError;

      // Create user role
      await supabase
        .from('user_roles')
        .insert({
          user_id: request.user_id,
          role: 'user',
        });

      // Notify the user
      await supabase.from('notifications').insert({
        user_id: request.user_id,
        title: 'Permintaan Disetujui',
        message: 'Permintaan pendaftaran sebagai Manager telah disetujui. Silakan login kembali.',
      });

      toast.success('Permintaan berhasil disetujui');
      fetchRequests();
      return true;
    } catch (error: any) {
      console.error('Error approving request:', error.message);
      toast.error('Gagal menyetujui permintaan: ' + error.message);
      return false;
    }
  };

  const rejectRequest = async (requestId: string) => {
    if (!user) return false;

    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) throw new Error('Request not found');

      const { error } = await supabase
        .from('pending_manager_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      // Notify the user
      await supabase.from('notifications').insert({
        user_id: request.user_id,
        title: 'Permintaan Ditolak',
        message: 'Permintaan pendaftaran sebagai Manager ditolak. Silakan hubungi admin untuk informasi lebih lanjut.',
      });

      toast.success('Permintaan berhasil ditolak');
      fetchRequests();
      return true;
    } catch (error: any) {
      console.error('Error rejecting request:', error.message);
      toast.error('Gagal menolak permintaan');
      return false;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return {
    requests,
    pendingRequests,
    myRequest,
    loading,
    createRequest,
    approveRequest,
    rejectRequest,
    refetch: fetchRequests,
  };
}
