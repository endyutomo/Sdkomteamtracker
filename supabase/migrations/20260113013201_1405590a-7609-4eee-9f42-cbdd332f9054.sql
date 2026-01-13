-- Add new activity types to the enum
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'sick';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'permission';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'time_off';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'wfh';