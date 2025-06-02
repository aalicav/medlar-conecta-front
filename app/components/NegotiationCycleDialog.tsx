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
import { Loader2, RefreshCw } from 'lucide-react';
import { Negotiation, negotiationService, negotiationStatusLabels } from '@/services/negotiationService';
import { useToast } from '@/components/ui/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NegotiationCycleDialogProps {
  negotiation: Negotiation;
  onComplete: () => void;
}

export function NegotiationCycleDialog({ negotiation, onComplete }: NegotiationCycleDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const handleStartNewCycle = async () => {
    setLoading(true);
    try {
      await negotiationService.startNewCycle(negotiation.id);
      toast({
        title: "Sucesso",
        description: "Novo ciclo de negociação iniciado com sucesso",
      });
      setOpen(false);
      onComplete();
    } catch (error) {
      console.error('Erro ao iniciar novo ciclo de negociação:', error);
      toast({
        title: "Erro",
        description: "Falha ao iniciar novo ciclo de negociação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar a data em formato brasileiro
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  };

  // Verificar se existem ciclos anteriores
  const hasPreviousCycles = negotiation.previous_cycles_data && 
                           Array.isArray(negotiation.previous_cycles_data) && 
                           negotiation.previous_cycles_data.length > 0;

  // Garantir que previous_cycles_data seja um array, mesmo se for undefined
  const previousCycles = Array.isArray(negotiation.previous_cycles_data) 
    ? negotiation.previous_cycles_data 
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Iniciar Novo Ciclo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Iniciar Novo Ciclo de Negociação</DialogTitle>
          <DialogDescription>
            Esta ação iniciará um novo ciclo de negociação baseado na atual. 
            Os itens serão resetados para o status pendente mantendo os valores originais propostos.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 py-4">
          <div className="flex flex-col space-y-2">
            <p className="text-sm">
              <strong>Ciclo atual:</strong> {negotiation.negotiation_cycle} de {negotiation.max_cycles_allowed}
            </p>
            <p className="text-sm text-gray-500">
              Iniciar um novo ciclo permitirá renegociar os itens que não foram aprovados ou
              que receberam contra-propostas que não foram aceitas.
            </p>
          </div>

          {hasPreviousCycles && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="previous-cycles">
                <AccordionTrigger className="text-sm font-medium">
                  Histórico de Ciclos Anteriores
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 text-sm">
                    {previousCycles.map((cycle: any, index: number) => (
                      <div key={index} className="border rounded-md p-3 bg-muted/20">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-medium">Ciclo {index + 1}</p>
                          <Badge variant={
                            cycle.status === 'complete' ? 'default' : 
                            cycle.status === 'partially_complete' ? 'warning' : 
                            cycle.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {negotiationStatusLabels[cycle.status]}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Data: {formatDate(cycle.end_date)}</p>
                          {cycle.notes && <p>Observações: {cycle.notes}</p>}
                          <div className="mt-2">
                            <p>Resumo:</p>
                            <ul className="ml-4 list-disc space-y-0.5 mt-1">
                              <li>Total de itens: {cycle.total_items || 0}</li>
                              <li>Aprovados: {cycle.approved_items || 0}</li>
                              <li>Rejeitados: {cycle.rejected_items || 0}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleStartNewCycle}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Iniciar Novo Ciclo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 