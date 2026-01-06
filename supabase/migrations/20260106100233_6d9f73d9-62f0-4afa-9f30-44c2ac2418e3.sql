-- Add project and opportunity fields to activities table
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS project TEXT,
ADD COLUMN IF NOT EXISTS opportunity TEXT;