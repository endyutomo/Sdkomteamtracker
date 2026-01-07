-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create new insert policy that allows users to insert their own profile OR superadmins to insert for others
CREATE POLICY "Users can insert own profile or superadmins can insert for others" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  OR public.is_superadmin(auth.uid())
);

-- Also update the update policy to allow superadmins to update other profiles
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile or superadmins can update others" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = user_id 
  OR public.is_superadmin(auth.uid())
);