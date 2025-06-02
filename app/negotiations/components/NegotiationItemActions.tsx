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
  const [isLoading, setIsLoading] = useState(false);

  if (!negotiation || !item) {
    return null;
  }

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!item.id) return;

    try {
      setIsLoading(true);
      
      await negotiationService.respondToItem(item.id, {
        status: action === 'approve' ? 'approved' : 'rejected' as NegotiationItemStatus,
        approved_value: action === 'approve' ? item.proposed_value : undefined,
        notes: action === 'approve' ? 'Aprovado' : 'Rejeitado'
      });

      toast({
        title: "Sucesso",
        description: `Item ${action === 'approve' ? 'aprovado' : 'rejeitado'} com sucesso`,
      });
      
      onActionComplete();
    } catch (error) {
      console.error('Error performing action:', error);
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
        
        {item.status === 'pending' && negotiation.status === 'submitted' && onShowCounterOfferDialog && (
          <DropdownMenuItem onClick={() => onShowCounterOfferDialog(item)} className="text-blue-600 focus:text-blue-600">
            <TrendingUp className="mr-2 h-4 w-4" />
            Fazer Contraproposta
          </DropdownMenuItem>
        )}
        
        {item.status === 'counter_offered' && negotiation.status === 'submitted' && onShowResponseDialog && (
          <DropdownMenuItem onClick={() => onShowResponseDialog(item)} className="text-green-600 focus:text-green-600">
            <CheckCircle className="mr-2 h-4 w-4" />
            Responder Proposta
          </DropdownMenuItem>
        )}
        
        {item.status === 'pending' && negotiation.status === 'submitted' && (
          <>
            <DropdownMenuItem onClick={() => handleAction('approve')} className="text-green-600 focus:text-green-600">
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprovar Item
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAction('reject')} className="text-red-600 focus:text-red-600">
              <XCircle className="mr-2 h-4 w-4" />
              Rejeitar Item
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 