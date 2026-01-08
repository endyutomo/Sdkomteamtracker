import { useState } from 'react';
import { DailyActivity, ActivityType } from '@/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { MapPin, Phone, Mail, Users, Calendar, Eye, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface RecentActivitiesProps {
  activities: DailyActivity[];
  canViewDetail?: boolean; // Only manager/admin can view detail
  onViewAll?: () => void;
}

const activityIcons: Record<ActivityType, typeof MapPin> = {
  visit: MapPin,
  call: Phone,
  email: Mail,
  meeting: Users,
  other: Calendar,
};

const activityLabels: Record<ActivityType, string> = {
  visit: 'Kunjungan',
  call: 'Telepon',
  email: 'Email',
  meeting: 'Meeting',
  other: 'Lainnya',
};

// Helper to get activity types display
const getActivityTypesDisplay = (activity: DailyActivity): string => {
  if (activity.activityTypes && activity.activityTypes.length > 0) {
    return activity.activityTypes.map(t => activityLabels[t]).join(', ');
  }
  return activityLabels[activity.activityType];
};

// Helper to get primary activity type icon
const getPrimaryActivityIcon = (activity: DailyActivity) => {
  if (activity.activityTypes && activity.activityTypes.length > 0) {
    return activityIcons[activity.activityTypes[0]];
  }
  return activityIcons[activity.activityType];
};

export function RecentActivities({ activities, canViewDetail = false, onViewAll }: RecentActivitiesProps) {
  const [selectedActivity, setSelectedActivity] = useState<DailyActivity | null>(null);
  const [showAll, setShowAll] = useState(false);
  
  const sortedActivities = activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const displayedActivities = showAll ? sortedActivities : sortedActivities.slice(0, 5);
  const hasMore = sortedActivities.length > 5;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Aktivitas Terbaru</h3>
        {hasMore && !showAll && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onViewAll ? onViewAll() : setShowAll(true)}
            className="text-primary gap-1"
          >
            Lihat Semua
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        {showAll && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowAll(false)}
            className="text-muted-foreground"
          >
            Tutup
          </Button>
        )}
      </div>
      
      {displayedActivities.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <Calendar className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p>Belum ada aktivitas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedActivities.map((activity) => {
            const Icon = getPrimaryActivityIcon(activity);
            const activityTypesCount = activity.activityTypes?.length || 1;
            
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg border border-border/50 p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{activity.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.personName} • {getActivityTypesDisplay(activity)}
                        {activityTypesCount > 1 && (
                          <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">
                            +{activityTypesCount - 1}
                          </Badge>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(activity.date), 'd MMM', { locale: id })}
                      </span>
                      {canViewDetail && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setSelectedActivity(activity)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {activity.collaboration && (
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      <Users className="mr-1 h-2.5 w-2.5" />
                      {activity.collaboration.personName}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog - Only for manager/admin */}
      <Dialog open={!!selectedActivity && canViewDetail} onOpenChange={() => setSelectedActivity(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Aktivitas</DialogTitle>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium">
                    {format(new Date(selectedActivity.date), 'dd MMMM yyyy', { locale: id })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kategori</p>
                  <Badge variant={selectedActivity.category === 'sales' ? 'default' : 'secondary'}>
                    {selectedActivity.category === 'sales' ? 'Sales' : 'Presales'}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Tipe Aktivitas</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(selectedActivity.activityTypes || [selectedActivity.activityType]).map((type) => {
                    const TypeIcon = activityIcons[type];
                    return (
                      <Badge key={type} variant="outline" className="gap-1">
                        <TypeIcon className="h-3 w-3" />
                        {activityLabels[type]}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{selectedActivity.customerName}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Person</p>
                <p className="font-medium">{selectedActivity.personName}</p>
              </div>

              {selectedActivity.project && (
                <div>
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{selectedActivity.project}</p>
                </div>
              )}

              {selectedActivity.opportunity && (
                <div>
                  <p className="text-sm text-muted-foreground">Opportunity</p>
                  <p className="font-medium">{selectedActivity.opportunity}</p>
                </div>
              )}

              {selectedActivity.locationName && (
                <div>
                  <p className="text-sm text-muted-foreground">Lokasi</p>
                  <p className="text-sm">{selectedActivity.locationName}</p>
                </div>
              )}

              {selectedActivity.collaboration && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Kolaborasi</span>
                  </div>
                  <p className="text-sm">{selectedActivity.collaboration.personName}</p>
                  {selectedActivity.collaboration.bookingDate && (
                    <p className="text-xs text-muted-foreground">
                      Tanggal Booking: {format(new Date(selectedActivity.collaboration.bookingDate), 'dd MMM yyyy', { locale: id })}
                    </p>
                  )}
                </div>
              )}

              {selectedActivity.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Catatan</p>
                  <p className="text-sm">{selectedActivity.notes}</p>
                </div>
              )}

              {selectedActivity.photos && selectedActivity.photos.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Foto</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedActivity.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Foto ${index + 1}`}
                        className="h-16 w-16 rounded-lg object-cover border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
