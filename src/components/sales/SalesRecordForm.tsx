import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { SalesRecord } from '@/types/sales';

interface SalesRecordFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (record: {
    customerName: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    costPrice: number;
    closingDate: Date;
    notes?: string;
  }) => Promise<void>;
  editRecord?: SalesRecord;
}

export function SalesRecordForm({ open, onClose, onSubmit, editRecord }: SalesRecordFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [closingDate, setClosingDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editRecord) {
      setCustomerName(editRecord.customerName);
      setProductName(editRecord.productName);
      setQuantity(editRecord.quantity);
      setUnitPrice(editRecord.unitPrice);
      setCostPrice(editRecord.costPrice || 0);
      setClosingDate(editRecord.closingDate);
      setNotes(editRecord.notes || '');
    } else {
      resetForm();
    }
  }, [editRecord, open]);

  const resetForm = () => {
    setCustomerName('');
    setProductName('');
    setQuantity(1);
    setUnitPrice(0);
    setCostPrice(0);
    setClosingDate(new Date());
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !productName.trim() || quantity <= 0 || unitPrice <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        customerName: customerName.trim(),
        productName: productName.trim(),
        quantity,
        unitPrice,
        costPrice,
        closingDate,
        notes: notes.trim() || undefined,
      });
      resetForm();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalAmount = quantity * unitPrice;
  const marginAmount = totalAmount - (costPrice * quantity);
  const marginPercentage = totalAmount > 0 ? (marginAmount / totalAmount) * 100 : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editRecord ? 'Edit Penjualan' : 'Tambah Penjualan'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Nama Customer *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Masukkan nama customer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productName">Nama Produk *</Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Masukkan nama produk"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitPrice">Harga Jual (Rp) *</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="costPrice">Harga Modal (Rp)</Label>
            <Input
              id="costPrice"
              type="number"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(Number(e.target.value))}
              placeholder="Masukkan harga modal per unit"
            />
          </div>

          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Penjualan:</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Margin:</span>
              <span className={`text-lg font-bold ${marginAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(marginAmount)} ({marginPercentage.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tanggal Closing *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !closingDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {closingDate ? format(closingDate, 'dd MMMM yyyy', { locale: id }) : 'Pilih tanggal'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={closingDate}
                  onSelect={(date) => date && setClosingDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan (opsional)"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Batal
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
