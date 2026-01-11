import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Target, TrendingUp, Edit, Trash2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useSales } from '@/hooks/useSales';
import { SalesRecordForm } from './SalesRecordForm';
import { SalesTargetForm } from './SalesTargetForm';
import { SalesRecord, PeriodType } from '@/types/sales';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export function SalesDashboard() {
  const {
    targets,
    records,
    loading,
    addTarget,
    addRecord,
    updateRecord,
    deleteRecord,
    getTargetForPeriod,
    getSalesForPeriod,
  } = useSales();

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalesRecord | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  // Calculate summaries
  const monthlyTarget = getTargetForPeriod('monthly', currentYear, currentMonth);
  const quarterlyTarget = getTargetForPeriod('quarterly', currentYear, undefined, currentQuarter);
  const yearlyTarget = getTargetForPeriod('yearly', currentYear);

  const monthlySales = getSalesForPeriod('monthly', currentYear, currentMonth);
  const quarterlySales = getSalesForPeriod('quarterly', currentYear, undefined, currentQuarter);
  const yearlySales = getSalesForPeriod('yearly', currentYear);

  const monthlyTotal = monthlySales.reduce((sum, r) => sum + r.totalAmount, 0);
  const quarterlyTotal = quarterlySales.reduce((sum, r) => sum + r.totalAmount, 0);
  const yearlyTotal = yearlySales.reduce((sum, r) => sum + r.totalAmount, 0);

  const monthlyAchievement = monthlyTarget
    ? Math.min((monthlyTotal / monthlyTarget.targetAmount) * 100, 100)
    : 0;
  const quarterlyAchievement = quarterlyTarget
    ? Math.min((quarterlyTotal / quarterlyTarget.targetAmount) * 100, 100)
    : 0;
  const yearlyAchievement = yearlyTarget
    ? Math.min((yearlyTotal / yearlyTarget.targetAmount) * 100, 100)
    : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleAddRecord = async (record: {
    customerName: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    closingDate: Date;
    notes?: string;
  }) => {
    await addRecord(record);
  };

  const handleEditRecord = async (record: {
    customerName: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    closingDate: Date;
    notes?: string;
  }) => {
    if (editingRecord) {
      await updateRecord(editingRecord.id, record);
      setEditingRecord(undefined);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    await deleteRecord(id);
    setDeleteConfirm(null);
  };

  const handleAddTarget = async (
    periodType: PeriodType,
    periodYear: number,
    targetAmount: number,
    periodMonth?: number,
    periodQuarter?: number
  ) => {
    await addTarget(periodType, periodYear, targetAmount, periodMonth, periodQuarter);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Target Bulanan</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyTarget ? formatCurrency(monthlyTarget.targetAmount) : 'Belum diset'}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Tercapai: {formatCurrency(monthlyTotal)}</span>
                <span>{monthlyAchievement.toFixed(0)}%</span>
              </div>
              <Progress value={monthlyAchievement} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {months[currentMonth - 1]} {currentYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Target Kuartal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quarterlyTarget ? formatCurrency(quarterlyTarget.targetAmount) : 'Belum diset'}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Tercapai: {formatCurrency(quarterlyTotal)}</span>
                <span>{quarterlyAchievement.toFixed(0)}%</span>
              </div>
              <Progress value={quarterlyAchievement} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Q{currentQuarter} {currentYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Target Tahunan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {yearlyTarget ? formatCurrency(yearlyTarget.targetAmount) : 'Belum diset'}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Tercapai: {formatCurrency(yearlyTotal)}</span>
                <span>{yearlyAchievement.toFixed(0)}%</span>
              </div>
              <Progress value={yearlyAchievement} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tahun {currentYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setShowRecordForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Penjualan
        </Button>
        <Button variant="outline" onClick={() => setShowTargetForm(true)}>
          <Target className="h-4 w-4 mr-2" />
          Set Target
        </Button>
      </div>

      {/* Tabs for Records and Targets */}
      <Tabs defaultValue="records" className="w-full">
        <TabsList>
          <TabsTrigger value="records">Riwayat Penjualan</TabsTrigger>
          <TabsTrigger value="targets">Daftar Target</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Penjualan</CardTitle>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada data penjualan. Klik "Tambah Penjualan" untuk memulai.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Sales</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {format(record.closingDate, 'dd MMM yyyy', { locale: id })}
                          </TableCell>
                          <TableCell className="font-medium">{record.userName}</TableCell>
                          <TableCell className="font-medium">{record.customerName}</TableCell>
                          <TableCell>{record.productName}</TableCell>
                          <TableCell className="text-right">{record.quantity}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(record.totalAmount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingRecord(record);
                                  setShowRecordForm(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteConfirm(record.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="targets" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Target</CardTitle>
            </CardHeader>
            <CardContent>
              {targets.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada target yang diset. Klik "Set Target" untuk memulai.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sales</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead>Tahun</TableHead>
                        <TableHead>Detail</TableHead>
                        <TableHead className="text-right">Target</TableHead>
                        <TableHead className="text-right">Realisasi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {targets.map((target) => (
                        <TableRow key={target.id}>
                          <TableCell className="font-medium">{target.userName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {target.periodType === 'monthly'
                                ? 'Bulanan'
                                : target.periodType === 'quarterly'
                                  ? 'Kuartal'
                                  : 'Tahunan'}
                            </Badge>
                          </TableCell>
                          <TableCell>{target.periodYear}</TableCell>
                          <TableCell>
                            {target.periodType === 'monthly' && target.periodMonth
                              ? months[target.periodMonth - 1]
                              : target.periodType === 'quarterly' && target.periodQuarter
                                ? `Q${target.periodQuarter}`
                                : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(target.targetAmount)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-primary">
                            {formatCurrency(target.achievedAmount || 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <SalesRecordForm
        open={showRecordForm}
        onClose={() => {
          setShowRecordForm(false);
          setEditingRecord(undefined);
        }}
        onSubmit={editingRecord ? handleEditRecord : handleAddRecord}
        editRecord={editingRecord}
      />

      <SalesTargetForm
        open={showTargetForm}
        onClose={() => setShowTargetForm(false)}
        onSubmit={handleAddTarget}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Penjualan</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus data penjualan ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDeleteRecord(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
