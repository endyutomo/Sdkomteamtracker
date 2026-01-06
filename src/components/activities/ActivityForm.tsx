import { useState, useEffect } from 'react';
import { DailyActivity, ActivityType, Person, Collaboration } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (activity: Omit<DailyActivity, 'id' | 'createdAt'>) => void;
  persons: Person[];
  editActivity?: DailyActivity | null;
}

const activityTypes: { value: ActivityType; label: string }[] = [
  { value: 'visit', label: 'Kunjungan' },
  { value: 'call', label: 'Telepon' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Lainnya' },
];

export function ActivityForm({ open, onClose, onSubmit, persons, editActivity }: ActivityFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [salesPersonId, setSalesPersonId] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('visit');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [hasCollaboration, setHasCollaboration] = useState(false);
  const [collaborationDivision, setCollaborationDivision] = useState<'presales' | 'other'>('presales');
  const [collaborationPersonId, setCollaborationPersonId] = useState('');
  const [collaborationPersonName, setCollaborationPersonName] = useState('');

  const salesPersons = persons.filter(p => p.role === 'sales');
  const presalesPersons = persons.filter(p => p.role === 'presales');
  const otherPersons = persons.filter(p => p.role === 'other');

  useEffect(() => {
    if (editActivity) {
      setDate(new Date(editActivity.date));
      setSalesPersonId(editActivity.salesPersonId);
      setActivityType(editActivity.activityType);
      setCustomerName(editActivity.customerName);
      setNotes(editActivity.notes);
      if (editActivity.collaboration) {
        setHasCollaboration(true);
        setCollaborationDivision(editActivity.collaboration.division);
        setCollaborationPersonId(editActivity.collaboration.personId || '');
        setCollaborationPersonName(editActivity.collaboration.personName);
      }
    } else {
      resetForm();
    }
  }, [editActivity, open]);

  const resetForm = () => {
    setDate(new Date());
    setSalesPersonId('');
    setActivityType('visit');
    setCustomerName('');
    setNotes('');
    setHasCollaboration(false);
    setCollaborationDivision('presales');
    setCollaborationPersonId('');
    setCollaborationPersonName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!salesPersonId) {
      toast.error('Pilih sales person');
      return;
    }
    
    if (!customerName.trim()) {
      toast.error('Masukkan nama customer');
      return;
    }

    const salesPerson = persons.find(p => p.id === salesPersonId);
    
    let collaboration: Collaboration | undefined;
    if (hasCollaboration && activityType === 'visit') {
      const collabPerson = persons.find(p => p.id === collaborationPersonId);
      const personName = collabPerson?.name || collaborationPersonName;
      
      if (!personName.trim()) {
        toast.error('Masukkan nama orang untuk kolaborasi');
        return;
      }
      
      collaboration = {
        division: collaborationDivision,
        personId: collaborationPersonId || undefined,
        personName,
      };
    }

    onSubmit({
      date,
      salesPersonId,
      salesPersonName: salesPerson?.name || '',
      activityType,
      customerName: customerName.trim(),
      notes: notes.trim(),
      collaboration,
    });

    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editActivity ? 'Edit Aktivitas' : 'Tambah Aktivitas Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Date */}
          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP', { locale: id }) : 'Pilih tanggal'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Sales Person */}
          <div className="space-y-2">
            <Label>Sales Person</Label>
            <Select value={salesPersonId} onValueChange={setSalesPersonId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih sales person" />
              </SelectTrigger>
              <SelectContent>
                {salesPersons.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Belum ada data sales. Tambahkan di menu Data Person.
                  </div>
                ) : (
                  salesPersons.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Activity Type */}
          <div className="space-y-2">
            <Label>Tipe Aktivitas</Label>
            <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Name */}
          <div className="space-y-2">
            <Label>Nama Customer</Label>
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Masukkan nama customer"
            />
          </div>

          {/* Collaboration (only for visit) */}
          {activityType === 'visit' && (
            <div className="space-y-4 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label className="font-medium">Kolaborasi</Label>
                </div>
                <Switch
                  checked={hasCollaboration}
                  onCheckedChange={setHasCollaboration}
                />
              </div>

              {hasCollaboration && (
                <div className="space-y-4 animate-slide-up">
                  <div className="space-y-2">
                    <Label>Divisi</Label>
                    <Select
                      value={collaborationDivision}
                      onValueChange={(v) => {
                        setCollaborationDivision(v as 'presales' | 'other');
                        setCollaborationPersonId('');
                        setCollaborationPersonName('');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="presales">Presales</SelectItem>
                        <SelectItem value="other">Divisi Lain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      {collaborationDivision === 'presales' ? 'Pilih Presales' : 'Nama Orang'}
                    </Label>
                    {collaborationDivision === 'presales' ? (
                      <>
                        <Select value={collaborationPersonId} onValueChange={(v) => {
                          setCollaborationPersonId(v);
                          const person = presalesPersons.find(p => p.id === v);
                          setCollaborationPersonName(person?.name || '');
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih presales" />
                          </SelectTrigger>
                          <SelectContent>
                            {presalesPersons.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">
                                Belum ada data presales
                              </div>
                            ) : (
                              presalesPersons.map((person) => (
                                <SelectItem key={person.id} value={person.id}>
                                  {person.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {presalesPersons.length === 0 && (
                          <Input
                            value={collaborationPersonName}
                            onChange={(e) => setCollaborationPersonName(e.target.value)}
                            placeholder="Atau ketik nama manual"
                            className="mt-2"
                          />
                        )}
                      </>
                    ) : (
                      <Input
                        value={collaborationPersonName}
                        onChange={(e) => setCollaborationPersonName(e.target.value)}
                        placeholder="Masukkan nama orang dari divisi lain"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Catatan</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan (opsional)"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" className="flex-1">
              {editActivity ? 'Simpan Perubahan' : 'Tambah Aktivitas'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
