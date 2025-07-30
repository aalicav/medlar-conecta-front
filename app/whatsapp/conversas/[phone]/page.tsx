'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Phone, 
  User, 
  Building, 
  Stethoscope,
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import BidirectionalMessageService, { BidirectionalMessage } from '@/app/services/bidirectionalMessageService';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatPageProps {
  params: {
    phone: string;
  };
}

export default function ChatPage({ params }: ChatPageProps) {
  const [messages, setMessages] = useState<BidirectionalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const phone = decodeURIComponent(params.phone);

  useEffect(() => {
    fetchMessages();
  }, [phone]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const data = await BidirectionalMessageService.getConversationHistory(phone, 100);
      setMessages(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar mensagens');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const sentMessage = await BidirectionalMessageService.sendMessage(phone, newMessage.trim());
      
      // Add the new message to the list
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
    } catch (err) {
      setError('Erro ao enviar mensagem');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getEntityIcon = (entity: any) => {
    if (!entity) return <User className="h-4 w-4" />;
    
    switch (entity.type) {
      case 'Patient':
        return <User className="h-4 w-4" />;
      case 'Professional':
        return <Stethoscope className="h-4 w-4" />;
      case 'Clinic':
        return <Building className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getEntityName = (entity: any) => {
    if (!entity) return 'Contato';
    
    switch (entity.type) {
      case 'Patient':
        return entity.name || 'Paciente';
      case 'Professional':
        return entity.name || 'Profissional';
      case 'Clinic':
        return entity.name || 'Clínica';
      default:
        return 'Contato';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'read':
        return <CheckCircle className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  };

  const getDirectionText = (direction: string) => {
    return direction === 'inbound' ? 'Recebida' : 'Enviada';
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button asChild variant="ghost" className="mr-4">
          <Link href="/whatsapp/conversas">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Conversa com {formatPhone(phone)}</h1>
          <p className="text-gray-500">Histórico de mensagens</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 flex items-center">
          <AlertCircle className="mr-2" />
          {error}
        </div>
      )}

      <Card className="h-[600px] flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Phone className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{formatPhone(phone)}</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{messages.length} mensagens</span>
                <span>•</span>
                <span>Última atividade: {messages.length > 0 ? formatDistanceToNow(new Date(messages[messages.length - 1].created_at), { addSuffix: true, locale: ptBR }) : 'Nunca'}</span>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Carregando mensagens...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Nenhuma mensagem encontrada</p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.direction === 'outbound'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(message.status)}
                            <span className="text-xs opacity-70">
                              {getDirectionText(message.direction)}
                            </span>
                          </div>
                          <span className="text-xs opacity-70">
                            {formatDistanceToNow(new Date(message.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <Separator />

          {/* Message Input */}
          <div className="p-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={sending}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sending}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {sending && (
              <p className="text-xs text-gray-500 mt-2">Enviando mensagem...</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 