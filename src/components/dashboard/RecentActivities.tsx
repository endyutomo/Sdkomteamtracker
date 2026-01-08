import { DailyActivity } from '@/types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { MapPin, Phone, Mail, Users, Calendar, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RecentActivitiesProps {
  activities: DailyActivity[];
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

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const recentActivities = activities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Aktivitas Terbaru</h3>
        <button className="text-muted-foreground hover:text-foreground">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>
      
      {recentActivities.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          <Calendar className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p>Belum ada aktivitas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const Icon = activityIcons[activity.activityType];
            return (
              <div
                key={activity.id}
                className="flex items-start gap-4 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{activity.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.personName} • {activityLabels[activity.activityType]} • {activity.category === 'presales' ? 'Presales' : 'Sales'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {format(new Date(activity.date), 'd MMM', { locale: id })}
                    </span>
                  </div>
                  {activity.collaboration && (
                    <Badge variant="secondary" className="mt-2">
                      <Users className="mr-1 h-3 w-3" />
                      Kolaborasi: {activity.collaboration.personName}
                    </Badge>
                  )}
                  {activity.notes && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{activity.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
