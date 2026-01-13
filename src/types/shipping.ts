export type ShippingStatus = 'pending' | 'booked' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Shipment {
    id: string;
    createdBy: string;
    driverId?: string | null;

    // Sender
    senderName: string;
    senderAddress: string;
    senderPhone?: string | null;

    // Recipient
    recipientName: string;
    recipientAddress: string;
    recipientPhone?: string | null;

    // Item
    itemDescription: string;
    weightKg?: number | null;
    dimensions?: string | null;

    // Status
    status: ShippingStatus;
    pickupDate?: Date | null;
    deliveryDate?: Date | null;
    estimatedDelivery?: Date | null;

    notes?: string | null;

    // Tracking
    currentLatitude?: number | null;
    currentLongitude?: number | null;
    currentLocationName?: string | null;
    lastLocationUpdate?: Date | null;

    // Metadata
    createdAt: Date;
    updatedAt: Date;

    // Joined data (from profiles)
    creatorName?: string;
    driverName?: string;
}

export interface DriverBooking {
    id: string;
    shipmentId: string;
    driverId: string;
    bookedBy: string;

    bookingDate: Date;
    bookingTime?: string | null;
    status: BookingStatus;
    notes?: string | null;

    createdAt: Date;
    updatedAt: Date;

    // Joined
    driverName?: string;
    bookedByName?: string;
    shipment?: Shipment;
}

export interface ShipmentTracking {
    id: string;
    shipmentId: string;

    latitude: number;
    longitude: number;
    locationName?: string | null;

    status?: ShippingStatus | null;
    notes?: string | null;

    recordedAt: Date;
}

// Form types
export interface ShipmentFormData {
    senderName: string;
    senderAddress: string;
    senderPhone?: string;
    recipientName: string;
    recipientAddress: string;
    recipientPhone?: string;
    itemDescription: string;
    weightKg?: number;
    dimensions?: string;
    pickupDate?: Date;
    estimatedDelivery?: Date;
    notes?: string;
}

export interface BookingFormData {
    shipmentId: string;
    driverId: string;
    bookingDate: Date;
    bookingTime?: string;
    notes?: string;
}

// Status labels for UI
export const SHIPPING_STATUS_LABELS: Record<ShippingStatus, string> = {
    pending: 'Menunggu Driver',
    booked: 'Driver Terbooking',
    picked_up: 'Barang Diambil',
    in_transit: 'Dalam Perjalanan',
    delivered: 'Terkirim',
    cancelled: 'Dibatalkan',
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
    pending: 'Menunggu',
    confirmed: 'Dikonfirmasi',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
};

export const SHIPPING_STATUS_COLORS: Record<ShippingStatus, string> = {
    pending: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    booked: 'bg-blue-500/20 text-blue-600 border-blue-500/30',
    picked_up: 'bg-purple-500/20 text-purple-600 border-purple-500/30',
    in_transit: 'bg-orange-500/20 text-orange-600 border-orange-500/30',
    delivered: 'bg-green-500/20 text-green-600 border-green-500/30',
    cancelled: 'bg-red-500/20 text-red-600 border-red-500/30',
};
