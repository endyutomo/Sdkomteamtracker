import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shipment, ShipmentTracking } from '@/types/shipping';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Fix Leaflet default icon issue with Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

// Custom icons
const senderIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="green" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

const recipientIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
});

const driverIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="blue" stroke="white" stroke-width="1">
            <rect x="1" y="3" width="15" height="13" rx="2" ry="2"></rect>
            <path d="M16 8h5l3 3v5h-2"></path>
            <circle cx="5.5" cy="18.5" r="2.5"></circle>
            <circle cx="18.5" cy="18.5" r="2.5"></circle>
        </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
});

const trackingIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="gray" stroke="white" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
        </svg>
    `),
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
});

interface ShipmentMapViewProps {
    shipment: Shipment;
    trackingHistory?: ShipmentTracking[];
    height?: string;
    showControls?: boolean;
    onLocationUpdate?: () => void;
    isDriver?: boolean;
}

// Component to auto-center map
function MapController({ center }: { center: [number, number] }) {
    const map = useMap();

    useEffect(() => {
        map.setView(center, 13);
    }, [center, map]);

    return null;
}

export function ShipmentMapView({
    shipment,
    trackingHistory = [],
    height = '500px',
    showControls = true,
    onLocationUpdate,
    isDriver = false,
}: ShipmentMapViewProps) {
    const [center, setCenter] = useState<[number, number]>([
        -6.2088, // Default Jakarta
        106.8456,
    ]);

    // Determine map center based on available data
    useEffect(() => {
        if (shipment.currentLatitude && shipment.currentLongitude) {
            // Center on driver location if available
            setCenter([shipment.currentLatitude, shipment.currentLongitude]);
        } else if (trackingHistory.length > 0) {
            // Center on last tracking point
            const last = trackingHistory[0];
            setCenter([last.latitude, last.longitude]);
        } else {
            // Default to sender location (would need geocoding in real app)
            // For now, use Jakarta as default
            setCenter([-6.2088, 106.8456]);
        }
    }, [shipment, trackingHistory]);

    // Calculate route line (simplified - in production, use routing API)
    const routeLine: [number, number][] = [];

    // Add sender location (if we had coordinates)
    // For demo, we'll just show tracking history
    if (trackingHistory.length > 0) {
        trackingHistory.forEach(track => {
            routeLine.push([track.latitude, track.longitude]);
        });
    }

    // Add current driver location
    if (shipment.currentLatitude && shipment.currentLongitude) {
        routeLine.push([shipment.currentLatitude, shipment.currentLongitude]);
    }

    const lastUpdate = shipment.lastLocationUpdate
        ? format(new Date(shipment.lastLocationUpdate), 'dd MMM yyyy, HH:mm', { locale: id })
        : 'Belum ada update';

    return (
        <div className="space-y-4">
            {/* Map Info Header */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                        <p className="font-medium">Tracking Pengiriman</p>
                        <p className="text-sm text-muted-foreground">
                            {shipment.senderName} → {shipment.recipientName}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Update terakhir: {lastUpdate}</span>
                    </div>
                    {shipment.currentLocationName && (
                        <p className="text-sm font-medium mt-1">{shipment.currentLocationName}</p>
                    )}
                </div>
            </div>

            {/* Map Container */}
            <div style={{ height, borderRadius: '8px', overflow: 'hidden' }} className="border">
                <MapContainer
                    center={center}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    scrollWheelZoom={true}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapController center={center} />

                    {/* Tracking History Markers */}
                    {trackingHistory.map((track, index) => (
                        <Marker
                            key={track.id}
                            position={[track.latitude, track.longitude]}
                            icon={trackingIcon}
                        >
                            <Popup>
                                <div className="p-2">
                                    <p className="font-medium">Tracking #{trackingHistory.length - index}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {format(new Date(track.recordedAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                                    </p>
                                    {track.locationName && (
                                        <p className="text-sm mt-1">{track.locationName}</p>
                                    )}
                                    {track.notes && (
                                        <p className="text-xs text-muted-foreground mt-1">{track.notes}</p>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {/* Current Driver Location */}
                    {shipment.currentLatitude && shipment.currentLongitude && (
                        <Marker
                            position={[shipment.currentLatitude, shipment.currentLongitude]}
                            icon={driverIcon}
                        >
                            <Popup>
                                <div className="p-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Truck className="h-4 w-4 text-blue-600" />
                                        <p className="font-medium">Lokasi Driver</p>
                                    </div>
                                    <p className="text-sm">{shipment.driverName || 'Driver'}</p>
                                    {shipment.currentLocationName && (
                                        <p className="text-sm mt-1">{shipment.currentLocationName}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Update: {lastUpdate}
                                    </p>
                                    <Badge className="mt-2" variant="outline">
                                        {shipment.status}
                                    </Badge>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Route Line */}
                    {routeLine.length > 1 && (
                        <Polyline
                            positions={routeLine}
                            color="blue"
                            weight={3}
                            opacity={0.6}
                            dashArray="10, 10"
                        />
                    )}
                </MapContainer>
            </div>

            {/* Driver Controls */}
            {isDriver && onLocationUpdate && (
                <div className="flex items-center justify-center gap-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Navigation className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                        <p className="font-medium text-blue-900 dark:text-blue-100">
                            Update Lokasi Anda
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Lokasi akan diupdate otomatis setiap 3 menit saat status "Dalam Perjalanan"
                        </p>
                    </div>
                    <Button onClick={onLocationUpdate} size="sm" className="gap-2">
                        <MapPin className="h-4 w-4" />
                        Update Sekarang
                    </Button>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500"></div>
                    <span>Pengirim</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span>Penerima</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span>Driver (Lokasi Saat Ini)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                    <span>Riwayat Tracking</span>
                </div>
            </div>
        </div>
    );
}
