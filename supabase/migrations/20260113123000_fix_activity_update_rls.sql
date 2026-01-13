-- Add RLS policy to allow Managers to update and delete activities
-- Drop existing restricted policies if they exist (though we usually just add)
-- The existing "Users can update activities" policy only allowed own records or superadmin

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND division = 'manager'
  )
$$;

DROP POLICY IF EXISTS "Users can update activities" ON public.activities;
CREATE POLICY "Users and managers can update activities" 
ON public.activities 
FOR UPDATE 
USING (
  (auth.uid() = user_id) 
  OR is_manager(auth.uid())
  OR is_superadmin(auth.uid())
);

DROP POLICY IF EXISTS "Users can delete activities" ON public.activities;
CREATE POLICY "Users and managers can delete activities" 
ON public.activities 
FOR DELETE 
USING (
  (auth.uid() = user_id) 
  OR is_manager(auth.uid())
  OR is_superadmin(auth.uid())
);
