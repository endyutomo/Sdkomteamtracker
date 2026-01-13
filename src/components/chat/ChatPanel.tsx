import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Users, User, Building2, ChevronLeft, Filter, Volume2, VolumeX, Settings, Check, CheckCheck, Shield, Smile, Image, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useChat, ConversationWithDetails, Message } from '@/hooks/useChat';
import { useChatSettings } from '@/hooks/useChatSettings';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [superadminIds, setSuperadminIds] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { profile, allProfiles, isSuperadmin } = useProfile();
  const { settings: chatSettings, toggleSound } = useChatSettings();
  const {
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
    getConversationParticipantsCount,
    allProfiles: chatAllProfiles,
  } = useChat(chatSettings.soundEnabled);

  // Fetch superadmin IDs
  useEffect(() => {
    const fetchSuperadmins = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'superadmin');
      if (data) {
        setSuperadminIds(data.map((r) => r.user_id));
      }
    };
    fetchSuperadmins();
  }, []);

  // Check if user is superadmin
  const isUserSuperadmin = (userId: string) => superadminIds.includes(userId);

  // Get read status for a message
  const getReadStatus = (msg: Message) => {
    if (msg.sender_id !== user?.id) return null;

    const reads = msg.reads || [];
    const readersExcludingSender = reads.filter((r) => r.user_id !== msg.sender_id);

    if (!activeConversation) return { allRead: false, readCount: 0, readers: [], notReaders: [] };

    const participantsCount = getConversationParticipantsCount(activeConversation);
    const expectedReaders = participantsCount - 1; // Exclude sender

    const allRead = expectedReaders > 0 && readersExcludingSender.length >= expectedReaders;

    // Get who hasn't read
    let notReaders: string[] = [];
    if (activeConversation.type === 'direct') {
      const otherParticipant = activeConversation.participants.find((p) => p.user_id !== user?.id);
      if (otherParticipant && !readersExcludingSender.some((r) => r.user_id === otherParticipant.user_id)) {
        notReaders = [otherParticipant.name];
      }
    } else if (activeConversation.type === 'division') {
      const relevantProfiles = activeConversation.division === 'all'
        ? chatAllProfiles
        : chatAllProfiles.filter((p) => p.division === activeConversation.division || p.division === 'manager');

      notReaders = relevantProfiles
        .filter((p) => p.user_id !== user?.id && !readersExcludingSender.some((r) => r.user_id === p.user_id))
        .map((p) => p.name);
    }

    return {
      allRead,
      readCount: readersExcludingSender.length,
      readers: readersExcludingSender.map((r) => r.user_name || 'Unknown'),
      notReaders,
    };
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle emoji select
  const handleEmojiSelect = (emoji: any) => {
    setNewMessage((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File terlalu besar',
          description: 'Maksimal ukuran file adalah 5MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('chat-images')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Gagal upload gambar',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    const { data: publicUrl } = supabase.storage
      .from('chat-images')
      .getPublicUrl(data.path);

    return publicUrl.publicUrl;
  };

  // Cancel image preview
  const cancelImagePreview = () => {
    setPreviewImage(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || (!newMessage.trim() && !selectedImageFile)) return;

    setUploadingImage(true);

    try {
      let imageUrl: string | undefined;

      if (selectedImageFile) {
        imageUrl = (await uploadImage(selectedImageFile)) || undefined;
      }

      await sendMessage(activeConversation.id, newMessage, imageUrl);
      setNewMessage('');
      cancelImagePreview();
    } finally {
      setUploadingImage(false);
    }
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

  const handleStartDivisionChat = async (division: 'sales' | 'presales' | 'logistic' | 'backoffice' | 'all') => {
    const name = division === 'all' ? 'Semua Tim' :
      division === 'sales' ? 'Tim Sales' :
        division === 'presales' ? 'Tim Presales' :
          division === 'logistic' ? 'Tim Logistik' : 'Tim Backoffice';
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
    if (filterType === 'logistic') return conv.type === 'division' && conv.division === 'logistic';
    if (filterType === 'backoffice') return conv.type === 'division' && conv.division === 'backoffice';
    if (filterType === 'all-team') return conv.type === 'division' && conv.division === 'all';
    return true;
  });

  const handleOpenChat = () => {
    setIsOpen(true);
    clearUnread();
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <Button
          onClick={handleOpenChat}
          className="h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg relative transition-transform hover:scale-105 active:scale-95"
          size="icon"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-96 h-[100dvh] sm:h-[500px] bg-card border-t sm:border border-border sm:rounded-xl shadow-elevated z-50 flex flex-col overflow-hidden">
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
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Pengaturan">
                    <Settings className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Pengaturan Chat</h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {chatSettings.soundEnabled ? (
                          <Volume2 className="h-4 w-4 text-primary" />
                        ) : (
                          <VolumeX className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm">Suara Notifikasi</span>
                      </div>
                      <Switch
                        checked={chatSettings.soundEnabled}
                        onCheckedChange={toggleSound}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
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
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => handleStartDivisionChat('logistic')}
                >
                  <Building2 className="h-4 w-4" />
                  Tim Logistik
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => handleStartDivisionChat('backoffice')}
                >
                  <Building2 className="h-4 w-4" />
                  Tim Backoffice
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
                    {isUserSuperadmin(otherUser.user_id) && (
                      <Shield className="h-3 w-3 text-amber-500" />
                    )}
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {otherUser.division === 'manager' ? 'Manager' :
                        otherUser.division === 'sales' ? 'Sales' :
                          otherUser.division === 'presales' ? 'Presales' :
                            otherUser.division === 'backoffice' ? 'Backoffice' :
                              otherUser.division === 'logistic' ? 'Logistik' : otherUser.division}
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
              {messages.map((msg) => {
                const readStatus = getReadStatus(msg);
                const isSenderSuperadmin = isUserSuperadmin(msg.sender_id);
                const isOwnMessage = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}
                  >
                    {/* Always show sender name for all messages */}
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs text-muted-foreground font-medium">
                        {msg.sender_name || profile?.name || 'Anda'}
                      </span>
                      {isSenderSuperadmin && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Shield className="h-3 w-3 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <span className="text-xs">Superadmin</span>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm transition-all ${isOwnMessage
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted rounded-bl-md'
                        }`}
                    >
                      {msg.image_url && (
                        <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block mb-2">
                          <img
                            src={msg.image_url}
                            alt="Chat image"
                            className="max-w-full rounded-lg max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          />
                        </a>
                      )}
                      {msg.content && msg.content !== '📷 Gambar' && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(msg.created_at), 'HH:mm', { locale: id })}
                      </span>
                      {readStatus && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-pointer">
                              {readStatus.allRead ? (
                                <CheckCheck className="h-3 w-3 text-primary" />
                              ) : (
                                <Check className="h-3 w-3 text-muted-foreground" />
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[200px]">
                            <div className="text-xs space-y-1">
                              {readStatus.readers.length > 0 && (
                                <div>
                                  <span className="font-medium text-primary">Dibaca:</span>{' '}
                                  {readStatus.readers.join(', ')}
                                </div>
                              )}
                              {readStatus.notReaders.length > 0 && (
                                <div>
                                  <span className="font-medium text-muted-foreground">Belum dibaca:</span>{' '}
                                  {readStatus.notReaders.join(', ')}
                                </div>
                              )}
                              {readStatus.readers.length === 0 && readStatus.notReaders.length === 0 && (
                                <span>Belum ada yang membaca</span>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Image Preview */}
          {previewImage && (
            <div className="p-2 border-t border-border bg-muted/30">
              <div className="relative inline-block">
                <img src={previewImage} alt="Preview" className="h-20 rounded-lg object-cover" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={cancelImagePreview}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-border bg-background/50 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              {/* Emoji Picker */}
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                  >
                    <Smile className="h-5 w-5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-auto p-0 border-none shadow-xl">
                  <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme="auto"
                    locale="id"
                    previewPosition="none"
                    skinTonePosition="none"
                  />
                </PopoverContent>
              </Popover>

              {/* Image Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-9 w-9"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
              >
                <Image className="h-5 w-5 text-muted-foreground" />
              </Button>

              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Tulis pesan..."
                className="flex-1 rounded-full px-4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                disabled={uploadingImage}
              />
              <Button
                type="submit"
                size="icon"
                disabled={(!newMessage.trim() && !selectedImageFile) || uploadingImage}
                className="rounded-full shrink-0 transition-transform hover:scale-105 active:scale-95"
              >
                {uploadingImage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
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
                <SelectItem value="logistic">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Tim Logistik
                  </div>
                </SelectItem>
                <SelectItem value="backoffice">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Tim Backoffice
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
                          {conv.last_message.image_url ? '📷 Gambar' : conv.last_message.content}
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
