-- Drop existing SELECT policy for profiles
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Create new policy that allows viewing superadmin profiles by all authenticated users
CREATE POLICY "Users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR is_manager(auth.uid()) 
  OR (is_sales(auth.uid()) AND (division = 'presales' OR division = 'manager'))
  OR (is_presales(auth.uid()) AND (division = 'sales' OR division = 'manager'))
  OR EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = profiles.user_id 
    AND user_roles.role = 'superadmin'
  )
);