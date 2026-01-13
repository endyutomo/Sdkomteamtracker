-- Create helper functions for new divisions
CREATE OR REPLACE FUNCTION public.is_logistic(_user_id uuid)
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
      AND division = 'logistic'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_backoffice(_user_id uuid)
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
      AND division = 'backoffice'
  )
$$;

-- Update RLS Policies for conversations to include new divisions
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
CREATE POLICY "Users can view conversations they participate in"
ON public.conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = id AND user_id = auth.uid()
  ) OR
  (type = 'division' AND division IS NOT NULL AND (
    (division = 'sales' AND is_sales(auth.uid())) OR
    (division = 'presales' AND is_presales(auth.uid())) OR
    (division = 'logistic' AND is_logistic(auth.uid())) OR
    (division = 'backoffice' AND is_backoffice(auth.uid())) OR
    (division = 'all' AND auth.uid() IS NOT NULL) OR
    is_manager(auth.uid())
  ))
);

-- Update RLS Policies for conversation_participants
DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
CREATE POLICY "Users can view participants of their conversations"
ON public.conversation_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.type = 'division' AND (
      (c.division = 'sales' AND is_sales(auth.uid())) OR
      (c.division = 'presales' AND is_presales(auth.uid())) OR
      (c.division = 'logistic' AND is_logistic(auth.uid())) OR
      (c.division = 'backoffice' AND is_backoffice(auth.uid())) OR
      (c.division = 'all' AND auth.uid() IS NOT NULL) OR
      is_manager(auth.uid())
    )
  )
);

-- Update RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id AND c.type = 'division' AND (
      (c.division = 'sales' AND is_sales(auth.uid())) OR
      (c.division = 'presales' AND is_presales(auth.uid())) OR
      (c.division = 'logistic' AND is_logistic(auth.uid())) OR
      (c.division = 'backoffice' AND is_backoffice(auth.uid())) OR
      (c.division = 'all' AND auth.uid() IS NOT NULL) OR
      is_manager(auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
CREATE POLICY "Users can send messages to their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id AND c.type = 'division' AND (
        (c.division = 'sales' AND is_sales(auth.uid())) OR
        (c.division = 'presales' AND is_presales(auth.uid())) OR
        (c.division = 'logistic' AND is_logistic(auth.uid())) OR
        (c.division = 'backoffice' AND is_backoffice(auth.uid())) OR
        (c.division = 'all' AND auth.uid() IS NOT NULL) OR
        is_manager(auth.uid())
      )
    )
  )
);
