-- COMBINED PERMISSIONS UPDATE
-- Run this to enable Team Analytics for Activity and Sales modules

-- 1. ACTIVITY MODULE: Allow all authenticated users to view all activities
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
-- Note: We drop the specific "view own" policy and replace it with "view all"
CREATE POLICY "Users can view all activities"
  ON public.activities FOR SELECT
  TO authenticated
  USING (true);

-- 2. SALES MODULE: Allow Manager and Sales Division to view all records
DROP POLICY IF EXISTS "Sales users can view their own targets" ON public.sales_targets;
DROP POLICY IF EXISTS "Sales users can view their own records" ON public.sales_records;
DROP POLICY IF EXISTS "Team can view all sales targets" ON public.sales_targets;
DROP POLICY IF EXISTS "Team can view all sales records" ON public.sales_records;

CREATE POLICY "Team can view all sales targets"
ON public.sales_targets FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND division IN ('manager', 'sales')
  )
  OR 
  is_superadmin(auth.uid())
);

CREATE POLICY "Team can view all sales records"
ON public.sales_records FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND division IN ('manager', 'sales')
  )
  OR 
  is_superadmin(auth.uid())
);
