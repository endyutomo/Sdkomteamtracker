-- 1. BASE ACTIVITIES SCHEMA
CREATE TYPE public.person_role AS ENUM ('sales', 'presales', 'other');
CREATE TYPE public.activity_type AS ENUM ('visit', 'call', 'email', 'meeting', 'other');
CREATE TYPE public.activity_category AS ENUM ('sales', 'presales');

CREATE TABLE public.persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role person_role NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category activity_category NOT NULL,
  person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
  person_name TEXT NOT NULL,
  activity_type activity_type NOT NULL,
  customer_name TEXT NOT NULL,
  notes TEXT DEFAULT '',
  collaboration JSONB,
  photos TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own persons" ON public.persons FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own persons" ON public.persons FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own persons" ON public.persons FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own persons" ON public.persons FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activities" ON public.activities FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own activities" ON public.activities FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own activities" ON public.activities FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_persons_user_id ON public.persons(user_id);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_date ON public.activities(date);
CREATE INDEX idx_activities_person_id ON public.activities(person_id);

-- 2. BASE PROFILES SCHEMA
CREATE TYPE public.division_type AS ENUM ('sales', 'presales', 'manager');
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL,
  jabatan text,
  division division_type NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND division = 'manager')
$$;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view all profiles" ON public.profiles FOR SELECT USING (public.is_manager(auth.uid()));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Managers can update any profile" ON public.profiles FOR UPDATE USING (public.is_manager(auth.uid()));
CREATE POLICY "Managers can delete profiles" ON public.profiles FOR DELETE USING (public.is_manager(auth.uid()));

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Managers can view all roles" ON public.user_roles FOR SELECT USING (public.is_manager(auth.uid()));
CREATE POLICY "Users can insert their own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update RLS for Managers
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
CREATE POLICY "Users can view their own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id OR public.is_manager(auth.uid()));

DROP POLICY IF EXISTS "Users can view their own persons" ON public.persons;
CREATE POLICY "Users can view their own persons" ON public.persons FOR SELECT USING (auth.uid() = user_id OR public.is_manager(auth.uid()));

CREATE POLICY "Managers can update any person" ON public.persons FOR UPDATE USING (public.is_manager(auth.uid()));
CREATE POLICY "Managers can delete any person" ON public.persons FOR DELETE USING (public.is_manager(auth.uid()));
CREATE POLICY "Managers can insert persons" ON public.persons FOR INSERT WITH CHECK (public.is_manager(auth.uid()) OR auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. BASE SALES SCHEMA
CREATE TABLE public.sales_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_year INTEGER NOT NULL,
  period_month INTEGER,
  period_quarter INTEGER,
  target_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, period_type, period_year, period_month, period_quarter)
);

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

ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_records ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_sales_targets_updated_at BEFORE UPDATE ON public.sales_targets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sales_records_updated_at BEFORE UPDATE ON public.sales_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update Sales RLS (Initial)
CREATE POLICY "Sales users can view their own targets" ON public.sales_targets FOR SELECT USING (auth.uid() = user_id OR is_manager(auth.uid()));
CREATE POLICY "Sales users can create their own targets" ON public.sales_targets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Sales users can update their own targets" ON public.sales_targets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Sales users can delete their own targets" ON public.sales_targets FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Sales users can view their own records" ON public.sales_records FOR SELECT USING (auth.uid() = user_id OR is_manager(auth.uid()));
CREATE POLICY "Sales users can create their own records" ON public.sales_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Sales users can update their own records" ON public.sales_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Sales users can delete their own records" ON public.sales_records FOR DELETE USING (auth.uid() = user_id);

-- 4. SALES MARGIN UPDATE
ALTER TABLE public.sales_records ADD COLUMN IF NOT EXISTS modal DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE public.sales_records ADD COLUMN IF NOT EXISTS other_cost DECIMAL(15, 2) DEFAULT 0;

-- 5. FUNCTION SUPERADMIN
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin')
$$;

-- 6. FINAL PERMISSIONS (OPEN ACCESS FOR TEAM STATS)
-- Activity Report: Allow all view
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
CREATE POLICY "Users can view all activities" ON public.activities FOR SELECT TO authenticated USING (true);

-- Sales Report: Allow Manager/Sales view all
DROP POLICY IF EXISTS "Sales users can view their own targets" ON public.sales_targets;
DROP POLICY IF EXISTS "Sales users can view their own records" ON public.sales_records;

CREATE POLICY "Team can view all sales targets" ON public.sales_targets FOR SELECT USING (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND division IN ('manager', 'sales'))
  OR is_superadmin(auth.uid())
);

CREATE POLICY "Team can view all sales records" ON public.sales_records FOR SELECT USING (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND division IN ('manager', 'sales'))
  OR is_superadmin(auth.uid())
);
