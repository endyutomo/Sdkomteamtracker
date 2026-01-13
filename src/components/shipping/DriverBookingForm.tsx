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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, Loader2, Truck, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookingFormData, DriverBooking, Shipment } from '@/types/shipping';
import { Profile } from '@/hooks/useProfile';

interface DriverBookingFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: BookingFormData) => Promise<DriverBooking | null>;
    shipment: Shipment | null;
    availableDrivers: Profile[];
}

export function DriverBookingForm({
    open,
    onClose,
    onSubmit,
    shipment,
    availableDrivers
}: DriverBookingFormProps) {
    const [loading, setLoading] = useState(false);
    const [driverId, setDriverId] = useState('');
    const [bookingDate, setBookingDate] = useState<Date | undefined>(new Date());
    const [bookingTime, setBookingTime] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!shipment || !driverId || !bookingDate) {
            return;
        }

        setLoading(true);
        try {
            const result = await onSubmit({
                shipmentId: shipment.id,
                driverId,
                bookingDate,
                bookingTime: bookingTime || undefined,
                notes: notes || undefined,
            });

            if (result) {
                onClose();
                setDriverId('');
                setBookingDate(new Date());
                setBookingTime('');
                setNotes('');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!shipment) return null;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        Booking Driver
                    </DialogTitle>
                    <DialogDescription>
                        Pilih driver untuk pengiriman ini
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Shipment Info */}
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <p className="font-medium text-sm">{shipment.itemDescription}</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>Dari: {shipment.senderName} - {shipment.senderAddress}</p>
                            <p>Ke: {shipment.recipientName} - {shipment.recipientAddress}</p>
                        </div>
                    </div>

                    {/* Driver Selection */}
                    <div className="space-y-2">
                        <Label>Pilih Driver *</Label>
                        <Select value={driverId} onValueChange={setDriverId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih driver..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availableDrivers.length === 0 ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                        Tidak ada driver tersedia
                                    </div>
                                ) : (
                                    availableDrivers.map((driver) => (
                                        <SelectItem key={driver.user_id} value={driver.user_id}>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span>{driver.name}</span>
                                                {driver.jabatan && (
                                                    <span className="text-muted-foreground text-xs">
                                                        ({driver.jabatan})
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Booking Date */}
                    <div className="space-y-2">
                        <Label>Tanggal Booking *</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !bookingDate && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {bookingDate
                                        ? format(bookingDate, 'PPP', { locale: localeId })
                                        : 'Pilih tanggal'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={bookingDate}
                                    onSelect={setBookingDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Booking Time */}
                    <div className="space-y-2">
                        <Label htmlFor="bookingTime">Waktu (opsional)</Label>
                        <Select value={bookingTime} onValueChange={setBookingTime}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih waktu..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="08:00">08:00 - Pagi</SelectItem>
                                <SelectItem value="10:00">10:00</SelectItem>
                                <SelectItem value="12:00">12:00 - Siang</SelectItem>
                                <SelectItem value="14:00">14:00</SelectItem>
                                <SelectItem value="16:00">16:00 - Sore</SelectItem>
                                <SelectItem value="18:00">18:00</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Catatan</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Instruksi khusus untuk driver..."
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading || !driverId || !bookingDate}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Booking Driver
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
