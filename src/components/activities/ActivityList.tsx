import { useState } from 'react';
import { DailyActivity, Person } from '@/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { MapPin, Phone, Mail, Users, Calendar, Trash2, Edit2, ImageIcon, X, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

interface ActivityListProps {
  activities: DailyActivity[];
  onDelete: (id: string) => void;
  onEdit: (activity: DailyActivity) => void;
}

const activityIcons = {
  visit: MapPin,
  call: Phone,
  email: Mail,
  meeting: Users,
  other: Calendar,
};

const activityLabels = {
  visit: 'Kunjungan',
  call: 'Telepon',
  email: 'Email',
  meeting: 'Meeting',
  other: 'Lainnya',
};

const activityColors = {
  visit: 'bg-success/10 text-success border-success/20',
  call: 'bg-info/10 text-info border-info/20',
  email: 'bg-warning/10 text-warning border-warning/20',
  meeting: 'bg-primary/10 text-primary border-primary/20',
  other: 'bg-muted text-muted-foreground border-muted',
};

export function ActivityList({ activities, onDelete, onEdit }: ActivityListProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const { profile, isManager, isSuperadmin } = useProfile();
  
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Check if user can edit/delete an activity
  const canModify = (activity: DailyActivity) => {
    // Superadmin can modify all activities
    if (isSuperadmin) return true;
    // Regular manager can only view, not edit others
    if (isManager && !isSuperadmin) {
      // Manager can edit their own activities only
      return activity.personId === profile?.id;
    }
    // Sales can only modify their own sales activities, not presales
    if (profile?.division === 'sales' && activity.category === 'presales') return false;
    // Presales can only modify their own presales activities, not sales
    if (profile?.division === 'presales' && activity.category === 'sales') return false;
    // User can modify their own activities
    return activity.personId === profile?.id;
  };

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-12 text-center shadow-card">
        <Calendar className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">Belum Ada Aktivitas</h3>
        <p className="text-muted-foreground">
          Mulai dengan menambahkan aktivitas harian pertama Anda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedActivities.map((activity, index) => {
        const Icon = activityIcons[activity.activityType];
        return (
          <div
            key={activity.id}
            className="group rounded-xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-elevated animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${activityColors[activity.activityType]}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{activity.customerName}</h3>
                    <Badge variant="outline" className="text-xs">
                      {activityLabels[activity.activityType]}
                    </Badge>
                    <Badge variant={activity.category === 'presales' ? 'secondary' : 'default'} className="text-xs">
                      {activity.category === 'presales' ? 'Presales' : 'Sales'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.category === 'presales' ? 'Presales' : 'Sales'}: {activity.personName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(activity.date), 'EEEE, d MMMM yyyy', { locale: id })}
                  </p>
                  
                  {/* Photos for visit activity */}
                  {activity.activityType === 'visit' && activity.photos && activity.photos.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground">
                        <ImageIcon className="h-3 w-3" />
                        <span>Foto Kunjungan ({activity.photos.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activity.photos.map((photo, photoIndex) => (
                          <img
                            key={photoIndex}
                            src={photo}
                            alt={`Foto kunjungan ${photoIndex + 1}`}
                            className="h-16 w-16 rounded-lg object-cover border border-border cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedPhoto(photo)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {activity.collaboration && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {/* Display multi-collaborators if available */}
                      {activity.collaboration.collaborators && activity.collaboration.collaborators.length > 0 ? (
                        activity.collaboration.collaborators.map((collab, idx) => (
                          <Badge key={idx} className="bg-info/10 text-info border-info/20 hover:bg-info/20">
                            <Users className="mr-1.5 h-3 w-3" />
                            {collab.personName} ({collab.division === 'manager' ? 'Manager' : 
                              collab.division === 'sales' ? 'Sales' : 
                              collab.division === 'presales' ? 'Presales' : 'Lainnya'})
                          </Badge>
                        ))
                      ) : (
                        // Legacy single collaborator format
                        <Badge className="bg-info/10 text-info border-info/20 hover:bg-info/20">
                          <Users className="mr-1.5 h-3 w-3" />
                          Kolaborasi dengan {activity.collaboration.division === 'presales' ? 'Presales' : 'Divisi Lain'}: {activity.collaboration.personName}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {activity.notes && (
                    <p className="mt-3 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                      {activity.notes}
                    </p>
                  )}
                </div>
              </div>
              
              {canModify(activity) ? (
                <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(activity)}
                    className="h-9 w-9"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Aktivitas?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Aktivitas ini akan dihapus permanen dan tidak dapat dikembalikan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(activity.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Hapus
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Lihat saja
                  </Badge>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Photo Preview Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl p-2">
          {selectedPhoto && (
            <img
              src={selectedPhoto}
              alt="Preview foto kunjungan"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
