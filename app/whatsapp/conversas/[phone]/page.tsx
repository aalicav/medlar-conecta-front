'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Building, UserCheck, Phone } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import BidirectionalMessageService from '@/app/services/bidirectionalMessageService';
import ChatInterface from '@/app/components/ChatInterface';
import { toast } from 'sonner';

export default function ChatPage() {
  const params = useParams();
  const phone = params?.phone as string;
  const [contactInfo, setContactInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        setLoading(true);
        
        // Get conversation history to identify contact type
        const messages = await BidirectionalMessageService.getCompleteHistory(phone, 1);
        
        if (messages.length > 0) {
          const lastMessage = messages[0];
          const senderEntity = lastMessage.sender_entity;
          const recipientEntity = lastMessage.recipient_entity;
          
          setContactInfo({
            type: senderEntity?.type || recipientEntity?.type,
            name: senderEntity?.name || recipientEntity?.name,
            entity: senderEntity || recipientEntity,
          });
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
        toast.error('Erro ao carregar informações do contato');
      } finally {
        setLoading(false);
      }
    };

    if (phone) {
      fetchContactInfo();
    }
  }, [phone]);

  const getContactIcon = () => {
    switch (contactInfo?.type) {
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

  const getContactTypeText = () => {
    switch (contactInfo?.type) {
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

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando conversa...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/whatsapp/conversas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-full">
              {getContactIcon()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {contactInfo?.name || formatPhone(phone)}
              </h1>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">
                  {getContactTypeText()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {formatPhone(phone)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <Card>
        <CardContent className="p-0">
          <ChatInterface
            phone={phone}
            contactName={contactInfo?.name}
            contactType={contactInfo?.type}
          />
        </CardContent>
      </Card>
    </div>
  );
} 