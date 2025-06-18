import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MoreVertical,
  Edit,
  FileText,
  GitFork,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Send,
  Ban,
  UserCheck,
  FileCheck,
  RefreshCw,
  ArrowLeft,
  Crown,
  Building
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { negotiationService } from '@/services/negotiationService';
import type { Negotiation } from '@/types/negotiations';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NegotiationActionsProps {
  negotiation: Negotiation;
  onActionComplete: () => void;
  onShowForkDialog?: (negotiation: Negotiation) => void;
}

export function NegotiationActions({ 
  negotiation,
  onActionComplete,
  onShowForkDialog
}: NegotiationActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!negotiation) {
    return null;
  }

  // Verifica se o usuário pode aprovar internamente
  const canApproveInternally = () => {
    if (!user) return false;
    
    // Super admin pode aprovar sua própria negociação
    if (hasRole('super_admin')) return true;
    
    // Não pode aprovar sua própria negociação (exceto super admin)
    if (negotiation.creator?.id === user.id) return false;

    // Precisa ter uma das roles permitidas
    return hasRole(['commercial_manager', 'super_admin', 'director']);
  };

  // Verifica se o usuário pode aprovar externamente
  const canApproveExternally = () => {
    if (!user) return false;

    // Super admin pode aprovar externamente qualquer negociação
    if (hasRole('super_admin')) return true;

    // Verifica se o usuário pertence à entidade alvo
    const isTargetEntity = negotiation.negotiable_id === user.entity_id;
    
    switch (negotiation.negotiable_type) {
      case 'App\\Models\\HealthPlan':
        return hasRole('plan_admin') && isTargetEntity;
      case 'App\\Models\\Professional':
        return hasRole('professional') && isTargetEntity;
      case 'App\\Models\\Clinic':
        return hasRole('clinic_admin') && isTargetEntity;
      default:
        return false;
    }
  };

  // Verifica se o usuário pode editar
  const canEdit = () => {
    if (!user) return false;
    
    // Criador pode editar se estiver em rascunho
    if (negotiation.creator?.id === user.id && negotiation.status === 'draft') {
      return true;
    }

    // Gerentes podem editar se estiver pendente
    if (hasRole(['commercial_manager', 'super_admin', 'director']) && negotiation.status === 'pending') {
      return true;
    }

    return false;
  };

  // Verifica se o usuário é diretor
  const isDirector = () => {
    return hasRole(['director', 'super_admin']);
  };

  // Verifica se o usuário é da equipe comercial
  const isCommercial = () => {
    return hasRole(['commercial_manager', 'super_admin']);
  };

  // Função para lidar com aprovação/rejeição interna
  const handleInternalAction = async (action: 'approve' | 'reject') => {
    try {
      setIsLoading(true);
      
      if (!canApproveInternally()) {
        toast({
          title: "Erro",
          description: "Você não tem permissão para aprovar/rejeitar internamente esta negociação",
          variant: "destructive"
        });
        return;
      }

      await negotiationService.processApproval(negotiation.id, {
        approved: action === 'approve',
        approval_notes: action === 'approve' ? 'Aprovado internamente' : 'Rejeitado internamente'
      });

      toast({
        title: "Sucesso",
        description: `Negociação ${action === 'approve' ? 'aprovada' : 'rejeitada'} internamente com sucesso`,
      });
      
      onActionComplete();
    } catch (error) {
      console.error('Error performing internal action:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar ação",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para enviar para aprovação
  const handleSubmitForApproval = async () => {
    try {
      setIsLoading(true);
      await negotiationService.submitForApproval(negotiation.id);
      
      toast({
        title: "Sucesso",
        description: "Negociação enviada para aprovação",
      });
      
      onActionComplete();
    } catch (error) {
      console.error('Error submitting for approval:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar para aprovação",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para enviar para aprovação da direção
  const handleSubmitForDirectorApproval = async () => {
    try {
      setIsLoading(true);
      await negotiationService.submitForDirectorApproval(negotiation.id);
      
      toast({
        title: "Sucesso",
        description: "Negociação enviada para aprovação da direção",
      });
      
      onActionComplete();
    } catch (error) {
      console.error('Error submitting for director approval:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar para aprovação da direção",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para aprovação da direção
  const handleDirectorAction = async (action: 'approve' | 'reject') => {
    try {
      setIsLoading(true);
      
      if (!isDirector()) {
        toast({
          title: "Erro",
          description: "Você não tem permissão para aprovar/rejeitar como diretor",
          variant: "destructive"
        });
        return;
      }

      await negotiationService.directorApprove(negotiation.id, {
        approved: action === 'approve',
        approval_notes: action === 'approve' ? 'Aprovado pela direção' : 'Rejeitado pela direção'
      });

      toast({
        title: "Sucesso",
        description: `Negociação ${action === 'approve' ? 'aprovada' : 'rejeitada'} pela direção`,
      });
      
      onActionComplete();
    } catch (error) {
      console.error('Error performing director action:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar ação da direção",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para marcar como formalizada
  const handleMarkAsFormalized = async () => {
    try {
      setIsLoading(true);
      await negotiationService.markAsFormalized(negotiation.id);
      
      toast({
        title: "Sucesso",
        description: "Negociação marcada como formalizada",
      });
      
      onActionComplete();
    } catch (error) {
      console.error('Error marking as formalized:', error);
      toast({
        title: "Erro",
        description: "Falha ao marcar como formalizada",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para gerar contrato
  const handleGenerateContract = async () => {
    try {
      setIsLoading(true);
      await negotiationService.generateContract(negotiation.id);
      
      toast({
        title: "Sucesso",
        description: "Contrato gerado com sucesso",
      });
      
      onActionComplete();
    } catch (error) {
      console.error('Error generating contract:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar contrato",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para reenviar notificações
  const handleResendNotifications = async () => {
    try {
      setIsLoading(true);
      await negotiationService.resendNotifications(negotiation.id);
      
      toast({
        title: "Sucesso",
        description: "Notificações reenviadas com sucesso",
      });
      
      onActionComplete();
    } catch (error) {
      console.error('Error resending notifications:', error);
      toast({
        title: "Erro",
        description: "Falha ao reenviar notificações",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para cancelar negociação
  const handleCancel = async () => {
    try {
      setIsLoading(true);
      await negotiationService.cancelNegotiation(negotiation.id);
      
      toast({
        title: "Sucesso",
        description: "Negociação cancelada com sucesso",
      });
      
      onActionComplete();
    } catch (error) {
      console.error('Error cancelling negotiation:', error);
      toast({
        title: "Erro",
        description: "Falha ao cancelar negociação",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Ações da Negociação</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Ver detalhes - sempre disponível */}
        <DropdownMenuItem onClick={() => router.push(`/negotiations/${negotiation.id}`)}>
          <FileText className="mr-2 h-4 w-4" />
          Ver Detalhes
        </DropdownMenuItem>

        {/* Editar - apenas se permitido */}
        {canEdit() && (
          <DropdownMenuItem onClick={() => router.push(`/negotiations/${negotiation.id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
        )}

        {/* Enviar para aprovação - apenas rascunho */}
        {negotiation.status === 'draft' && negotiation.creator?.id === user?.id && (
          <DropdownMenuItem onClick={handleSubmitForApproval}>
            <Send className="mr-2 h-4 w-4" />
            Enviar para Aprovação
          </DropdownMenuItem>
        )}

        {/* Enviar para aprovação da direção - apenas se aprovado internamente */}
        {negotiation.status === 'approved' && isCommercial() && (
          <DropdownMenuItem onClick={handleSubmitForDirectorApproval}>
            <Crown className="mr-2 h-4 w-4" />
            Enviar para Direção
          </DropdownMenuItem>
        )}

        {/* Aprovação da direção - apenas se pendente aprovação da direção */}
        {negotiation.approval_level === 'pending_director_approval' && isDirector() && (
          <>
            <DropdownMenuItem onClick={() => handleDirectorAction('approve')} className="text-green-600 focus:text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprovar como Diretor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDirectorAction('reject')} className="text-red-600 focus:text-red-600">
              <XCircle className="mr-2 h-4 w-4" />
              Rejeitar como Diretor
            </DropdownMenuItem>
          </>
        )}

        {/* Aprovação interna - apenas se submetido */}
        {negotiation.status === 'submitted' && canApproveInternally() && (
          <>
            <DropdownMenuItem onClick={() => handleInternalAction('approve')} className="text-green-600 focus:text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprovar Internamente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleInternalAction('reject')} className="text-red-600 focus:text-red-600">
              <XCircle className="mr-2 h-4 w-4" />
              Rejeitar Internamente
            </DropdownMenuItem>
          </>
        )}

        {/* Aprovação externa - apenas se aprovado internamente */}
        {negotiation.status === 'approved' && canApproveExternally() && (
          <DropdownMenuItem onClick={() => router.push(`/negotiations/${negotiation.id}`)}>
            <UserCheck className="mr-2 h-4 w-4" />
            Aprovar/Rejeitar Externamente
          </DropdownMenuItem>
        )}

        {/* Marcar como formalizada - apenas se aprovado e pendente aditivo */}
        {negotiation.formalization_status === 'pending_aditivo' && isCommercial() && (
          <DropdownMenuItem onClick={handleMarkAsFormalized}>
            <FileCheck className="mr-2 h-4 w-4" />
            Marcar como Formalizada
          </DropdownMenuItem>
        )}

        {/* Gerar contrato - apenas se aprovado ou completo */}
        {(negotiation.status === 'approved' || negotiation.status === 'complete' || negotiation.status === 'partially_complete') && isCommercial() && (
          <DropdownMenuItem onClick={handleGenerateContract}>
            <FileText className="mr-2 h-4 w-4" />
            Gerar Contrato
          </DropdownMenuItem>
        )}

        {/* Reenviar notificações - apenas se submetido */}
        {negotiation.status === 'submitted' && isCommercial() && (
          <DropdownMenuItem onClick={handleResendNotifications}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reenviar Notificações
          </DropdownMenuItem>
        )}

        {/* Bifurcar - apenas se permitido */}
        {hasRole(['commercial_manager', 'super_admin', 'director']) && 
         (negotiation.status === 'submitted' || negotiation.status === 'partially_approved') && 
         onShowForkDialog && (
          <DropdownMenuItem onClick={() => onShowForkDialog(negotiation)}>
            <GitFork className="mr-2 h-4 w-4" />
            Bifurcar Negociação
          </DropdownMenuItem>
        )}

        {/* Cancelar - apenas se não estiver finalizada */}
        {!['complete', 'rejected', 'cancelled'].includes(negotiation.status) && (
          <DropdownMenuItem onClick={handleCancel} className="text-red-600 focus:text-red-600">
            <Ban className="mr-2 h-4 w-4" />
            Cancelar Negociação
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}