-- Add new division types: backoffice and logistic
ALTER TYPE public.division_type ADD VALUE IF NOT EXISTS 'backoffice';
ALTER TYPE public.division_type ADD VALUE IF NOT EXISTS 'logistic';