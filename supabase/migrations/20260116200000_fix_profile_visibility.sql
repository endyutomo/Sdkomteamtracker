-- Fix profile visibility to allow all authenticated users to see each other
-- This resolves the issue where only 2 users were visible in the Team menu

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Create new policy that allows all authenticated users to view all profiles
-- Profile information (name, division, jabatan) is considered non-sensitive internal team data
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- Keep the update policy restricted to own profile or managers
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (
  auth.uid() = user_id OR 
  public.is_manager(auth.uid()) OR
  public.is_backoffice(auth.uid())
);

-- Keep the delete policy restricted to managers/superadmins
DROP POLICY IF EXISTS "Managers can delete profiles" ON public.profiles;
CREATE POLICY "Managers can delete profiles"
ON public.profiles FOR DELETE
USING (
  public.is_manager(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'superadmin'
  )
);
