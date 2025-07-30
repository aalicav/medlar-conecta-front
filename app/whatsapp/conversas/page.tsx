'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  MessageSquare, 
  User, 
  Building, 
  UserCheck, 
  Phone,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import Link from 'next/link';
import BidirectionalMessageService, { TwilioConversation } from '@/app/services/bidirectionalMessageService';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<TwilioConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await BidirectionalMessageService.getConversations(50);
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await BidirectionalMessageService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();
  }, []);

  useEffect(() => {
    // Set up real-time updates
    const unsubscribe = BidirectionalMessageService.listenForNewMessages((newConversation) => {
      // Update conversations list
      setConversations(prev => {
        const existingIndex = prev.findIndex(conv => conv.phone === newConversation.phone);
        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[existingIndex] = newConversation;
          return updated;
        } else {
          // Add new conversation
          return [newConversation, ...prev];
        }
      });

      // Show notification
      toast.success(`Nova mensagem de ${newConversation.phone}`, {
        description: newConversation.latest_message?.content,
        duration: 5000,
      });

      // Update unread count
      fetchUnreadCount();
    });

    return unsubscribe;
  }, []);

  const getContactIcon = (type?: string) => {
    switch (type) {
      case 'Patient':
        return <User className="h-4 w-4" />;
      case 'Professional':
        return <UserCheck className="h-4 w-4" />;
      case 'Clinic':
        return <Building className="h-4 w-4" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const getContactTypeText = (type?: string) => {
    switch (type) {
      case 'Patient':
        return 'Paciente';
      case 'Professional':
        return 'Profissional';
      case 'Clinic':
        return 'Clínica';
      default:
        return 'Contato';
    }
  };

  const formatPhone = (phone: string) => {
    const cleanPhone = phone.replace('whatsapp:', '');
    
    if (cleanPhone.startsWith('55')) {
      const number = cleanPhone.substring(2);
      if (number.length === 10) {
        return `(${number.substring(0, 2)}) ${number.substring(2, 6)}-${number.substring(6)}`;
      } else if (number.length === 11) {
        return `(${number.substring(0, 2)}) ${number.substring(2, 7)}-${number.substring(7)}`;
      }
    }
    
    return cleanPhone;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return format(date, 'HH:mm', { locale: ptBR });
      } else if (diffInHours < 48) {
        return 'Ontem';
      } else {
        return format(date, 'dd/MM', { locale: ptBR });
      }
    } catch (error) {
      return 'Agora';
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Check className="h-3 w-3 text-green-500" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const filteredConversations = conversations.filter(conversation => {
    const searchLower = searchTerm.toLowerCase();
    const phone = formatPhone(conversation.phone).toLowerCase();
    const name = conversation.contact_info?.name?.toLowerCase() || '';
    const content = conversation.latest_message?.content?.toLowerCase() || '';
    
    return phone.includes(searchLower) || 
           name.includes(searchLower) || 
           content.includes(searchLower);
  });

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando conversas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Conversas WhatsApp</h1>
          <p className="text-muted-foreground">
            {conversations.length} conversa{conversations.length !== 1 ? 's' : ''}
            {unreadCount > 0 && (
              <span className="ml-2 text-primary">
                • {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar por nome, telefone ou mensagem..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Conversations List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {filteredConversations.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                  </p>
                </div>
              </div>
            ) : (
              filteredConversations.map((conversation, index) => (
                <div key={conversation.conversation_sid}>
                  <Link href={`/whatsapp/conversas/${conversation.phone}`}>
                    <div className="flex items-center space-x-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary/10">
                          {getContactIcon(conversation.contact_info?.type)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold truncate">
                              {conversation.contact_info?.name || formatPhone(conversation.phone)}
                            </h3>
                            {conversation.contact_info?.type && (
                              <Badge variant="secondary" className="text-xs">
                                {getContactTypeText(conversation.contact_info.type)}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(conversation.latest_message?.timestamp || conversation.created_at)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-sm text-muted-foreground truncate flex-1">
                            {conversation.latest_message?.content || 'Nenhuma mensagem'}
                          </p>
                          <div className="flex items-center space-x-1 ml-2">
                            {conversation.latest_message?.status && 
                              getMessageStatusIcon(conversation.latest_message.status)
                            }
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatPhone(conversation.phone)}
                        </p>
                      </div>
                    </div>
                  </Link>
                  
                  {index < filteredConversations.length - 1 && (
                    <Separator />
                  )}
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
} 