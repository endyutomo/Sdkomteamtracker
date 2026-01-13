-- Create helper functions for new divisions
CREATE OR REPLACE FUNCTION public.is_backoffice(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND division = 'backoffice'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_logistic(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND division = 'logistic'
  )
$$;

-- Update RLS policies for activities table to allow backoffice and logistic to view
DROP POLICY IF EXISTS "Users can view activities" ON public.activities;
CREATE POLICY "Users can view activities" ON public.activities
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    is_manager(auth.uid()) OR 
    is_superadmin(auth.uid()) OR 
    is_sales(auth.uid()) OR 
    is_presales(auth.uid()) OR
    is_backoffice(auth.uid()) OR
    is_logistic(auth.uid())
  );

-- Backoffice can create activities (for booking on behalf of others)
DROP POLICY IF EXISTS "Users can create their own activities" ON public.activities;
CREATE POLICY "Users can create their own activities" ON public.activities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR is_backoffice(auth.uid()));

-- Backoffice can update activities (for managing bookings)
DROP POLICY IF EXISTS "Users can update activities" ON public.activities;
CREATE POLICY "Users can update activities" ON public.activities
  FOR UPDATE
  USING (
    auth.uid() = user_id OR 
    is_superadmin(auth.uid()) OR
    is_backoffice(auth.uid())
  );

-- Update RLS policies for sales_records to allow backoffice to view
DROP POLICY IF EXISTS "Sales users can view their own records" ON public.sales_records;
CREATE POLICY "Sales users can view their own records" ON public.sales_records
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    is_manager(auth.uid()) OR 
    is_superadmin(auth.uid()) OR
    is_backoffice(auth.uid())
  );

-- Update RLS policies for sales_targets to allow backoffice to view
DROP POLICY IF EXISTS "Sales users can view their own targets" ON public.sales_targets;
CREATE POLICY "Sales users can view their own targets" ON public.sales_targets
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    is_manager(auth.uid()) OR 
    is_superadmin(auth.uid()) OR
    is_backoffice(auth.uid())
  );

-- Update profiles RLS to allow viewing logistic profiles for collaboration
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = user_id OR 
    is_manager(auth.uid()) OR 
    is_backoffice(auth.uid()) OR
    (is_sales(auth.uid()) AND (division IN ('presales', 'manager', 'logistic'))) OR
    (is_presales(auth.uid()) AND (division IN ('sales', 'manager', 'logistic'))) OR
    (is_logistic(auth.uid()) AND (division IN ('sales', 'presales', 'manager'))) OR
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = profiles.user_id 
      AND user_roles.role = 'superadmin'
    )
  );