import { useState } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ShipmentFormData, Shipment } from '@/types/shipping';

interface ShipmentFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: ShipmentFormData) => Promise<Shipment | null>;
    editShipment?: Shipment | null;
}

export function ShipmentForm({ open, onClose, onSubmit, editShipment }: ShipmentFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ShipmentFormData>({
        senderName: editShipment?.senderName || '',
        senderAddress: editShipment?.senderAddress || '',
        senderPhone: editShipment?.senderPhone || '',
        recipientName: editShipment?.recipientName || '',
        recipientAddress: editShipment?.recipientAddress || '',
        recipientPhone: editShipment?.recipientPhone || '',
        itemDescription: editShipment?.itemDescription || '',
        weightKg: editShipment?.weightKg || undefined,
        dimensions: editShipment?.dimensions || '',
        pickupDate: editShipment?.pickupDate || undefined,
        estimatedDelivery: editShipment?.estimatedDelivery || undefined,
        notes: editShipment?.notes || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.senderName || !formData.senderAddress ||
            !formData.recipientName || !formData.recipientAddress ||
            !formData.itemDescription) {
            return;
        }

        setLoading(true);
        try {
            const result = await onSubmit(formData);
            if (result) {
                onClose();
                setFormData({
                    senderName: '',
                    senderAddress: '',
                    senderPhone: '',
                    recipientName: '',
                    recipientAddress: '',
                    recipientPhone: '',
                    itemDescription: '',
                    weightKg: undefined,
                    dimensions: '',
                    pickupDate: undefined,
                    estimatedDelivery: undefined,
                    notes: '',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editShipment ? 'Edit Pengiriman' : 'Buat Pengiriman Baru'}
                    </DialogTitle>
                    <DialogDescription>
                        Isi detail pengiriman barang
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Sender Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Informasi Pengirim
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="senderName">Nama Pengirim *</Label>
                                <Input
                                    id="senderName"
                                    value={formData.senderName}
                                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                                    placeholder="Nama lengkap pengirim"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="senderPhone">No. Telepon</Label>
                                <Input
                                    id="senderPhone"
                                    value={formData.senderPhone}
                                    onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                                    placeholder="08xxxxxxxxxx"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="senderAddress">Alamat Pengirim *</Label>
                            <Textarea
                                id="senderAddress"
                                value={formData.senderAddress}
                                onChange={(e) => setFormData({ ...formData, senderAddress: e.target.value })}
                                placeholder="Alamat lengkap pengirim"
                                required
                            />
                        </div>
                    </div>

                    {/* Recipient Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Informasi Penerima
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="recipientName">Nama Penerima *</Label>
                                <Input
                                    id="recipientName"
                                    value={formData.recipientName}
                                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                                    placeholder="Nama lengkap penerima"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="recipientPhone">No. Telepon</Label>
                                <Input
                                    id="recipientPhone"
                                    value={formData.recipientPhone}
                                    onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                                    placeholder="08xxxxxxxxxx"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="recipientAddress">Alamat Penerima *</Label>
                            <Textarea
                                id="recipientAddress"
                                value={formData.recipientAddress}
                                onChange={(e) => setFormData({ ...formData, recipientAddress: e.target.value })}
                                placeholder="Alamat lengkap penerima"
                                required
                            />
                        </div>
                    </div>

                    {/* Item Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Detail Barang
                        </h3>
                        <div className="space-y-2">
                            <Label htmlFor="itemDescription">Deskripsi Barang *</Label>
                            <Textarea
                                id="itemDescription"
                                value={formData.itemDescription}
                                onChange={(e) => setFormData({ ...formData, itemDescription: e.target.value })}
                                placeholder="Jelaskan barang yang dikirim"
                                required
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="weightKg">Berat (kg)</Label>
                                <Input
                                    id="weightKg"
                                    type="number"
                                    step="0.1"
                                    value={formData.weightKg || ''}
                                    onChange={(e) => setFormData({ ...formData, weightKg: parseFloat(e.target.value) || undefined })}
                                    placeholder="0.0"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dimensions">Dimensi</Label>
                                <Input
                                    id="dimensions"
                                    value={formData.dimensions}
                                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                                    placeholder="P x L x T cm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Jadwal Pengiriman
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Tanggal Pengambilan</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !formData.pickupDate && 'text-muted-foreground'
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.pickupDate
                                                ? format(formData.pickupDate, 'PPP', { locale: localeId })
                                                : 'Pilih tanggal'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.pickupDate}
                                            onSelect={(date) => setFormData({ ...formData, pickupDate: date || undefined })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-2">
                                <Label>Estimasi Pengiriman</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                'w-full justify-start text-left font-normal',
                                                !formData.estimatedDelivery && 'text-muted-foreground'
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.estimatedDelivery
                                                ? format(formData.estimatedDelivery, 'PPP', { locale: localeId })
                                                : 'Pilih tanggal'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.estimatedDelivery}
                                            onSelect={(date) => setFormData({ ...formData, estimatedDelivery: date || undefined })}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Catatan</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Catatan tambahan (opsional)"
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editShipment ? 'Simpan' : 'Buat Pengiriman'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
