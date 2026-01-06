-- Fix: Company settings should only be viewable by authenticated users
DROP POLICY IF EXISTS "Anyone can view company settings" ON public.company_settings;
CREATE POLICY "Authenticated users can view company settings"
ON public.company_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add: Managers can delete company settings
CREATE POLICY "Managers can delete company settings"
ON public.company_settings
FOR DELETE
USING (is_manager(auth.uid()));

-- Add: Users can delete their own profile
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Fix: Add restrictive policies to prevent role manipulation
-- Note: user_roles should not be updatable or deletable by regular users
-- The existing lack of UPDATE/DELETE policies is actually secure by default in RLS