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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Notification } from '@/types/notifications';
import { useNotifications } from '@/hooks/useNotifications';
import { Loader2, CheckCircle, XCircle, MapPin, Package } from 'lucide-react';

interface BookingAcceptanceDialogProps {
    open: boolean;
    onClose: () => void;
    notification: Notification;
    action: 'accept' | 'reject';
}

export function BookingAcceptanceDialog({
    open,
    onClose,
    notification,
    action,
}: BookingAcceptanceDialogProps) {
    const { acceptBooking, rejectBooking } = useNotifications();
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState('');

    const bookingData = notification.data;
    const isAccept = action === 'accept';

    const handleSubmit = async () => {
        if (!bookingData?.booking_id) return;

        setLoading(true);
        try {
            let success = false;
            if (isAccept) {
                success = await acceptBooking(notification.id, bookingData.booking_id);
            } else {
                success = await rejectBooking(notification.id, bookingData.booking_id, reason);
            }

            if (success) {
                onClose();
                setReason('');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isAccept ? (
                            <>
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Terima Pengiriman
                            </>
                        ) : (
                            <>
                                <XCircle className="h-5 w-5 text-red-600" />
                                Tolak Pengiriman
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {isAccept
                            ? 'Konfirmasi untuk menerima pengiriman ini'
                            : 'Berikan alasan penolakan pengiriman'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Shipment Details */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <div className="flex items-start gap-2">
                            <Package className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">
                                    {bookingData?.item_description || 'Pengiriman Barang'}
                                </p>
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1 ml-6">
                            <p>
                                <span className="font-medium">Dari:</span> {bookingData?.sender_name}
                            </p>
                            <p>
                                <span className="font-medium">Ke:</span> {bookingData?.recipient_name}
                            </p>
                            {bookingData?.booking_date && (
                                <p>
                                    <span className="font-medium">Tanggal:</span>{' '}
                                    {format(new Date(bookingData.booking_date), 'dd MMM yyyy', {
                                        locale: localeId,
                                    })}
                                    {bookingData.booking_time && ` - ${bookingData.booking_time}`}
                                </p>
                            )}
                            {bookingData?.notes && (
                                <p>
                                    <span className="font-medium">Catatan:</span> {bookingData.notes}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Rejection Reason */}
                    {!isAccept && (
                        <div className="space-y-2">
                            <Label htmlFor="reason">Alasan Penolakan (opsional)</Label>
                            <Textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Contoh: Jadwal sudah penuh, lokasi terlalu jauh, dll."
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Confirmation Message */}
                    <div
                        className={`p-3 rounded-lg border ${isAccept
                                ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800'
                                : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                            }`}
                    >
                        <p className="text-sm">
                            {isAccept ? (
                                <>
                                    ✅ Dengan menerima, pengiriman ini akan ditugaskan kepada Anda dan
                                    status akan berubah menjadi <strong>"Driver Terbooking"</strong>.
                                </>
                            ) : (
                                <>
                                    ⚠️ Dengan menolak, backoffice akan diberi tahu dan dapat memilih
                                    driver lain untuk pengiriman ini.
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                        Batal
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        variant={isAccept ? 'default' : 'destructive'}
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isAccept ? 'Terima Pengiriman' : 'Tolak Pengiriman'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
