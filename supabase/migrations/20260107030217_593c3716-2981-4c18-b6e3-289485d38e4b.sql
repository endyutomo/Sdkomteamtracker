-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view activities" ON public.activities;

-- Create new policy that allows all sales and presales to view all activities
CREATE POLICY "Users can view activities" 
ON public.activities 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR is_manager(auth.uid()) 
  OR is_superadmin(auth.uid()) 
  OR is_sales(auth.uid()) 
  OR is_presales(auth.uid())
);