-- EXTREME OPEN PERMISSIONS UPDATE
-- Run this to allow ALL logged-in users to view ALL sales data and activities

-- 1. ACTIVITY MODULE: All users can view all activities
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can view all activities" ON public.activities;

CREATE POLICY "Users can view all activities"
  ON public.activities FOR SELECT
  TO authenticated
  USING (true);

-- 2. SALES MODULE: All users can view all sales records/targets
DROP POLICY IF EXISTS "Team can view all sales targets" ON public.sales_targets;
DROP POLICY IF EXISTS "Team can view all sales records" ON public.sales_records;
DROP POLICY IF EXISTS "Sales users can view their own targets" ON public.sales_targets;
DROP POLICY IF EXISTS "Sales users can view their own records" ON public.sales_records;

-- Allow ANY authenticated user (Sales, Presales, Manager, etc) to VIEW all sales data
CREATE POLICY "Everyone can view all sales targets"
ON public.sales_targets FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Everyone can view all sales records"
ON public.sales_records FOR SELECT
TO authenticated
USING (true);
