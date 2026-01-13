import { useState, useEffect, useRef } from 'react';
import { DailyActivity, ActivityType, ActivityCategory, Person, Collaboration, CollaborationPerson } from '@/types';
import { Profile } from '@/hooks/useProfile';
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
import { format, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Users, Camera, X, ImagePlus, Bell, Shield, Plus, Trash2, Lock, CalendarDays, Stethoscope, Plane, Home, Briefcase, Clock } from 'lucide-react';
import { CollaboratorBookingCalendar } from './CollaboratorBookingCalendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LocationPicker } from './LocationPicker';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LocationData {
  latitude: number;
  longitude: number;
  locationName: string;
}

interface ActivityFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (activity: Omit<DailyActivity, 'id' | 'createdAt' | 'userId'>) => void;
  persons: Person[];
  allProfiles?: Profile[];
  currentProfile?: Profile | null;
  editActivity?: DailyActivity | null;
  allActivities?: DailyActivity[]; // To check for booking conflicts
}

const activityTypes: { value: ActivityType; label: string }[] = [
  { value: 'visit', label: 'Kunjungan' },
  { value: 'call', label: 'Telepon' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Lainnya' },
];

const attendanceTypes: { value: ActivityType; label: string; icon: any; color: string }[] = [
  { value: 'sick', label: 'Sakit', icon: Stethoscope, color: 'text-red-500' },
  { value: 'permission', label: 'Ijin', icon: Clock, color: 'text-yellow-500' },
  { value: 'time_off', label: 'Cuti', icon: Plane, color: 'text-purple-500' },
  { value: 'wfh', label: 'WFH', icon: Home, color: 'text-blue-500' },
];

export function ActivityForm({ open, onClose, onSubmit, persons, allProfiles = [], currentProfile, editActivity, allActivities = [] }: ActivityFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<ActivityCategory>('sales');
  const [personId, setPersonId] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('visit');
  const [isAttendanceMode, setIsAttendanceMode] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [project, setProject] = useState('');
  const [opportunity, setOpportunity] = useState('');
  const [notes, setNotes] = useState('');
  const [hasCollaboration, setHasCollaboration] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaborationPerson[]>([]);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('');
  const [collaboratorBookingDate, setCollaboratorBookingDate] = useState<Date>(new Date());
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationData | undefined>();
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date | undefined>();
  const [reminderTime, setReminderTime] = useState('09:00');
  const [superadminIds, setSuperadminIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch superadmin IDs
  useEffect(() => {
    const fetchSuperadmins = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'superadmin');
      if (data) {
        setSuperadminIds(data.map((r) => r.user_id));
      }
    };
    fetchSuperadmins();
  }, []);

  const isUserSuperadmin = (userId: string) => superadminIds.includes(userId);

  // Get superadmin profiles
  const superadminProfiles = allProfiles.filter(p => superadminIds.includes(p.user_id));

  // Get ALL profiles for collaboration selection - everyone can be selected
  const allCollaborationOptions = allProfiles.map(p => ({
    id: p.id,
    name: p.name,
    division: p.division as 'sales' | 'presales' | 'manager' | 'backoffice' | 'logistic',
    user_id: p.user_id
  }));

  // Create a combined list of all profiles for managers/superadmins
  const allAvailableOptions = allProfiles.map(p => ({
    id: p.id,
    name: p.name,
    division: p.division,
    user_id: p.user_id
  }));

  // Get profiles by division for selection - include managers, backoffice, and superadmins
  const salesProfiles = allProfiles.filter(p => p.division === 'sales' || p.division === 'manager' || p.division === 'backoffice' || p.division === 'logistic' || superadminIds.includes(p.user_id));
  const presalesProfiles = allProfiles.filter(p => p.division === 'presales' || p.division === 'manager' || p.division === 'backoffice' || p.division === 'logistic' || superadminIds.includes(p.user_id));

  // Fall back to persons if no profiles available
  const salesPersons = persons.filter(p => p.role === 'sales');
  const presalesPersons = persons.filter(p => p.role === 'presales');

  // Use profiles first, then fall back to persons
  const availableSalesOptions = salesProfiles.length > 0
    ? salesProfiles.map(p => ({ id: p.id, name: p.name, division: p.division, user_id: p.user_id }))
    : salesPersons.map(p => ({ id: p.id, name: p.name, division: p.role, user_id: '' }));

  const availablePresalesOptions = presalesProfiles.length > 0
    ? presalesProfiles.map(p => ({ id: p.id, name: p.name, division: p.division, user_id: p.user_id }))
    : presalesPersons.map(p => ({ id: p.id, name: p.name, division: p.role, user_id: '' }));

  const availableOptions = (currentProfile?.division === 'manager' || (currentProfile && isUserSuperadmin(currentProfile.user_id)))
    ? allAvailableOptions
    : (category === 'sales' ? availableSalesOptions : availablePresalesOptions);

  // Get booked collaborators for the selected date (excluding current activity if editing)
  const getBookedCollaboratorsForDate = (selectedDate: Date): Set<string> => {
    const booked = new Set<string>();

    allActivities.forEach(activity => {
      // Skip current activity if editing
      if (editActivity && activity.id === editActivity.id) return;

      // Check if activity is on the same date
      if (isSameDay(new Date(activity.date), selectedDate)) {
        // Add all collaborators from this activity
        if (activity.collaboration?.collaborators) {
          activity.collaboration.collaborators.forEach(collab => {
            if (collab.personId) {
              booked.add(collab.personId);
            }
          });
        } else if (activity.collaboration?.personId) {
          // Legacy single collaborator
          booked.add(activity.collaboration.personId);
        }
      }
    });

    return booked;
  };

  const bookedCollaborators = getBookedCollaboratorsForDate(date);

  // Filter collaboration options to exclude already selected collaborators, current person, and booked collaborators
  const availableCollaboratorOptions = allCollaborationOptions.filter(
    p => p.id !== personId && !collaborators.some(c => c.personId === p.id)
  );

  // Set current user as default selection when opening form
  useEffect(() => {
    if (open && !editActivity && currentProfile) {
      // Auto-select current user and set category based on their division
      if (currentProfile.division === 'sales') {
        setCategory('sales');
        setPersonId(currentProfile.id);
      } else if (currentProfile.division === 'presales') {
        setCategory('presales');
        setPersonId(currentProfile.id);
      } else if (currentProfile.division === 'manager') {
        // Manager can choose, default to sales category and their own ID
        setCategory('sales');
        setPersonId(currentProfile.id);
      } else if (currentProfile.division === 'backoffice' || currentProfile.division === 'logistic') {
        // Backoffice and Logistic are locked to sales category and their own ID
        setCategory('sales');
        setPersonId(currentProfile.id);
      }

    }
  }, [open, editActivity, currentProfile]);

  useEffect(() => {
    if (editActivity) {
      setDate(new Date(editActivity.date));
      setCategory(editActivity.category || 'sales');
      setPersonId(editActivity.personId || '');
      setActivityType(editActivity.activityType);
      setCustomerName(editActivity.customerName);
      setProject(editActivity.project || '');
      setOpportunity(editActivity.opportunity || '');
      setNotes(editActivity.notes);
      setPhotos(editActivity.photos || []);
      if (editActivity.latitude && editActivity.longitude) {
        setLocation({
          latitude: editActivity.latitude,
          longitude: editActivity.longitude,
          locationName: editActivity.locationName || '',
        });
      } else {
        setLocation(undefined);
      }
      if (editActivity.collaboration) {
        setHasCollaboration(true);
        // Support both old single collaborator and new multi-collaborator format
        if (editActivity.collaboration.collaborators && editActivity.collaboration.collaborators.length > 0) {
          setCollaborators(editActivity.collaboration.collaborators);
        } else if (editActivity.collaboration.personName) {
          // Legacy format - convert to new format
          setCollaborators([{
            personId: editActivity.collaboration.personId,
            personName: editActivity.collaboration.personName,
            division: editActivity.collaboration.division === 'presales' ? 'presales' : 'other'
          }]);
        }
      }
      if (editActivity.reminderAt) {
        setHasReminder(true);
        const reminderDateTime = new Date(editActivity.reminderAt);
        setReminderDate(reminderDateTime);
        setReminderTime(
          `${String(reminderDateTime.getHours()).padStart(2, '0')}:${String(reminderDateTime.getMinutes()).padStart(2, '0')}`
        );
      } else {
        setHasReminder(false);
        setReminderDate(undefined);
        setReminderTime('09:00');
      }
    } else {
      resetForm();
    }
  }, [editActivity, open]);

  // Handle mode switch based on activity type when editing
  useEffect(() => {
    if (editActivity) {
      if (['sick', 'permission', 'time_off', 'wfh'].includes(editActivity.activityType)) {
        setIsAttendanceMode(true);
      } else {
        setIsAttendanceMode(false);
      }
    }
  }, [editActivity]);

  const resetForm = () => {
    setDate(new Date());
    setCategory('sales');
    setPersonId('');
    setActivityType('visit');
    setIsAttendanceMode(false);
    setCustomerName('');
    setProject('');
    setOpportunity('');
    setNotes('');
    setHasCollaboration(false);
    setCollaborators([]);
    setSelectedCollaboratorId('');
    setCollaboratorBookingDate(new Date());
    setPhotos([]);
    setLocation(undefined);
    setHasReminder(false);
    setReminderDate(undefined);
    setReminderTime('09:00');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran foto maksimal 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!personId) {
      toast.error(`Pilih ${category === 'sales' ? 'sales' : 'presales'} person`);
      return;
    }



    // Auto-fill customer name for attendance mode if empty (though hidden, just in case)
    let finalCustomerName = customerName.trim();
    if (isAttendanceMode) {
      // Find label
      const typeLabel = attendanceTypes.find(t => t.value === activityType)?.label || 'Absensi';
      finalCustomerName = typeLabel;
    } else if (!finalCustomerName) {
      toast.error('Nama customer wajib diisi');
      return;
    }

    // Location is mandatory for work activities, WFH, and permission
    // But optional for sick and time_off (they might be at home/hospital)
    const locationOptionalTypes = ['sick', 'time_off'];
    if (!locationOptionalTypes.includes(activityType)) {
      if (!location || !location.locationName) {
        toast.error('Lokasi dan alamat wajib diisi');
        return;
      }
    }

    const selectedOption = availableOptions.find(p => p.id === personId);

    let collaboration: Collaboration | undefined;
    if (hasCollaboration && collaborators.length > 0) {
      // Use the first collaborator for legacy fields, store all in collaborators array
      const firstCollab = collaborators[0];
      collaboration = {
        division: firstCollab.division === 'sales' || firstCollab.division === 'manager' ? 'presales' : firstCollab.division as 'presales' | 'other',
        personId: firstCollab.personId,
        personName: firstCollab.personName,
        collaborators: collaborators,
      };
    }

    // Build reminder datetime
    let reminderAt: Date | null = null;
    if (hasReminder && reminderDate) {
      const [hours, minutes] = reminderTime.split(':').map(Number);
      reminderAt = new Date(reminderDate);
      reminderAt.setHours(hours, minutes, 0, 0);
    }

    onSubmit({
      date,
      category,
      personId,
      personName: selectedOption?.name || '',
      activityType,
      customerName: finalCustomerName,
      project: project.trim() || undefined,
      opportunity: opportunity.trim() || undefined,
      notes: notes.trim(),
      collaboration,
      photos: activityType === 'visit' ? photos : undefined,
      latitude: location?.latitude,
      longitude: location?.longitude,
      locationName: location?.locationName,
      reminderAt,
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
          {/* Mode Toggle */}
          {!editActivity && (
            <div className="flex p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setIsAttendanceMode(false);
                  setActivityType('visit');
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                  !isAttendanceMode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Briefcase className="h-4 w-4" />
                Aktivitas Kerja
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAttendanceMode(true);
                  setActivityType('wfh'); // Default to WFH
                }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                  isAttendanceMode ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarDays className="h-4 w-4" />
                Status Kehadiran
              </button>
            </div>
          )}

          {!isAttendanceMode ? (
            // NORMAL ACTIVITY FORM FIELDS
            <>
              {/* Category Hapus dari UI sesuai permintaan */}            </>
          ) : (
            // ATTENDANCE MODE FIELDS - SIMPLIFIED
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-4">
              <p className="text-sm text-muted-foreground mb-4">
                Catat status kehadiran jika sedang tidak melakukan kunjungan sales reguler (Sakit, Ijin, Cuti) atau WFH.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {attendanceTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = activityType === type.value;
                  return (
                    <div
                      key={type.value}
                      onClick={() => setActivityType(type.value)}
                      className={cn(
                        "cursor-pointer flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all hover:bg-background/80",
                        isSelected
                          ? `border-primary bg-background shadow-md`
                          : "border-transparent bg-white/50 hover:border-primary/20"
                      )}
                    >
                      <div className={cn("p-2 rounded-full bg-slate-100", type.color)}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className={cn("font-medium text-sm", isSelected ? "text-primary" : "text-slate-600")}>
                        {type.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date - Shared */}
          <div className="space-y-2">
            <Label>Tanggal</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={!currentProfile || activityType === 'sick'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    (!currentProfile || activityType === 'sick') && 'bg-muted cursor-not-allowed',
                    !date && 'text-muted-foreground'
                  )}
                >
                  {(!currentProfile || activityType === 'sick') ? (
                    <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                  ) : (
                    <CalendarIcon className="mr-2 h-4 w-4" />
                  )}
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
            {activityType === 'sick' && (
              <p className="text-[10px] text-muted-foreground">Tanggal untuk status Sakit terkunci dan tidak dapat diubah.</p>
            )}
          </div>

          {/* Person - Shared but label consolidated */}
          <div className="space-y-2">
            <Label>Identitas Pelapor (Nama & Divisi)</Label>            {/* Show dropdown only for managers/superadmins, otherwise show read-only */}
            {(currentProfile?.division === 'manager' || (currentProfile && isUserSuperadmin(currentProfile.user_id))) ? (
              <Select value={personId} onValueChange={(val) => {
                setPersonId(val);
                const selected = allAvailableOptions.find(o => o.id === val);
                if (selected) {
                  setCategory(selected.division === 'presales' ? 'presales' : 'sales');
                }
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih anggota tim" />
                </SelectTrigger>
                <SelectContent>
                  {availableOptions.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Belum ada anggota terdaftar.
                    </div>
                  ) : (
                    availableOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            {option.name}
                            {option.user_id && isUserSuperadmin(option.user_id) && (
                              <Shield className="h-3 w-3 text-amber-500" />
                            )}
                          </div>
                          <Badge variant="outline" className="text-[10px] ml-2 opacity-70">
                            {option.division === 'sales' ? 'Sales' : option.division === 'presales' ? 'Presales' : option.division === 'backoffice' ? 'Backoffice' : option.division === 'logistic' ? 'Logistik' : option.division}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={currentProfile ? `${currentProfile.name} (${currentProfile.division === 'sales' ? 'Sales' : currentProfile.division === 'presales' ? 'Presales' : currentProfile.division === 'backoffice' ? 'Backoffice' : currentProfile.division === 'logistic' ? 'Logistik' : currentProfile.division})` : ''}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            {currentProfile && currentProfile.division !== 'manager' && !isUserSuperadmin(currentProfile.user_id) && (
              <p className="text-[10px] text-muted-foreground">Nama dan divisi otomatis diisi berdasarkan akun Anda.</p>
            )}

          </div>



          {!isAttendanceMode && (
            <>
              {/* Activity Type Standard */}
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
                <Label>Nama Customer <span className="text-destructive">*</span></Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama customer"
                  required
                />
              </div>

              {/* Project */}
              <div className="space-y-2">
                <Label>Project</Label>
                <Input
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="Nama project (opsional)"
                />
              </div>

              {/* Opportunity */}
              <div className="space-y-2">
                <Label>Opportunity</Label>
                <Input
                  value={opportunity}
                  onChange={(e) => setOpportunity(e.target.value)}
                  placeholder="Nama opportunity (opsional)"
                />
              </div>

              {/* Photo Upload (only for visit) */}
              {activityType === 'visit' && (
                <div className="space-y-3 rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <Label className="font-medium">Foto Kunjungan</Label>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  <div className="flex flex-wrap gap-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Foto ${index + 1}`}
                          className="h-20 w-20 rounded-lg object-cover border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-20 w-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-xs">Tambah</span>
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Maksimal 5MB per foto. Format: JPG, PNG, WebP
                  </p>
                </div>
              )}
            </>
          )}

          {/* Location Picker - Optional for sick and time_off */}
          {!['sick', 'time_off'].includes(activityType) ? (
            <LocationPicker value={location} onChange={setLocation} required />
          ) : (
            <div className="space-y-2">
              <LocationPicker value={location} onChange={setLocation} required={false} />
              <p className="text-xs text-muted-foreground italic">
                * Lokasi opsional untuk status Sakit/Cuti
              </p>
            </div>
          )}

          {/* Collaboration - Available for all activity types */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Kolaborasi</Label>
              </div>
              <Switch
                checked={hasCollaboration}
                onCheckedChange={(checked) => {
                  setHasCollaboration(checked);
                  if (!checked) {
                    setCollaborators([]);
                    setSelectedCollaboratorId('');
                  }
                }}
              />
            </div>

            {hasCollaboration && (
              <div className="space-y-4 animate-slide-up">
                {/* Selected collaborators list */}
                {collaborators.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Kolaborator terpilih:</Label>
                    <div className="flex flex-wrap gap-2">
                      {collaborators.map((collab, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1 pr-1"
                        >
                          <span>{collab.personName}</span>
                          {collab.bookingDate && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1 rounded ml-1">
                              {format(new Date(collab.bookingDate), 'dd MMM')}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setCollaborators(prev => prev.filter((_, i) => i !== index))}
                            className="ml-1 h-4 w-4 rounded-full hover:bg-destructive hover:text-destructive-foreground flex items-center justify-center"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add new collaborator */}
                <div className="space-y-3">
                  <Label>Tambah Kolaborator & Waktu Booking</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select
                      value={selectedCollaboratorId}
                      onValueChange={setSelectedCollaboratorId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih anggota tim" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCollaboratorOptions.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Tidak ada anggota yang tersedia
                          </div>
                        ) : (
                          availableCollaboratorOptions.map((option) => {
                            const isBooked = getBookedCollaboratorsForDate(collaboratorBookingDate).has(option.id);
                            return (
                              <SelectItem
                                key={option.id}
                                value={option.id}
                                disabled={isBooked}
                              >
                                <div className="flex items-center gap-2">
                                  {option.name}
                                  <span className="text-xs text-muted-foreground">
                                    ({option.division === 'manager' ? 'Manager' :
                                      option.division === 'sales' ? 'Sales' :
                                        option.division === 'backoffice' ? 'Backoffice' :
                                          option.division === 'logistic' ? 'Driver' : 'Presales'})
                                  </span>
                                  {option.user_id && isUserSuperadmin(option.user_id) && (
                                    <Shield className="h-3 w-3 text-amber-500" />
                                  )}
                                  {isBooked && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Lock className="h-3 w-3 text-destructive" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Sudah dibooking untuk tanggal ini</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !collaboratorBookingDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {collaboratorBookingDate ? format(collaboratorBookingDate, "dd MMM yyyy", { locale: id }) : "Tanggal Booking"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={collaboratorBookingDate}
                          onSelect={(d) => d && setCollaboratorBookingDate(d)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex gap-2">
                    {selectedCollaboratorId && (
                      <CollaboratorBookingCalendar
                        collaboratorId={selectedCollaboratorId}
                        collaboratorName={allCollaborationOptions.find(p => p.id === selectedCollaboratorId)?.name || ''}
                        allActivities={allActivities}
                        selectedDate={collaboratorBookingDate}
                        onDateSelect={(d) => setCollaboratorBookingDate(d)}
                      />
                    )}
                    <Button
                      type="button"
                      variant="default"
                      className="flex-1"
                      onClick={() => {
                        if (selectedCollaboratorId) {
                          const option = allCollaborationOptions.find(p => p.id === selectedCollaboratorId);
                          if (option) {
                            // Check if already booked
                            if (getBookedCollaboratorsForDate(collaboratorBookingDate).has(option.id)) {
                              toast.error(`${option.name} sudah dibooking untuk tanggal ${format(collaboratorBookingDate, 'dd MMM')}`);
                              return;
                            }
                            setCollaborators(prev => [...prev, {
                              personId: option.id,
                              personName: option.name,
                              division: option.division as 'sales' | 'presales' | 'manager' | 'other',
                              bookingDate: collaboratorBookingDate.toISOString()
                            }]);
                            setSelectedCollaboratorId('');
                          }
                        }
                      }}
                      disabled={!selectedCollaboratorId}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Kolaborator
                    </Button>
                  </div>
                  {getBookedCollaboratorsForDate(collaboratorBookingDate).size > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Kunci: Terbooking pada {format(collaboratorBookingDate, 'dd MMM')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Reminder */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Label className="font-medium">Reminder</Label>
              </div>
              <Switch
                checked={hasReminder}
                onCheckedChange={setHasReminder}
              />
            </div>

            {hasReminder && (
              <div className="space-y-4 animate-slide-up">
                <div className="space-y-2">
                  <Label>Tanggal Reminder</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !reminderDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {reminderDate ? format(reminderDate, 'PPP', { locale: id }) : 'Pilih tanggal'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={reminderDate}
                        onSelect={(d) => d && setReminderDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Waktu Reminder</Label>
                  <Input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

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
