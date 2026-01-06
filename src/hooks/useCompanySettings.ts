import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CompanySettings {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as CompanySettings | null);
    } catch (error: any) {
      console.error('Error fetching company settings:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<Omit<CompanySettings, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      if (settings) {
        const { data, error } = await supabase
          .from('company_settings')
          .update(updates)
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;
        setSettings(data as CompanySettings);
      } else {
        const { data, error } = await supabase
          .from('company_settings')
          .insert(updates)
          .select()
          .single();

        if (error) throw error;
        setSettings(data as CompanySettings);
      }

      toast({
        title: 'Berhasil',
        description: 'Pengaturan perusahaan berhasil diupdate',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('sdkom')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('sdkom')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Gagal mengupload logo: ' + error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  return {
    settings,
    loading,
    updateSettings,
    uploadLogo,
    refetch: fetchSettings,
  };
}
