import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import {
    Shipment,
    DriverBooking,
    ShipmentTracking,
    ShipmentFormData,
    BookingFormData,
    ShippingStatus,
    BookingStatus
} from '@/types/shipping';
import { Profile } from './useProfile';

interface ShipmentRow {
    id: string;
    created_by: string;
    driver_id: string | null;
    sender_name: string;
    sender_address: string;
    sender_phone: string | null;
    recipient_name: string;
    recipient_address: string;
    recipient_phone: string | null;
    item_description: string;
    weight_kg: number | null;
    dimensions: string | null;
    status: string;
    pickup_date: string | null;
    delivery_date: string | null;
    estimated_delivery: string | null;
    notes: string | null;
    current_latitude: number | null;
    current_longitude: number | null;
    current_location_name: string | null;
    last_location_update: string | null;
    created_at: string;
    updated_at: string;
}

interface BookingRow {
    id: string;
    shipment_id: string;
    driver_id: string;
    booked_by: string;
    booking_date: string;
    booking_time: string | null;
    status: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

interface TrackingRow {
    id: string;
    shipment_id: string;
    latitude: number;
    longitude: number;
    location_name: string | null;
    status: string | null;
    notes: string | null;
    recorded_at: string;
}

// Convert database row to Shipment type
const mapRowToShipment = (row: ShipmentRow, profiles: Profile[] = []): Shipment => {
    const creator = profiles.find(p => p.user_id === row.created_by);
    const driver = profiles.find(p => p.user_id === row.driver_id);

    return {
        id: row.id,
        createdBy: row.created_by,
        driverId: row.driver_id,
        senderName: row.sender_name,
        senderAddress: row.sender_address,
        senderPhone: row.sender_phone,
        recipientName: row.recipient_name,
        recipientAddress: row.recipient_address,
        recipientPhone: row.recipient_phone,
        itemDescription: row.item_description,
        weightKg: row.weight_kg,
        dimensions: row.dimensions,
        status: row.status as ShippingStatus,
        pickupDate: row.pickup_date ? new Date(row.pickup_date) : null,
        deliveryDate: row.delivery_date ? new Date(row.delivery_date) : null,
        estimatedDelivery: row.estimated_delivery ? new Date(row.estimated_delivery) : null,
        notes: row.notes,
        currentLatitude: row.current_latitude,
        currentLongitude: row.current_longitude,
        currentLocationName: row.current_location_name,
        lastLocationUpdate: row.last_location_update ? new Date(row.last_location_update) : null,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        creatorName: creator?.name,
        driverName: driver?.name,
    };
};

const mapRowToBooking = (row: BookingRow, profiles: Profile[] = []): DriverBooking => {
    const driver = profiles.find(p => p.user_id === row.driver_id);
    const booker = profiles.find(p => p.user_id === row.booked_by);

    return {
        id: row.id,
        shipmentId: row.shipment_id,
        driverId: row.driver_id,
        bookedBy: row.booked_by,
        bookingDate: new Date(row.booking_date),
        bookingTime: row.booking_time,
        status: row.status as BookingStatus,
        notes: row.notes,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        driverName: driver?.name,
        bookedByName: booker?.name,
    };
};

const mapRowToTracking = (row: TrackingRow): ShipmentTracking => ({
    id: row.id,
    shipmentId: row.shipment_id,
    latitude: row.latitude,
    longitude: row.longitude,
    locationName: row.location_name,
    status: row.status as ShippingStatus | null,
    notes: row.notes,
    recordedAt: new Date(row.recorded_at),
});

export function useShipping() {
    const { user } = useAuth();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [bookings, setBookings] = useState<DriverBooking[]>([]);
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch all profiles for joining names
    const fetchProfiles = useCallback(async () => {
        const { data } = await supabase.from('profiles').select('*');
        if (data) setProfiles(data as Profile[]);
    }, []);

    // Fetch shipments
    const fetchShipments = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await (supabase
                .from('shipments' as any)
                .select('*')
                .order('created_at', { ascending: false }) as any);

            if (error) throw error;

            const mappedShipments = (data || []).map((row: any) =>
                mapRowToShipment(row as ShipmentRow, profiles)
            );
            setShipments(mappedShipments);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error fetching shipments:', message);
        }
    }, [user, profiles]);

    // Fetch bookings
    const fetchBookings = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await (supabase
                .from('driver_bookings' as any)
                .select('*')
                .order('created_at', { ascending: false }) as any);

            if (error) throw error;

            const mappedBookings = (data || []).map((row: any) =>
                mapRowToBooking(row as BookingRow, profiles)
            );
            setBookings(mappedBookings);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error fetching bookings:', message);
        }
    }, [user, profiles]);

    // Initial fetch
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await fetchProfiles();
        };
        init();
    }, [fetchProfiles]);

    useEffect(() => {
        if (profiles.length > 0) {
            Promise.all([fetchShipments(), fetchBookings()]).finally(() => {
                setLoading(false);
            });
        }
    }, [profiles, fetchShipments, fetchBookings]);

    // Add shipment
    const addShipment = async (data: ShipmentFormData): Promise<Shipment | null> => {
        if (!user) return null;

        try {
            const { data: result, error } = await (supabase
                .from('shipments' as any)
                .insert({
                    created_by: user.id,
                    sender_name: data.senderName,
                    sender_address: data.senderAddress,
                    sender_phone: data.senderPhone || null,
                    recipient_name: data.recipientName,
                    recipient_address: data.recipientAddress,
                    recipient_phone: data.recipientPhone || null,
                    item_description: data.itemDescription,
                    weight_kg: data.weightKg || null,
                    dimensions: data.dimensions || null,
                    pickup_date: data.pickupDate?.toISOString().split('T')[0] || null,
                    estimated_delivery: data.estimatedDelivery?.toISOString().split('T')[0] || null,
                    notes: data.notes || null,
                })
                .select()
                .single() as any);

            if (error) throw error;

            const newShipment = mapRowToShipment(result as ShipmentRow, profiles);
            setShipments(prev => [newShipment, ...prev]);
            toast.success('Pengiriman berhasil dibuat');
            return newShipment;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Gagal membuat pengiriman: ' + message);
            return null;
        }
    };

    // Update shipment
    const updateShipment = async (id: string, updates: Partial<ShipmentFormData>): Promise<boolean> => {
        try {
            const updateData: Record<string, unknown> = {};

            if (updates.senderName !== undefined) updateData.sender_name = updates.senderName;
            if (updates.senderAddress !== undefined) updateData.sender_address = updates.senderAddress;
            if (updates.senderPhone !== undefined) updateData.sender_phone = updates.senderPhone;
            if (updates.recipientName !== undefined) updateData.recipient_name = updates.recipientName;
            if (updates.recipientAddress !== undefined) updateData.recipient_address = updates.recipientAddress;
            if (updates.recipientPhone !== undefined) updateData.recipient_phone = updates.recipientPhone;
            if (updates.itemDescription !== undefined) updateData.item_description = updates.itemDescription;
            if (updates.weightKg !== undefined) updateData.weight_kg = updates.weightKg;
            if (updates.dimensions !== undefined) updateData.dimensions = updates.dimensions;
            if (updates.pickupDate !== undefined) updateData.pickup_date = updates.pickupDate?.toISOString().split('T')[0];
            if (updates.estimatedDelivery !== undefined) updateData.estimated_delivery = updates.estimatedDelivery?.toISOString().split('T')[0];
            if (updates.notes !== undefined) updateData.notes = updates.notes;

            const { error } = await (supabase
                .from('shipments' as any)
                .update(updateData)
                .eq('id', id) as any);

            if (error) throw error;

            await fetchShipments();
            toast.success('Pengiriman berhasil diupdate');
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Gagal update pengiriman: ' + message);
            return false;
        }
    };

    // Update shipment status
    const updateShipmentStatus = async (
        id: string,
        status: ShippingStatus,
        location?: { latitude: number; longitude: number; locationName?: string }
    ): Promise<boolean> => {
        try {
            const updateData: Record<string, unknown> = { status };

            if (status === 'delivered') {
                updateData.delivery_date = new Date().toISOString().split('T')[0];
            }

            if (location) {
                updateData.current_latitude = location.latitude;
                updateData.current_longitude = location.longitude;
                updateData.current_location_name = location.locationName;
                updateData.last_location_update = new Date().toISOString();
            }

            const { error } = await (supabase
                .from('shipments' as any)
                .update(updateData)
                .eq('id', id) as any);

            if (error) throw error;

            // Add tracking record
            if (location) {
                await (supabase.from('shipment_tracking' as any).insert({
                    shipment_id: id,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    location_name: location.locationName,
                    status,
                }) as any);
            }

            await fetchShipments();
            toast.success('Status pengiriman berhasil diupdate');
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Gagal update status: ' + message);
            return false;
        }
    };

    // Delete shipment
    const deleteShipment = async (id: string): Promise<boolean> => {
        try {
            const { error } = await (supabase
                .from('shipments' as any)
                .delete()
                .eq('id', id) as any);

            if (error) throw error;

            setShipments(prev => prev.filter(s => s.id !== id));
            toast.success('Pengiriman berhasil dihapus');
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Gagal menghapus pengiriman: ' + message);
            return false;
        }
    };

    // Book driver
    const bookDriver = async (data: BookingFormData): Promise<DriverBooking | null> => {
        if (!user) return null;

        try {
            // Create booking
            const { data: booking, error: bookingError } = await (supabase
                .from('driver_bookings' as any)
                .insert({
                    shipment_id: data.shipmentId,
                    driver_id: data.driverId,
                    booked_by: user.id,
                    booking_date: data.bookingDate.toISOString().split('T')[0],
                    booking_time: data.bookingTime || null,
                    notes: data.notes || null,
                    status: 'confirmed', // Auto-confirm, no approval needed
                })
                .select()
                .single() as any);

            if (bookingError) throw bookingError;

            // Update shipment with driver and status
            await (supabase
                .from('shipments' as any)
                .update({
                    driver_id: data.driverId,
                    status: 'booked',
                })
                .eq('id', data.shipmentId) as any);

            const newBooking = mapRowToBooking(booking as BookingRow, profiles);
            setBookings(prev => [newBooking, ...prev]);
            await fetchShipments();

            toast.success('Driver berhasil di-booking');
            return newBooking;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Gagal booking driver: ' + message);
            return null;
        }
    };

    // Update booking status
    const updateBookingStatus = async (id: string, status: BookingStatus): Promise<boolean> => {
        try {
            const { error } = await (supabase
                .from('driver_bookings' as any)
                .update({ status })
                .eq('id', id) as any);

            if (error) throw error;

            await fetchBookings();
            toast.success('Status booking berhasil diupdate');
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error('Gagal update booking: ' + message);
            return false;
        }
    };

    // Get tracking history
    const getTrackingHistory = async (shipmentId: string): Promise<ShipmentTracking[]> => {
        try {
            const { data, error } = await (supabase
                .from('shipment_tracking' as any)
                .select('*')
                .eq('shipment_id', shipmentId)
                .order('recorded_at', { ascending: true }) as any);

            if (error) throw error;

            return (data || []).map((row: any) => mapRowToTracking(row as TrackingRow));
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error fetching tracking:', message);
            return [];
        }
    };

    // Update location (for real-time tracking)
    const updateLocation = async (
        shipmentId: string,
        latitude: number,
        longitude: number,
        locationName?: string
    ): Promise<boolean> => {
        try {
            // Update shipment current location
            await (supabase
                .from('shipments' as any)
                .update({
                    current_latitude: latitude,
                    current_longitude: longitude,
                    current_location_name: locationName,
                    last_location_update: new Date().toISOString(),
                })
                .eq('id', shipmentId) as any);

            // Add tracking record
            await (supabase.from('shipment_tracking' as any).insert({
                shipment_id: shipmentId,
                latitude,
                longitude,
                location_name: locationName,
            }) as any);

            await fetchShipments();
            return true;
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('Error updating location:', message);
            return false;
        }
    };

    // Get available drivers (logistic division)
    const getAvailableDrivers = (): Profile[] => {
        return profiles.filter(p => p.division === 'logistic');
    };

    // Get my shipments (as driver)
    const getMyAssignedShipments = (): Shipment[] => {
        if (!user) return [];
        return shipments.filter(s => s.driverId === user.id);
    };

    // Get pending shipments (no driver assigned)
    const getPendingShipments = (): Shipment[] => {
        return shipments.filter(s => s.status === 'pending');
    };

    // Get statistics
    const getStats = () => {
        const total = shipments.length;
        const pending = shipments.filter(s => s.status === 'pending').length;
        const inProgress = shipments.filter(s => ['booked', 'picked_up', 'in_transit'].includes(s.status)).length;
        const delivered = shipments.filter(s => s.status === 'delivered').length;
        const cancelled = shipments.filter(s => s.status === 'cancelled').length;

        return { total, pending, inProgress, delivered, cancelled };
    };

    const refetch = async () => {
        await Promise.all([fetchShipments(), fetchBookings()]);
    };

    return {
        shipments,
        bookings,
        loading,
        addShipment,
        updateShipment,
        updateShipmentStatus,
        deleteShipment,
        bookDriver,
        updateBookingStatus,
        getTrackingHistory,
        updateLocation,
        getAvailableDrivers,
        getMyAssignedShipments,
        getPendingShipments,
        getStats,
        refetch,
    };
}
