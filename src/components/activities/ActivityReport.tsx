import { useState } from 'react';
import { DailyActivity } from '@/types';
import { Profile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

export function ActivityReport({ activities, allProfiles }: ActivityReportProps) {
  const [selectedActivity, setSelectedActivity] = useState<DailyActivity | null>(null);

  // Group activities by division
  const salesActivities = activities.filter(a => a.category === 'sales' || !a.category);
  const presalesActivities = activities.filter(a => a.category === 'presales');

  // Export to Excel
  const exportToExcel = (division: 'all' | 'sales' | 'presales') => {
    let dataToExport = activities;
    
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
      'Catatan': activity.notes || '-',
      'Latitude': activity.latitude || '-',
      'Longitude': activity.longitude || '-',
      'Nama Lokasi': activity.locationName || '-',
      'Kolaborasi Dengan': activity.collaboration?.personName || '-',
      'Divisi Kolaborasi': activity.collaboration?.division || '-',
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
          disabled={activities.length === 0}
        >
          <Download className="h-4 w-4" />
          Export Semua Data
        </Button>
      </div>

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
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 space-y-1">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Kolaborasi</span>
                  </div>
                  <p className="text-sm">
                    {selectedActivity.collaboration.personName} 
                    <span className="text-muted-foreground ml-1">
                      ({selectedActivity.collaboration.division === 'presales' ? 'Presales' : 'Divisi Lain'})
                    </span>
                  </p>
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