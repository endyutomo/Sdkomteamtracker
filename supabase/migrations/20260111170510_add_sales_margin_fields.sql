-- Add modal, other cost columns to sales_records table for margin calculation
ALTER TABLE public.sales_records 
ADD COLUMN modal DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN other_cost DECIMAL(15, 2) DEFAULT 0;
