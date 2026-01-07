import { useState } from 'react';
import { Activity, Users, MapPin, TrendingUp, Briefcase, RefreshCw, Building2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from './StatCard';
import { ActivityChart } from './ActivityChart';
import { RecentActivities } from './RecentActivities';
import { ActivityDetailDialog } from './ActivityDetailDialog';
import { TeamDetailDialog } from './TeamDetailDialog';
import { MissingActivitiesCard } from './MissingActivitiesCard';
import { DailyActivity, Person } from '@/types';
import { Profile } from '@/hooks/useProfile';
import { CompanySettings } from '@/hooks/useCompanySettings';
import { isToday, isThisWeek } from 'date-fns';

interface DashboardProps {
  activities: DailyActivity[];
  persons: Person[];
  allProfiles: Profile[];
  companySettings?: CompanySettings | null;
  onOpenCompanySettings?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isManager?: boolean;
  currentUserId?: string;
  currentDivision?: string;
  currentUserName?: string;
  onAddActivity?: () => void;
}

function LogoImage({ src, alt }: { src: string; alt: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="h-14 w-14 rounded-lg border border-border bg-muted flex items-center justify-center shadow-sm">
        <Building2 className="h-7 w-7 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative h-14 w-14">
      {isLoading && (
        <div className="absolute inset-0 rounded-lg border border-border bg-muted flex items-center justify-center shadow-sm">
          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`h-14 w-14 rounded-lg object-contain border border-border bg-background shadow-sm transition-opacity ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}

export function Dashboard({ activities, persons, allProfiles, companySettings, onOpenCompanySettings, onRefresh, isRefreshing, isManager = false, currentUserId, currentDivision, currentUserName, onAddActivity }: DashboardProps) {
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    title: string;
    filterType?: 'sales' | 'presales' | 'visit' | 'collaboration';
  }>({ open: false, title: '' });

  const [teamDialog, setTeamDialog] = useState(false);

  const salesActivities = activities.filter(a => a.category === 'sales' || !a.category);
  const presalesActivities = activities.filter(a => a.category === 'presales');
  
  const todaySalesActivities = salesActivities.filter(a => isToday(new Date(a.date)));
  const todayPresalesActivities = presalesActivities.filter(a => isToday(new Date(a.date)));
  
  const weekSalesActivities = salesActivities.filter(a => isThisWeek(new Date(a.date)));
  const weekPresalesActivities = presalesActivities.filter(a => isThisWeek(new Date(a.date)));
  
  const visitActivities = activities.filter(a => a.activityType === 'visit');
  const collaborationActivities = activities.filter(a => a.collaboration);
  
  const salesCount = allProfiles.filter(p => p.division === 'sales').length;
  const presalesCount = allProfiles.filter(p => p.division === 'presales').length;

  const openDetail = (title: string, filterType: 'sales' | 'presales' | 'visit' | 'collaboration') => {
    setDetailDialog({ open: true, title, filterType });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Message */}
      {currentUserName && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-foreground">
            Selamat datang, <span className="text-primary">{currentUserName}</span>! 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Semoga hari ini produktif dan menyenangkan.
          </p>
        </div>
      )}
      {/* Company Header with Logo */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onOpenCompanySettings}
          className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer text-left"
          title="Klik untuk edit pengaturan perusahaan"
        >
          {companySettings?.logo_url ? (
            <LogoImage 
              src={companySettings.logo_url} 
              alt={companySettings.name || 'Logo Perusahaan'} 
            />
          ) : (
            <div className="h-14 w-14 rounded-lg border border-border bg-muted flex items-center justify-center shadow-sm">
              <Building2 className="h-7 w-7 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {companySettings?.name || 'Dashboard'}
            </h1>
            {companySettings?.address && (
              <p className="text-sm text-muted-foreground truncate max-w-xs">
                {companySettings.address}
              </p>
            )}
          </div>
        </button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Memperbarui...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Aktivitas Sales"
          value={todaySalesActivities.length}
          subtitle={`${weekSalesActivities.length} minggu ini`}
          icon={Activity}
          variant="primary"
          onClick={() => openDetail('Aktivitas Sales', 'sales')}
        />
        <StatCard
          title="Aktivitas Presales"
          value={todayPresalesActivities.length}
          subtitle={`${weekPresalesActivities.length} minggu ini`}
          icon={Briefcase}
          variant="info"
          onClick={() => openDetail('Aktivitas Presales', 'presales')}
        />
        <StatCard
          title="Total Kunjungan"
          value={visitActivities.length}
          subtitle="Semua waktu"
          icon={MapPin}
          variant="success"
          onClick={() => openDetail('Total Kunjungan', 'visit')}
        />
        <StatCard
          title="Kolaborasi"
          value={collaborationActivities.length}
          subtitle="Kunjungan dengan tim"
          icon={Users}
          variant="warning"
          onClick={() => openDetail('Kolaborasi', 'collaboration')}
        />
        <StatCard
          title="Tim Terdaftar"
          value={allProfiles.length}
          subtitle={`${salesCount} sales, ${presalesCount} presales`}
          icon={TrendingUp}
          variant="primary"
          onClick={() => setTeamDialog(true)}
        />
      </div>

      {/* Charts and Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart activities={activities} />
        <RecentActivities activities={activities} />
      </div>

      {/* Missing Activities Card - Visible for Manager and Sales/Presales */}
      {(isManager || currentDivision === 'sales' || currentDivision === 'presales') && (
        <MissingActivitiesCard 
          activities={activities} 
          allProfiles={allProfiles}
          currentUserId={currentUserId}
          onAddActivity={onAddActivity}
        />
      )}

      <ActivityDetailDialog
        open={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, title: '' })}
        title={detailDialog.title}
        activities={activities}
        filterType={detailDialog.filterType}
      />

      <TeamDetailDialog
        open={teamDialog}
        onClose={() => setTeamDialog(false)}
        profiles={allProfiles}
        isManager={isManager}
      />
    </div>
  );
}
