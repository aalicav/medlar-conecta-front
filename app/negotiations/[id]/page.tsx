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
  MoreHorizontal
} from 'lucide-react';

import { useAuth } from '@/contexts/auth-context';

import { 
  negotiationService, 
  Negotiation, 
  NegotiationItem,
  negotiationStatusLabels, 
  negotiationItemStatusLabels,
  UserRole,
  ApprovalLevel,
  ApprovalAction
} from '../../services/negotiationService';

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
import { ApprovalHistoryList } from '@/app/components/ApprovalHistory';

// Helper function to map status to color variants
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'draft': return 'outline';
    case 'submitted': return 'secondary';
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

export default function NegotiationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  // NOTA: Em versões futuras do Next.js, será necessário usar React.use(params) 
  // em vez do acesso direto a params.id
  const negotiationId = parseInt(params.id);
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [respondLoading, setRespondLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NegotiationItem | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [counterOfferMode, setCounterOfferMode] = useState(false);
  const [responseForm, setResponseForm] = useState({
    status: 'approved',
    approved_value: 0,
    counter_value: 0,
    notes: ''
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'submit' | 'cancel' | null;
    title: string;
    description: string;
  }>({
    open: false,
    action: null,
    title: '',
    description: ''
  });

  const getApprovalLevelLabel = (level: ApprovalLevel): string => {
    const labels: Record<ApprovalLevel, string> = {
      commercial: 'Comercial',
      financial: 'Financeiro',
      management: 'Comitê de Gestão',
      legal: 'Jurídico',
      direction: 'Direção'
    };
    return labels[level];
  };

  const fetchNegotiation = async () => {
    setLoading(true);
    try {
      const response = await negotiationService.getNegotiation(negotiationId);
      if (response.data) {
      setNegotiation(response.data);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes da negociação",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar negociação:', error);
      toast({
        title: "Erro",
        description: "Falha ao obter detalhes da negociação",
        variant: "destructive"
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
  
  const confirmAction = (action: 'submit' | 'cancel') => {
    const titulos = {
      submit: 'Enviar Negociação para Aprovação',
      cancel: 'Cancelar Negociação'
    };
    
    const descricoes = {
      submit: 'Tem certeza que deseja enviar esta negociação para o fluxo de aprovação?',
      cancel: 'Tem certeza que deseja cancelar esta negociação?'
    };
    
    setConfirmDialog({
      open: true,
      action,
      title: titulos[action],
      description: descricoes[action]
    });
  };

  const handleActionConfirm = async () => {
    if (!confirmDialog.action || !negotiation) return;
    
    try {
      if (confirmDialog.action === 'submit') {
        // Use the new approval workflow endpoint
        await negotiationService.submitForApproval(negotiation.id);
        toast({
          title: "Sucesso",
          description: "Negociação enviada para aprovação comercial",
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
      console.error(`Erro ao ${confirmDialog.action === 'submit' ? 'enviar' : 'cancelar'} negociação:`, error);
      toast({
        title: "Erro",
        description: `Falha ao ${confirmDialog.action === 'submit' ? 'enviar' : 'cancelar'} a negociação`,
        variant: "destructive"
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleApproval = async (action: ApprovalAction) => {
    if (!negotiation) return;
    
    try {
      await negotiationService.processApproval(negotiation.id, action);
      toast({
        title: "Sucesso",
        description: `Negociação ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso`,
      });
      fetchNegotiation();
    } catch (error) {
      console.error(`Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} negociação:`, error);
      toast({
        title: "Erro",
        description: `Falha ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} a negociação`,
        variant: "destructive"
      });
    }
  };

  const handleResendNotifications = async () => {
    if (!negotiation) return;
    
    try {
      await negotiationService.resendNotifications(negotiation.id, negotiation.status);
      toast({
        title: "Sucesso",
        description: "Notificações reenviadas com sucesso",
      });
    } catch (error) {
      console.error('Erro ao reenviar notificações:', error);
      toast({
        title: "Erro",
        description: "Falha ao reenviar notificações",
        variant: "destructive"
      });
    }
  };

  const renderizarAcoes = (negociacao: Negotiation) => {
    const canApprove = (level: ApprovalLevel): boolean => {
      const permissionMap: Record<ApprovalLevel, string> = {
        commercial: 'approve_negotiation_commercial',
        financial: 'approve_negotiation_financial',
        management: 'approve_negotiation_management',
        legal: 'approve_negotiation_legal',
        direction: 'approve_negotiation_direction'
      };
      
      return hasPermission(permissionMap[level]);
    };

    return (
      <div className="flex items-center gap-2">
        {negociacao.status === 'draft' && (
          <Button onClick={() => confirmAction('submit')}>
            Enviar para Aprovação
          </Button>
        )}
        
        {negociacao.status.startsWith('pending_') && 
         canApprove(negociacao.current_approval_level as ApprovalLevel) && (
          <>
            <Button onClick={() => handleApproval('approve')}>
              Aprovar {getApprovalLevelLabel(negociacao.current_approval_level as ApprovalLevel)}
            </Button>
            <Button variant="destructive" onClick={() => handleApproval('reject')}>
              Rejeitar
            </Button>
          </>
        )}

        {(negociacao.status.startsWith('pending_') || negociacao.status === 'submitted' as any) && (
          <Button variant="outline" onClick={handleResendNotifications}>
            Reenviar Notificações
          </Button>
        )}
        
        {!['approved', 'rejected', 'cancelled'].includes(negociacao.status) && (
          <Button variant="outline" onClick={() => confirmAction('cancel')}>
            Cancelar
          </Button>
        )}
        
        {negociacao.status === 'approved' && (
          <Button onClick={handleGenerateContract}>
            Gerar Contrato
          </Button>
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
      approved_value: item.proposed_value,
      counter_value: item.proposed_value,
      notes: ''
    });
    setResponseDialogOpen(true);
  };

  const showCounterOfferDialog = (item: NegotiationItem) => {
    setSelectedItem(item);
    setCounterOfferMode(true);
    setResponseForm({
      status: 'approved',
      approved_value: item.proposed_value,
      counter_value: item.proposed_value,
      notes: ''
    });
    setResponseDialogOpen(true);
  };

  const handleResponseSubmit = async () => {
    if (!selectedItem || !selectedItem.id) return;
    
    setRespondLoading(true);
    try {
      if (counterOfferMode) {
        console.log("Enviando contraproposta:", {
          endpoint: `/negotiation-items/${selectedItem.id}/counter`,
          data: {
            counter_value: responseForm.counter_value,
            notes: responseForm.notes
          }
        });
        
        // Usando a API de contra-oferta
        await negotiationService.counterOffer(selectedItem.id, {
          counter_value: responseForm.counter_value,
          notes: responseForm.notes
        });
        
        toast({
          title: "Sucesso",
          description: "Contra-proposta enviada com sucesso",
        });
      } else {
        console.log("Enviando resposta:", {
          endpoint: `/negotiation-items/${selectedItem.id}/respond`,
          data: {
            status: responseForm.status,
            approved_value: responseForm.status === 'approved' ? responseForm.approved_value : undefined,
            notes: responseForm.notes
          }
        });
        
        // Usando a API de resposta
        await negotiationService.respondToItem(selectedItem.id, {
          status: responseForm.status as 'approved' | 'rejected',
          approved_value: responseForm.status === 'approved' ? responseForm.approved_value : undefined,
          notes: responseForm.notes
        });
      
        toast({
          title: "Sucesso",
          description: "Resposta enviada com sucesso",
        });
      }
      
      setResponseDialogOpen(false);
      fetchNegotiation();
    } catch (error: any) {
      console.error('Erro ao responder ao item:', error);
      
      // Mensagem de erro mais detalhada
      const errorMessage = error.response?.data?.message || 
        (counterOfferMode ? "Falha ao enviar contra-proposta" : "Falha ao enviar resposta");
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Log detalhado do erro para depuração
      console.error('Detalhes do erro:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
    } finally {
      setRespondLoading(false);
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
        <span className="text-foreground font-medium">{negotiation.title}</span>
      </div>
      
      {/* Header */}
      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/negotiations')} className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
              <div className="flex items-center gap-3 mb-1">
                <Badge variant={getStatusVariant(negotiation.status)} className="px-3 py-1">
                {negotiationStatusLabels[negotiation.status]}
              </Badge>
                <span className="text-muted-foreground text-sm">
                ID: {negotiation.id}
              </span>
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
                  negotiation.status.startsWith('pending_') && negotiation.current_approval_level ?
                  `Aguardando aprovação do ${getApprovalLevelLabel(negotiation.current_approval_level as ApprovalLevel)}` :
                  'Revise o status de cada procedimento nesta negociação.'}
              </CardDescription>
            </div>
            {pendingItems > 0 && negotiation.status.startsWith('pending_') && (
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
                  <TableHead className="w-[40%]">Procedimento</TableHead>
                  <TableHead className="text-right">Valor Proposto</TableHead>
                  <TableHead className="text-right">Valor Aprovado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observações</TableHead>
                {negotiation.status.startsWith('pending_') && (
                  <TableHead className="text-right">Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {negotiation.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center py-4 text-muted-foreground">
                        <Clipboard className="h-8 w-8 mb-2 opacity-40" />
                        <p>Nenhum item encontrado nesta negociação</p>
                      </div>
                  </TableCell>
                </TableRow>
              ) : (
                negotiation.items.map((item) => (
                    <TableRow key={item.id} className={item.status === 'pending' && negotiation.status.startsWith('pending_') ? 'bg-amber-50/30' : undefined}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.tuss?.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Badge variant="outline" className="h-5 mr-1.5 text-xs">
                              {item.tuss?.code}
                            </Badge>
                            <span>TUSS</span>
                        </div>
                      </div>
                    </TableCell>
                      <TableCell className="text-right font-medium">
                      {formatCurrency(item.proposed_value)}
                    </TableCell>
                      <TableCell className="text-right">
                      {item.status === 'approved' && item.approved_value ? (
                          <HoverCard>
                            <HoverCardTrigger>
                              <span className={`font-medium ${
                                parseFloat(String(item.approved_value)) < parseFloat(String(item.proposed_value))
                                  ? "text-red-600 flex items-center justify-end" 
                                  : parseFloat(String(item.approved_value)) > parseFloat(String(item.proposed_value))
                                    ? "text-green-600 flex items-center justify-end" 
                                    : "flex items-center justify-end"
                              }`}>
                                {formatCurrency(item.approved_value)}
                                {parseFloat(String(item.approved_value)) < parseFloat(String(item.proposed_value)) && 
                                  <TrendingDown className="h-4 w-4 ml-1" />}
                                {parseFloat(String(item.approved_value)) > parseFloat(String(item.proposed_value)) && 
                                  <TrendingUp className="h-4 w-4 ml-1" />}
                              </span>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-auto">
                              <div className="space-y-2">
                                <div className="text-sm font-medium">Comparativo</div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                  <div className="text-muted-foreground">Proposto:</div>
                                  <div className="text-right">{formatCurrency(item.proposed_value)}</div>
                                  
                                  <div className="text-muted-foreground">Aprovado:</div>
                                  <div className="text-right">{formatCurrency(item.approved_value)}</div>
                                  
                                  <div className="text-muted-foreground border-t pt-1 mt-1">Diferença:</div>
                                  <div className={`text-right border-t pt-1 mt-1 ${
                          parseFloat(String(item.approved_value)) < parseFloat(String(item.proposed_value))
                            ? "text-red-600" 
                            : parseFloat(String(item.approved_value)) > parseFloat(String(item.proposed_value))
                              ? "text-green-600" 
                              : ""
                                  }`}>
                                    {parseFloat(String(item.approved_value)) > parseFloat(String(item.proposed_value)) ? "+" : ""}
                                    {formatCurrency(parseFloat(String(item.approved_value)) - parseFloat(String(item.proposed_value))).replace('R$ ', '')}
                                  </div>
                                </div>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                        <Badge variant={getItemStatusVariant(item.status)} className="capitalize">
                        {negotiationItemStatusLabels[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        {item.notes ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="max-w-[180px] truncate text-sm text-muted-foreground hover:text-foreground transition-colors">
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
                    {negotiation.status.startsWith('pending_') && (
                      <TableCell className="text-right">
                        {item.status === 'pending' && (
                          <div className="space-x-2">
                            <Button 
                              size="sm" 
                              onClick={() => showResponseDialog(item)}
                              className="bg-primary hover:bg-primary/90"
                            >
                              Responder
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => showCounterOfferDialog(item)}
                              className="text-secondary-foreground"
                            >
                              Contraproposta
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {counterOfferMode ? (
                <>
                  <TrendingUp className="h-5 w-5 text-secondary" />
                  Enviar Contraproposta
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Responder ao Item
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedItem?.tuss?.name && (
                <div className="mt-1">
                  <Badge variant="outline" className="mr-2">{selectedItem.tuss.code}</Badge>
                  {selectedItem.tuss.name}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {!counterOfferMode && (
              <div>
                <Label htmlFor="status" className="text-muted-foreground">Resposta</Label>
                <Select 
                  value={responseForm.status} 
                  onValueChange={(value) => setResponseForm({...responseForm, status: value})}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Aprovar</SelectItem>
                    <SelectItem value="rejected">Rejeitar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 items-end">
              <div>
                <Label htmlFor="proposed-value" className="text-muted-foreground">Valor Proposto</Label>
                <div className="relative mt-1.5">
                  <Input 
                    id="proposed-value" 
                    value={selectedItem && selectedItem.proposed_value 
                      ? parseFloat(String(selectedItem.proposed_value)).toFixed(2).replace('.', ',')
                      : '0,00'} 
                    disabled 
                    className="bg-muted pl-8"
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center text-muted-foreground">
                    R$
                  </div>
              </div>
            </div>
            
              {(responseForm.status !== 'rejected' || counterOfferMode) && (
              <div>
                  <Label htmlFor="response-value" className="text-muted-foreground">
                    {counterOfferMode ? 'Valor da Contraproposta' : 'Valor Aprovado'}
                </Label>
                  <div className="relative mt-1.5">
                <Input 
                      id="response-value"
                  type="number"
                  step="0.01"
                      min="0"
                      value={counterOfferMode ? responseForm.counter_value : responseForm.approved_value} 
                      onChange={(e) => counterOfferMode
                        ? setResponseForm({...responseForm, counter_value: parseFloat(e.target.value) || 0})
                        : setResponseForm({...responseForm, approved_value: parseFloat(e.target.value) || 0})
                      }
                      className={`pl-8 ${
                        counterOfferMode
                          ? 'border-secondary focus-visible:ring-secondary'
                          : responseForm.status === 'approved'
                            ? 'border-primary focus-visible:ring-primary'
                            : ''
                      }`}
                    />
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center text-muted-foreground">
                      R$
                    </div>
                  </div>
              </div>
            )}
            </div>
            
            <div>
              <Label htmlFor="notes" className="text-muted-foreground">Observações</Label>
              <Textarea 
                id="notes"
                placeholder="Adicione comentários ou observações sobre sua resposta"
                value={responseForm.notes}
                onChange={(e) => setResponseForm({...responseForm, notes: e.target.value})}
                className="mt-1.5 min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleResponseSubmit} 
              disabled={respondLoading}
              className={counterOfferMode ? 'bg-secondary hover:bg-secondary/90' : ''}
            >
              {respondLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {counterOfferMode ? 'Enviando...' : 'Respondendo...'}
                </>
              ) : (
                counterOfferMode ? 'Enviar Contraproposta' : 'Confirmar Resposta'
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
      
      {negotiation.approval_history && negotiation.approval_history.length > 0 && (
        <ApprovalHistoryList history={negotiation.approval_history} />
      )}
    </div>
  );
} 