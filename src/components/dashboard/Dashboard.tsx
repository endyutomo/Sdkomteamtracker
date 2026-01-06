import { Activity, Users, MapPin, TrendingUp, Briefcase } from 'lucide-react';
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
  const salesActivities = activities.filter(a => a.category === 'sales' || !a.category);
  const presalesActivities = activities.filter(a => a.category === 'presales');
  
  const todaySalesActivities = salesActivities.filter(a => isToday(new Date(a.date)));
  const todayPresalesActivities = presalesActivities.filter(a => isToday(new Date(a.date)));
  
  const weekSalesActivities = salesActivities.filter(a => isThisWeek(new Date(a.date)));
  const weekPresalesActivities = presalesActivities.filter(a => isThisWeek(new Date(a.date)));
  
  const visitActivities = activities.filter(a => a.activityType === 'visit');
  const collaborationActivities = activities.filter(a => a.collaboration);
  
  const salesCount = persons.filter(p => p.role === 'sales').length;
  const presalesCount = persons.filter(p => p.role === 'presales').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Aktivitas Sales"
          value={todaySalesActivities.length}
          subtitle={`${weekSalesActivities.length} minggu ini`}
          icon={Activity}
          variant="primary"
        />
        <StatCard
          title="Aktivitas Presales"
          value={todayPresalesActivities.length}
          subtitle={`${weekPresalesActivities.length} minggu ini`}
          icon={Briefcase}
          variant="info"
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
          variant="warning"
        />
        <StatCard
          title="Tim"
          value={salesCount + presalesCount}
          subtitle={`${salesCount} sales, ${presalesCount} presales`}
          icon={TrendingUp}
          variant="primary"
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
