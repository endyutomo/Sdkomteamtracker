import { ShipmentTracking } from '@/types/shipping';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ShipmentTrackingHistoryProps {
    trackingHistory: ShipmentTracking[];
    onLocationClick?: (tracking: ShipmentTracking) => void;
}

export function ShipmentTrackingHistory({
    trackingHistory,
    onLocationClick,
}: ShipmentTrackingHistoryProps) {
    if (trackingHistory.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Navigation className="h-5 w-5" />
                        Riwayat Tracking
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Belum ada riwayat tracking</p>
                        <p className="text-sm mt-1">
                            Lokasi akan tercatat saat driver mengupdate posisi
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Calculate distance between two points (Haversine formula)
    const calculateDistance = (
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number => {
        const R = 6371; // Earth's radius in km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Navigation className="h-5 w-5" />
                    Riwayat Tracking ({trackingHistory.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                        {trackingHistory.map((track, index) => {
                            const isFirst = index === 0;
                            const isLast = index === trackingHistory.length - 1;

                            // Calculate distance from previous point
                            let distance: number | null = null;
                            if (index < trackingHistory.length - 1) {
                                const prev = trackingHistory[index + 1];
                                distance = calculateDistance(
                                    track.latitude,
                                    track.longitude,
                                    prev.latitude,
                                    prev.longitude
                                );
                            }

                            return (
                                <div
                                    key={track.id}
                                    className={`relative pl-8 pb-4 ${!isLast ? 'border-l-2 border-dashed border-muted' : ''
                                        }`}
                                >
                                    {/* Timeline dot */}
                                    <div
                                        className={`absolute left-0 top-0 -translate-x-1/2 w-4 h-4 rounded-full border-2 ${isFirst
                                                ? 'bg-blue-500 border-blue-600'
                                                : 'bg-gray-300 border-gray-400'
                                            }`}
                                    ></div>

                                    {/* Content */}
                                    <div
                                        className={`p-3 rounded-lg border ${isFirst
                                                ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800'
                                                : 'bg-muted/50 border-border'
                                            } ${onLocationClick ? 'cursor-pointer hover:bg-muted' : ''
                                            }`}
                                        onClick={() => onLocationClick?.(track)}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin className={`h-4 w-4 ${isFirst ? 'text-blue-600' : 'text-muted-foreground'}`} />
                                                <span className="font-medium text-sm">
                                                    {isFirst ? 'Lokasi Terkini' : `Tracking #${trackingHistory.length - index}`}
                                                </span>
                                            </div>
                                            {track.status && (
                                                <Badge variant="outline" className="text-xs">
                                                    {track.status}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Location name */}
                                        {track.locationName && (
                                            <p className="text-sm mb-2">{track.locationName}</p>
                                        )}

                                        {/* Coordinates */}
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {track.latitude.toFixed(6)}, {track.longitude.toFixed(6)}
                                        </p>

                                        {/* Time */}
                                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            <span>
                                                {format(new Date(track.recordedAt), 'dd MMM yyyy, HH:mm:ss', {
                                                    locale: id,
                                                })}
                                            </span>
                                        </div>

                                        {/* Distance from previous point */}
                                        {distance !== null && distance > 0.01 && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                📏 {distance.toFixed(2)} km dari titik sebelumnya
                                            </p>
                                        )}

                                        {/* Notes */}
                                        {track.notes && (
                                            <p className="text-xs text-muted-foreground mt-2 italic">
                                                "{track.notes}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
