import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PeriodType, SalesTarget } from '@/types/sales';

interface SalesTargetFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    periodType: PeriodType,
    periodYear: number,
    targetAmount: number,
    periodMonth?: number,
    periodQuarter?: number,
    userId?: string,
    id?: string
  ) => Promise<void>;
  existingTarget?: SalesTarget;
}

const months = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

const quarters = [
  { value: 1, label: 'Q1 (Jan-Mar)' },
  { value: 2, label: 'Q2 (Apr-Jun)' },
  { value: 3, label: 'Q3 (Jul-Sep)' },
  { value: 4, label: 'Q4 (Okt-Des)' },
];

export function SalesTargetForm({ open, onClose, onSubmit, existingTarget }: SalesTargetFormProps) {
  const currentYear = new Date().getFullYear();
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [periodYear, setPeriodYear] = useState(currentYear);
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [periodQuarter, setPeriodQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [targetAmount, setTargetAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingTarget) {
      setPeriodType(existingTarget.periodType);
      setPeriodYear(existingTarget.periodYear);
      if (existingTarget.periodMonth) setPeriodMonth(existingTarget.periodMonth);
      if (existingTarget.periodQuarter) setPeriodQuarter(existingTarget.periodQuarter);
      setTargetAmount(existingTarget.targetAmount);
    } else {
      setPeriodType('monthly');
      setPeriodYear(currentYear);
      setPeriodMonth(new Date().getMonth() + 1);
      setPeriodQuarter(Math.ceil((new Date().getMonth() + 1) / 3));
      setTargetAmount(0);
    }
  }, [existingTarget, open, currentYear]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (targetAmount <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(
        periodType,
        periodYear,
        targetAmount,
        periodType === 'monthly' ? periodMonth : undefined,
        periodType === 'quarterly' ? periodQuarter : undefined,
        existingTarget?.userId,
        existingTarget?.id
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{existingTarget ? 'Edit Target Penjualan' : 'Set Target Penjualan'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipe Periode</Label>
            <Select value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Bulanan</SelectItem>
                <SelectItem value="quarterly">Kuartal</SelectItem>
                <SelectItem value="yearly">Tahunan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tahun</Label>
            <Select value={periodYear.toString()} onValueChange={(v) => setPeriodYear(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {periodType === 'monthly' && (
            <div className="space-y-2">
              <Label>Bulan</Label>
              <Select value={periodMonth.toString()} onValueChange={(v) => setPeriodMonth(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {periodType === 'quarterly' && (
            <div className="space-y-2">
              <Label>Kuartal</Label>
              <Select value={periodQuarter.toString()} onValueChange={(v) => setPeriodQuarter(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((q) => (
                    <SelectItem key={q.value} value={q.value.toString()}>
                      {q.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="targetAmount">Target Penjualan (Rp)</Label>
            <Input
              id="targetAmount"
              type="number"
              min="0"
              value={targetAmount}
              onChange={(e) => setTargetAmount(Number(e.target.value))}
              placeholder="Masukkan target penjualan"
              required
            />
            {targetAmount > 0 && (
              <p className="text-sm text-muted-foreground">{formatCurrency(targetAmount)}</p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan Target'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
