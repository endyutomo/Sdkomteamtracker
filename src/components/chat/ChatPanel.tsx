import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Users, User, Building2, ChevronLeft, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChat, ConversationWithDetails, Message } from '@/hooks/useChat';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { profile, allProfiles } = useProfile();
  const {
    conversations,
    messages,
    activeConversation,
    loading,
    createDirectConversation,
    createDivisionConversation,
    sendMessage,
    openConversation,
    closeConversation,
  } = useChat();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || !newMessage.trim()) return;
    await sendMessage(activeConversation.id, newMessage);
    setNewMessage('');
  };

  const handleStartDirectChat = async (userId: string) => {
    const conv = await createDirectConversation(userId);
    if (conv) {
      const fullConv = conversations.find((c) => c.id === conv.id);
      if (fullConv) {
        await openConversation(fullConv);
      }
    }
    setShowNewChat(false);
  };

  const handleStartDivisionChat = async (division: 'sales' | 'presales' | 'all') => {
    const name = division === 'all' ? 'Semua Tim' : division === 'sales' ? 'Tim Sales' : 'Tim Presales';
    const conv = await createDivisionConversation(division, name);
    if (conv) {
      const fullConv = conversations.find((c) => c.id === conv.id);
      if (fullConv) {
        await openConversation(fullConv);
      }
    }
    setShowNewChat(false);
  };

  const getConversationName = (conv: ConversationWithDetails) => {
    if (conv.type === 'division') {
      return conv.name || 'Group';
    }
    const otherParticipant = conv.participants.find((p) => p.user_id !== user?.id);
    return otherParticipant?.name || 'Chat';
  };

  const getConversationIcon = (conv: ConversationWithDetails) => {
    if (conv.type === 'division') {
      return <Building2 className="h-4 w-4" />;
    }
    return <User className="h-4 w-4" />;
  };

  const otherUsers = allProfiles.filter((p) => p.user_id !== user?.id);

  // Filter conversations based on selected filter
  const filteredConversations = conversations.filter((conv) => {
    if (filterType === 'all') return true;
    if (filterType === 'direct') return conv.type === 'direct';
    if (filterType === 'division') return conv.type === 'division';
    if (filterType === 'sales') return conv.type === 'division' && conv.division === 'sales';
    if (filterType === 'presales') return conv.type === 'division' && conv.division === 'presales';
    if (filterType === 'all-team') return conv.type === 'division' && conv.division === 'all';
    return true;
  });

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-card border border-border rounded-xl shadow-elevated z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        {activeConversation ? (
          <>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeConversation}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold">{getConversationName(activeConversation)}</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <span className="font-semibold">Chat</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowNewChat(!showNewChat)}>
                <Users className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      {showNewChat && !activeConversation ? (
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Division Chats */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Chat Divisi</h3>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => handleStartDivisionChat('all')}
                >
                  <Building2 className="h-4 w-4" />
                  Semua Tim
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => handleStartDivisionChat('sales')}
                >
                  <Building2 className="h-4 w-4" />
                  Tim Sales
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => handleStartDivisionChat('presales')}
                >
                  <Building2 className="h-4 w-4" />
                  Tim Presales
                </Button>
              </div>
            </div>

            {/* Direct Chats */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">Chat Langsung</h3>
              <div className="space-y-1">
                {otherUsers.map((otherUser) => (
                  <Button
                    key={otherUser.id}
                    variant="ghost"
                    className="w-full justify-start gap-2"
                    onClick={() => handleStartDirectChat(otherUser.user_id)}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {otherUser.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{otherUser.name}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {otherUser.division === 'manager' ? 'Manager' : otherUser.division === 'sales' ? 'Sales' : 'Presales'}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      ) : activeConversation ? (
        <>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}
                >
                  {msg.sender_id !== user?.id && (
                    <span className="text-xs text-muted-foreground mb-1">{msg.sender_name}</span>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 ${
                      msg.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {format(new Date(msg.created_at), 'HH:mm', { locale: id })}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Tulis pesan..."
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Filter */}
          <div className="p-3 border-b border-border">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter percakapan" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Percakapan</SelectItem>
                <SelectItem value="direct">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Chat Langsung
                  </div>
                </SelectItem>
                <SelectItem value="division">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Semua Grup Divisi
                  </div>
                </SelectItem>
                <SelectItem value="sales">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Tim Sales
                  </div>
                </SelectItem>
                <SelectItem value="presales">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Tim Presales
                  </div>
                </SelectItem>
                <SelectItem value="all-team">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Semua Tim
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <ScrollArea className="flex-1 p-4">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Memuat...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{filterType === 'all' ? 'Belum ada percakapan' : 'Tidak ada percakapan yang cocok'}</p>
                <Button
                  variant="link"
                  onClick={() => setShowNewChat(true)}
                  className="mt-2"
                >
                  Mulai chat baru
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <Button
                    key={conv.id}
                    variant="ghost"
                    className="w-full justify-start gap-3 h-auto py-3"
                    onClick={() => openConversation(conv)}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {getConversationIcon(conv)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{getConversationName(conv)}</p>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {conv.type === 'direct' ? 'Direct' : 'Grup'}
                        </Badge>
                      </div>
                      {conv.last_message && (
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.last_message.content}
                        </p>
                      )}
                    </div>
                    {conv.last_message && (
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(conv.last_message.created_at), 'HH:mm')}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
