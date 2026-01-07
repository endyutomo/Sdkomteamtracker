-- Create function to check if user is superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'superadmin'
  )
$$;

-- Drop existing policies on activities that we need to update
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can view activities" ON public.activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON public.activities;

-- Create new policies that include superadmin access
CREATE POLICY "Users can view activities" 
ON public.activities 
FOR SELECT 
USING (
  (auth.uid() = user_id) 
  OR is_manager(auth.uid()) 
  OR is_superadmin(auth.uid())
  OR (is_sales(auth.uid()) AND (category = 'presales'::activity_category)) 
  OR (is_presales(auth.uid()) AND (category = 'sales'::activity_category))
);

CREATE POLICY "Users can update activities" 
ON public.activities 
FOR UPDATE 
USING (
  (auth.uid() = user_id) 
  OR is_superadmin(auth.uid())
);

CREATE POLICY "Users can delete activities" 
ON public.activities 
FOR DELETE 
USING (
  (auth.uid() = user_id) 
  OR is_superadmin(auth.uid())
);