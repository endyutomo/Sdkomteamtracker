-- Add RLS policy to allow collaborators to view activities they are assigned to
-- and update existing view policy to be more specific or inclusive

CREATE POLICY "Collaborators can view assigned activities"
ON public.activities
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()
    AND (
      (activities.collaboration->'collaborators') @> jsonb_build_array(jsonb_build_object('personId', p.id))
      OR activities.collaboration->>'personId' = p.id::text
    )
  )
);

-- Note: The existing "Users can view activities" policy might already allow broad access,
-- but this policy ensures that even if broad access is restricted, collaborators still have access.
