import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Notification } from '@/types/notifications';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { BookingAcceptanceDialog } from './BookingAcceptanceDialog';
import {
    Bell,
    CheckCircle,
    XCircle,
    Truck,
    Package,
    Trash2
} from 'lucide-react';

interface NotificationItemProps {
    notification: Notification;
    onClose?: () => void;
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
    booking_request: <Truck className="h-4 w-4 text-blue-600" />,
    booking_accepted: <CheckCircle className="h-4 w-4 text-green-600" />,
    booking_rejected: <XCircle className="h-4 w-4 text-red-600" />,
    shipment_update: <Package className="h-4 w-4 text-orange-600" />,
    system: <Bell className="h-4 w-4 text-gray-600" />,
};

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
    const { markAsRead, deleteNotification } = useNotifications();
    const [showAcceptDialog, setShowAcceptDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);

    const handleClick = () => {
        if (!notification.read) {
            markAsRead(notification.id);
        }
    };

    const handleAccept = () => {
        setShowAcceptDialog(true);
    };

    const handleReject = () => {
        setShowRejectDialog(true);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteNotification(notification.id);
    };

    const isBookingRequest = notification.type === 'booking_request' && !notification.action_taken;

    return (
        <>
            <div
                className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                    }`}
                onClick={handleClick}
            >
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="mt-0.5">
                        {NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.system}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="font-medium text-sm">{notification.title}</p>
                            {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5"></div>
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                        </p>

                        {/* Booking Request Actions */}
                        {isBookingRequest && (
                            <div className="flex gap-2 mt-3">
                                <Button
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAccept();
                                    }}
                                    className="h-8"
                                >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Terima
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReject();
                                    }}
                                    className="h-8"
                                >
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Tolak
                                </Button>
                            </div>
                        )}

                        {/* Action Taken Badge */}
                        {notification.action_taken && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                                Sudah Ditanggapi
                            </Badge>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(notification.created_at, {
                                    addSuffix: true,
                                    locale: localeId,
                                })}
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDelete}
                                className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Acceptance Dialog */}
            {isBookingRequest && notification.data?.booking_id && (
                <>
                    <BookingAcceptanceDialog
                        open={showAcceptDialog}
                        onClose={() => {
                            setShowAcceptDialog(false);
                            onClose?.();
                        }}
                        notification={notification}
                        action="accept"
                    />
                    <BookingAcceptanceDialog
                        open={showRejectDialog}
                        onClose={() => {
                            setShowRejectDialog(false);
                            onClose?.();
                        }}
                        notification={notification}
                        action="reject"
                    />
                </>
            )}
        </>
    );
}
