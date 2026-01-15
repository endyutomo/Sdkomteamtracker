-- Add Notifications System for Driver Booking
-- Created: 2026-01-15

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    action_taken BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- 2. Add acceptance_status column to driver_bookings
ALTER TABLE public.driver_bookings 
ADD COLUMN IF NOT EXISTS acceptance_status TEXT DEFAULT 'pending_acceptance';

-- Add index for acceptance_status
CREATE INDEX IF NOT EXISTS idx_driver_bookings_acceptance_status ON public.driver_bookings(acceptance_status);

-- 3. Create function to auto-create notification when booking is created
CREATE OR REPLACE FUNCTION create_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
    shipment_info RECORD;
BEGIN
    -- Get shipment details
    SELECT sender_name, recipient_name, item_description
    INTO shipment_info
    FROM public.shipments
    WHERE id = NEW.shipment_id;

    -- Create notification for driver
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data
    ) VALUES (
        NEW.driver_id,
        'booking_request',
        'Permintaan Pengiriman Baru',
        'Anda mendapat permintaan pengiriman dari ' || shipment_info.sender_name || ' ke ' || shipment_info.recipient_name,
        jsonb_build_object(
            'booking_id', NEW.id,
            'shipment_id', NEW.shipment_id,
            'booking_date', NEW.booking_date,
            'booking_time', NEW.booking_time,
            'notes', NEW.notes,
            'sender_name', shipment_info.sender_name,
            'recipient_name', shipment_info.recipient_name,
            'item_description', shipment_info.item_description
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_booking_created ON public.driver_bookings;
CREATE TRIGGER on_booking_created
    AFTER INSERT ON public.driver_bookings
    FOR EACH ROW
    WHEN (NEW.acceptance_status = 'pending_acceptance')
    EXECUTE FUNCTION create_booking_notification();

-- 4. Create function to notify backoffice when booking is accepted/rejected
CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER AS $$
DECLARE
    shipment_info RECORD;
    driver_info RECORD;
    backoffice_user_id UUID;
BEGIN
    -- Only proceed if acceptance_status changed
    IF OLD.acceptance_status IS DISTINCT FROM NEW.acceptance_status THEN
        -- Get shipment and driver details
        SELECT s.sender_name, s.recipient_name, s.item_description, s.created_by
        INTO shipment_info
        FROM public.shipments s
        WHERE s.id = NEW.shipment_id;
        
        SELECT p.name
        INTO driver_info
        FROM public.profiles p
        WHERE p.user_id = NEW.driver_id;
        
        -- Create notification for the person who created the booking
        IF NEW.acceptance_status = 'accepted' THEN
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                data
            ) VALUES (
                NEW.booked_by,
                'booking_accepted',
                'Booking Diterima',
                driver_info.name || ' telah menerima pengiriman ke ' || shipment_info.recipient_name,
                jsonb_build_object(
                    'booking_id', NEW.id,
                    'shipment_id', NEW.shipment_id,
                    'driver_name', driver_info.name
                )
            );
        ELSIF NEW.acceptance_status = 'rejected' THEN
            INSERT INTO public.notifications (
                user_id,
                type,
                title,
                message,
                data
            ) VALUES (
                NEW.booked_by,
                'booking_rejected',
                'Booking Ditolak',
                driver_info.name || ' menolak pengiriman. Silakan pilih driver lain.',
                jsonb_build_object(
                    'booking_id', NEW.id,
                    'shipment_id', NEW.shipment_id,
                    'driver_name', driver_info.name,
                    'rejection_reason', NEW.notes
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status change
DROP TRIGGER IF EXISTS on_booking_status_changed ON public.driver_bookings;
CREATE TRIGGER on_booking_status_changed
    AFTER UPDATE ON public.driver_bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_booking_status_change();

-- 5. Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;

-- Users can only see their own notifications
CREATE POLICY "notifications_select_policy" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- System can create notifications (via triggers)
CREATE POLICY "notifications_insert_policy" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_policy" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "notifications_delete_policy" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Create updated_at trigger for notifications
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable real-time for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 8. Grant permissions
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
