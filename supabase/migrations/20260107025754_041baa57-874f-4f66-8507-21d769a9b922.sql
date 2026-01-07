-- Create message_reads table to track who has read each message
CREATE TABLE public.message_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS
ALTER TABLE public.message_reads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all message reads"
ON public.message_reads
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can mark messages as read"
ON public.message_reads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reads"
ON public.message_reads
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for message_reads
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reads;