-- Add cost_price and margin columns to sales_records table
ALTER TABLE public.sales_records 
ADD COLUMN cost_price numeric DEFAULT 0,
ADD COLUMN margin_amount numeric GENERATED ALWAYS AS (total_amount - (cost_price * quantity)) STORED,
ADD COLUMN margin_percentage numeric GENERATED ALWAYS AS (
  CASE 
    WHEN total_amount > 0 THEN ((total_amount - (cost_price * quantity)) / total_amount) * 100 
    ELSE 0 
  END
) STORED;