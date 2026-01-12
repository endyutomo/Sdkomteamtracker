-- Drop existing generated columns and recreate with new formula
ALTER TABLE public.sales_records 
DROP COLUMN margin_amount,
DROP COLUMN margin_percentage;

-- Add other_expense column
ALTER TABLE public.sales_records 
ADD COLUMN other_expense numeric DEFAULT 0;

-- Recreate margin columns with new formula including other_expense
ALTER TABLE public.sales_records 
ADD COLUMN margin_amount numeric GENERATED ALWAYS AS (total_amount - (cost_price * quantity) - COALESCE(other_expense, 0)) STORED,
ADD COLUMN margin_percentage numeric GENERATED ALWAYS AS (
  CASE 
    WHEN total_amount > 0 THEN ((total_amount - (cost_price * quantity) - COALESCE(other_expense, 0)) / total_amount) * 100 
    ELSE 0 
  END
) STORED;