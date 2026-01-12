import { useState, useMemo } from 'react';
import { DailyActivity } from '@/types';
import { Profile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  FileSpreadsheet,
  MapPin,
  Phone,
  Mail,
  Users,
  Calendar,
  Briefcase,
  Eye,
  Search,
  X,
  CalendarIcon,
  AlertCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { MissingActivitiesReport } from './MissingActivitiesReport';
import { TeamActivityStats } from './TeamActivityStats';
import { useProfile } from '@/hooks/useProfile';
import { startOfWeek, endOfWeek } from 'date-fns';

interface ActivityReportProps {
  activities: DailyActivity[];
  allProfiles: Profile[];
}

const activityTypeLabels: Record<string, string> = {
  visit: 'Kunjungan',
  call: 'Telepon',
  email: 'Email',
  meeting: 'Meeting',
  other: 'Lainnya',
};

const activityTypeIcons: Record<string, React.ReactNode> = {
  visit: <MapPin className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  other: <Calendar className="h-4 w-4" />,
};

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

// Generate year options (last 5 years)
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => ({
  value: String(currentYear - i),
  label: String(currentYear - i),
}));

export function ActivityReport({ activities, allProfiles }: ActivityReportProps) {
  const { isManager } = useProfile();
  const [selectedActivity, setSelectedActivity] = useState<DailyActivity | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'date' | 'week' | 'month' | 'year'>('all');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');

  // Filter activities based on search, activity type, and date filters
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        activity.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.locationName?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Activity type filter
      if (activityTypeFilter !== 'all' && activity.activityType !== activityTypeFilter) {
        return false;
      }

      // Date filter
      const activityDate = new Date(activity.date);

      if (filterType === 'date' && selectedDate) {
        const activityDateStr = format(activityDate, 'yyyy-MM-dd');
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        return activityDateStr === selectedDateStr;
      }

      if (filterType === 'week' && selectedDate) {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        return isWithinInterval(activityDate, { start: weekStart, end: weekEnd });
      }

      if (filterType === 'month' && selectedMonth !== '' && selectedYear) {
        const monthStart = startOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth)));
        const monthEnd = endOfMonth(new Date(parseInt(selectedYear), parseInt(selectedMonth)));
        return isWithinInterval(activityDate, { start: monthStart, end: monthEnd });
      }

      if (filterType === 'year' && selectedYear) {
        const yearStart = startOfYear(new Date(parseInt(selectedYear), 0));
        const yearEnd = endOfYear(new Date(parseInt(selectedYear), 0));
        return isWithinInterval(activityDate, { start: yearStart, end: yearEnd });
      }

      return true;
    });
  }, [activities, searchQuery, filterType, selectedDate, selectedMonth, selectedYear, activityTypeFilter]);

  // Group activities by division
  const salesActivities = filteredActivities.filter(a => a.category === 'sales' || !a.category);
  const presalesActivities = filteredActivities.filter(a => a.category === 'presales');

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setSelectedDate(undefined);
    setSelectedMonth('');
    setSelectedYear(String(currentYear));
    setActivityTypeFilter('all');
  };

  // Export to Excel
  const exportToExcel = (division: 'all' | 'sales' | 'presales') => {
    let dataToExport = filteredActivities;

    if (division === 'sales') {
      dataToExport = salesActivities;
    } else if (division === 'presales') {
      dataToExport = presalesActivities;
    }

    const exportData = dataToExport.map(activity => ({
      'Tanggal': format(new Date(activity.date), 'dd/MM/yyyy', { locale: id }),
      'Waktu Input': format(new Date(activity.createdAt), 'dd/MM/yyyy HH:mm', { locale: id }),
      'Kategori': activity.category === 'sales' ? 'Sales' : 'Presales',
      'Nama Person': activity.personName,
      'Tipe Aktivitas': activityTypeLabels[activity.activityType] || activity.activityType,
      'Nama Customer': activity.customerName,
      'Project': activity.project || '-',
      'Opportunity': activity.opportunity || '-',
      'Catatan': activity.notes || '-',
      'Latitude': activity.latitude || '-',
      'Longitude': activity.longitude || '-',
      'Nama Lokasi': activity.locationName || '-',
      'Kolaborasi': activity.collaboration?.collaborators
        ? activity.collaboration.collaborators.map(c => `${c.personName} (${c.bookingDate ? format(new Date(c.bookingDate), 'dd/MM/yyyy') : '-'})`).join(', ')
        : activity.collaboration?.personName || '-',
      'Jumlah Foto': activity.photos?.length || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Aktivitas');

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.min(maxWidth, Math.max(key.length, ...exportData.map(row =>
        String(row[key as keyof typeof row] || '').length
      )))
    }));
    worksheet['!cols'] = colWidths;

    const fileName = `report_aktivitas_${division}_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const renderActivityTable = (activityList: DailyActivity[], division: string) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={division === 'sales' ? 'default' : 'secondary'}>
            {activityList.length} aktivitas
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToExcel(division as 'sales' | 'presales')}
          className="gap-2"
          disabled={activityList.length === 0}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {activityList.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Tidak ada data aktivitas
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">Tanggal</TableHead>
                  <TableHead>Person</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Opportunity</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead className="w-[80px] text-center">Detail</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityList.map(activity => (
                  <TableRow key={activity.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      {format(new Date(activity.date), 'dd MMM yy', { locale: id })}
                    </TableCell>
                    <TableCell>{activity.personName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {activityTypeIcons[activity.activityType]}
                        <span className="text-sm">{activityTypeLabels[activity.activityType]}</span>
                      </div>
                    </TableCell>
                    <TableCell>{activity.customerName}</TableCell>
                    <TableCell>
                      <span className="text-sm">{activity.project || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{activity.opportunity || '-'}</span>
                    </TableCell>
                    <TableCell>
                      {activity.locationName ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs truncate max-w-[150px]" title={activity.locationName}>
                            {activity.locationName.split(',')[0]}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedActivity(activity)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Report Aktivitas</h2>
          <p className="text-muted-foreground">
            Laporan aktivitas berdasarkan divisi
          </p>
        </div>
        <Button
          onClick={() => exportToExcel('all')}
          className="gap-2"
          disabled={filteredActivities.length === 0}
        >
          <Download className="h-4 w-4" />
          Export Semua Data
        </Button>
      </div>

      {/* Team Activity Stats - Visible Only to Managers */}
      {isManager && (
        <TeamActivityStats
          activities={filteredActivities}
          allProfiles={allProfiles}
        />
      )}

      {/* Search and Filter Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cari customer, person, catatan, atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Type Selector */}
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Tipe Aktivitas</Label>
                <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Semua Tipe
                      </div>
                    </SelectItem>
                    <SelectItem value="visit">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Kunjungan
                      </div>
                    </SelectItem>
                    <SelectItem value="call">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telepon
                      </div>
                    </SelectItem>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </div>
                    </SelectItem>
                    <SelectItem value="meeting">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Meeting
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Filter Waktu</Label>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Pilih filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Waktu</SelectItem>
                    <SelectItem value="date">Tanggal</SelectItem>
                    <SelectItem value="week">Mingguan</SelectItem>
                    <SelectItem value="month">Bulan</SelectItem>
                    <SelectItem value="year">Tahun</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date/Week Picker */}
              {(filterType === 'date' || filterType === 'week') && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    {filterType === 'date' ? 'Pilih Tanggal' : 'Pilih Tanggal dalam Minggu'}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-[200px] justify-start text-left font-normal',
                          !selectedDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: id }) : 'Pilih tanggal'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Month & Year Picker */}
              {filterType === 'month' && (
                <>
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
                </>
              )}

              {/* Year Only Picker */}
              {filterType === 'year' && (
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

              {/* Clear Filter Button */}
              {(searchQuery || filterType !== 'all') && (
                <div className="space-y-2">
                  <Label className="text-sm text-transparent">Clear</Label>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                    <X className="h-4 w-4" />
                    Reset Filter
                  </Button>
                </div>
              )}
            </div>

            {/* Active Filter Info */}
            {(searchQuery || filterType !== 'all') && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Menampilkan {filteredActivities.length} dari {activities.length} aktivitas</span>
                {filterType === 'date' && selectedDate && (
                  <Badge variant="outline">
                    {format(selectedDate, 'dd MMMM yyyy', { locale: id })}
                  </Badge>
                )}
                {filterType === 'week' && selectedDate && (
                  <Badge variant="outline">
                    Minggu: {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd MMM', { locale: id })} - {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd MMM yyyy', { locale: id })}
                  </Badge>
                )}
                {filterType === 'month' && selectedMonth !== '' && (
                  <Badge variant="outline">
                    {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                  </Badge>
                )}
                {filterType === 'year' && (
                  <Badge variant="outline">
                    Tahun {selectedYear}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              Total Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{salesActivities.length}</div>
            <p className="text-sm text-muted-foreground">aktivitas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Total Presales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{presalesActivities.length}</div>
            <p className="text-sm text-muted-foreground">aktivitas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="presales" className="gap-2">
            <Users className="h-4 w-4" />
            Presales
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="mt-4">
          {renderActivityTable(salesActivities, 'sales')}
        </TabsContent>
        <TabsContent value="presales" className="mt-4">
          {renderActivityTable(presalesActivities, 'presales')}
        </TabsContent>
      </Tabs>

      {/* Missing Activities Report */}
      <MissingActivitiesReport
        activities={activities}
        allProfiles={allProfiles}
      />

      {/* Activity Detail Dialog */}
      <Dialog open={!!selectedActivity} onOpenChange={() => setSelectedActivity(null)}>
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
                    {format(new Date(selectedActivity.date), 'EEEE, dd MMMM yyyy', { locale: id })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kategori</p>
                  <Badge variant={selectedActivity.category === 'sales' ? 'default' : 'secondary'}>
                    {selectedActivity.category === 'sales' ? 'Sales' : 'Presales'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Person</p>
                  <p className="font-medium">{selectedActivity.personName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipe Aktivitas</p>
                  <div className="flex items-center gap-1">
                    {activityTypeIcons[selectedActivity.activityType]}
                    <span>{activityTypeLabels[selectedActivity.activityType]}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium">{selectedActivity.customerName}</p>
              </div>

              {(selectedActivity.project || selectedActivity.opportunity) && (
                <div className="grid grid-cols-2 gap-4">
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
                </div>
              )}

              {selectedActivity.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Catatan</p>
                  <p className="text-sm">{selectedActivity.notes}</p>
                </div>
              )}

              {/* Location Info */}
              {(selectedActivity.latitude && selectedActivity.longitude) && (
                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-sm">Lokasi Check-in</span>
                  </div>
                  {selectedActivity.locationName && (
                    <p className="text-sm">{selectedActivity.locationName}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Koordinat: {selectedActivity.latitude.toFixed(6)}, {selectedActivity.longitude.toFixed(6)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(
                      `https://www.google.com/maps?q=${selectedActivity.latitude},${selectedActivity.longitude}`,
                      '_blank'
                    )}
                    className="gap-1"
                  >
                    <MapPin className="h-3 w-3" />
                    Buka di Google Maps
                  </Button>
                </div>
              )}

              {/* Collaboration */}
              {selectedActivity.collaboration && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Kolaborasi</span>
                  </div>
                  <div className="space-y-2">
                    {selectedActivity.collaboration.collaborators ? (
                      selectedActivity.collaboration.collaborators.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>{c.personName}</span>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-[10px] h-5">{c.division}</Badge>
                            {c.bookingDate && (
                              <Badge variant="secondary" className="text-[10px] h-5 bg-blue-100 dark:bg-blue-900">
                                Booking: {format(new Date(c.bookingDate), 'dd MMM yyyy', { locale: id })}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm">
                        {selectedActivity.collaboration.personName}
                        <span className="text-muted-foreground ml-1">
                          ({selectedActivity.collaboration.division === 'presales' ? 'Presales' : 'Divisi Lain'})
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Photos */}
              {selectedActivity.photos && selectedActivity.photos.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Foto ({selectedActivity.photos.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedActivity.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Foto ${index + 1}`}
                        className="h-20 w-20 rounded-lg object-cover border"
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Waktu Input</p>
                <p className="text-sm">
                  {format(new Date(selectedActivity.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}