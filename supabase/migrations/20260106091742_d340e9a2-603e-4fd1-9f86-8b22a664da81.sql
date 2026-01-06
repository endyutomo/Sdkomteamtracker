-- Add storage policies for sdkom bucket (logos folder)
CREATE POLICY "Managers can upload logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'sdkom' 
  AND is_manager(auth.uid())
);

CREATE POLICY "Managers can update logos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'sdkom'
  AND is_manager(auth.uid())
);

CREATE POLICY "Managers can delete logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'sdkom'
  AND is_manager(auth.uid())
);

CREATE POLICY "Anyone authenticated can view logos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'sdkom'
  AND auth.uid() IS NOT NULL
);

-- Fix user_roles INSERT policy to only allow 'user' role
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
CREATE POLICY "Users can insert their own role with user role only"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id AND role = 'user');

-- Add manager policies for user_roles
CREATE POLICY "Managers can update user roles"
ON public.user_roles
FOR UPDATE
USING (is_manager(auth.uid()));

CREATE POLICY "Managers can delete user roles"
ON public.user_roles
FOR DELETE
USING (is_manager(auth.uid()));