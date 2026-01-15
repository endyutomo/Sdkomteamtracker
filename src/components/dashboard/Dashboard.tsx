import { useState } from 'react';
import { Activity, Users, MapPin, TrendingUp, Briefcase, RefreshCw, Building2, Loader2, Truck } from 'lucide-react';
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
  isSuperadmin?: boolean;
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

export function Dashboard({ activities, persons, allProfiles, companySettings, onOpenCompanySettings, onRefresh, isRefreshing, isManager = false, isSuperadmin = false, currentUserId, currentDivision, currentUserName, onAddActivity }: DashboardProps) {
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    title: string;
    filterType?: 'sales' | 'presales' | 'visit' | 'collaboration' | 'logistic' | 'backoffice';
  }>({ open: false, title: '' });

  const [teamDialog, setTeamDialog] = useState(false);

  // Filter sales activities - exclude logistic and backoffice categories AND users
  const logisticUserIds = allProfiles.filter(p => p.division === 'logistic').map(p => p.user_id);
  const backofficeUserIds = allProfiles.filter(p => p.division === 'backoffice').map(p => p.user_id);

  // Sales activities: category='sales' OR (no category AND not logistic/backoffice user)
  const salesActivities = activities.filter(a =>
    (a.category === 'sales') ||
    (!a.category && !logisticUserIds.includes(a.userId) && !backofficeUserIds.includes(a.userId))
  );

  const presalesActivities = activities.filter(a => a.category === 'presales');

  // Logistic activities - filter by category 'logistic' OR by logistic user ids for backward compatibility
  const logisticActivities = activities.filter(a =>
    a.category === 'logistic' ||
    (!a.category && logisticUserIds.includes(a.userId))
  );

  // Backoffice activities - filter by category 'backoffice' OR by backoffice user ids for backward compatibility
  const backofficeActivities = activities.filter(a =>
    a.category === 'backoffice' ||
    (!a.category && backofficeUserIds.includes(a.userId))
  );

  const todaySalesActivities = salesActivities.filter(a => isToday(new Date(a.date)));
  const todayPresalesActivities = presalesActivities.filter(a => isToday(new Date(a.date)));
  const todayLogisticActivities = logisticActivities.filter(a => isToday(new Date(a.date)));
  const todayBackofficeActivities = backofficeActivities.filter(a => isToday(new Date(a.date)));

  const weekSalesActivities = salesActivities.filter(a => isThisWeek(new Date(a.date)));
  const weekPresalesActivities = presalesActivities.filter(a => isThisWeek(new Date(a.date)));
  const weekLogisticActivities = logisticActivities.filter(a => isThisWeek(new Date(a.date)));
  const weekBackofficeActivities = backofficeActivities.filter(a => isThisWeek(new Date(a.date)));

  const visitActivities = activities.filter(a => a.activityType === 'visit');
  const collaborationActivities = activities.filter(a => a.collaboration);

  const salesCount = allProfiles.filter(p => p.division === 'sales').length;
  const presalesCount = allProfiles.filter(p => p.division === 'presales').length;
  const logisticCount = allProfiles.filter(p => p.division === 'logistic').length;
  const backofficeCount = allProfiles.filter(p => p.division === 'backoffice').length;

  const openDetail = (title: string, filterType: 'sales' | 'presales' | 'visit' | 'collaboration' | 'logistic' | 'backoffice') => {
    setDetailDialog({ open: true, title, filterType });
  };

  // Check if user is backoffice
  const isBackoffice = currentDivision === 'backoffice';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Message */}
      {currentUserName && (
        <div className={`bg-gradient-to-r ${isBackoffice ? 'from-blue-500/10 to-blue-500/5 border-blue-500/20' : 'from-primary/10 to-primary/5 border-primary/20'} border rounded-lg p-4`}>
          <h2 className="text-lg font-semibold text-foreground">
            Selamat datang, <span className={isBackoffice ? 'text-blue-600' : 'text-primary'}>{currentUserName}</span>! 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isBackoffice
              ? 'Anda memiliki akses penuh untuk memonitor aktivitas tim, penjualan, dan pengiriman.'
              : 'Semoga hari ini produktif dan menyenangkan.'}
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
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
          title="Aktivitas Kurir"
          value={todayLogisticActivities.length}
          subtitle={`${weekLogisticActivities.length} minggu ini`}
          icon={Truck}
          variant="success"
          onClick={() => openDetail('Aktivitas Kurir', 'logistic')}
        />
        <StatCard
          title="Aktivitas Backoffice"
          value={todayBackofficeActivities.length}
          subtitle={`${weekBackofficeActivities.length} minggu ini`}
          icon={Building2}
          variant="warning"
          onClick={() => openDetail('Aktivitas Backoffice', 'backoffice')}
        />
        <StatCard
          title="Total Kunjungan"
          value={visitActivities.length}
          subtitle="Semua waktu"
          icon={MapPin}
          variant="primary"
          onClick={() => openDetail('Total Kunjungan', 'visit')}
        />
        <StatCard
          title="Kolaborasi"
          value={collaborationActivities.length}
          subtitle="Kunjungan dengan tim"
          icon={Users}
          variant="info"
          onClick={() => openDetail('Kolaborasi', 'collaboration')}
        />
        <StatCard
          title="Tim Terdaftar"
          value={allProfiles.length}
          subtitle={`${salesCount}S ${presalesCount}P ${logisticCount}L ${backofficeCount}B`}
          icon={TrendingUp}
          variant="success"
          onClick={() => setTeamDialog(true)}
        />
      </div>

      {/* Charts and Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityChart activities={activities} />
        <RecentActivities activities={activities} />
      </div>

      {/* Missing Activities Card - Visible for Manager, Backoffice, Logistic, and Sales/Presales */}
      {(isManager || currentDivision === 'backoffice' || currentDivision === 'logistic' || currentDivision === 'sales' || currentDivision === 'presales') && (
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
        logisticUserIds={logisticUserIds}
        backofficeUserIds={backofficeUserIds}
      />

      <TeamDetailDialog
        open={teamDialog}
        onClose={() => setTeamDialog(false)}
        profiles={allProfiles}
        isManager={isManager}
        isSuperadmin={isSuperadmin}
      />
    </div>
  );
}
