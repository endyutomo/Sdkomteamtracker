import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle } from 'lucide-react';
import { DivisionType } from '@/hooks/useProfile';
import { PendingManagerRequest } from '@/hooks/usePendingManagerRequests';

interface ProfileFormProps {
  open: boolean;
  onSubmit: (data: { name: string; jabatan: string; division: DivisionType }) => void;
  onManagerRequest?: (data: { name: string; jabatan: string; email: string }) => Promise<PendingManagerRequest | null>;
  userEmail?: string;
  pendingRequest?: PendingManagerRequest | null;
  isNewUser?: boolean;
}

export function ProfileForm({
  open,
  onSubmit,
  onManagerRequest,
  userEmail = '',
  pendingRequest,
  isNewUser = true
}: ProfileFormProps) {
  const [name, setName] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [division, setDivision] = useState<DivisionType>('sales');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    try {
      // If division is manager, send request for approval
      await onSubmit({ name: name.trim(), jabatan: jabatan.trim(), division });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {isNewUser ? 'Lengkapi Profile Anda' : 'Edit Profile'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jabatan">Jabatan</Label>
            <Input
              id="jabatan"
              value={jabatan}
              onChange={(e) => setJabatan(e.target.value)}
              placeholder="Masukkan jabatan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="division">Divisi *</Label>
            <Select value={division} onValueChange={(val) => setDivision(val as DivisionType)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="presales">Presales</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>


          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : 'Simpan Profile'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
