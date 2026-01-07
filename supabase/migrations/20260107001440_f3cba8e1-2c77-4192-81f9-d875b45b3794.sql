-- Update RLS policies to allow all authenticated users to view and participate in all chats

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view conversations they participate in" ON public.conversations;
DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;

DROP POLICY IF EXISTS "Users can view participants of their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can add participants to their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Participants can remove themselves" ON public.conversation_participants;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

-- Conversations: All authenticated users can view and create
CREATE POLICY "All users can view all conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All users can update conversations"
ON public.conversations
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Conversation Participants: All authenticated users can view and add
CREATE POLICY "All users can view all participants"
ON public.conversation_participants
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All users can add participants"
ON public.conversation_participants
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All users can remove participants"
ON public.conversation_participants
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Messages: All authenticated users can view and send
CREATE POLICY "All users can view all messages"
ON public.messages
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "All users can send messages"
ON public.messages
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND sender_id = auth.uid());

CREATE POLICY "Users can update their own messages"
ON public.messages
FOR UPDATE
USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
ON public.messages
FOR DELETE
USING (sender_id = auth.uid());
