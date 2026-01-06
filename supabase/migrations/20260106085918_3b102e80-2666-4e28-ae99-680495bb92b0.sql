-- Create company_settings table for logo and company data
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'SDKOM',
  logo_url text,
  address text,
  phone text,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can view company settings
CREATE POLICY "Anyone can view company settings"
ON public.company_settings
FOR SELECT
TO authenticated
USING (true);

-- Only managers can update company settings
CREATE POLICY "Managers can update company settings"
ON public.company_settings
FOR UPDATE
USING (is_manager(auth.uid()));

-- Only managers can insert company settings
CREATE POLICY "Managers can insert company settings"
ON public.company_settings
FOR INSERT
WITH CHECK (is_manager(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON public.company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default company settings
INSERT INTO public.company_settings (name) VALUES ('SDKOM');