import { DailyActivity } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Phone, Mail, MapPin, MessageSquare, Users, Calendar } from 'lucide-react';

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
    if (filterType === 'visit') return activity.activityType === 'visit';
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
                const config = activityTypeConfig[activity.activityType] || activityTypeConfig.other;
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
                          <p className="font-medium">{activity.customerName}</p>
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
                    {activity.notes && (
                      <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                        {activity.notes}
                      </p>
                    )}
                    {activity.collaboration && (
                      <div className="mt-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Kolaborasi dengan: {activity.collaboration.personName} ({activity.collaboration.division})
                        </span>
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
