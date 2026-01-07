import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { toast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender_name?: string;
}

export interface Conversation {
  id: string;
  name: string | null;
  type: 'direct' | 'group' | 'division';
  division: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithDetails extends Conversation {
  participants: { user_id: string; name: string }[];
  last_message?: Message;
  unread_count?: number;
}

export function useChat() {
  const { user } = useAuth();
  const { profile, allProfiles } = useProfile();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (convError) throw convError;

      // Get participants for each conversation
      const conversationsWithDetails: ConversationWithDetails[] = await Promise.all(
        (convData || []).map(async (conv) => {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conv.id);

          const participantDetails = (participants || []).map((p) => {
            const profile = allProfiles.find((pr) => pr.user_id === p.user_id);
            return {
              user_id: p.user_id,
              name: profile?.name || 'Unknown',
            };
          });

          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...conv,
            type: conv.type as 'direct' | 'group' | 'division',
            participants: participantDetails,
            last_message: lastMsg || undefined,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error: any) {
      console.error('Error fetching conversations:', error.message);
    } finally {
      setLoading(false);
    }
  }, [user, allProfiles]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithNames = (data || []).map((msg) => {
        const senderProfile = allProfiles.find((p) => p.user_id === msg.sender_id);
        return {
          ...msg,
          sender_name: senderProfile?.name || 'Unknown',
        };
      });

      setMessages(messagesWithNames);
    } catch (error: any) {
      console.error('Error fetching messages:', error.message);
    }
  }, [user, allProfiles]);

  // Subscribe to new messages
  useEffect(() => {
    if (!activeConversation) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          const senderProfile = allProfiles.find((p) => p.user_id === newMessage.sender_id);
          setMessages((prev) => [
            ...prev,
            { ...newMessage, sender_name: senderProfile?.name || 'Unknown' },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation, allProfiles]);

  // Subscribe to all new messages for notifications
  useEffect(() => {
    if (!user) return;

    const notificationChannel = supabase
      .channel('all-messages-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // Don't notify for own messages
          if (newMessage.sender_id === user.id) return;
          
          // Don't notify if viewing this conversation
          if (activeConversation?.id === newMessage.conversation_id) return;
          
          const senderProfile = allProfiles.find((p) => p.user_id === newMessage.sender_id);
          const senderName = senderProfile?.name || 'Seseorang';
          
          // Increment unread count
          setUnreadCount((prev) => prev + 1);
          
          // Show toast notification
          toast({
            title: `Pesan baru dari ${senderName}`,
            description: newMessage.content.length > 50 
              ? newMessage.content.substring(0, 50) + '...' 
              : newMessage.content,
          });
          
          // Refresh conversations to update last message
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationChannel);
    };
  }, [user, activeConversation, allProfiles, fetchConversations]);

  useEffect(() => {
    if (allProfiles.length > 0) {
      fetchConversations();
    }
  }, [fetchConversations, allProfiles]);

  const createDirectConversation = async (otherUserId: string) => {
    if (!user) return null;

    try {
      // Check if conversation already exists
      const { data: existingParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      const myConvIds = (existingParticipants || []).map((p) => p.conversation_id);

      for (const convId of myConvIds) {
        const { data: conv } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', convId)
          .eq('type', 'direct')
          .maybeSingle();

        if (conv) {
          const { data: otherParticipant } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', convId)
            .eq('user_id', otherUserId)
            .maybeSingle();

          if (otherParticipant) {
            // Conversation already exists
            await fetchConversations();
            const existingConv = conversations.find((c) => c.id === convId);
            return existingConv || null;
          }
        }
      }

      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({ type: 'direct' })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants
      await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: otherUserId },
      ]);

      await fetchConversations();
      return newConv;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const createDivisionConversation = async (division: 'sales' | 'presales' | 'all', name: string) => {
    if (!user) return null;

    try {
      // Check if division conversation already exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('type', 'division')
        .eq('division', division)
        .maybeSingle();

      if (existingConv) {
        await fetchConversations();
        return existingConv;
      }

      // Create new division conversation
      const { data: newConv, error } = await supabase
        .from('conversations')
        .insert({ type: 'division', division, name })
        .select()
        .single();

      if (error) throw error;

      await fetchConversations();
      return newConv;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }
  };

  const sendMessage = async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
      });

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const openConversation = async (conversation: ConversationWithDetails) => {
    setActiveConversation(conversation);
    setUnreadCount(0); // Reset unread when opening a conversation
    await fetchMessages(conversation.id);
  };

  const closeConversation = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  const clearUnread = () => {
    setUnreadCount(0);
  };

  return {
    conversations,
    messages,
    activeConversation,
    loading,
    unreadCount,
    createDirectConversation,
    createDivisionConversation,
    sendMessage,
    openConversation,
    closeConversation,
    clearUnread,
    refetch: fetchConversations,
  };
}
