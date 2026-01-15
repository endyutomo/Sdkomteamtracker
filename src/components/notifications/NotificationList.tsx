import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { CheckCheck, Inbox } from 'lucide-react';

interface NotificationListProps {
    onClose?: () => void;
}

export function NotificationList({ onClose }: NotificationListProps) {
    const { notifications, unreadCount, loading, markAllAsRead } = useNotifications();

    if (loading) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                <p>Memuat notifikasi...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifikasi</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="h-8 text-xs"
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Tandai Semua Dibaca
                        </Button>
                    )}
                </div>
                {unreadCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {unreadCount} notifikasi belum dibaca
                    </p>
                )}
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Inbox className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm font-medium">Tidak ada notifikasi</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Notifikasi akan muncul di sini
                    </p>
                </div>
            ) : (
                <ScrollArea className="h-[400px]">
                    <div className="divide-y">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onClose={onClose}
                            />
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>
    );
}
