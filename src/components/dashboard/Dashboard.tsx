import { Activity, Users, MapPin, TrendingUp } from 'lucide-react';
import { StatCard } from './StatCard';
import { ActivityChart } from './ActivityChart';
import { RecentActivities } from './RecentActivities';
import { DailyActivity, Person } from '@/types';
import { startOfDay, isToday, isThisWeek } from 'date-fns';

interface DashboardProps {
  activities: DailyActivity[];
  persons: Person[];
}

export function Dashboard({ activities, persons }: DashboardProps) {
  const todayActivities = activities.filter(a => isToday(new Date(a.date)));
  const weekActivities = activities.filter(a => isThisWeek(new Date(a.date)));
  const visitActivities = activities.filter(a => a.activityType === 'visit');
  const collaborationActivities = activities.filter(a => a.collaboration);
  const salesCount = persons.filter(p => p.role === 'sales').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Aktivitas Hari Ini"
          value={todayActivities.length}
          subtitle={`${weekActivities.length} minggu ini`}
          icon={Activity}
          variant="primary"
        />
        <StatCard
          title="Total Kunjungan"
          value={visitActivities.length}
          subtitle="Semua waktu"
          icon={MapPin}
          variant="success"
        />
        <StatCard
          title="Kolaborasi"
          value={collaborationActivities.length}
          subtitle="Kunjungan dengan tim"
          icon={Users}
          variant="info"
        />
        <StatCard
          title="Tim Sales"
          value={salesCount}
          subtitle={`${persons.length} total anggota`}
          icon={TrendingUp}
          variant="warning"
        />
      </div>

      {/* Charts and Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart activities={activities} />
        <RecentActivities activities={activities} />
      </div>
    </div>
  );
}
