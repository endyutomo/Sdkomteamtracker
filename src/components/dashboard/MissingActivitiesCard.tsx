import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, ChevronDown, ChevronUp, Calendar, User, Bell, PlusCircle } from 'lucide-react';
import { DailyActivity } from '@/types';
import { Profile } from '@/hooks/useProfile';
import { 
  format, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth,
  startOfYear,
  endOfYear,
  isWeekend, 
  isBefore,
  startOfDay,
  isToday,
  setHours,
  setMinutes,
  setSeconds
} from 'date-fns';
import { id } from 'date-fns/locale';

interface MissingActivity {
  profileId: string;
  profileName: string;
  userId: string;
  division: string;
  date: Date;
  dayName: string;
  status: string;
  canFillActivity: boolean;
}

interface MissingActivitiesCardProps {
  activities: DailyActivity[];
  allProfiles: Profile[];
  currentUserId?: string;
  onAddActivity?: () => void;
}

// Check if current time is before 12:00 PM (noon)
function isBeforeNoon(): boolean {
  const now = new Date();
  const noon = setSeconds(setMinutes(setHours(new Date(), 12), 0), 0);
  return isBefore(now, noon);
}

function getMissingActivities(
  activities: DailyActivity[],
  profiles: Profile[],
  startDate: Date,
  endDate: Date
): MissingActivity[] {
  const today = startOfDay(new Date());
  const now = new Date();
  const noon = setSeconds(setMinutes(setHours(new Date(), 12), 0), 0);
  const canFillToday = isBefore(now, noon);
  
  const salesPresalesProfiles = profiles.filter(
    p => p.division === 'sales' || p.division === 'presales'
  );

  // Get all weekdays in the date range
  const allDays = eachDayOfInterval({ start: startDate, end: endDate })
    .filter(date => !isWeekend(date) && (isBefore(date, today) || format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')));

  // Create a map of activities by user_id and date
  const activityMap = new Map<string, Set<string>>();
  activities.forEach(activity => {
    const key = activity.userId;
    if (!activityMap.has(key)) {
      activityMap.set(key, new Set());
    }
    activityMap.get(key)!.add(format(new Date(activity.date), 'yyyy-MM-dd'));
  });

  const missing: MissingActivity[] = [];

  salesPresalesProfiles.forEach(profile => {
    allDays.forEach(date => {
      // Only check dates up to and including today
      if (isBefore(today, date)) return;
      
      const dateStr = format(date, 'yyyy-MM-dd');
      const hasActivity = activityMap.get(profile.user_id)?.has(dateStr);
      const isTodayDate = isToday(date);

      if (!hasActivity) {
        // For today's date, only show if it's after noon OR before noon (with clickable option)
        // For past dates, always show
        missing.push({
          profileId: profile.id,
          profileName: profile.name,
          userId: profile.user_id,
          division: profile.division,
          date: date,
          dayName: format(date, 'EEEE', { locale: id }),
          status: 'Belum ada aktivitas',
          canFillActivity: isTodayDate && canFillToday
        });
      }
    });
  });

  // Sort by date descending, then by name
  return missing.sort((a, b) => {
    const dateCompare = b.date.getTime() - a.date.getTime();
    if (dateCompare !== 0) return dateCompare;
    return a.profileName.localeCompare(b.profileName);
  });
}

export function MissingActivitiesCard({ activities, allProfiles, currentUserId, onAddActivity }: MissingActivitiesCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const today = new Date();
  const canFillNow = isBeforeNoon();

  // Get missing activities for different periods
  const dailyMissing = useMemo(() => {
    return getMissingActivities(
      activities,
      allProfiles,
      startOfDay(today),
      startOfDay(today)
    );
  }, [activities, allProfiles]);

  const weeklyMissing = useMemo(() => {
    return getMissingActivities(
      activities,
      allProfiles,
      startOfWeek(today, { weekStartsOn: 1 }),
      endOfWeek(today, { weekStartsOn: 1 })
    );
  }, [activities, allProfiles]);

  const monthlyMissing = useMemo(() => {
    return getMissingActivities(
      activities,
      allProfiles,
      startOfMonth(today),
      endOfMonth(today)
    );
  }, [activities, allProfiles]);

  const currentMissing = activeTab === 'daily' 
    ? dailyMissing 
    : activeTab === 'weekly' 
      ? weeklyMissing 
      : monthlyMissing;

  const salesMissing = currentMissing.filter(m => m.division === 'sales');
  const presalesMissing = currentMissing.filter(m => m.division === 'presales');

  const displayedItems = expanded ? currentMissing : currentMissing.slice(0, 5);

  if (currentMissing.length === 0 && activeTab === 'daily') {
    return null;
  }

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            <CardTitle className="text-lg">Belum Ada Aktivitas</CardTitle>
          </div>
          <Badge variant="destructive" className="text-xs">
            {currentMissing.length} data
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily" className="text-xs">
              Hari Ini ({dailyMissing.length})
            </TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">
              Minggu Ini ({weeklyMissing.length})
            </TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">
              Bulan Ini ({monthlyMissing.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Summary badges */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            Sales: {salesMissing.length}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            Presales: {presalesMissing.length}
          </Badge>
        </div>

        {/* Notification for current user if they haven't filled activity today */}
        {currentUserId && dailyMissing.some(m => m.userId === currentUserId) && (
          <div className={`p-3 rounded-lg border ${canFillNow ? 'bg-warning/10 border-warning/30' : 'bg-muted border-border'}`}>
            <div className="flex items-center gap-2">
              <Bell className={`h-4 w-4 ${canFillNow ? 'text-warning' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-medium ${canFillNow ? 'text-warning' : 'text-muted-foreground'}`}>
                Segera isi aktivitas hari ini!
              </span>
            </div>
            {canFillNow ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full gap-2 border-warning text-warning hover:bg-warning/10"
                onClick={onAddActivity}
              >
                <PlusCircle className="h-4 w-4" />
                Isi Aktivitas Sekarang
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Batas waktu pengisian sudah lewat (12:00 siang)
              </p>
            )}
          </div>
        )}

        {currentMissing.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Semua tim sudah mengisi aktivitas
          </div>
        ) : (
          <>
            <ScrollArea className={expanded ? 'h-[300px]' : 'max-h-[200px]'}>
              <div className="space-y-2">
                {displayedItems.map((item, index) => (
                  <div
                    key={`${item.profileId}-${format(item.date, 'yyyy-MM-dd')}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-background border text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{item.profileName}</span>
                          <Badge 
                            variant={item.division === 'sales' ? 'default' : 'secondary'}
                            className="text-xs h-5"
                          >
                            {item.division}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>{item.dayName}, {format(item.date, 'dd MMM yyyy', { locale: id })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Show fill button for current user's own missing activity if before noon */}
                      {item.userId === currentUserId && item.canFillActivity && onAddActivity && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs gap-1 border-warning text-warning hover:bg-warning/10"
                          onClick={onAddActivity}
                        >
                          <PlusCircle className="h-3 w-3" />
                          Isi
                        </Button>
                      )}
                      <Badge variant="destructive" className="text-xs whitespace-nowrap">
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {currentMissing.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Tampilkan Lebih Sedikit
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Tampilkan Semua ({currentMissing.length})
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
