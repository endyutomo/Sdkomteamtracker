-- Create shipping_status enum
CREATE TYPE public.shipping_status AS ENUM (
  'pending',
  'booked',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled'
);

-- Create booking_status enum  
CREATE TYPE public.booking_status AS ENUM (
  'pending',
  'confirmed',
  'completed',
  'cancelled'
);

-- Create shipments table
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  driver_id UUID NULL,
  
  -- Sender info
  sender_name TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  sender_phone TEXT NULL,
  
  -- Recipient info
  recipient_name TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_phone TEXT NULL,
  
  -- Item info
  item_description TEXT NOT NULL,
  weight_kg NUMERIC NULL,
  dimensions TEXT NULL,
  
  -- Status
  status shipping_status NOT NULL DEFAULT 'pending',
  pickup_date DATE NULL,
  delivery_date DATE NULL,
  estimated_delivery DATE NULL,
  
  notes TEXT NULL,
  
  -- Tracking
  current_latitude DOUBLE PRECISION NULL,
  current_longitude DOUBLE PRECISION NULL,
  current_location_name TEXT NULL,
  last_location_update TIMESTAMP WITH TIME ZONE NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create driver_bookings table
CREATE TABLE public.driver_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL,
  booked_by UUID NOT NULL,
  
  booking_date DATE NOT NULL,
  booking_time TEXT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  notes TEXT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipment_tracking table
CREATE TABLE public.shipment_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location_name TEXT NULL,
  
  status shipping_status NULL,
  notes TEXT NULL,
  
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking ENABLE ROW LEVEL SECURITY;

-- Shipments RLS policies
CREATE POLICY "Users can view shipments"
  ON public.shipments FOR SELECT
  USING (
    auth.uid() = created_by 
    OR auth.uid() = driver_id
    OR is_manager(auth.uid())
    OR is_backoffice(auth.uid())
    OR is_logistic(auth.uid())
  );

CREATE POLICY "Users can create shipments"
  ON public.shipments FOR INSERT
  WITH CHECK (
    auth.uid() = created_by 
    OR is_backoffice(auth.uid())
    OR is_manager(auth.uid())
  );

CREATE POLICY "Users can update shipments"
  ON public.shipments FOR UPDATE
  USING (
    auth.uid() = created_by 
    OR auth.uid() = driver_id
    OR is_manager(auth.uid())
    OR is_backoffice(auth.uid())
  );

CREATE POLICY "Users can delete shipments"
  ON public.shipments FOR DELETE
  USING (
    auth.uid() = created_by 
    OR is_manager(auth.uid())
  );

-- Driver bookings RLS policies
CREATE POLICY "Users can view driver bookings"
  ON public.driver_bookings FOR SELECT
  USING (
    auth.uid() = booked_by 
    OR auth.uid() = driver_id
    OR is_manager(auth.uid())
    OR is_backoffice(auth.uid())
    OR is_logistic(auth.uid())
  );

CREATE POLICY "Users can create driver bookings"
  ON public.driver_bookings FOR INSERT
  WITH CHECK (
    auth.uid() = booked_by 
    OR is_backoffice(auth.uid())
    OR is_manager(auth.uid())
  );

CREATE POLICY "Users can update driver bookings"
  ON public.driver_bookings FOR UPDATE
  USING (
    auth.uid() = booked_by 
    OR auth.uid() = driver_id
    OR is_manager(auth.uid())
    OR is_backoffice(auth.uid())
  );

CREATE POLICY "Users can delete driver bookings"
  ON public.driver_bookings FOR DELETE
  USING (
    auth.uid() = booked_by 
    OR is_manager(auth.uid())
  );

-- Shipment tracking RLS policies
CREATE POLICY "Users can view shipment tracking"
  ON public.shipment_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.shipments s 
      WHERE s.id = shipment_id 
      AND (s.created_by = auth.uid() OR s.driver_id = auth.uid())
    )
    OR is_manager(auth.uid())
    OR is_backoffice(auth.uid())
    OR is_logistic(auth.uid())
  );

CREATE POLICY "Drivers and backoffice can create tracking"
  ON public.shipment_tracking FOR INSERT
  WITH CHECK (
    is_logistic(auth.uid())
    OR is_backoffice(auth.uid())
    OR is_manager(auth.uid())
  );

-- Create triggers for updated_at
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_bookings_updated_at
  BEFORE UPDATE ON public.driver_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for shipments
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_bookings;