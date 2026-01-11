-- Fix RLS policies to allow Managers and Superadmins to UPDATE and DELETE targets and records

-- 1. Sales Targets
DROP POLICY IF EXISTS "Sales users can update their own targets" ON public.sales_targets;
DROP POLICY IF EXISTS "Sales users can delete their own targets" ON public.sales_targets;

CREATE POLICY "Sales users and managers can update targets"
ON public.sales_targets FOR UPDATE
USING (auth.uid() = user_id OR is_manager(auth.uid()) OR is_superadmin(auth.uid()));

CREATE POLICY "Sales users and managers can delete targets"
ON public.sales_targets FOR DELETE
USING (auth.uid() = user_id OR is_manager(auth.uid()) OR is_superadmin(auth.uid()));


-- 2. Sales Records
DROP POLICY IF EXISTS "Sales users can update their own records" ON public.sales_records;
DROP POLICY IF EXISTS "Sales users can delete their own records" ON public.sales_records;

CREATE POLICY "Sales users and managers can update records"
ON public.sales_records FOR UPDATE
USING (auth.uid() = user_id OR is_manager(auth.uid()) OR is_superadmin(auth.uid()));

CREATE POLICY "Sales users and managers can delete records"
ON public.sales_records FOR DELETE
USING (auth.uid() = user_id OR is_manager(auth.uid()) OR is_superadmin(auth.uid()));
