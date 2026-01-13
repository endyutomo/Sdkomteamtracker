-- =====================================================
-- SHIPPING FEATURE: Database Schema
-- =====================================================

-- 1. ENUM untuk status pengiriman
DO $$ BEGIN
  CREATE TYPE public.shipping_status AS ENUM (
    'pending',      -- Menunggu driver
    'booked',       -- Driver sudah di-booking
    'picked_up',    -- Barang sudah diambil
    'in_transit',   -- Dalam perjalanan
    'delivered',    -- Sudah dikirim
    'cancelled'     -- Dibatalkan
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. ENUM untuk status booking
DO $$ BEGIN
  CREATE TYPE public.booking_status AS ENUM (
    'pending',      -- Menunggu konfirmasi
    'confirmed',    -- Dikonfirmasi driver
    'completed',    -- Selesai
    'cancelled'     -- Dibatalkan
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. Tabel Shipments (Pengiriman)
CREATE TABLE IF NOT EXISTS public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Info Pengirim
  sender_name TEXT NOT NULL,
  sender_address TEXT NOT NULL,
  sender_phone TEXT,
  
  -- Info Penerima
  recipient_name TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  recipient_phone TEXT,
  
  -- Info Barang
  item_description TEXT NOT NULL,
  weight_kg DECIMAL(10, 2),
  dimensions TEXT,
  
  -- Status & Tanggal
  status public.shipping_status NOT NULL DEFAULT 'pending',
  pickup_date DATE,
  delivery_date DATE,
  estimated_delivery DATE,
  
  -- Catatan
  notes TEXT,
  
  -- Tracking Real-time
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  current_location_name TEXT,
  last_location_update TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tabel Driver Bookings
CREATE TABLE IF NOT EXISTS public.driver_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  booking_date DATE NOT NULL,
  booking_time TIME,
  status public.booking_status NOT NULL DEFAULT 'confirmed', -- Auto-confirm, no approval needed
  
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(shipment_id, driver_id)
);

-- 5. Tabel Tracking History (untuk real-time tracking)
CREATE TABLE IF NOT EXISTS public.shipment_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_name TEXT,
  
  status public.shipping_status,
  notes TEXT,
  
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_shipments_created_by ON public.shipments(created_by);
CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON public.shipments(driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_pickup_date ON public.shipments(pickup_date);
CREATE INDEX IF NOT EXISTS idx_driver_bookings_driver_id ON public.driver_bookings(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_bookings_shipment_id ON public.driver_bookings(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_shipment_id ON public.shipment_tracking(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_recorded_at ON public.shipment_tracking(recorded_at);

-- 7. Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_tracking ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for Shipments

-- View: Logistic, Backoffice, Manager dapat melihat semua; lainnya hanya milik sendiri
CREATE POLICY "shipments_select_policy" ON public.shipments FOR SELECT USING (
  auth.uid() = created_by 
  OR auth.uid() = driver_id
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND division IN ('logistic', 'backoffice', 'manager')
  )
  OR public.is_superadmin(auth.uid())
);

-- Insert: Logistic, Backoffice, Manager dapat membuat
CREATE POLICY "shipments_insert_policy" ON public.shipments FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND division IN ('logistic', 'backoffice', 'manager')
  )
  OR public.is_superadmin(auth.uid())
);

-- Update: Creator, assigned Driver, Manager dapat update
CREATE POLICY "shipments_update_policy" ON public.shipments FOR UPDATE USING (
  auth.uid() = created_by 
  OR auth.uid() = driver_id
  OR public.is_manager(auth.uid())
  OR public.is_superadmin(auth.uid())
);

-- Delete: Hanya Manager dan Superadmin
CREATE POLICY "shipments_delete_policy" ON public.shipments FOR DELETE USING (
  public.is_manager(auth.uid())
  OR public.is_superadmin(auth.uid())
);

-- 9. RLS Policies for Driver Bookings

CREATE POLICY "bookings_select_policy" ON public.driver_bookings FOR SELECT USING (
  auth.uid() = driver_id
  OR auth.uid() = booked_by
  OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND division IN ('logistic', 'backoffice', 'manager')
  )
  OR public.is_superadmin(auth.uid())
);

CREATE POLICY "bookings_insert_policy" ON public.driver_bookings FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND division IN ('logistic', 'backoffice', 'manager')
  )
  OR public.is_superadmin(auth.uid())
);

CREATE POLICY "bookings_update_policy" ON public.driver_bookings FOR UPDATE USING (
  auth.uid() = driver_id 
  OR auth.uid() = booked_by 
  OR public.is_manager(auth.uid())
  OR public.is_superadmin(auth.uid())
);

CREATE POLICY "bookings_delete_policy" ON public.driver_bookings FOR DELETE USING (
  public.is_manager(auth.uid())
  OR public.is_superadmin(auth.uid())
);

-- 10. RLS Policies for Tracking

CREATE POLICY "tracking_select_policy" ON public.shipment_tracking FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.shipments s 
    WHERE s.id = shipment_id 
    AND (
      s.created_by = auth.uid() 
      OR s.driver_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND division IN ('logistic', 'backoffice', 'manager')
      )
    )
  )
  OR public.is_superadmin(auth.uid())
);

CREATE POLICY "tracking_insert_policy" ON public.shipment_tracking FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shipments s 
    WHERE s.id = shipment_id 
    AND s.driver_id = auth.uid()
  )
  OR public.is_superadmin(auth.uid())
);

-- 11. Triggers for updated_at
CREATE TRIGGER update_shipments_updated_at 
  BEFORE UPDATE ON public.shipments 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_bookings_updated_at 
  BEFORE UPDATE ON public.driver_bookings 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
