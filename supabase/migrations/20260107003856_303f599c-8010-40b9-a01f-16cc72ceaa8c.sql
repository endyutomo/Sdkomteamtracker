-- Drop existing restrictive upload policy
DROP POLICY IF EXISTS "Managers can upload logos" ON storage.objects;

-- Create new policy allowing all authenticated users to upload logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'sdkom' AND auth.uid() IS NOT NULL);

-- Also allow all authenticated users to update their uploads
DROP POLICY IF EXISTS "Managers can update logos" ON storage.objects;
CREATE POLICY "Authenticated users can update logos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'sdkom' AND auth.uid() IS NOT NULL);

-- Allow all authenticated users to delete logos
DROP POLICY IF EXISTS "Managers can delete logos" ON storage.objects;
CREATE POLICY "Authenticated users can delete logos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'sdkom' AND auth.uid() IS NOT NULL);