
-- Create division enum
CREATE TYPE public.division_type AS ENUM ('sales', 'presales', 'manager');

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name text NOT NULL,
  jabatan text,
  division division_type NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user is manager
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND division = 'manager'
  )
$$;

-- Profiles RLS policies
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Managers can view all profiles
CREATE POLICY "Managers can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_manager(auth.uid()));

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Managers can update any profile
CREATE POLICY "Managers can update any profile"
ON public.profiles
FOR UPDATE
USING (public.is_manager(auth.uid()));

-- Managers can delete profiles
CREATE POLICY "Managers can delete profiles"
ON public.profiles
FOR DELETE
USING (public.is_manager(auth.uid()));

-- User roles RLS policies
-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Managers can view all roles
CREATE POLICY "Managers can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_manager(auth.uid()));

-- Users can insert their own role on signup
CREATE POLICY "Users can insert their own role"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update activities RLS to allow managers to view all
DROP POLICY IF EXISTS "Users can view their own activities" ON public.activities;
CREATE POLICY "Users can view their own activities"
ON public.activities
FOR SELECT
USING (auth.uid() = user_id OR public.is_manager(auth.uid()));

-- Update persons RLS to allow managers to view all
DROP POLICY IF EXISTS "Users can view their own persons" ON public.persons;
CREATE POLICY "Users can view their own persons"
ON public.persons
FOR SELECT
USING (auth.uid() = user_id OR public.is_manager(auth.uid()));

-- Managers can manage all persons
CREATE POLICY "Managers can update any person"
ON public.persons
FOR UPDATE
USING (public.is_manager(auth.uid()));

CREATE POLICY "Managers can delete any person"
ON public.persons
FOR DELETE
USING (public.is_manager(auth.uid()));

CREATE POLICY "Managers can insert persons"
ON public.persons
FOR INSERT
WITH CHECK (public.is_manager(auth.uid()) OR auth.uid() = user_id);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
