'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/app/components/ui/loading-spinner';
import { usePermissions } from '@/app/hooks/usePermissions';
import { apiClient, getErrorMessage } from '@/app/services/api-client';
import { notificationService } from '@/app/services/notification-service';
import { formatCurrency, formatDate } from '@/lib/utils';
import { PencilIcon } from 'lucide-react';
import Link from 'next/link';

interface Negotiation {
  id: number;
  tuss_id: number;
  requested_value: string;
  approved_value: string | null;
  justification: string;
  approval_notes: string | null;
  rejection_reason: string | null;
  urgency_level: string;
  requested_by: number;
  approved_by: number | null;
  approved_at: string | null;
  is_requiring_addendum: boolean;
  addendum_included: boolean;
  addendum_number: string | null;
  addendum_date: string | null;
  addendum_notes: string | null;
  status: 'pending_approval' | 'approved' | 'rejected' | 'formalized' | 'cancelled';
  negotiable: {
    id: number;
    name: string;
  };
  tuss_procedure: {
    id: number;
    code: string;
    description: string;
    name: string;
  };
  created_by: {
    id: number;
    name: string;
  };
  created_at: string;
  solicitation?: {
    id: number;
    patient_name?: string;
  };
}

export default function DetalhesNegociacaoExtemporanea() {
  const params = useParams<{ id: string }>();
  const negotiationId = params?.id;
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [approvalValue, setApprovalValue] = useState<string>('');
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Verificação de permissões
  const canApprove = hasPermission('approve extemporaneous negotiations');
  const canAddendum = hasPermission('edit extemporaneous negotiations');

  // Buscar detalhes da negociação
  const fetchNegotiation = async () => {
    try {
      const response = await apiClient.get(`/extemporaneous-negotiations/${negotiationId}`);
      const negotiationData = response.data.data;
      
      setNegotiation(negotiationData);
      
      // Define o valor inicial de aprovação como o valor solicitado
      if (negotiationData?.requested_value) {
        setApprovalValue(negotiationData.requested_value.toString());
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (negotiationId) {
      fetchNegotiation();
    }
  }, [negotiationId]);

  // Manipular aprovação da negociação
  const handleApprove = async () => {
    if (!canApprove) {
      toast({
        title: 'Permissão Negada',
        description: 'Você não tem permissão para aprovar negociações',
        variant: 'destructive',
      });
      return;
    }

    if (!approvalValue || parseFloat(approvalValue) <= 0) {
      toast({
        title: 'Erro de Validação',
        description: 'Por favor, insira um valor válido para aprovação',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await apiClient.post(`/extemporaneous-negotiations/${negotiationId}/approve`, {
        approved_value: parseFloat(approvalValue),
        approval_notes: approvalNotes,
      });
      
      toast({
        title: 'Sucesso',
        description: 'Negociação aprovada com sucesso',
      });
      
      // Atualiza os dados da negociação
      setNegotiation(response.data.data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!negotiation) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold">Negociação não encontrada</h2>
        <p className="mt-2 text-muted-foreground">A negociação solicitada não existe ou você não tem permissão para visualizá-la.</p>
        <Button onClick={() => router.push('/negotiations/extemporaneous')} className="mt-4">
          Voltar para Lista
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Detalhes da Negociação Extemporânea</h1>
          <p className="text-muted-foreground">
            Revisar e processar negociações de procedimentos excepcionais
          </p>
        </div>
        
        <div className="flex gap-2">
          {negotiation.status === 'pending_approval' && hasPermission('edit extemporaneous negotiations') && (
            <Button variant="outline" onClick={() => router.push(`/negotiations/extemporaneous/${negotiation.id}/edit`)}>
              <PencilIcon className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push('/negotiations/extemporaneous')}>
            Voltar para Lista
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Informações da Negociação</CardTitle>
            <Badge 
              variant={
                negotiation.status === 'approved' ? 'default' : 
                negotiation.status === 'rejected' ? 'destructive' : 
                'secondary'
              }
            >
              {negotiation.status === 'pending_approval' ? 'PENDENTE' :
               negotiation.status === 'approved' ? 'APROVADA' :
               negotiation.status === 'rejected' ? 'REJEITADA' :
               negotiation.status === 'formalized' ? 'FORMALIZADA' :
               negotiation.status === 'cancelled' ? 'CANCELADA' :
               'DESCONHECIDO'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Procedimento TUSS</Label>
              <p className="text-sm font-medium">
                {negotiation.tuss_procedure?.code || 'N/A'} - {negotiation.tuss_procedure?.description || 'N/A'}
              </p>
            </div>
            
            <div>
              <Label>Valor Solicitado</Label>
              <p className="text-sm font-medium">
                {formatCurrency(parseFloat(negotiation.requested_value))}
              </p>
            </div>
            
            <div>
              <Label>Nível de Urgência</Label>
              <p className="text-sm font-medium capitalize">
                {negotiation.urgency_level === 'low' ? 'Baixa' :
                 negotiation.urgency_level === 'medium' ? 'Média' :
                 negotiation.urgency_level === 'high' ? 'Alta' :
                 negotiation.urgency_level || 'N/A'}
              </p>
            </div>
            
            <div>
              <Label>Solicitado Por</Label>
              <p className="text-sm font-medium">
                {negotiation.created_by?.name || 'N/A'}
              </p>
            </div>
            
            <div>
              <Label>Data da Solicitação</Label>
              <p className="text-sm font-medium">
                {negotiation.created_at ? formatDate(new Date(negotiation.created_at)) : 'N/A'}
              </p>
            </div>
          </div>
          
          <div>
            <Label>Justificativa</Label>
            <p className="text-sm mt-1 p-2 bg-muted rounded-md">
              {negotiation.justification || 'Nenhuma justificativa fornecida'}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {negotiation.status === 'pending_approval' && canApprove && (
        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="approvalValue">Valor de Aprovação</Label>
              <Input
                id="approvalValue"
                type="number"
                step="0.01"
                value={approvalValue}
                onChange={(e) => setApprovalValue(e.target.value)}
                placeholder="Digite o valor aprovado"
              />
            </div>
            
            <div>
              <Label htmlFor="approvalNotes">Observações (Opcional)</Label>
              <Textarea
                id="approvalNotes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Adicione notas ou condições"
                rows={3}
              />
            </div>
            
            <Button
              className="w-full"
              onClick={handleApprove}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Aprovando...' : 'Aprovar Negociação'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 