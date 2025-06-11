"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Edit, 
  ArrowLeft, 
  DollarSign,
  User,
  Calendar,
  Clock,
  Clipboard,
  Loader2,
  TrendingUp,
  TrendingDown,
  BarChart4,
  Info,
  BarChart,
  MoreHorizontal,
  ArrowLeftRight
} from 'lucide-react';

import { useAuth } from '@/contexts/auth-context';

import { 
  negotiationService, 
  negotiationStatusLabels,
  negotiationStatusColors,
  negotiationItemStatusLabels,
  type ApprovalLevel,
  type ApprovalAction,
  type Negotiation,
  type NegotiationItem,
  type NegotiationStatus,
  type NegotiationItemStatus,
  type ApprovalHistoryItem
} from '../../../services/negotiationService';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ApprovalHistory } from '@/app/components/ApprovalHistory';
import { NegotiationAnnouncement } from '@/app/components/NegotiationAnnouncement';
import { RollbackStatusDialog } from '@/app/components/RollbackStatusDialog';
import { NegotiationCycleDialog } from '@/app/components/NegotiationCycleDialog';
import { NegotiationForkDialog } from '@/app/components/NegotiationForkDialog';
import { ForkedNegotiationsList } from '@/app/components/ForkedNegotiationsList';
import { Toaster } from '@/components/ui/toaster';
import { getErrorMessage } from '../../services/types';
import { NegotiationItemActions } from '../components/NegotiationItemActions';


// Helper function to map status to color variants
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'draft': return 'outline';
    case 'submitted': return 'secondary';
    case 'pending': return 'secondary';
    case 'complete': return 'default';
    case 'partially_complete': return 'warning';
    case 'approved': return 'default';
    case 'partially_approved': return 'secondary';
    case 'rejected': return 'destructive';
    case 'cancelled': return 'outline';
    default: return 'outline';
  }
};

const getItemStatusVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'outline';
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    case 'counter_offered': return 'secondary';
    default: return 'outline';
  }
};

// Helper function to format currency for Brazilian format
const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Format with Brazilian style (comma as decimal separator)
  return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
};

/**
 * Obter descrição do fluxo de status para ajudar na compreensão do usuário
 */
const getStatusDescription = (status: NegotiationStatus): string => {
  switch (status) {
    case 'draft':
      return 'Negociação em elaboração, ainda não enviada.';
    case 'submitted':
      return 'Aguardando avaliação da entidade.';
    case 'pending':
      return 'Em processo de aprovação interna.';
    case 'approved':
      return 'Aprovada internamente, aguardando confirmação da entidade.';
    case 'complete':
      return 'Negociação aprovada e finalizada.';
    case 'partially_complete':
      return 'Alguns itens foram aprovados e outros rejeitados.';
    case 'rejected':
      return 'Negociação foi rejeitada.';
    case 'cancelled':
      return 'Negociação foi cancelada.';
    default:
      return '';
  }
};

// Update the status helper to use the existing labels and colors
const getStatusInfo = (status: string) => {
  const statusMap: Record<string, {
    label: string;
    description: string;
    color: string;
  }> = {
    draft: {
      label: 'Rascunho',
      description: 'Negociação em elaboração, ainda não enviada.',
      color: 'default'
    },
    submitted: {
      label: 'Enviada',
      description: 'Aguardando avaliação da entidade.',
      color: 'blue'
    },
    pending: {
      label: 'Em Aprovação',
      description: 'Em processo de aprovação interna.',
      color: 'yellow'
    },
    approved: {
      label: 'Aprovada Internamente',
      description: 'Aprovada internamente, aguardando confirmação da entidade.',
      color: 'green'
    },
    complete: {
      label: 'Concluída',
      description: 'Negociação aprovada e finalizada.',
      color: 'green'
    },
    partially_complete: {
      label: 'Parcialmente Concluída',
      description: 'Alguns itens foram aprovados e outros rejeitados.',
      color: 'orange'
    },
    rejected: {
      label: 'Rejeitada',
      description: 'Negociação foi rejeitada.',
      color: 'red'
    },
    cancelled: {
      label: 'Cancelada',
      description: 'Negociação foi cancelada.',
      color: 'gray'
    }
  };

  return statusMap[status] || { label: status, description: '', color: 'default' };
};

// Update the response form type
type ResponseForm = {
  status: NegotiationItemStatus;
  approved_value: number;
  counter_value: number;
  notes: string;
};

