import { DailyActivity, ActivityType } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Phone, Mail, MapPin, MessageSquare, Users, Calendar, Navigation, Briefcase, FileText } from 'lucide-react';
import { getFirstActivityType, getActivityTypes, displayCustomerNames } from '@/utils/activityHelpers';

interface ActivityDetailDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  activities: DailyActivity[];
  filterType?: 'sales' | 'presales' | 'visit' | 'collaboration';
}

const activityTypeConfig: Record<string, { label: string; icon: any; color: string }> = {
  visit: { label: 'Kunjungan', icon: MapPin, color: 'bg-green-100 text-green-800' },
  call: { label: 'Telepon', icon: Phone, color: 'bg-blue-100 text-blue-800' },
  email: { label: 'Email', icon: Mail, color: 'bg-purple-100 text-purple-800' },
  meeting: { label: 'Meeting', icon: Users, color: 'bg-orange-100 text-orange-800' },
  other: { label: 'Lainnya', icon: MessageSquare, color: 'bg-gray-100 text-gray-800' },
};

export function ActivityDetailDialog({
  open,
  onClose,
  title,
  activities,
  filterType,
}: ActivityDetailDialogProps) {
  const filteredActivities = activities.filter((activity) => {
    if (!filterType) return true;
    if (filterType === 'sales') return activity.category === 'sales' || !activity.category;
    if (filterType === 'presales') return activity.category === 'presales';
    if (filterType === 'visit') return getActivityTypes(activity.activityType).includes('visit');
    if (filterType === 'collaboration') return !!activity.collaboration;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title} ({filteredActivities.length})</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data aktivitas
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActivities.map((activity) => {
                const firstType = getFirstActivityType(activity.activityType);
                const config = activityTypeConfig[firstType] || activityTypeConfig.other;
                const Icon = config.icon;

                return (
                  <div
                    key={activity.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{displayCustomerNames(activity.customerName)}</p>
                          <p className="text-sm text-muted-foreground">{activity.personName}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={config.color}>{config.label}</Badge>
                        <Badge variant="outline">
                          {activity.category === 'presales' ? 'Presales' : 'Sales'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(activity.date), 'EEEE, dd MMMM yyyy', { locale: id })}
                    </div>
                    {/* Project and Opportunity */}
                    {(activity.project || activity.opportunity) && (
                      <div className="flex flex-wrap gap-2 text-sm">
                        {activity.project && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Briefcase className="h-4 w-4" />
                            <span>Project: {activity.project}</span>
                          </div>
                        )}
                        {activity.opportunity && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>Opportunity: {activity.opportunity}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Location with Google Maps link */}
                    {(activity.locationName || (activity.latitude && activity.longitude)) && (
                      <div className="flex items-center gap-2 bg-muted p-2 rounded">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground truncate">
                            {activity.locationName || `${activity.latitude}, ${activity.longitude}`}
                          </p>
                        </div>
                        {activity.latitude && activity.longitude && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0"
                            onClick={() => {
                              const url = `https://www.google.com/maps?q=${activity.latitude},${activity.longitude}`;
                              window.open(url, '_blank');
                            }}
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            Maps
                          </Button>
                        )}
                      </div>
                    )}

                    {activity.notes && (
                      <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        <span className="font-medium">Catatan: </span>{activity.notes}
                      </p>
                    )}
                    {activity.collaboration && (
                      <div className="mt-2">
                        {/* Display multi-collaborators if available */}
                        {activity.collaboration.collaborators && activity.collaboration.collaborators.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Kolaborasi dengan:</span>
                            {activity.collaboration.collaborators.map((collab, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {collab.personName} ({collab.division === 'manager' ? 'Manager' : 
                                  collab.division === 'sales' ? 'Sales' : 
                                  collab.division === 'presales' ? 'Presales' : 'Lainnya'})
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          // Legacy single collaborator format
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Kolaborasi dengan: {activity.collaboration.personName} ({activity.collaboration.division})
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {activity.photos && activity.photos.length > 0 && (
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {activity.photos.map((photo, idx) => (
                          <img
                            key={idx}
                            src={photo}
                            alt={`Foto ${idx + 1}`}
                            className="h-16 w-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
