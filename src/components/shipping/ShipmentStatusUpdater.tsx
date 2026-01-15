import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    CheckCircle,
    Circle,
    MapPin,
    Navigation,
    Loader2,
    Package,
    Truck,
    Home,
    Map,
    History
} from 'lucide-react';
import {
    Shipment,
    ShipmentTracking,
    ShippingStatus,
    SHIPPING_STATUS_LABELS,
    SHIPPING_STATUS_COLORS
} from '@/types/shipping';
import { ShipmentMapView } from './ShipmentMapView';
import { AutoLocationTracker } from './AutoLocationTracker';
import { ShipmentTrackingHistory } from './ShipmentTrackingHistory';

interface ShipmentStatusUpdaterProps {
    open: boolean;
    onClose: () => void;
    shipment: Shipment | null;
    trackingHistory: ShipmentTracking[];
    onUpdateStatus: (
        id: string,
        status: ShippingStatus,
        location?: { latitude: number; longitude: number; locationName?: string }
    ) => Promise<boolean>;
    isDriver?: boolean;
}

const STATUS_ORDER: ShippingStatus[] = [
    'pending',
    'booked',
    'picked_up',
    'in_transit',
    'delivered',
];

const STATUS_ICONS: Record<ShippingStatus, React.ReactNode> = {
    pending: <Circle className="h-5 w-5" />,
    booked: <Truck className="h-5 w-5" />,
    picked_up: <Package className="h-5 w-5" />,
    in_transit: <Navigation className="h-5 w-5" />,
    delivered: <Home className="h-5 w-5" />,
    cancelled: <Circle className="h-5 w-5" />,
};

