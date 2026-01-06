import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Person, PersonRole } from '@/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export function usePersons() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchPersons = useCallback(async () => {
    if (!user) {
      setPersons([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: Person[] = (data || []).map((p) => ({
        id: p.id,
        name: p.name,
        role: p.role as PersonRole,
        createdAt: new Date(p.created_at),
      }));

      setPersons(mapped);
    } catch (error) {
      console.error('Error fetching persons:', error);
      toast.error('Gagal memuat data person');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPersons();
  }, [fetchPersons]);

  const addPerson = async (person: Omit<Person, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('persons')
        .insert({
          user_id: user.id,
          name: person.name,
          role: person.role,
        })
        .select()
        .single();

      if (error) throw error;

      const newPerson: Person = {
        id: data.id,
        name: data.name,
        role: data.role as PersonRole,
        createdAt: new Date(data.created_at),
      };

      setPersons((prev) => [newPerson, ...prev]);
      toast.success('Person berhasil ditambahkan');
      return newPerson;
    } catch (error) {
      console.error('Error adding person:', error);
      toast.error('Gagal menambahkan person');
    }
  };

  const updatePerson = async (id: string, updates: Partial<Omit<Person, 'id' | 'createdAt'>>) => {
    try {
      const { error } = await supabase
        .from('persons')
        .update({
          name: updates.name,
          role: updates.role,
        })
        .eq('id', id);

      if (error) throw error;

      setPersons((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
      toast.success('Data person berhasil diperbarui');
    } catch (error) {
      console.error('Error updating person:', error);
      toast.error('Gagal memperbarui person');
    }
  };

  const deletePerson = async (id: string) => {
    try {
      const { error } = await supabase.from('persons').delete().eq('id', id);

      if (error) throw error;

      setPersons((prev) => prev.filter((p) => p.id !== id));
      toast.success('Person berhasil dihapus');
    } catch (error) {
      console.error('Error deleting person:', error);
      toast.error('Gagal menghapus person');
    }
  };

  return {
    persons,
    loading,
    addPerson,
    updatePerson,
    deletePerson,
    refetch: fetchPersons,
  };
}
