'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
  Avatar,
  ConversationHeader,
  MessageSeparator,
} from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import { Send, Phone, User, Building, UserCheck } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BidirectionalMessageService, { TwilioMessage } from '@/app/services/bidirectionalMessageService';
import { toast } from 'sonner';
import ChatNotifications from './ChatNotifications';

interface ChatInterfaceProps {
  phone: string;
  contactName?: string;
  contactType?: 'Patient' | 'Professional' | 'Clinic';
}

interface ChatMessage {
  id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: string;
  timestamp: Date;
  sender: string;
  position: 'first' | 'normal' | 'single' | 'last';
}

export default function ChatInterface({ phone, contactName, contactType }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [pagination, setPagination] = useState<{
    has_more: boolean;
    next_page_token: string | null;
    total_count: number;
    limit: number;
  } | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getContactIcon = () => {
    switch (contactType) {
      case 'Patient':
        return <User className="h-6 w-6" />;
      case 'Professional':
        return <UserCheck className="h-6 w-6" />;
      case 'Clinic':
        return <Building className="h-6 w-6" />;
      default:
        return <Phone className="h-6 w-6" />;
    }
  };

  const getContactName = () => {
    if (contactName) return contactName;
    
    switch (contactType) {
      case 'Patient':
        return `Paciente: ${phone}`;
      case 'Professional':
        return `Profissional: ${phone}`;
      case 'Clinic':
        return `Clínica: ${phone}`;
      default:
        return `Contato: ${phone}`;
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

  // Função para corrigir o fuso horário
  const parseDateWithTimezone = (dateString: string | undefined): Date => {
    try {
      // Verificar se dateString existe
      if (!dateString) {
        console.warn('Date string is undefined or null, using current date');
        return new Date();
      }

      // Parse a data ISO e ajusta para o fuso horário local
      const date = parseISO(dateString);
      // Ajusta para o fuso horário do Brasil (UTC-3)
      const brazilTime = new Date(date.getTime() - (3 * 60 * 60 * 1000));
      return brazilTime;
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return new Date();
    }
  };

  const fetchMessages = async () => {
    if (isFetching) {
      console.log('Already fetching messages, skipping...');
      return;
    }

    try {
      setIsFetching(true);
      setLoading(true);
      console.log('Fetching messages for phone:', phone);
      
      const result = await BidirectionalMessageService.getConversationHistory(phone, 50);
      console.log('Received data from API:', result);
      console.log('Data type:', typeof result);
      console.log('Messages array:', result.messages);
      console.log('Messages length:', result.messages?.length || 0);
      console.log('Pagination info:', result.pagination);
      
      if (!result.messages || result.messages.length === 0) {
        console.log('No messages received from API');
        setMessages([]);
        setPagination(result.pagination);
        return;
      }
      
      // Ordena as mensagens por data de criação (mais antigas primeiro)
      const sortedData = result.messages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      console.log('Sorted data:', sortedData);
      
      const chatMessages: ChatMessage[] = sortedData.map((msg: TwilioMessage) => ({
        id: msg.id,
        content: msg.content || '',
        direction: msg.direction,
        status: msg.status,
        timestamp: parseDateWithTimezone(msg.timestamp),
        sender: msg.direction === 'inbound' ? 'user' : 'me',
        position: 'single' as const,
      }));
      
      console.log('Chat messages processed:', chatMessages);
      console.log('Setting messages state with:', chatMessages.length, 'messages');
      setMessages(chatMessages);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const handleNewMessage = (newMessage: any) => {
    // Verificar se a mensagem tem a estrutura correta
    if (!newMessage || !newMessage.id) {
      console.warn('Invalid message structure:', newMessage);
      return;
    }

    // Add new message to the chat
    const chatMessage: ChatMessage = {
      id: newMessage.id,
      content: newMessage.content || '',
      direction: newMessage.direction || 'inbound',
      status: newMessage.status || 'sent',
      timestamp: parseDateWithTimezone(newMessage.timestamp),
      sender: (newMessage.direction || 'inbound') === 'inbound' ? 'user' : 'me',
      position: 'single',
    };
    
    setMessages(prev => [...prev, chatMessage]);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || sending) return;

    try {
      setSending(true);
      
      // Add message to UI immediately
      const newMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        content: inputValue,
        direction: 'outbound',
        status: 'pending',
        timestamp: new Date(),
        sender: 'me',
        position: 'single',
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputValue('');

      // Send message via API
      const response = await BidirectionalMessageService.sendMessage(phone, inputValue);
      
      // Update message with real data
      setMessages(prev => prev.map(msg => 
        msg.id === newMessage.id 
          ? { ...msg, id: response.message_sid, status: 'sent' }
          : msg
      ));

      toast.success('Mensagem enviada');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
      
      // Remove failed message
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${Date.now()}`));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMore || !pagination?.has_more || !pagination?.next_page_token) {
      return;
    }

    try {
      setLoadingMore(true);
      console.log('Loading more messages with token:', pagination.next_page_token);
      
      const result = await BidirectionalMessageService.getConversationHistory(phone, 50, pagination.next_page_token);
      console.log('Loaded more messages:', result);
      
      // Ordena as mensagens por data de criação (mais antigas primeiro)
      const sortedData = result.messages.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      
      const chatMessages: ChatMessage[] = sortedData.map((msg: TwilioMessage) => ({
        id: msg.id,
        content: msg.content || '',
        direction: msg.direction,
        status: msg.status,
        timestamp: parseDateWithTimezone(msg.timestamp),
        sender: msg.direction === 'inbound' ? 'user' : 'me',
        position: 'single' as const,
      }));
      
      // Adiciona as novas mensagens no início (mensagens mais antigas)
      setMessages(prev => [...chatMessages, ...prev]);
      setPagination(result.pagination);
      
      console.log('Added', chatMessages.length, 'more messages');
    } catch (error) {
      console.error('Error loading more messages:', error);
      toast.error('Erro ao carregar mais mensagens');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [phone]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando conversa...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Real-time notifications */}
      <ChatNotifications phone={phone} onNewMessage={handleNewMessage} />
      
      <div className="h-[600px] border rounded-lg overflow-hidden">
        <MainContainer responsive>
          <ChatContainer>
            <ConversationHeader>
              <ConversationHeader.Content>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    {getContactIcon()}
                  </div>
                  <div>
                    <h3 className="font-semibold">{getContactName()}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatPhone(phone)}
                    </p>
                  </div>
                </div>
              </ConversationHeader.Content>
            </ConversationHeader>
            
            <MessageList
              typingIndicator={<TypingIndicator content="Digitando..." />}
              className="bg-gray-50"
            >
              {pagination?.has_more && (
                <div className="p-4 text-center">
                  <button
                    onClick={loadMoreMessages}
                    disabled={loadingMore}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loadingMore ? 'Carregando...' : 'Carregar mais mensagens'}
                  </button>
                </div>
              )}
              
              {messages.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  Nenhuma mensagem encontrada
                </div>
              ) : (
                messages.map((message, index) => (
                  <Message
                    key={message.id}
                    model={{
                      message: message.content,
                      sentTime: format(message.timestamp, 'HH:mm', { locale: ptBR }),
                      sender: message.sender,
                      direction: message.direction === 'inbound' ? 'incoming' : 'outgoing',
                      position: 'single',
                    }}
                  >
                    <Message.Header 
                      sender={message.sender === 'me' ? 'Operador' : getContactName()}
                      sentTime={format(message.timestamp, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    />
                    <Message.CustomContent>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{message.content}</span>
                        {message.status === 'sent' && (
                          <span className="text-xs text-green-500">✓</span>
                        )}
                        {message.status === 'delivered' && (
                          <span className="text-xs text-blue-500">✓✓</span>
                        )}
                        {message.status === 'read' && (
                          <span className="text-xs text-blue-600">✓✓</span>
                        )}
                      </div>
                    </Message.CustomContent>
                  </Message>
                ))
              )}
              <div ref={messagesEndRef} />
            </MessageList>
            
            <MessageInput
              placeholder="Digite sua mensagem..."
              value={inputValue}
              onChange={(val) => setInputValue(val)}
              onSend={sendMessage}
              onKeyPress={handleKeyPress}
              sendButton={true}
              attachButton={false}
              disabled={sending}
              className="border-t"
            />
          </ChatContainer>
        </MainContainer>
      </div>
    </>
  );
} 