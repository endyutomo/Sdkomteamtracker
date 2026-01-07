-- Create table for pending manager requests
CREATE TABLE public.pending_manager_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  jabatan TEXT,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pending_manager_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own requests
CREATE POLICY "Users can create their own manager requests"
ON public.pending_manager_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own requests
CREATE POLICY "Users can view their own requests"
ON public.pending_manager_requests
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Superadmin can view all requests
CREATE POLICY "Superadmin can view all requests"
ON public.pending_manager_requests
FOR SELECT
USING (is_superadmin(auth.uid()));

-- Policy: Superadmin can update requests (approve/reject)
CREATE POLICY "Superadmin can update requests"
ON public.pending_manager_requests
FOR UPDATE
USING (is_superadmin(auth.uid()));

-- Policy: Superadmin can delete requests
CREATE POLICY "Superadmin can delete requests"
ON public.pending_manager_requests
FOR DELETE
USING (is_superadmin(auth.uid()));