-- Drop existing select policies
DROP POLICY IF EXISTS "Sales users can view their own targets" ON public.sales_targets;
DROP POLICY IF EXISTS "Sales users can view their own records" ON public.sales_records;

-- Create new policies allowing Sales division to view ALL records (for Team Analytics)
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
