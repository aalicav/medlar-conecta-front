import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Negotiation, NegotiationStatus, negotiationService, negotiationStatusLabels } from '@/services/negotiationService';
import { useToast } from '@/components/ui/use-toast';

interface RollbackStatusDialogProps {
  negotiation: Negotiation;
  onComplete: () => void;
}

export function RollbackStatusDialog({ negotiation, onComplete }: RollbackStatusDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [targetStatus, setTargetStatus] = React.useState<'draft' | 'submitted' | 'pending'>('submitted');
  const [reason, setReason] = React.useState('');
  const { toast } = useToast();

  // Determinar quais status são válidos para rollback a partir do status atual
  const getValidTargetStatuses = (): Array<'draft' | 'submitted' | 'pending'> => {
    const statusMap: Record<NegotiationStatus, Array<'draft' | 'submitted' | 'pending'>> = {
      'pending': ['submitted', 'draft'],
      'approved': ['pending', 'submitted'],
      'partially_approved': ['submitted'],
      'draft': [],
      'submitted': [],
      'complete': [],
      'partially_complete': [],
      'rejected': [],
      'cancelled': []
    };

    return statusMap[negotiation.status] || [];
  };

  const validStatuses = getValidTargetStatuses();

  const handleRollback = async () => {
    if (!reason) {
      toast({
        title: "Atenção",
        description: "O motivo da reversão é obrigatório",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await negotiationService.rollbackStatus(negotiation.id, targetStatus, reason);
      toast({
        title: "Sucesso",
        description: `Status revertido com sucesso para ${negotiationStatusLabels[targetStatus]}`,
      });
      setOpen(false);
      onComplete();
    } catch (error) {
      console.error('Erro ao reverter status da negociação:', error);
      toast({
        title: "Erro",
        description: "Falha ao reverter status da negociação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Se não houver status válidos para rollback, não renderiza o componente
  if (validStatuses.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Reverter Status
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reverter Status da Negociação</DialogTitle>
          <DialogDescription>
            Escolha para qual status você deseja reverter e informe o motivo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="target-status">Status alvo</Label>
            <Select 
              value={targetStatus}
              onValueChange={(value) => setTargetStatus(value as 'draft' | 'submitted' | 'pending')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Escolha o status" />
              </SelectTrigger>
              <SelectContent>
                {validStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {negotiationStatusLabels[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="reason">Motivo da reversão</Label>
            <Textarea
              id="reason"
              placeholder="Informe o motivo para reverter o status"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleRollback}
            disabled={loading || !reason}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reverter Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 