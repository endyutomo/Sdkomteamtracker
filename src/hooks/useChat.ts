import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { toast } from '@/hooks/use-toast';
import { playChimeSound } from '@/utils/notificationSound';

export interface MessageRead {
  id: string;
  message_id: string;
  user_id: string;
  read_at: string;
  user_name?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url?: string | null;
  created_at: string;
  sender_name?: string;
  reads?: MessageRead[];
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

export function useChat(soundEnabled: boolean = true) {
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

  const fetchMessageReads = useCallback(async (messageIds: string[]) => {
    if (messageIds.length === 0) return {};

    const { data } = await supabase
      .from('message_reads')
      .select('*')
      .in('message_id', messageIds);

    const readsMap: Record<string, MessageRead[]> = {};
    (data || []).forEach((read) => {
      const userProfile = allProfiles.find((p) => p.user_id === read.user_id);
      const readWithName = { ...read, user_name: userProfile?.name || 'Unknown' };
      if (!readsMap[read.message_id]) {
        readsMap[read.message_id] = [];
      }
      readsMap[read.message_id].push(readWithName);
    });
    return readsMap;
  }, [allProfiles]);

  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messageIds = (data || []).map((m) => m.id);
      const readsMap = await fetchMessageReads(messageIds);

      const messagesWithNames = (data || []).map((msg) => {
        const senderProfile = allProfiles.find((p) => p.user_id === msg.sender_id);
        return {
          ...msg,
          sender_name: senderProfile?.name || 'Unknown',
          reads: readsMap[msg.id] || [],
        };
      });

      setMessages(messagesWithNames);

      // Mark all messages as read for current user
      const unreadMessages = (data || []).filter(
        (msg) => msg.sender_id !== user.id && !readsMap[msg.id]?.some((r) => r.user_id === user.id)
      );
      if (unreadMessages.length > 0) {
        await supabase.from('message_reads').insert(
          unreadMessages.map((msg) => ({ message_id: msg.id, user_id: user.id }))
        );
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error.message);
    }
  }, [user, allProfiles, fetchMessageReads]);

  // Subscribe to new messages and read receipts
  useEffect(() => {
    if (!activeConversation || !user) return;

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
        async (payload) => {
          const newMessage = payload.new as Message;
          const senderProfile = allProfiles.find((p) => p.user_id === newMessage.sender_id);
          setMessages((prev) => [
            ...prev,
            { ...newMessage, sender_name: senderProfile?.name || 'Unknown', reads: [] },
          ]);
          
          // Mark as read if not own message
          if (newMessage.sender_id !== user.id) {
            await supabase.from('message_reads').insert({
              message_id: newMessage.id,
              user_id: user.id,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message_reads',
        },
        (payload) => {
          const newRead = payload.new as MessageRead;
          const userProfile = allProfiles.find((p) => p.user_id === newRead.user_id);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === newRead.message_id
                ? {
                    ...msg,
                    reads: [...(msg.reads || []), { ...newRead, user_name: userProfile?.name || 'Unknown' }],
                  }
                : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation, allProfiles, user]);

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
          
          // Play notification sound if enabled
          if (soundEnabled) {
            playChimeSound();
          }
          
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
  }, [user, activeConversation, allProfiles, fetchConversations, soundEnabled]);

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

  const sendMessage = async (conversationId: string, content: string, imageUrl?: string) => {
    if (!user || (!content.trim() && !imageUrl)) return;

    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim() || (imageUrl ? '📷 Gambar' : ''),
        image_url: imageUrl || null,
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

  // Get total participants count for a conversation
  const getConversationParticipantsCount = useCallback((conversation: ConversationWithDetails) => {
    if (conversation.type === 'division') {
      // For division conversations, count all profiles in that division
      if (conversation.division === 'all') {
        return allProfiles.length;
      }
      return allProfiles.filter((p) => p.division === conversation.division || p.division === 'manager').length;
    }
    return conversation.participants.length;
  }, [allProfiles]);

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
    getConversationParticipantsCount,
    allProfiles,
  };
}