export function ShipmentStatusUpdater({
    open,
    onClose,
    shipment,
    trackingHistory,
    onUpdateStatus,
    isDriver,
}: ShipmentStatusUpdaterProps) {
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{
        latitude: number;
        longitude: number;
        locationName?: string;
    } | null>(null);

    // Get current location
    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation tidak didukung browser ini');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // Try to get location name via reverse geocoding
                let locationName: string | undefined;
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
                    );
                    const data = await response.json();
                    locationName = data.display_name?.split(',').slice(0, 3).join(',');
                } catch {
                    console.log('Could not get location name');
                }

                setCurrentLocation({ latitude, longitude, locationName });
                setGettingLocation(false);
            },
            (error) => {
                console.error('Error getting location:', error);
                setGettingLocation(false);
                alert('Gagal mendapatkan lokasi. Pastikan GPS aktif.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Get next valid status
    const getNextStatus = (): ShippingStatus | null => {
        if (!shipment) return null;
        const currentIndex = STATUS_ORDER.indexOf(shipment.status);
        if (currentIndex === -1 || currentIndex >= STATUS_ORDER.length - 1) return null;
        return STATUS_ORDER[currentIndex + 1];
    };

    const handleUpdateStatus = async (newStatus: ShippingStatus) => {
        if (!shipment) return;

        setLoading(true);
        try {
            await onUpdateStatus(shipment.id, newStatus, currentLocation || undefined);
            setCurrentLocation(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) {
            setCurrentLocation(null);
        }
    }, [open]);

    if (!shipment) return null;

    const nextStatus = getNextStatus();
    const currentStatusIndex = STATUS_ORDER.indexOf(shipment.status);
    const isInTransit = shipment.status === 'in_transit';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Navigation className="h-5 w-5" />
                        Tracking & Update Status
                    </DialogTitle>
                    <DialogDescription>
                        {shipment.senderName} → {shipment.recipientName}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="status" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="status" className="gap-2">
                            <Package className="h-4 w-4" />
                            Status
                        </TabsTrigger>
                        <TabsTrigger value="map" className="gap-2">
                            <Map className="h-4 w-4" />
                            Peta Tracking
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <History className="h-4 w-4" />
                            Riwayat
                        </TabsTrigger>
                    </TabsList>

                    {/* Status Tab */}
                    <TabsContent value="status" className="flex-1 overflow-y-auto mt-4">
                        <div className="space-y-6">
                            {/* Current Status */}
                            <div className="flex items-center justify-center">
                                <Badge className={`${SHIPPING_STATUS_COLORS[shipment.status]} text-base px-4 py-2`}>
                                    {SHIPPING_STATUS_LABELS[shipment.status]}
                                </Badge>
                            </div>

                            {/* Status Timeline */}
                            <div className="relative">
                                {STATUS_ORDER.map((status, index) => {
                                    const isCompleted = index < currentStatusIndex;
                                    const isCurrent = index === currentStatusIndex;
                                    const isPending = index > currentStatusIndex;

                                    return (
                                        <div key={status} className="flex items-start gap-3 mb-4 last:mb-0">
                                            <div className="relative flex flex-col items-center">
                                                <div
                                                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${isCompleted
                                                            ? 'bg-green-500 border-green-500 text-white'
                                                            : isCurrent
                                                                ? 'bg-primary border-primary text-primary-foreground'
                                                                : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                                                        }`}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle className="h-5 w-5" />
                                                    ) : (
                                                        STATUS_ICONS[status]
                                                    )}
                                                </div>
                                                {index < STATUS_ORDER.length - 1 && (
                                                    <div
                                                        className={`w-0.5 h-8 ${isCompleted ? 'bg-green-500' : 'bg-muted-foreground/30'
                                                            }`}
                                                    />
                                                )}
                                            </div>
                                            <div className="pt-2">
                                                <p
                                                    className={`font-medium ${isPending ? 'text-muted-foreground' : ''
                                                        }`}
                                                >
                                                    {SHIPPING_STATUS_LABELS[status]}
                                                </p>
                                                {/* Show tracking info if available */}
                                                {trackingHistory
                                                    .filter((t) => t.status === status)
                                                    .map((track) => (
                                                        <p key={track.id} className="text-xs text-muted-foreground mt-0.5">
                                                            {format(track.recordedAt, 'dd/MM HH:mm', { locale: localeId })}
                                                            {track.locationName && ` - ${track.locationName}`}
                                                        </p>
                                                    ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Current Location Display */}
                            {currentLocation && (
                                <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 space-y-1">
                                    <div className="flex items-center gap-2 text-green-600">
                                        <MapPin className="h-4 w-4" />
                                        <span className="font-medium text-sm">Lokasi Saat Ini</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {currentLocation.locationName ||
                                            `${currentLocation.latitude.toFixed(6)}, ${currentLocation.longitude.toFixed(6)}`}
                                    </p>
                                </div>
                            )}

                            {/* Driver Actions */}
                            {isDriver && nextStatus && shipment.status !== 'delivered' && (
                                <div className="space-y-3 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={getCurrentLocation}
                                        disabled={gettingLocation}
                                    >
                                        {gettingLocation ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <MapPin className="mr-2 h-4 w-4" />
                                        )}
                                        {currentLocation ? 'Update Lokasi' : 'Ambil Lokasi GPS'}
                                    </Button>

                                    <Button
                                        className="w-full"
                                        onClick={() => handleUpdateStatus(nextStatus)}
                                        disabled={loading}
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Update ke: {SHIPPING_STATUS_LABELS[nextStatus]}
                                    </Button>
                                </div>
                            )}

                            {/* Live Location Map Link */}
                            {shipment.currentLatitude && shipment.currentLongitude && (
                                <div className="pt-4 border-t">
                                    <a
                                        href={`https://www.google.com/maps?q=${shipment.currentLatitude},${shipment.currentLongitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
                                    >
                                        <MapPin className="h-4 w-4" />
                                        Lihat Lokasi Terakhir di Maps
                                    </a>
                                    {shipment.lastLocationUpdate && (
                                        <p className="text-center text-xs text-muted-foreground mt-1">
                                            Update: {format(shipment.lastLocationUpdate, 'dd MMM HH:mm', { locale: localeId })}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Map Tab */}
                    <TabsContent value="map" className="flex-1 overflow-y-auto mt-4">
                        <div className="space-y-4">
                            {/* Auto Location Tracker for Driver */}
                            {isDriver && isInTransit && (
                                <AutoLocationTracker
                                    shipmentId={shipment.id}
                                    isActive={isInTransit}
                                    onLocationUpdate={async (lat, lng, locationName) => {
                                        await onUpdateStatus(
                                            shipment.id,
                                            shipment.status,
                                            { latitude: lat, longitude: lng, locationName }
                                        );
                                    }}
                                />
                            )}

                            {/* Map View */}
                            <ShipmentMapView
                                shipment={shipment}
                                trackingHistory={trackingHistory}
                                height="500px"
                                showControls={true}
                                isDriver={isDriver}
                                onLocationUpdate={isDriver ? getCurrentLocation : undefined}
                            />
                        </div>
                    </TabsContent>

                    {/* Tracking History Tab */}
                    <TabsContent value="history" className="flex-1 overflow-y-auto mt-4">
                        <ShipmentTrackingHistory
                            trackingHistory={trackingHistory}
                            onLocationClick={(track) => {
                                // Could center map on this location in future
                                console.log('Clicked tracking:', track);
                            }}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
