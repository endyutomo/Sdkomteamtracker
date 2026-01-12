import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertCircle, Download, FileSpreadsheet, Calendar, User } from 'lucide-react';
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
  getWeek,
  getMonth,
  getYear
} from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';

interface MissingActivity {
  profileId: string;
  profileName: string;
  division: string;
  date: Date;
  dayName: string;
  status: string;
}

interface MissingActivitiesReportProps {
  activities: DailyActivity[];
  allProfiles: Profile[];
}

// Generate month options
const months = [
  { value: '0', label: 'Januari' },
  { value: '1', label: 'Februari' },
  { value: '2', label: 'Maret' },
  { value: '3', label: 'April' },
  { value: '4', label: 'Mei' },
  { value: '5', label: 'Juni' },
  { value: '6', label: 'Juli' },
  { value: '7', label: 'Agustus' },
  { value: '8', label: 'September' },
  { value: '9', label: 'Oktober' },
  { value: '10', label: 'November' },
  { value: '11', label: 'Desember' },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}));

// Helper to check activity status
function getMissingActivities(
  activities: DailyActivity[],
  profiles: Profile[],
  startDate: Date,
  endDate: Date
): MissingActivity[] {
  const today = startOfDay(new Date());
  const salesPresalesProfiles = profiles.filter(
    p => p.division === 'sales' || p.division === 'presales'
  );

  // Get all weekdays in the date range (only up to today)
  const effectiveEndDate = isBefore(endDate, today) ? endDate : today;

  const allDays = eachDayOfInterval({ start: startDate, end: effectiveEndDate })
    .filter(date => !isWeekend(date));

  // Create a map of activities by user_id and date -> types
  const activityMap = new Map<string, Map<string, Set<string>>>();

  activities.forEach(activity => {
    const userId = activity.userId;
    const dateStr = format(new Date(activity.date), 'yyyy-MM-dd');

    if (!activityMap.has(userId)) {
      activityMap.set(userId, new Map());
    }

    if (!activityMap.get(userId)!.has(dateStr)) {
      activityMap.get(userId)!.set(dateStr, new Set());
    }

    activityMap.get(userId)!.get(dateStr)!.add(activity.activityType);
  });

  const missing: MissingActivity[] = [];

  salesPresalesProfiles.forEach(profile => {
    allDays.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const userActivities = activityMap.get(profile.user_id)?.get(dateStr);

      let status = 'Belum ada aktivitas';
      let isMissing = true;

      if (userActivities) {
        // Check for specific statuses
        const hasSick = userActivities.has('sick');
        const hasPermission = userActivities.has('permission');
        const hasTimeOff = userActivities.has('time_off');
        const hasWFH = userActivities.has('wfh');

        // Productive activities
        const hasProductive =
          userActivities.has('visit') ||
          userActivities.has('call') ||
          userActivities.has('email') ||
          userActivities.has('meeting') ||
          userActivities.has('other');

        if (hasSick || hasPermission || hasTimeOff) {
          // Valid absence, considered complete
          isMissing = false;
        } else if (hasWFH) {
          if (hasProductive) {
            // WFH and working
            isMissing = false;
          } else {
            // WFH but no work logged yet
            status = 'WFH - Belum ada aktivitas sales';
            isMissing = true;
          }
        } else if (hasProductive) {
          // Normal working day
          isMissing = false;
        }
      }

      if (isMissing) {
        missing.push({
          profileId: profile.id,
          profileName: profile.name,
          division: profile.division,
          date: date,
          dayName: format(date, 'EEEE', { locale: id }),
          status: status
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

// Get accumulated counts per person
function getAccumulatedCounts(missing: MissingActivity[]): Map<string, number> {
  const counts = new Map<string, number>();
  missing.forEach(item => {
    const current = counts.get(item.profileId) || 0;
    counts.set(item.profileId, current + 1);
  });
  return counts;
}

export function MissingActivitiesReport({ activities, allProfiles }: MissingActivitiesReportProps) {
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly' | 'yearly'>('weekly');
  const [selectedMonth, setSelectedMonth] = useState<string>(String(new Date().getMonth()));
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [activeTab, setActiveTab] = useState<'sales' | 'presales'>('sales');

  const today = new Date();

  // Calculate date ranges based on period type
  const dateRange = useMemo(() => {
    if (periodType === 'weekly') {
      return {
        start: startOfWeek(today, { weekStartsOn: 1 }),
        end: endOfWeek(today, { weekStartsOn: 1 })
      };
    } else if (periodType === 'monthly') {
      const year = parseInt(selectedYear);
      const month = parseInt(selectedMonth);
      return {
        start: startOfMonth(new Date(year, month)),
        end: endOfMonth(new Date(year, month))
      };
    } else {
      const year = parseInt(selectedYear);
      return {
        start: startOfYear(new Date(year, 0)),
        end: endOfYear(new Date(year, 0))
      };
    }
  }, [periodType, selectedMonth, selectedYear]);

  const missingActivities = useMemo(() => {
    return getMissingActivities(
      activities,
      allProfiles,
      dateRange.start,
      dateRange.end
    );
  }, [activities, allProfiles, dateRange]);

  const salesMissing = missingActivities.filter(m => m.division === 'sales');
  const presalesMissing = missingActivities.filter(m => m.division === 'presales');

  const currentMissing = activeTab === 'sales' ? salesMissing : presalesMissing;

  // Get accumulated counts for summary
  const salesCounts = getAccumulatedCounts(salesMissing);
  const presalesCounts = getAccumulatedCounts(presalesMissing);

  // Export to Excel
  const exportToExcel = (division: 'all' | 'sales' | 'presales') => {
    let dataToExport = missingActivities;

    if (division === 'sales') {
      dataToExport = salesMissing;
    } else if (division === 'presales') {
      dataToExport = presalesMissing;
    }

    const exportData = dataToExport.map(item => ({
      'Nama': item.profileName,
      'Divisi': item.division === 'sales' ? 'Sales' : 'Presales',
      'Tanggal': format(item.date, 'dd/MM/yyyy', { locale: id }),
      'Hari': item.dayName,
      'Status': item.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Aktivitas Tidak Diisi');

    // Auto-size columns
    const maxWidth = 30;
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.min(maxWidth, Math.max(key.length, ...exportData.map(row =>
        String(row[key as keyof typeof row] || '').length
      )))
    }));
    worksheet['!cols'] = colWidths;

    const periodLabel = periodType === 'weekly' ? 'mingguan' : periodType === 'monthly' ? 'bulanan' : 'tahunan';
    const fileName = `aktivitas_tidak_diisi_${division}_${periodLabel}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Export accumulated summary
  const exportAccumulatedSummary = () => {
    const salesProfiles = allProfiles.filter(p => p.division === 'sales');
    const presalesProfiles = allProfiles.filter(p => p.division === 'presales');

    const salesData = salesProfiles.map(p => ({
      'Nama': p.name,
      'Divisi': 'Sales',
      'Jumlah Hari Tidak Mengisi': salesCounts.get(p.id) || 0
    }));

    const presalesData = presalesProfiles.map(p => ({
      'Nama': p.name,
      'Divisi': 'Presales',
      'Jumlah Hari Tidak Mengisi': presalesCounts.get(p.id) || 0
    }));

    const exportData = [...salesData, ...presalesData].filter(d => d['Jumlah Hari Tidak Mengisi'] > 0);

    if (exportData.length === 0) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Akumulasi');

    const periodLabel = periodType === 'weekly' ? 'mingguan' : periodType === 'monthly' ? 'bulanan' : 'tahunan';
    const fileName = `akumulasi_tidak_mengisi_${periodLabel}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const getPeriodLabel = () => {
    if (periodType === 'weekly') {
      return `Minggu ke-${getWeek(today, { weekStartsOn: 1 })} ${selectedYear}`;
    } else if (periodType === 'monthly') {
      return `${months[parseInt(selectedMonth)].label} ${selectedYear}`;
    } else {
      return `Tahun ${selectedYear}`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            <CardTitle className="text-lg">Laporan Aktivitas Tidak Diisi</CardTitle>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={exportAccumulatedSummary}
              className="gap-2"
              disabled={missingActivities.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export Akumulasi
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToExcel('all')}
              className="gap-2"
              disabled={missingActivities.length === 0}
            >
              <Download className="h-4 w-4" />
              Export Semua
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Period Filter */}
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Periode</Label>
            <Select value={periodType} onValueChange={(v) => setPeriodType(v as typeof periodType)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Mingguan</SelectItem>
                <SelectItem value="monthly">Bulanan</SelectItem>
                <SelectItem value="yearly">Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {periodType === 'monthly' && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Bulan</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(periodType === 'monthly' || periodType === 'yearly') && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Tahun</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year.value} value={year.value}>
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Period Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Periode: {getPeriodLabel()}</span>
          <span className="text-muted-foreground">
            ({format(dateRange.start, 'dd MMM', { locale: id })} - {format(dateRange.end, 'dd MMM yyyy', { locale: id })})
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sales</p>
                  <p className="text-2xl font-bold">{salesMissing.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {salesCounts.size} orang tidak mengisi
                  </p>
                </div>
                <Badge variant="default">{salesCounts.size} orang</Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-secondary/50 border-secondary">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Presales</p>
                  <p className="text-2xl font-bold">{presalesMissing.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {presalesCounts.size} orang tidak mengisi
                  </p>
                </div>
                <Badge variant="secondary">{presalesCounts.size} orang</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Sales/Presales */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="sales">
                Sales ({salesMissing.length})
              </TabsTrigger>
              <TabsTrigger value="presales">
                Presales ({presalesMissing.length})
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToExcel(activeTab)}
              className="gap-2"
              disabled={currentMissing.length === 0}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export {activeTab === 'sales' ? 'Sales' : 'Presales'}
            </Button>
          </div>

          <TabsContent value="sales" className="mt-4">
            {salesMissing.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Semua sales sudah mengisi aktivitas
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Nama</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Hari</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesMissing.map((item, index) => (
                        <TableRow key={`${item.profileId}-${format(item.date, 'yyyy-MM-dd')}`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {item.profileName}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(item.date, 'dd MMM yyyy', { locale: id })}
                          </TableCell>
                          <TableCell>{item.dayName}</TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="text-xs">
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="presales" className="mt-4">
            {presalesMissing.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Semua presales sudah mengisi aktivitas
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Nama</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Hari</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {presalesMissing.map((item, index) => (
                        <TableRow key={`${item.profileId}-${format(item.date, 'yyyy-MM-dd')}`}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {item.profileName}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(item.date, 'dd MMM yyyy', { locale: id })}
                          </TableCell>
                          <TableCell>{item.dayName}</TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="text-xs">
                              {item.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