export default function NegotiationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission, user } = useAuth();
  // NOTA: Em versões futuras do Next.js, será necessário usar React.use(params) 
  // em vez do acesso direto a params.id
  const negotiationId = parseInt(params.id);
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [respondLoading, setRespondLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NegotiationItem | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [counterOfferMode, setCounterOfferMode] = useState(false);
  const [responseForm, setResponseForm] = useState<ResponseForm>({
    status: 'approved',
    approved_value: 0,
    counter_value: 0,
    notes: ''
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'submit_for_approval' | 'cancel';
    title: string;
    description: string;
  }>({
    open: false,
    action: 'submit_for_approval',
    title: '',
    description: ''
  });

  const getApprovalLevelLabel = (level: ApprovalLevel): string => {
    return 'Aprovação';
  };

  // Function to check if negotiation has no pending items
  const hasNoPendingItems = (negotiation: Negotiation): boolean => {
    return negotiation.items.every(item => item.status !== 'pending');
  };

  const fetchNegotiation = async () => {
    try {
      const response = await negotiationService.getById(Number(params.id));
      const apiData = response.data;

      const negotiation: Negotiation = {
        id: apiData.id,
        title: apiData.title,
        description: apiData.description,
        status: apiData.status,
        status_label: apiData.status_label,
        start_date: apiData.start_date,
        end_date: apiData.end_date,
        total_value: apiData.total_value,
        notes: apiData.notes,
        created_at: apiData.created_at,
        updated_at: apiData.updated_at,
        negotiation_cycle: apiData.negotiation_cycle,
        max_cycles_allowed: apiData.max_cycles_allowed,
        is_fork: apiData.is_fork,
        forked_at: apiData.forked_at,
        fork_count: apiData.fork_count,
        parent_negotiation_id: apiData.parent_negotiation_id,
        negotiable_type: apiData.negotiable_type,
        negotiable_id: apiData.negotiable_id,
        negotiable: apiData.negotiable,
        creator: apiData.creator,
        items: apiData.items,
        approved_at: apiData.approved_at,
        approval_notes: apiData.approval_notes,
        rejected_at: apiData.rejected_at,
        rejection_notes: apiData.rejection_notes,
        can_approve: apiData.can_approve,
        can_submit_for_approval: apiData.can_submit_for_approval,
        can_edit: apiData.can_edit,
        approval_history: apiData.approval_history,
        forked_negotiations: apiData.forked_negotiations,
        formalization_status: apiData.formalization_status
      };

      setNegotiation(negotiation);
    } catch (error) {
      console.error('Error fetching negotiation:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar a negociação",
        variant: "destructive"
      });
    }finally{
      setLoading(false);
    }
  };

  useEffect(() => {
    if (negotiationId) {
    fetchNegotiation();
    }
  }, [negotiationId]);
  
  // Update confirmAction function to handle the new submit_for_approval action
  const confirmAction = (action: 'submit_for_approval' | 'cancel') => {
    const titulos = {
      submit_for_approval: 'Enviar para Aprovação Interna',
      cancel: 'Cancelar Negociação'
    };
    
    const descricoes = {
      submit_for_approval: 'Tem certeza que deseja enviar esta negociação para aprovação interna?',
      cancel: 'Tem certeza que deseja cancelar esta negociação?'
    };
    
    setConfirmDialog({
      open: true,
      action,
      title: titulos[action],
      description: descricoes[action]
    });
  };

  // Update handleActionConfirm to handle the new submit_for_approval action
  const handleActionConfirm = async () => {
    if (!confirmDialog.action || !negotiation) return;
    
    try {
      if (confirmDialog.action === 'submit_for_approval') {
        // Submit for internal approval
        await negotiationService.submitForApproval(negotiation.id);
        toast({
          title: "Sucesso",
          description: "Negociação enviada para aprovação interna",
        });
      } else if (confirmDialog.action === 'cancel') {
        await negotiationService.cancelNegotiation(negotiation.id);
        toast({
          title: "Sucesso",
          description: "Negociação cancelada com sucesso",
        });
      }
      
      fetchNegotiation();
    } catch (error) {
      console.error(`Erro ao ${
        confirmDialog.action === 'submit_for_approval' ? 'enviar para aprovação interna' : 
        'cancelar'
      } negociação:`, error);
      
      toast({
        title: "Erro",
        description: `Falha ao ${
          confirmDialog.action === 'submit_for_approval' ? 'enviar para aprovação interna' : 
          'cancelar'
        } a negociação`,
        variant: "destructive"
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  /**
   * Processa a aprovação ou rejeição interna da negociação.
   * Quando aprovada, notifica a entidade (plano/profissional/clínica) para dar o veredito final,
   * podendo aprovar todos os itens (complete) ou apenas parte deles (partially_complete).
   */
  const handleApproval = async (action: ApprovalAction) => {
    if (!negotiation) return;
    
    try {
      const response = await negotiationService.processApproval(negotiation.id, {
        approved: action === 'approve',
        approval_notes: action === 'approve' ? 'Aprovado internamente' : 'Rejeitado internamente'
      });

      if (!response.success) {
        toast({
          title: "Erro",
          description: response.message || "Falha ao processar a aprovação",
          variant: "destructive"
        });
        return;
      }

      if (response.data) {
        // First cast the response data to ServiceNegotiation to ensure proper typing
        const apiData = response.data as unknown as Negotiation;
        
        // Map the API response to match our local types
        const mappedItems: NegotiationItem[] = apiData.items.map(item => ({
          id: item.id || 0,
          negotiation_id: item.negotiation_id,
          tuss: item.tuss,
          proposed_value: item.proposed_value,
          approved_value: item.approved_value,
          status: item.status,
          notes: item.notes,
          responded_at: item.responded_at,
          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || new Date().toISOString(),
          created_by: {
            id: item.created_by?.id || 0,
            name: item.created_by?.name || ''
          },
          updated_by: item.updated_by,
          can_respond: item.can_respond,
          is_approved: item.status === 'approved',
          is_rejected: item.status === 'rejected',
          has_counter_offer: item.status === 'counter_offered'
        }));

        setNegotiation({
          ...apiData,
          items: mappedItems,
          status_label: negotiationStatusLabels[apiData.status]
        });

        toast({
          title: "Sucesso",
          description: `Negociação ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso`,
        });
        
        if (action === 'approve') {
          toast({
            title: "Entidade será notificada",
            description: "Uma notificação foi enviada à entidade para dar o veredito final",
            variant: "default"
          });
        }
      }
    } catch (error: any) {
      console.error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} negociação:`, error);
      
      toast({
        title: "Erro",
        description: error.response?.data?.message || `Falha ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} a negociação`,
        variant: "destructive"
      });
    }
  };

  const handleResendNotifications = async () => {
    if (!negotiation) return;
    
    try {
      if (negotiation.status !== 'submitted') {
        toast({
          title: "Aviso",
          description: "Somente negociações no status 'Submetido' podem ter notificações reenviadas.",
          variant: "default"
        });
        return;
      }

      await negotiationService.resendNotifications(negotiation.id);
      
      toast({
        title: "Sucesso",
        description: "Notificações reenviadas com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao reenviar notificações:', error);
      
      const errorMessage = getErrorMessage(error);
      
      toast({
        title: "Erro",
        description: errorMessage || "Falha ao reenviar notificações",
        variant: "destructive"
      });
    }
  };

  // Update the canMakeProposal function
  const canMakeProposal = (negotiation: Negotiation): boolean => {
    if (!negotiation || !user) return false;
    
    const isOwnNegotiation = negotiation.creator.id === user.id;
    
    // Can make proposal if:
    // 1. Negotiation is submitted AND not own negotiation OR
    // 2. Negotiation is rejected (even if own negotiation)
    return (negotiation.status === 'submitted' && !isOwnNegotiation) ||
           (negotiation.status === 'rejected' && hasPermission('edit negotiations'));
  };

  // Update the message shown when can't make proposal
  const renderProposalRestrictionMessage = (negotiation: Negotiation): string => {
    if (negotiation.creator.id === user?.id && negotiation.status !== 'rejected') {
      return 'Você não pode fazer propostas em sua própria negociação, a menos que ela tenha sido rejeitada';
    }
    return 'Você não tem permissão para fazer propostas';
  };

  const canApproveNegotiation = (negotiation: Negotiation): boolean => {
    if (!negotiation || !user) return false;
    
    return negotiation.can_approve &&
           negotiation.creator.id !== user.id &&
           negotiation.status === 'pending';
  };

  /**
   * Renderiza as ações disponíveis para cada status da negociação.
   * 
   * Fluxo de status da negociação:
   * 1. draft: Rascunho inicial
   * 2. pending: Em avaliação interna 
   * 3. approved: Aprovado internamente, aguardando confirmação final da entidade 
   * 4a. complete: Completamente aprovado pela entidade externa
   * 4b. partially_complete: Parcialmente aprovado pela entidade externa
   * 
   * Também pode ser:
   * - rejected: Rejeitado internamente ou externamente
   * - cancelled: Cancelado manualmente
   */
  const renderizarAcoes = (negociacao: Negotiation) => {
    return (
      <div className="flex items-center gap-2">
        {/* Submit for approval */}
        {negociacao.can_submit_for_approval && (
          <Button onClick={() => confirmAction('submit_for_approval')}>
            Enviar para Aprovação Interna
          </Button>
        )}
        
        {/* Approval actions */}
        {negociacao.status === 'pending' && (
          <div className="flex items-center gap-2">
            {negociacao.can_approve ? (
              <>
                <Button onClick={() => handleApproval('approve')}>
                  Aprovar Negociação
                </Button>
                <Button variant="destructive" onClick={() => handleApproval('reject')}>
                  Rejeitar
                </Button>
              </>
            ) : negociacao.creator.id === user?.id ? (
              <div className="text-sm text-muted-foreground">
                Você não pode aprovar sua própria negociação
              </div>
            ) : !hasPermission('approve negotiations') ? (
              <div className="text-sm text-muted-foreground">
                Você não tem permissão para aprovar negociações
              </div>
            ) : null}
          </div>
        )}
        
        {/* Resend notifications */}
        {negociacao.status === 'submitted' && hasPermission('create negotiations') && (
          <Button variant="outline" onClick={handleResendNotifications}>
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Reenviar Notificações
          </Button>
        )}
        
        {/* Cancel negotiation */}
        {negociacao.can_edit && !['approved', 'rejected', 'cancelled', 'complete', 'partially_complete'].includes(negociacao.status) && (
          <Button variant="outline" onClick={() => confirmAction('cancel')}>
            Cancelar
          </Button>
        )}
        
        {/* Generate contract */}
        {(['approved', 'complete', 'partially_complete'].includes(negociacao.status)) && (
          <Button onClick={handleGenerateContract}>
            Gerar Contrato
          </Button>
        )}

        {/* Status rollback */}
        {(['pending', 'approved'].includes(negociacao.status) && hasPermission('manage negotiations')) && (
          <RollbackStatusDialog 
            negotiation={negociacao}
            onComplete={fetchNegotiation} 
          />
        )}

        {/* New negotiation cycle */}
        {(['partially_complete', 'complete', 'rejected'].includes(negociacao.status) && 
          negociacao.negotiation_cycle < negociacao.max_cycles_allowed) && (
          <NegotiationCycleDialog 
            negotiation={negociacao}
            onComplete={fetchNegotiation} 
          />
        )}

        {/* Fork negotiation */}
        {(negociacao.status === 'draft' && !negociacao.is_fork && 
          negociacao.items.filter(item => item.status === 'pending').length >= 2 && 
          hasPermission('manage negotiations')) && (
          <NegotiationForkDialog 
            negotiation={negociacao}
            onComplete={fetchNegotiation} 
          />
        )}
      </div>
    );
  };

  const handleGenerateContract = async () => {
    if (!negotiation) return;
      
    try {
      const response = await negotiationService.generateContract(negotiation.id);
      toast({
        title: "Sucesso",
        description: "Geração de contrato iniciada com sucesso",
      });
      
      if (response.data?.contract_id) {
        router.push(`/contracts/${response.data.contract_id}`);
      }
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar contrato",
        variant: "destructive"
      });
    }
  };

  const showResponseDialog = (item: NegotiationItem) => {
    setSelectedItem(item);
    setCounterOfferMode(false);
    setResponseForm({
      status: 'approved',
      approved_value: Number(item.approved_value) || Number(item.proposed_value),
      counter_value: 0,
      notes: ''
    });
    setResponseDialogOpen(true);
  };

  const showCounterOfferDialog = (item: NegotiationItem) => {
    setSelectedItem(item);
    setCounterOfferMode(true);
    setResponseForm({
      status: 'counter_offered',
      approved_value: 0,
      counter_value: Number(item.proposed_value),
      notes: ''
    });
    setResponseDialogOpen(true);
  };

  const handleResponseSubmit = async () => {
    if (!selectedItem?.id || !negotiation || !selectedItem.tuss?.id) return;
    
    setRespondLoading(true);
    try {
      if (counterOfferMode) {
        await negotiationService.update(negotiation.id, {
          items: [{
            id: selectedItem.id,
            tuss_id: selectedItem.tuss.id,
            proposed_value: responseForm.counter_value.toString(),
            notes: responseForm.notes || null
          }]
        });
        
        toast({
          title: "Sucesso",
          description: "Contra-proposta enviada com sucesso",
        });
      } else {
        await negotiationService.processApproval(negotiation.id, {
          approved: responseForm.status === 'approved',
          approval_notes: responseForm.notes
        });
      
        toast({
          title: "Sucesso",
          description: "Resposta enviada com sucesso",
        });
      }
      
      setResponseDialogOpen(false);
      await fetchNegotiation();
    } catch (error: any) {
      console.error('Erro ao responder ao item:', error);
      
      const errorMessage = getErrorMessage(error);
      
      toast({
        title: "Erro",
        description: errorMessage || (counterOfferMode ? "Falha ao enviar contra-proposta" : "Falha ao enviar resposta"),
        variant: "destructive"
      });
    } finally {
      setRespondLoading(false);
    }
  };

  const handleMarkAsComplete = async () => {
    if (!negotiation) return;
    
    try {
      await negotiationService.markAsComplete(negotiation.id);
      toast({
        title: "Sucesso",
        description: "Negociação marcada como completa com sucesso",
      });
      fetchNegotiation();
    } catch (error) {
      console.error('Erro ao marcar negociação como completa:', error);
      toast({
        title: "Erro",
        description: "Falha ao marcar negociação como completa",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsPartiallyComplete = async () => {
    if (!negotiation) return;
    
    try {
      await negotiationService.markAsPartiallyComplete(negotiation.id);
      toast({
        title: "Sucesso",
        description: "Negociação marcada como parcialmente completa com sucesso",
      });
      fetchNegotiation();
    } catch (error) {
      console.error('Erro ao marcar negociação como parcialmente completa:', error);
      toast({
        title: "Erro",
        description: "Falha ao marcar negociação como parcialmente completa",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] space-y-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-muted-foreground text-lg">Carregando detalhes da negociação...</p>
      </div>
    );
  }

  if (!negotiation) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">Painel</Link>
          <span>/</span>
          <Link href="/negotiations" className="hover:underline">Negociações</Link>
          <span>/</span>
          <span>Detalhes</span>
        </div>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 flex flex-col items-center justify-center py-10">
            <XCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Negociação não encontrada</h2>
            <p className="text-muted-foreground mb-4">Não foi possível encontrar os detalhes da negociação solicitada.</p>
            <Button onClick={() => router.push('/negotiations')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Negociações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calcular métricas
  const totalItems = negotiation.items.length;
  const approvedItems = negotiation.items.filter(item => item.status === 'approved').length;
  const rejectedItems = negotiation.items.filter(item => item.status === 'rejected').length;
  const pendingItems = negotiation.items.filter(item => item.status === 'pending').length;
  const counterOfferedItems = negotiation.items.filter(item => item.status === 'counter_offered').length;
  
  // Certifique-se de trabalhar com valores numéricos
  const totalProposedValue = negotiation.items.reduce((sum, item) => 
    sum + (typeof item.proposed_value === 'number' ? item.proposed_value : 
          typeof item.proposed_value === 'string' ? parseFloat(item.proposed_value) : 0), 0);
    
  const totalApprovedValue = negotiation.items
    .filter(item => item.status === 'approved')
    .reduce((sum, item) => 
      sum + (typeof item.approved_value === 'number' ? item.approved_value : 
            typeof item.approved_value === 'string' ? parseFloat(item.approved_value) : 0), 0);

  const percentDifference = totalProposedValue > 0 
    ? ((totalApprovedValue - totalProposedValue) / totalProposedValue) * 100 
    : 0;

  const getEntityTypeLabel = (type: string): string => {
    const parts = type.split('\\');
    const entity = parts[parts.length - 1];
    
    switch(entity) {
      case 'HealthPlan': return 'Plano de Saúde';
      case 'Professional': return 'Profissional';
      case 'Clinic': return 'Clínica';
      default: return entity;
    }
  };

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Link href="/dashboard" className="hover:underline">Painel</Link>
        <span>/</span>
        <Link href="/negotiations" className="hover:underline">Negociações</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{negotiation?.title}</span>
      </div>
      
      {/* Announcement Banner */}
      <NegotiationAnnouncement />
      
      {/* Header */}
      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/negotiations')} className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
              <div className="flex items-center gap-4">
                <Badge 
                  variant={negotiationStatusColors[negotiation.status] as any}
                  className="text-sm py-1 px-3"
                >
                  {negotiationStatusLabels[negotiation.status]}
                </Badge>
                <HoverCard>
                  <HoverCardTrigger>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <div className="space-y-2">
                      <h4 className="font-medium">Status da Negociação</h4>
                      <p className="text-sm text-muted-foreground">
                        {negotiation.status === 'draft' && 'Negociação em elaboração, ainda não enviada.'}
                        {negotiation.status === 'submitted' && 'Aguardando avaliação da entidade.'}
                        {negotiation.status === 'pending' && 'Em processo de aprovação interna.'}
                        {negotiation.status === 'approved' && 'Aprovada internamente, aguardando confirmação da entidade.'}
                        {negotiation.status === 'complete' && 'Negociação aprovada e finalizada.'}
                        {negotiation.status === 'partially_complete' && 'Alguns itens foram aprovados e outros rejeitados.'}
                        {negotiation.status === 'rejected' && 'Negociação foi rejeitada.'}
                        {negotiation.status === 'cancelled' && 'Negociação foi cancelada.'}
                      </p>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">{negotiation.title}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  <span>
                    {new Date(negotiation.start_date).toLocaleDateString()} até {new Date(negotiation.end_date).toLocaleDateString()}
                  </span>
                </div>
                <span>•</span>
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1.5" />
                  <span>{negotiation.creator?.name || 'Desconhecido'}</span>
                </div>
              </div>
          </div>
        </div>
        
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
          {renderizarAcoes(negotiation)}
          </div>
        </div>
      </div>
      
      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-500" />
              Resumo de Itens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1 bg-muted/40 rounded-lg p-3">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="text-2xl font-bold">{totalItems}</div>
              </div>
              <div className="space-y-1 bg-blue-50 rounded-lg p-3">
                <div className="text-sm text-muted-foreground">Aprovados</div>
                <div className="text-2xl font-bold text-blue-700">{approvedItems}</div>
              </div>
              <div className="space-y-1 bg-amber-50 rounded-lg p-3">
                <div className="text-sm text-muted-foreground">Pendentes</div>
                <div className="text-2xl font-bold text-amber-700">{pendingItems}</div>
              </div>
              <div className="space-y-1 bg-red-50 rounded-lg p-3">
                <div className="text-sm text-muted-foreground">Rejeitados</div>
                <div className="text-2xl font-bold text-red-700">{rejectedItems}</div>
              </div>
                </div>
            
            <div className="mt-4 bg-muted/30 h-2 rounded-full overflow-hidden">
              <div className="flex h-full">
                <div 
                  className="bg-blue-500 h-full"
                  style={{ width: `${totalItems > 0 ? (approvedItems / totalItems) * 100 : 0}%` }}
                ></div>
                <div 
                  className="bg-amber-500 h-full"
                  style={{ width: `${totalItems > 0 ? (pendingItems / totalItems) * 100 : 0}%` }}
                ></div>
                <div 
                  className="bg-red-500 h-full"
                  style={{ width: `${totalItems > 0 ? (rejectedItems / totalItems) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Valores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5 bg-muted/40 rounded-lg p-3">
                <div className="text-sm text-muted-foreground">Proposto</div>
                <div className="text-2xl font-bold">{formatCurrency(totalProposedValue)}</div>
              </div>
              <div className={`space-y-1.5 rounded-lg p-3 ${
                approvedItems > 0 ? (percentDifference >= 0 ? 'bg-green-50' : 'bg-red-50') : 'bg-gray-50'
              }`}>
                <div className="text-sm text-muted-foreground">Aprovado</div>
                <div className={`text-2xl font-bold ${
                  approvedItems > 0 ? (percentDifference >= 0 ? 'text-green-700' : 'text-red-700') : 'text-gray-500'
                }`}>
                  {formatCurrency(totalApprovedValue)}
                </div>
                {approvedItems > 0 && (
                  <div className={`flex items-center text-xs ${
                    percentDifference >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {percentDifference >= 0 ? 
                      <TrendingUp className="h-3 w-3 mr-1" /> : 
                      <TrendingDown className="h-3 w-3 mr-1" />
                    }
                    {percentDifference >= 0 ? '+' : ''}
                    {percentDifference.toFixed(2).replace('.', ',')}%
                </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-purple-500" />
              Entidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-xl font-semibold truncate">{negotiation.negotiable?.name || "-"}</div>
            <div className="flex items-center">
              <Badge variant="outline" className="flex items-center gap-1.5">
                {negotiation.negotiable_type && (
                  <>
                    {negotiation.negotiable_type.includes('HealthPlan') ? 
                      <BarChart4 className="h-3.5 w-3.5" /> : 
                      negotiation.negotiable_type.includes('Professional') ? 
                        <User className="h-3.5 w-3.5" /> : 
                        <BarChart className="h-3.5 w-3.5" />
                    }
                    <span>{getEntityTypeLabel(negotiation.negotiable_type)}</span>
                  </>
                )}
                    </Badge>
              </div>
              
            <div className="pt-3">
              <div className="text-sm text-muted-foreground">ID da Entidade</div>
              <div className="font-mono text-sm">{negotiation.negotiable_id}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Info className="h-5 w-5 text-amber-500" />
              Detalhes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground">Criado em</div>
                <div className="font-medium">{new Date(negotiation.created_at).toLocaleDateString()}</div>
                </div>
              
              {negotiation.approved_at && (
                <div>
                  <div className="text-xs text-muted-foreground">Aprovado em</div>
                  <div className="font-medium">{new Date(negotiation.approved_at).toLocaleDateString()}</div>
                </div>
              )}
              </div>
              
            {negotiation.notes && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center">
                        <Clipboard className="h-3.5 w-3.5 mr-1.5" />
                        Observações
                  </div>
                      <div className="text-sm truncate text-muted-foreground">
                        {negotiation.notes}
                </div>
            </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{negotiation.notes}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Items Table */}
      <Card className="bg-card shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Clipboard className="h-5 w-5 text-primary" />
                Itens da Negociação
              </CardTitle>
              <CardDescription>
                {negotiation.status === 'draft' ? 
                  'Estes itens serão incluídos na negociação após o envio para aprovação.' :
                  negotiation.status === 'submitted' ? 
                  'Aguardando avaliação por parte da entidade (plano/profissional/clínica).' :
                  negotiation.status === 'pending' ?
                  'Aguardando aprovação interna por usuário com alçada.' :
                  negotiation.status === 'approved' ?
                  'Aprovado internamente. Aguardando confirmação final da entidade.' :
                  negotiation.status === 'complete' ?
                  'Negociação concluída e aprovada pela entidade.' :
                  negotiation.status === 'partially_complete' ?
                  'Negociação parcialmente concluída pela entidade (algumas especialidades aprovadas, outras não).' :
                  'Revise o status de cada procedimento nesta negociação.'}
              </CardDescription>
            </div>
            {pendingItems > 0 && negotiation.status === 'submitted' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-md text-sm flex items-center">
                      <Info className="h-4 w-4 mr-1.5" />
                      <span>{pendingItems} {pendingItems === 1 ? 'item pendente' : 'itens pendentes'}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Existem itens aguardando sua resposta</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
          <Table>
              <TableHeader className="bg-muted/50">
              <TableRow>
                  <TableHead className="w-[15%]">Procedimento</TableHead>
                  <TableHead className="w-[35%]">Descrição</TableHead>
                  <TableHead className="w-[12%] text-right">Valor Proposto</TableHead>
                  <TableHead className="w-[12%] text-right">Valor Aprovado</TableHead>
                  <TableHead className="w-[10%]">Status</TableHead>
                  <TableHead className="w-[8%]">Observações</TableHead>
                  <TableHead className="w-[8%] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {negotiation.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                        <Clipboard className="h-8 w-8 mb-2 opacity-40" />
                        <p>Nenhum item encontrado nesta negociação</p>
                      </div>
                  </TableCell>
                </TableRow>
              ) : (
                negotiation.items.map((item) => (
                    <TableRow key={item.id} className={
                      item.status === 'pending' && negotiation.status === 'pending' 
                        ? 'bg-amber-50/30' 
                        : item.status === 'approved' 
                          ? 'bg-green-50/30'
                          : item.status === 'rejected'
                            ? 'bg-red-50/30'
                            : undefined
                    }>
                    <TableCell className="font-medium">
                      <Badge variant="outline" className="h-5 text-xs">
                        {item.tuss?.code}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.tuss?.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[400px]">
                        {item.tuss?.description}
                      </div>
                      {item.medical_specialty && (
                        <div className="mt-1">
                          <Badge variant="outline" className="text-xs">
                            Especialidade: {item.medical_specialty.name}
                          </Badge>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.proposed_value)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {item.approved_value ? formatCurrency(item.approved_value) : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        item.status === 'approved' ? 'success' :
                        item.status === 'rejected' ? 'destructive' :
                        item.status === 'counter_offered' ? 'secondary' :
                        'default'
                      }>
                        {negotiationItemStatusLabels[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.notes ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <div className="max-w-[100px] truncate text-sm text-muted-foreground hover:text-foreground transition-colors">
                                {item.notes}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <p>{item.notes}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        {negotiation.status === 'submitted' && (
                          <>
                            {item.status === 'pending' && canMakeProposal(negotiation) && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => showCounterOfferDialog(item)}
                                className="h-8 px-2"
                              >
                                <TrendingUp className="h-4 w-4" />
                              </Button>
                            )}
                            {item.status === 'counter_offered' && canMakeProposal(negotiation) && (
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => showResponseDialog(item)}
                                className="h-8 px-2"
                              >
                                <ArrowLeftRight className="h-4 w-4" />
                              </Button>
                            )}
                          </>
                        )}
                        <NegotiationItemActions
                          negotiation={negotiation}
                          item={{
                            ...item,
                            updated_by: item.created_by,
                            notes: item.notes,
                            proposed_value: item.proposed_value,
                            approved_value: item.approved_value
                          }}
                          onActionComplete={fetchNegotiation}
                          onShowResponseDialog={(i) => showResponseDialog({
                            ...i,
                            created_by: i.updated_by ?? i.created_by,
                            notes: i.notes || null,
                            proposed_value: i.proposed_value,
                            approved_value: i.approved_value
                          })}
                          onShowCounterOfferDialog={(i) => showCounterOfferDialog({
                            ...i,
                            created_by: i.updated_by ?? i.created_by,
                            notes: i.notes || null,
                            proposed_value: i.proposed_value,
                            approved_value: i.approved_value
                          })}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Response Dialog */}
      <Dialog 
        open={responseDialogOpen && canMakeProposal(negotiation)} 
        onOpenChange={(open) => {
          if (!canMakeProposal(negotiation)) return;
          setResponseDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {counterOfferMode ? (
                <>
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  Fazer Contraproposta
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Responder ao Item
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {counterOfferMode ? (
                'Faça uma contraproposta para este item da negociação.'
              ) : (
                'Aprove ou rejeite este item da negociação.'
              )}
              {selectedItem?.tuss?.description && (
                <div className="mt-2 p-3 bg-muted rounded-md space-y-2">
                  <div className="text-sm font-medium">{selectedItem.tuss.description}</div>
                  <div className="text-xs text-muted-foreground flex items-center mt-1">
                    <Badge variant="outline" className="mr-2">{selectedItem.tuss.code}</Badge>
                    Código TUSS
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Valor Atual:</span>
                      <div className="font-medium">{formatCurrency(selectedItem.proposed_value)}</div>
                    </div>
                    {selectedItem.approved_value && (
                      <div>
                        <span className="text-muted-foreground">Último Valor Aprovado:</span>
                        <div className="font-medium">{formatCurrency(selectedItem.approved_value)}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {!counterOfferMode ? (
              <>
                <div>
                  <Label htmlFor="status" className="text-muted-foreground">Decisão</Label>
                  <Select 
                    value={responseForm.status} 
                    onValueChange={(value) => setResponseForm({...responseForm, status: value as NegotiationItemStatus})}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione a decisão">
                        {responseForm.status === 'approved' ? 'Aprovar Item' : 
                         responseForm.status === 'rejected' ? 'Rejeitar Item' : 
                         'Selecione a decisão'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          Aprovar Item
                        </div>
                      </SelectItem>
                      <SelectItem value="rejected">
                        <div className="flex items-center">
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          Rejeitar Item
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {responseForm.status === 'approved' && (
                  <div>
                    <Label htmlFor="approved_value" className="text-muted-foreground">
                      Valor Aprovado
                    </Label>
                    <div className="mt-1.5">
                      <Input
                        id="approved_value"
                        type="number"
                        min="0"
                        step="0.01"
                        value={responseForm.approved_value}
                        onChange={(e) => setResponseForm({...responseForm, approved_value: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div>
                <Label htmlFor="counter_value" className="text-muted-foreground">
                  Valor da Contraproposta
                </Label>
                <div className="mt-1.5">
                  <Input
                    id="counter_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={responseForm.counter_value}
                    onChange={(e) => setResponseForm({...responseForm, counter_value: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="notes" className="text-muted-foreground">
                Observações
              </Label>
              <div className="mt-1.5">
                <Textarea
                  id="notes"
                  value={responseForm.notes}
                  onChange={(e) => setResponseForm({...responseForm, notes: e.target.value})}
                  placeholder={counterOfferMode ? 
                    "Explique os motivos da sua contraproposta..." : 
                    "Adicione observações sobre sua decisão..."}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleResponseSubmit} 
              disabled={respondLoading}
              variant={counterOfferMode ? "secondary" : responseForm.status === 'approved' ? "default" : "destructive"}
            >
              {respondLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {counterOfferMode ? 'Enviando...' : 'Respondendo...'}
                </>
              ) : (
                <>
                  {counterOfferMode ? (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Enviar Contraproposta
                    </>
                  ) : responseForm.status === 'approved' ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprovar Item
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeitar Item
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Dialog */}
      <AlertDialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleActionConfirm}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Approval History Section */}
      {negotiation && negotiation.approval_history && negotiation.approval_history.length > 0 && (
        <div className="my-6">
          <ApprovalHistory history={negotiation.approval_history} />
        </div>
      )}

      {/* Forked Negotiations Section */}
      {negotiation && ((negotiation.fork_count && negotiation.fork_count > 0) || negotiation.parent_negotiation_id) && (
        <div className="my-6">
          <ForkedNegotiationsList 
            parentNegotiation={negotiation} 
            forkedNegotiations={negotiation.forked_negotiations} 
          />
        </div>
      )}
      
      <Toaster />
    </div>
  );
} 