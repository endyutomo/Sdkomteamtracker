-- Create sales_targets table for storing sales targets
CREATE TABLE public.sales_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_year INTEGER NOT NULL,
  period_month INTEGER, -- For monthly targets (1-12)
  period_quarter INTEGER, -- For quarterly targets (1-4)
  target_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_year, period_month, period_quarter)
);

-- Create sales_records table for storing actual sales
CREATE TABLE public.sales_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15, 2) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL,
  closing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;

-- RLS policies for sales_targets
CREATE POLICY "Sales users can view their own targets"
ON public.sales_targets FOR SELECT
USING (auth.uid() = user_id OR is_manager(auth.uid()) OR is_superadmin(auth.uid()));

CREATE POLICY "Sales users can create their own targets"
ON public.sales_targets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sales users can update their own targets"
ON public.sales_targets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Sales users can delete their own targets"
ON public.sales_targets FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for sales_records
CREATE POLICY "Sales users can view their own records"
ON public.sales_records FOR SELECT
USING (auth.uid() = user_id OR is_manager(auth.uid()) OR is_superadmin(auth.uid()));

CREATE POLICY "Sales users can create their own records"
ON public.sales_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sales users can update their own records"
ON public.sales_records FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Sales users can delete their own records"
ON public.sales_records FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_sales_targets_updated_at
BEFORE UPDATE ON public.sales_targets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_records_updated_at
BEFORE UPDATE ON public.sales_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();