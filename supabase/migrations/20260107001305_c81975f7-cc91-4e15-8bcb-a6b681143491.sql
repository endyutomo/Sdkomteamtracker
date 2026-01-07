-- Drop and recreate conversation_participants INSERT policy to allow adding self and others when creating conversation
DROP POLICY IF EXISTS "Authenticated users can add participants" ON public.conversation_participants;

-- Allow users to add participants to conversations they created or are part of
CREATE POLICY "Users can add participants to their conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Allow adding self
    user_id = auth.uid() OR
    -- Allow adding others if user is already a participant of the conversation
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
    ) OR
    -- Allow adding participants to a new conversation (no participants yet)
    NOT EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id
    )
  )
);
