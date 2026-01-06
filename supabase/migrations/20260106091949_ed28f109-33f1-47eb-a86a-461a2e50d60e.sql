-- Remove foreign key constraint since we now use profiles instead of persons for activity assignment
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_person_id_fkey;