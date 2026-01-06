import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Person, PersonRole } from '@/types';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { personSchema } from '@/lib/validations';

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

    // Validate input
    const validation = personSchema.safeParse(person);
    if (!validation.success) {
      toast.error(validation.error.errors[0]?.message || 'Data tidak valid');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('persons')
        .insert({
          user_id: user.id,
          name: validation.data.name,
          role: validation.data.role,
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
    // Validate input if provided
    if (updates.name !== undefined || updates.role !== undefined) {
      const partialSchema = personSchema.partial();
      const validation = partialSchema.safeParse(updates);
      if (!validation.success) {
        toast.error(validation.error.errors[0]?.message || 'Data tidak valid');
        return;
      }
    }

    try {
      const { error } = await supabase
        .from('persons')
        .update({
          name: updates.name?.trim(),
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
