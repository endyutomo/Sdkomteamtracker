-- Create enum types for roles and activity types
CREATE TYPE public.person_role AS ENUM ('sales', 'presales', 'other');
CREATE TYPE public.activity_type AS ENUM ('visit', 'call', 'email', 'meeting', 'other');
CREATE TYPE public.activity_category AS ENUM ('sales', 'presales');

-- Create persons table
CREATE TABLE public.persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role person_role NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create activities table
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

-- Enable RLS on both tables
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- RLS policies for persons table
CREATE POLICY "Users can view their own persons"
  ON public.persons FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own persons"
  ON public.persons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own persons"
  ON public.persons FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own persons"
  ON public.persons FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS policies for activities table
CREATE POLICY "Users can view their own activities"
  ON public.activities FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activities"
  ON public.activities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON public.activities FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
  ON public.activities FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_persons_user_id ON public.persons(user_id);
CREATE INDEX idx_activities_user_id ON public.activities(user_id);
CREATE INDEX idx_activities_date ON public.activities(date);
CREATE INDEX idx_activities_person_id ON public.activities(person_id);