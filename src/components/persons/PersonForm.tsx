import { useState, useEffect } from 'react';
import { Person, PersonRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PersonFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (person: Omit<Person, 'id' | 'createdAt'>) => void;
  editPerson?: Person | null;
}

const roles: { value: PersonRole; label: string }[] = [
  { value: 'sales', label: 'Sales' },
  { value: 'presales', label: 'Presales' },
  { value: 'other', label: 'Lainnya' },
];

export function PersonForm({ open, onClose, onSubmit, editPerson }: PersonFormProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<PersonRole>('sales');

  useEffect(() => {
    if (editPerson) {
      setName(editPerson.name);
      setRole(editPerson.role);
    } else {
      setName('');
      setRole('sales');
    }
  }, [editPerson, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Masukkan nama');
      return;
    }

    onSubmit({
      name: name.trim(),
      role,
    });

    setName('');
    setRole('sales');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editPerson ? 'Edit Data Person' : 'Tambah Person Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>Nama</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Status/Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as PersonRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              {editPerson ? 'Simpan Perubahan' : 'Tambah Person'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
