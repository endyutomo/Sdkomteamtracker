import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Target, TrendingUp, Edit, Trash2, DollarSign, Users, ChevronDown, ChevronRight, Calendar, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { useSales } from '@/hooks/useSales';
import { useProfile } from '@/hooks/useProfile';
import { SalesRecordForm } from './SalesRecordForm';
import { SalesTargetForm } from './SalesTargetForm';
import { SalesAnalytics } from './SalesAnalytics';
import { SalesLeaderboard } from './SalesLeaderboard';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const months = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

interface SalesDashboardProps {
  isViewOnly?: boolean;
}

export function SalesDashboard({ isViewOnly = false }: SalesDashboardProps) {
  const {
    targets,
    records,
    loading,
    addTarget,
    deleteTarget,
    addRecord,
    updateRecord,
    deleteRecord,
    getTargetForPeriod,
    getSalesForPeriod,
    getSalesTeamReport,
    getAvailableYears,
    getMonthlyTrend,
    isManager,
  } = useSales();
  const { profile } = useProfile();

  const [showRecordForm, setShowRecordForm] = useState(false);
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalesRecord | undefined>();
  const [editingTarget, setEditingTarget] = useState<any | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteTargetConfirm, setDeleteTargetConfirm] = useState<string | null>(null);
  const [expandedSalesId, setExpandedSalesId] = useState<string | null>(null);
  const [reportPeriodType, setReportPeriodType] = useState<PeriodType>('monthly');
  const [showYearlyDetail, setShowYearlyDetail] = useState(false);

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const currentMonth = currentDate.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  // States for Team Report Filtering
  const [reportYear, setReportYear] = useState(currentDate.getFullYear());
  const [reportMonth, setReportMonth] = useState(currentDate.getMonth() + 1);
  const [reportQuarter, setReportQuarter] = useState(Math.ceil((currentDate.getMonth() + 1) / 3));


  const availableYears = getAvailableYears();
  const years = availableYears.length > 0 ? availableYears : [new Date().getFullYear()];

  // Calculate summaries
  const monthlyTarget = getTargetForPeriod('monthly', selectedYear, currentMonth);
  const quarterlyTarget = getTargetForPeriod('quarterly', selectedYear, undefined, currentQuarter);
  const yearlyTarget = getTargetForPeriod('yearly', selectedYear);

  const monthlySales = getSalesForPeriod('monthly', selectedYear, currentMonth);
  const quarterlySales = getSalesForPeriod('quarterly', selectedYear, undefined, currentQuarter);
  const yearlySales = getSalesForPeriod('yearly', selectedYear);

  const monthlyTotal = monthlySales.reduce((sum, r) => sum + (r.marginAmount || 0), 0);
  const quarterlyTotal = quarterlySales.reduce((sum, r) => sum + (r.marginAmount || 0), 0);
  const yearlyTotal = yearlySales.reduce((sum, r) => sum + (r.marginAmount || 0), 0);

  const monthlyAchievement = monthlyTarget
    ? Math.min((monthlyTotal / monthlyTarget.targetAmount) * 100, 100)
    : 0;
  const quarterlyAchievement = quarterlyTarget
    ? Math.min((quarterlyTotal / quarterlyTarget.targetAmount) * 100, 100)
    : 0;
  const yearlyAchievement = yearlyTarget
    ? Math.min((yearlyTotal / yearlyTarget.targetAmount) * 100, 100)
    : 0;



  const handleAddRecord = async (record: {
    customerName: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    otherExpense: number;
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
    costPrice: number;
    otherExpense: number;
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

  const handleSaveTarget = async (
    periodType: PeriodType,
    periodYear: number,
    targetAmount: number,
    periodMonth?: number,
    periodQuarter?: number,
    userId?: string,
    id?: string
  ) => {
    await addTarget(periodType, periodYear, targetAmount, periodMonth, periodQuarter, userId, id);
    setEditingTarget(undefined);
  };

  const handleDeleteTarget = async (id: string) => {
    await deleteTarget(id);
    setDeleteTargetConfirm(null);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Penjualan</h2>
          <p className="text-muted-foreground">
            Overview kinerja penjualan tahun {selectedYear}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-background/95 p-1 rounded-lg border">
          <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
          <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px] border-none shadow-none focus:ring-0">
              <SelectValue placeholder="Pilih Tahun" />
            </SelectTrigger>
            <SelectContent>
              {Array.from(new Set([...(getAvailableYears?.() || []), new Date().getFullYear()]))
                .sort((a, b) => b - a)
                .map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {isManager ? 'Target Tim Bulanan' : 'Target Bulanan'}
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyTarget ? formatCurrency(monthlyTarget.targetAmount) : 'Belum diset'}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Tercapai (Margin): {formatCurrency(monthlyTotal)}</span>
                <span>{monthlyAchievement.toFixed(0)}%</span>
              </div>
              <Progress value={monthlyAchievement} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {months[currentMonth - 1]} {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {isManager ? 'Target Tim Kuartal' : 'Target Kuartal'}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quarterlyTarget ? formatCurrency(quarterlyTarget.targetAmount) : 'Belum diset'}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Tercapai (Margin): {formatCurrency(quarterlyTotal)}</span>
                <span>{quarterlyAchievement.toFixed(0)}%</span>
              </div>
              <Progress value={quarterlyAchievement} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Q{currentQuarter} {selectedYear}</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-primary/50 transition-colors group"
          onClick={() => setShowYearlyDetail(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {isManager ? 'Target Tim Tahunan' : 'Target Tahunan'}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {yearlyTarget ? formatCurrency(yearlyTarget.targetAmount) : 'Belum diset'}
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Tercapai (Margin): {formatCurrency(yearlyTotal)}</span>
                <span>{yearlyAchievement.toFixed(0)}%</span>
              </div>
              <Progress value={yearlyAchievement} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tahun {selectedYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons - Hidden for view only */}
      {!isViewOnly && (
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
      )}

      {/* Tabs for Records and Targets */}
      <Tabs defaultValue="records" className="w-full">
        <TabsList>
          <TabsTrigger value="records">Riwayat Penjualan</TabsTrigger>
          <TabsTrigger value="targets">Daftar Target</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="team-report">Report Tim</TabsTrigger>
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
                        <TableHead className="text-right">Margin</TableHead>
                        {!isViewOnly && <TableHead className="text-right">Aksi</TableHead>}
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
                            <div className="flex flex-col items-end">
                              <span className={`font-medium ${(record.marginAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(record.marginAmount || 0)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({(record.marginPercentage || 0).toFixed(1)}%)
                              </span>
                            </div>
                          </TableCell>
                          {!isViewOnly && (
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
                          )}
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
                        {!isViewOnly && <TableHead className="text-right">Aksi</TableHead>}
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
                          {!isViewOnly && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditingTarget(target);
                                    setShowTargetForm(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteTargetConfirm(target.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Report Tab - Visible to All */}
        <TabsContent value="team-report" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Report Penjualan Tim
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={reportPeriodType === 'monthly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportPeriodType('monthly')}
                  >
                    Bulanan
                  </Button>
                  <Button
                    variant={reportPeriodType === 'quarterly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportPeriodType('quarterly')}
                  >
                    Kuartal
                  </Button>
                  <Button
                    variant={reportPeriodType === 'yearly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setReportPeriodType('yearly')}
                  >
                    Tahunan
                  </Button>
                </div>
              </div>

              {/* Filters Section */}
              <div className="flex gap-3 mt-4 items-center flex-wrap">
                {/* Year Selector */}
                <Select value={reportYear.toString()} onValueChange={(v) => setReportYear(parseInt(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Tahun" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.length > 0 ? (
                      availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))
                    ) : (
                      <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                    )}
                  </SelectContent>
                </Select>

                {/* Month Selector */}
                {reportPeriodType === 'monthly' && (
                  <Select value={reportMonth.toString()} onValueChange={(v) => setReportMonth(parseInt(v))}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Bulan" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month, index) => (
                        <SelectItem key={index + 1} value={(index + 1).toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Quarter Selector */}
                {reportPeriodType === 'quarterly' && (
                  <Select value={reportQuarter.toString()} onValueChange={(v) => setReportQuarter(parseInt(v))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Kuartal" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((q) => (
                        <SelectItem key={q} value={q.toString()}>Kuartal {q}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const teamReport = getSalesTeamReport(
                  reportPeriodType,
                  reportYear,
                  reportPeriodType === 'monthly' ? reportMonth : undefined,
                  reportPeriodType === 'quarterly' ? reportQuarter : undefined
                ).sort((a, b) => b.achievedAmount - a.achievedAmount); // Sort by margin (achievedAmount) descending

                if (teamReport.length === 0) {
                  return (
                    <p className="text-center text-muted-foreground py-8">
                      Belum ada data sales team.
                    </p>
                  );
                }

                return (
                  <div className="space-y-4">
                    {/* Leaderboard Section */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-4 px-1">Peringkat Sales (Berdasarkan Margin)</h3>
                      <SalesLeaderboard data={teamReport} />
                    </div>

                    <h3 className="text-lg font-semibold px-1">Detail Tim</h3>
                    <div className="space-y-2">
                      {teamReport.map((sales) => (
                        <div key={sales.userId} className="border rounded-lg">
                          <div
                            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setExpandedSalesId(
                              expandedSalesId === sales.userId ? null : sales.userId
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {expandedSalesId === sales.userId ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <div>
                                  <p className="font-medium">{sales.userName}</p>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {sales.division}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">
                                  {formatCurrency(sales.achievedAmount)}
                                  <span className="text-muted-foreground font-normal">
                                    {' '}/ {formatCurrency(sales.targetAmount)}
                                  </span>
                                </p>
                                <p className={`text-sm font-medium ${sales.achievementPercentage >= 100
                                  ? 'text-green-600'
                                  : sales.achievementPercentage >= 50
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                                  }`}>
                                  {sales.achievementPercentage.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <Progress
                                value={Math.min(sales.achievementPercentage, 100)}
                                className="h-2"
                              />
                            </div>
                          </div>

                          {/* Expanded Detail */}
                          {expandedSalesId === sales.userId && (
                            <div className="border-t bg-muted/30 p-4">
                              <h4 className="font-medium mb-3 text-sm">
                                Detail Transaksi ({sales.records.length} transaksi)
                              </h4>
                              {sales.records.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  Belum ada transaksi pada periode ini.
                                </p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Produk</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Margin</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {sales.records.map((record) => (
                                        <TableRow key={record.id}>
                                          <TableCell className="text-sm">
                                            {format(record.closingDate, 'dd MMM', { locale: id })}
                                          </TableCell>
                                          <TableCell className="text-sm">
                                            {record.customerName}
                                          </TableCell>
                                          <TableCell className="text-sm">
                                            {record.productName}
                                          </TableCell>
                                          <TableCell className="text-right text-sm">
                                            {formatCurrency(record.totalAmount)}
                                          </TableCell>
                                          <TableCell className={`text-right text-sm font-medium ${(record.marginAmount || 0) >= 0
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                            }`}>
                                            {formatCurrency(record.marginAmount || 0)}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="analytics" className="mt-4">
          <SalesAnalytics
            getMonthlyTrend={getMonthlyTrend}
            getAvailableYears={getAvailableYears}
            formatCurrency={formatCurrency}
          />
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
        onClose={() => {
          setShowTargetForm(false);
          setEditingTarget(undefined);
        }}
        onSubmit={handleSaveTarget}
        existingTarget={editingTarget}
      />

      {/* Delete Confirmation Records */}
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

      {/* Delete Confirmation Targets */}
      <AlertDialog open={!!deleteTargetConfirm} onOpenChange={() => setDeleteTargetConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Target</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus target ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTargetConfirm && handleDeleteTarget(deleteTargetConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Yearly Detail Dialog */}
      <Dialog open={showYearlyDetail} onOpenChange={setShowYearlyDetail}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Target Tim Tahunan - {selectedYear}</DialogTitle>
            <DialogDescription>
              Breakdown target dan realisasi margin per anggota sales.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid gap-4 md:grid-cols-2 mb-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Target Tim</p>
                <p className="text-2xl font-bold">{formatCurrency(yearlyTarget?.targetAmount || 0)}</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Pencapaian (Margin)</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(yearlyTotal)}</p>
                <div className="mt-2 text-sm">
                  Pencapaian: {yearlyAchievement.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Sales</TableHead>
                    <TableHead className="text-right">Target</TableHead>
                    <TableHead className="text-right">Realisasi (Margin)</TableHead>
                    <TableHead className="text-right">Pencapaian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getSalesTeamReport('yearly', selectedYear).map((sales) => (
                    <TableRow key={sales.userId}>
                      <TableCell className="font-medium">{sales.userName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sales.targetAmount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(sales.achievedAmount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className={`font-medium ${sales.achievementPercentage >= 100 ? 'text-green-600' :
                              sales.achievementPercentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {sales.achievementPercentage.toFixed(1)}%
                          </span>
                          <Progress value={Math.min(sales.achievementPercentage, 100)} className="h-1 w-20" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {getSalesTeamReport('yearly', selectedYear).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Belum ada data sales team.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
