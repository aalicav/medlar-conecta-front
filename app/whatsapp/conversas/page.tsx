'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  User, 
  Building, 
  Stethoscope,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import BidirectionalMessageService, { Conversation } from '@/app/services/bidirectionalMessageService';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ConversasPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await BidirectionalMessageService.getConversations(50);
      setConversations(data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar conversas');
      console.error(err);
    } finally {
      setLoading(false);
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
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'read':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Entregue';
      case 'read':
        return 'Lido';
      case 'failed':
        return 'Falha';
      case 'pending':
        return 'Pendente';
      case 'sent':
        return 'Enviado';
      default:
        return 'Desconhecido';
    }
  };

  const getDirectionText = (direction: string) => {
    return direction === 'inbound' ? 'Recebida' : 'Enviada';
  };

  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchTerm.toLowerCase();
    const phone = conv.conversation_partner || '';
    const content = conv.content || '';
    const entityName = getEntityName(conv.sender_entity || conv.recipient_entity);
    
    return phone.toLowerCase().includes(searchLower) ||
           content.toLowerCase().includes(searchLower) ||
           entityName.toLowerCase().includes(searchLower);
  });

  const formatPhone = (phone: string) => {
    // Remove all non-digits
    const cleaned = phone.replace(/\D/g, '');
    
    // Format Brazilian phone number
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Conversas WhatsApp</h1>
          <p className="text-gray-500">Gerencie conversas bidirecionais do WhatsApp</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={fetchConversations} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button asChild>
            <Link href="/whatsapp/nova-mensagem">Nova Mensagem</Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 flex items-center">
          <AlertCircle className="mr-2" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por telefone, conteúdo ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-md animate-pulse"></div>
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conversa encontrada</h3>
            <p className="text-gray-500 text-center">
              {searchTerm ? 'Nenhuma conversa corresponde à sua busca.' : 'Ainda não há conversas no sistema.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conversation) => (
            <Card key={conversation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getEntityIcon(conversation.sender_entity || conversation.recipient_entity)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-sm truncate">
                          {getEntityName(conversation.sender_entity || conversation.recipient_entity)}
                        </h3>
                        <Badge variant={conversation.direction === 'inbound' ? 'secondary' : 'default'}>
                          {getDirectionText(conversation.direction)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-1">
                        <Phone className="h-3 w-3" />
                        <span>{formatPhone(conversation.conversation_partner)}</span>
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.content || 'Sem conteúdo'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(conversation.status)}
                      <span className="text-xs text-gray-500">
                        {getStatusText(conversation.status)}
                      </span>
                    </div>
                    
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(conversation.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/whatsapp/conversas/${conversation.conversation_partner}`}>
                      Ver Conversa
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 