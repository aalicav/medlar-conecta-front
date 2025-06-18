import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  ArrowLeftRight,
  Loader2,
  DollarSign,
  AlertCircle,
  MoreVertical,
  FileText,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { negotiationService } from '@/services/negotiationService';
import type { Negotiation, NegotiationItem, NegotiationItemStatus } from '@/types/negotiations';
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

interface NegotiationItemActionsProps {
  negotiation: Negotiation;
  item: NegotiationItem;
  onActionComplete: () => void;
  onShowResponseDialog?: (item: NegotiationItem) => void;
  onShowCounterOfferDialog?: (item: NegotiationItem) => void;
}

export function NegotiationItemActions({ 
  negotiation,
  item,
  onActionComplete,
  onShowResponseDialog,
  onShowCounterOfferDialog
}: NegotiationItemActionsProps) {
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  if (!negotiation || !item) {
    return null;
  }

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

  // Verifica se o usuário pode aprovar internamente
  const canApproveInternally = () => {
    if (!user) return false;
    
    // Super admin pode aprovar sua própria negociação
    if (hasRole('super_admin')) return true;
    
    // Não pode aprovar sua própria negociação (exceto super admin)
    if (negotiation.creator.id === user.id) return false;

    // Precisa ter uma das roles permitidas
    return hasRole(['commercial_manager', 'super_admin', 'director']);
  };

  // Função para lidar com aprovação/rejeição externa
  const handleExternalAction = async (action: 'approve' | 'reject') => {
    if (!item.id) return;

    try {
      setIsLoading(true);
      
      if (!canApproveExternally()) {
        toast({
          title: "Erro",
          description: "Você não tem permissão para aprovar/rejeitar itens desta negociação",
          variant: "destructive"
        });
        return;
      }

      await negotiationService.processExternalApproval(negotiation.id, {
        approved: action === 'approve',
        approval_notes: action === 'approve' ? 'Aprovado pela entidade' : 'Rejeitado pela entidade',
        approved_items: action === 'approve' ? [{
          item_id: item.id,
          approved_value: Number(item.proposed_value)
        }] : []
      });

      toast({
        title: "Sucesso",
        description: `Item ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso`,
      });
      
      onActionComplete();
    } catch (error) {
      console.error('Error performing external action:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar ação",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Função para lidar com aprovação/rejeição interna
  const handleInternalAction = async (action: 'approve' | 'reject') => {
    if (!item.id) return;

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
        description: `Item ${action === 'approve' ? 'aprovado' : 'rejeitado'} internamente com sucesso`,
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
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Ações do Item</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Ações de aprovação externa */}
        {item.status === 'pending' && negotiation.status === 'submitted' && onShowCounterOfferDialog && canApproveExternally() && (
          <DropdownMenuItem onClick={() => onShowCounterOfferDialog(item)} className="text-blue-600 focus:text-blue-600">
            <TrendingUp className="mr-2 h-4 w-4" />
            Fazer Contraproposta
          </DropdownMenuItem>
        )}
        
        {item.status === 'counter_offered' && negotiation.status === 'submitted' && onShowResponseDialog && canApproveExternally() && (
          <DropdownMenuItem onClick={() => onShowResponseDialog(item)} className="text-green-600 focus:text-green-600">
            <CheckCircle className="mr-2 h-4 w-4" />
            Responder Proposta
          </DropdownMenuItem>
        )}
        
        {item.status === 'pending' && negotiation.status === 'approved' && canApproveExternally() && (
          <>
            <DropdownMenuItem onClick={() => handleExternalAction('approve')} className="text-green-600 focus:text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprovar Item
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExternalAction('reject')} className="text-red-600 focus:text-red-600">
              <XCircle className="mr-2 h-4 w-4" />
              Rejeitar Item
            </DropdownMenuItem>
          </>
        )}

        {/* Ações de aprovação interna */}
        {item.status === 'pending' && negotiation.status === 'submitted' && canApproveInternally() && (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 