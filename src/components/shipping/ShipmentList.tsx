import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
    Package,
    User,
    MapPin,
    Phone,
    Calendar,
    Truck,
    MoreVertical,
    Eye,
    Edit,
    Trash2,
    Navigation
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Shipment, SHIPPING_STATUS_LABELS, SHIPPING_STATUS_COLORS } from '@/types/shipping';

interface ShipmentListProps {
    shipments: Shipment[];
    onView: (shipment: Shipment) => void;
    onEdit: (shipment: Shipment) => void;
    onDelete: (id: string) => void;
    onBookDriver?: (shipment: Shipment) => void;
    onTrack?: (shipment: Shipment) => void;
    isManager?: boolean;
    currentUserId?: string;
}

export function ShipmentList({
    shipments,
    onView,
    onEdit,
    onDelete,
    onBookDriver,
    onTrack,
    isManager,
    currentUserId,
}: ShipmentListProps) {
    if (shipments.length === 0) {
        return (
            <Card className="p-8 text-center">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Belum ada pengiriman</h3>
                <p className="text-muted-foreground">
                    Klik tombol "Tambah Pengiriman" untuk membuat pengiriman baru
                </p>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {shipments.map((shipment) => (
                <Card key={shipment.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <Badge className={SHIPPING_STATUS_COLORS[shipment.status]}>
                                    {SHIPPING_STATUS_LABELS[shipment.status]}
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                    {format(shipment.createdAt, 'dd MMM yyyy, HH:mm', { locale: localeId })}
                                </p>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onView(shipment)}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        Lihat Detail
                                    </DropdownMenuItem>
                                    {onTrack && shipment.status !== 'pending' && shipment.status !== 'cancelled' && (
                                        <DropdownMenuItem onClick={() => onTrack(shipment)}>
                                            <Navigation className="mr-2 h-4 w-4" />
                                            Tracking
                                        </DropdownMenuItem>
                                    )}
                                    {shipment.status === 'pending' && onBookDriver && (
                                        <DropdownMenuItem onClick={() => onBookDriver(shipment)}>
                                            <Truck className="mr-2 h-4 w-4" />
                                            Booking Driver
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    {(isManager || shipment.createdBy === currentUserId) && (
                                        <>
                                            <DropdownMenuItem onClick={() => onEdit(shipment)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            {isManager && (
                                                <DropdownMenuItem
                                                    onClick={() => onDelete(shipment.id)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Hapus
                                                </DropdownMenuItem>
                                            )}
                                        </>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Item Description */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium line-clamp-1">{shipment.itemDescription}</span>
                            </div>
                            {shipment.weightKg && (
                                <p className="text-sm text-muted-foreground pl-6">
                                    {shipment.weightKg} kg
                                    {shipment.dimensions && ` • ${shipment.dimensions}`}
                                </p>
                            )}
                        </div>

                        {/* Sender & Recipient */}
                        <div className="space-y-2 text-sm">
                            <div className="flex items-start gap-2">
                                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">{shipment.senderName}</p>
                                    <p className="text-muted-foreground line-clamp-1">{shipment.senderAddress}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="flex-1 border-t border-dashed" />
                                <MapPin className="mx-2 h-4 w-4 text-primary" />
                                <div className="flex-1 border-t border-dashed" />
                            </div>
                            <div className="flex items-start gap-2">
                                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p className="font-medium">{shipment.recipientName}</p>
                                    <p className="text-muted-foreground line-clamp-1">{shipment.recipientAddress}</p>
                                </div>
                            </div>
                        </div>

                        {/* Driver & Date Info */}
                        <div className="flex items-center justify-between text-sm border-t pt-3">
                            {shipment.driverName ? (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Truck className="h-4 w-4" />
                                    <span>{shipment.driverName}</span>
                                </div>
                            ) : (
                                <span className="text-muted-foreground text-xs">Belum ada driver</span>
                            )}
                            {shipment.pickupDate && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    <span>{format(shipment.pickupDate, 'dd/MM/yy')}</span>
                                </div>
                            )}
                        </div>

                        {/* Live Location Indicator */}
                        {shipment.currentLatitude && shipment.lastLocationUpdate && (
                            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span>
                                    Live: {shipment.currentLocationName || 'Lokasi aktif'}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
