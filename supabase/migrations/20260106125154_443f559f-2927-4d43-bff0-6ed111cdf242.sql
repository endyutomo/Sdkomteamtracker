-- Create function to check if user is sales
CREATE OR REPLACE FUNCTION public.is_sales(_user_id uuid)
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
      AND division = 'sales'
  )
$$;

-- Update activities SELECT policy to allow sales to view presales activities
DROP POLICY IF EXISTS "Users can view their own activities " ON public.activities;
CREATE POLICY "Users can view activities" 
ON public.activities 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  is_manager(auth.uid()) OR 
  (is_sales(auth.uid()) AND category = 'presales')
);

-- Update profiles SELECT policies to allow sales to view presales profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;

CREATE POLICY "Users can view profiles" 
ON public.profiles 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  is_manager(auth.uid()) OR 
  (is_sales(auth.uid()) AND division = 'presales')
);