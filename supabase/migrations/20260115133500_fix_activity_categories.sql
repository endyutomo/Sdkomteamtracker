-- Fix Activity Categories Based on User Division
-- This migration updates all activities to have the correct category based on the user's division

-- Step 1: Add missing values to activity_category ENUM if they don't exist
DO $$ 
BEGIN
    -- Add 'logistic' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'logistic' AND enumtypid = 'activity_category'::regtype) THEN
        ALTER TYPE activity_category ADD VALUE 'logistic';
    END IF;
    
    -- Add 'backoffice' if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'backoffice' AND enumtypid = 'activity_category'::regtype) THEN
        ALTER TYPE activity_category ADD VALUE 'backoffice';
    END IF;
END $$;

-- Step 2: Update activities to match user division
UPDATE public.activities
SET category = CASE 
    WHEN profiles.division::text = 'sales' THEN 'sales'::activity_category
    WHEN profiles.division::text = 'presales' THEN 'presales'::activity_category
    WHEN profiles.division::text = 'logistic' THEN 'logistic'::activity_category
    WHEN profiles.division::text = 'backoffice' THEN 'backoffice'::activity_category
    WHEN profiles.division::text = 'manager' THEN 'sales'::activity_category
    ELSE 'sales'::activity_category
END
FROM public.profiles
WHERE activities.user_id = profiles.user_id
AND (
    activities.category IS NULL 
    OR activities.category::text != profiles.division::text
);
