-- Drop existing view policy
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;

-- Create new policy allowing all authenticated users to view ALL activities
-- This is required so that any user can see the "Team Activity Statistics"
CREATE POLICY "Users can view all activities"
  ON public.activities FOR SELECT
  TO authenticated
  USING (true);
