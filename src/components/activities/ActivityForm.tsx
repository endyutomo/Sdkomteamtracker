import { useState, useEffect, useRef } from 'react';
import { DailyActivity, ActivityType, ActivityCategory, Person, Collaboration, CollaborationPerson } from '@/types';
import { Profile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
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
import { CalendarIcon, Users, Camera, X, ImagePlus, Bell, Shield, Plus, Trash2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { LocationPicker } from './LocationPicker';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getFirstActivityType, getActivityTypes, getFirstCustomerName, getCustomerNames } from '@/utils/activityHelpers';

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

export function ActivityForm({ open, onClose, onSubmit, persons, allProfiles = [], currentProfile, editActivity, allActivities = [] }: ActivityFormProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState<ActivityCategory>('sales');
  const [personId, setPersonId] = useState('');
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<ActivityType[]>(['visit']);
  const [customerNames, setCustomerNames] = useState<string[]>(['']);
  const [project, setProject] = useState('');
  const [opportunity, setOpportunity] = useState('');
  const [notes, setNotes] = useState('');
  const [hasCollaboration, setHasCollaboration] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaborationPerson[]>([]);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<LocationData | undefined>();
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date | undefined>();
  const [reminderTime, setReminderTime] = useState('09:00');
  const [superadminIds, setSuperadminIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toggle activity type selection
  const toggleActivityType = (type: ActivityType) => {
    setSelectedActivityTypes(prev => {
      if (prev.includes(type)) {
        // Don't allow empty selection
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
  };

  // Add new customer name field
  const addCustomerName = () => {
    setCustomerNames(prev => [...prev, '']);
  };

  // Remove customer name field
  const removeCustomerName = (index: number) => {
    if (customerNames.length === 1) return;
    setCustomerNames(prev => prev.filter((_, i) => i !== index));
  };

  // Update customer name at index
  const updateCustomerName = (index: number, value: string) => {
    setCustomerNames(prev => prev.map((name, i) => i === index ? value : name));
  };

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
    division: p.division as 'sales' | 'presales' | 'manager', 
    user_id: p.user_id 
  }));

  // Get profiles by division for selection - include managers and superadmins
  const salesProfiles = allProfiles.filter(p => p.division === 'sales' || p.division === 'manager' || superadminIds.includes(p.user_id));
  const presalesProfiles = allProfiles.filter(p => p.division === 'presales' || p.division === 'manager' || superadminIds.includes(p.user_id));
  
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
    
  const availableOptions = category === 'sales' ? availableSalesOptions : availablePresalesOptions;

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
        // Manager can choose, default to sales category
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
      // Handle both single and array activity types
      const types = getActivityTypes(editActivity.activityType);
      setSelectedActivityTypes(types);
      // Handle both single and array customer names
      const names = getCustomerNames(editActivity.customerName);
      setCustomerNames(names.length > 0 ? names : ['']);
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

  const resetForm = () => {
    setDate(new Date());
    setCategory('sales');
    setPersonId('');
    setSelectedActivityTypes(['visit']);
    setCustomerNames(['']);
    setProject('');
    setOpportunity('');
    setNotes('');
    setHasCollaboration(false);
    setCollaborators([]);
    setSelectedCollaboratorId('');
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
    
    // Filter empty customer names
    const validCustomerNames = customerNames.filter(name => name.trim());
    if (validCustomerNames.length === 0) {
      toast.error('Nama customer wajib diisi');
      return;
    }

    if (selectedActivityTypes.length === 0) {
      toast.error('Pilih minimal satu tipe aktivitas');
      return;
    }

    // Location is mandatory for all activity types
    if (!location || !location.locationName) {
      toast.error('Lokasi dan alamat wajib diisi');
      return;
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
        collaborators: collaborators.map(c => ({
          ...c,
          bookedAt: date // Add booking date
        })),
      };
    }

    // Build reminder datetime
    let reminderAt: Date | null = null;
    if (hasReminder && reminderDate) {
      const [hours, minutes] = reminderTime.split(':').map(Number);
      reminderAt = new Date(reminderDate);
      reminderAt.setHours(hours, minutes, 0, 0);
    }

    // Determine which value to send based on count
    const activityTypeValue = selectedActivityTypes.length === 1 
      ? selectedActivityTypes[0] 
      : selectedActivityTypes;
    const customerNameValue = validCustomerNames.length === 1 
      ? validCustomerNames[0] 
      : validCustomerNames;

    onSubmit({
      date,
      category,
      personId,
      personName: selectedOption?.name || '',
      activityType: activityTypeValue,
      customerName: customerNameValue,
      project: project.trim() || undefined,
      opportunity: opportunity.trim() || undefined,
      notes: notes.trim(),
      collaboration,
      photos: selectedActivityTypes.includes('visit') ? photos : undefined,
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
          {/* Category */}
          <div className="space-y-2">
            <Label>Kategori Aktivitas</Label>
            <Select value={category} onValueChange={(v) => {
              setCategory(v as ActivityCategory);
              setPersonId('');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Aktivitas Sales</SelectItem>
                <SelectItem value="presales">Aktivitas Presales</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          {/* Person */}
          <div className="space-y-2">
            <Label>{category === 'sales' ? 'Sales Person' : 'Presales Person'}</Label>
            <Select value={personId} onValueChange={setPersonId}>
              <SelectTrigger>
                <SelectValue placeholder={`Pilih ${category === 'sales' ? 'sales' : 'presales'} person`} />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Belum ada anggota {category} terdaftar.
                  </div>
                ) : (
                  availableOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center gap-2">
                        {option.name}
                        {option.user_id && isUserSuperadmin(option.user_id) && (
                          <Shield className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Customer & Activity Type - Combined Section */}
          <div className="space-y-4 rounded-lg border border-border p-4">
            <Label className="font-medium">Customer & Tipe Aktivitas</Label>
            
            {/* Activity Types - Multi Select */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Tipe Aktivitas (pilih satu atau lebih)</Label>
              <div className="flex flex-wrap gap-2">
                {activityTypes.map((type) => (
                  <div
                    key={type.value}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                      selectedActivityTypes.includes(type.value)
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-background border-border hover:bg-muted"
                    )}
                    onClick={() => toggleActivityType(type.value)}
                  >
                    <Checkbox
                      checked={selectedActivityTypes.includes(type.value)}
                      onCheckedChange={() => toggleActivityType(type.value)}
                    />
                    <span className="text-sm">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Names - Multiple Input */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Nama Customer <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {customerNames.map((name, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={name}
                      onChange={(e) => updateCustomerName(index, e.target.value)}
                      placeholder={`Customer ${index + 1}`}
                    />
                    {customerNames.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomerName(index)}
                        className="shrink-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomerName}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Customer
                </Button>
              </div>
            </div>
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
          {selectedActivityTypes.includes('visit') && (
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

          {/* Location Picker - Mandatory for all activity types */}
          <LocationPicker value={location} onChange={setLocation} required />

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
                          <span className="text-xs opacity-70">
                            ({collab.division === 'manager' ? 'Manager' : 
                              collab.division === 'sales' ? 'Sales' : 
                              collab.division === 'presales' ? 'Presales' : 'Lainnya'})
                          </span>
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
                <div className="space-y-2">
                  <Label>Tambah Kolaborator</Label>
                  <div className="flex gap-2">
                    <Select 
                      value={selectedCollaboratorId} 
                      onValueChange={setSelectedCollaboratorId}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Pilih anggota tim" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCollaboratorOptions.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Tidak ada anggota yang tersedia
                          </div>
                        ) : (
                          availableCollaboratorOptions.map((option) => {
                            const isBooked = bookedCollaborators.has(option.id);
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
                                      option.division === 'sales' ? 'Sales' : 'Presales'})
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
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (selectedCollaboratorId) {
                          const option = allCollaborationOptions.find(p => p.id === selectedCollaboratorId);
                          if (option) {
                            // Check if already booked
                            if (bookedCollaborators.has(option.id)) {
                              toast.error(`${option.name} sudah dibooking untuk tanggal ini`);
                              return;
                            }
                            setCollaborators(prev => [...prev, {
                              personId: option.id,
                              personName: option.name,
                              division: option.division as 'sales' | 'presales' | 'manager' | 'other'
                            }]);
                            setSelectedCollaboratorId('');
                          }
                        }
                      }}
                      disabled={!selectedCollaboratorId}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {bookedCollaborators.size > 0 && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Anggota dengan tanda kunci sudah dibooking untuk tanggal ini
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
