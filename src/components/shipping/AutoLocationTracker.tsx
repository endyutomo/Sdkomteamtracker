import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface AutoLocationTrackerProps {
    shipmentId: string;
    isActive: boolean; // true when status is 'in_transit'
    onLocationUpdate: (latitude: number, longitude: number, locationName?: string) => Promise<void>;
    updateInterval?: number; // in milliseconds, default 3 minutes
}

export function AutoLocationTracker({
    shipmentId,
    isActive,
    onLocationUpdate,
    updateInterval = 3 * 60 * 1000, // 3 minutes
}: AutoLocationTrackerProps) {
    const [isTracking, setIsTracking] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const watchIdRef = useRef<number | null>(null);

    // Get location name from coordinates using reverse geocoding
    const getLocationName = async (lat: number, lng: number): Promise<string | undefined> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            return data.display_name || undefined;
        } catch (err) {
            console.error('Failed to get location name:', err);
            return undefined;
        }
    };

    // Update location function
    const updateLocation = async () => {
        if (isUpdating) return;

        setIsUpdating(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation tidak didukung oleh browser Anda');
            setIsUpdating(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // Get location name
                    const locationName = await getLocationName(latitude, longitude);

                    // Update to database
                    await onLocationUpdate(latitude, longitude, locationName);

                    setLastUpdate(new Date());
                    setError(null);
                    toast.success('Lokasi berhasil diupdate');
                } catch (err: any) {
                    setError(err.message || 'Gagal update lokasi');
                    toast.error('Gagal update lokasi');
                } finally {
                    setIsUpdating(false);
                }
            },
            (err) => {
                let errorMessage = 'Gagal mendapatkan lokasi';

                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        errorMessage = 'Izin akses lokasi ditolak. Mohon aktifkan di pengaturan browser.';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        errorMessage = 'Informasi lokasi tidak tersedia';
                        break;
                    case err.TIMEOUT:
                        errorMessage = 'Request lokasi timeout';
                        break;
                }

                setError(errorMessage);
                setIsUpdating(false);
                toast.error(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    // Start/stop auto tracking
    useEffect(() => {
        if (isActive && !isTracking) {
            // Start tracking
            setIsTracking(true);

            // Initial update
            updateLocation();

            // Set interval for auto updates
            intervalRef.current = setInterval(() => {
                updateLocation();
            }, updateInterval);

            toast.info('Auto-tracking lokasi dimulai');
        } else if (!isActive && isTracking) {
            // Stop tracking
            setIsTracking(false);

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }

            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }

            toast.info('Auto-tracking lokasi dihentikan');
        }

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [isActive, shipmentId]);

    // Manual update button
    const handleManualUpdate = () => {
        updateLocation();
    };

    return (
        <div className="space-y-3">
            {/* Status Info */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className="text-sm font-medium">
                        {isTracking ? 'Auto-tracking Aktif' : 'Auto-tracking Nonaktif'}
                    </span>
                </div>
                {lastUpdate && (
                    <span className="text-xs text-muted-foreground">
                        Update terakhir: {lastUpdate.toLocaleTimeString('id-ID')}
                    </span>
                )}
            </div>

            {/* Error Alert */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Manual Update Button */}
            <Button
                onClick={handleManualUpdate}
                disabled={isUpdating}
                className="w-full gap-2"
                size="lg"
            >
                {isUpdating ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Mengupdate Lokasi...
                    </>
                ) : (
                    <>
                        <Navigation className="h-5 w-5" />
                        Update Lokasi Sekarang
                    </>
                )}
            </Button>

            {/* Info */}
            {isActive && (
                <p className="text-xs text-center text-muted-foreground">
                    Lokasi akan diupdate otomatis setiap {updateInterval / 60000} menit
                </p>
            )}
        </div>
    );
}
