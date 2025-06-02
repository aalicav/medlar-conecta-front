import { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, TrendingUp, DollarSign, Copy, Percent } from 'lucide-react';
import { NegotiationItem, negotiationService } from '@/services/negotiationService';
import { useToast } from '@/components/ui/use-toast';

interface BatchCounterOfferDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  items: NegotiationItem[];
  negotiationId: number;
  onSuccess: () => void;
}

export function BatchCounterOfferDialog({
  isOpen,
  onOpenChange,
  items,
  negotiationId,
  onSuccess
}: BatchCounterOfferDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [counterValues, setCounterValues] = useState<{[key: number]: number}>({});
  const [globalNote, setGlobalNote] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'fixed' | 'percentage'>('fixed');
  const [adjustmentValue, setAdjustmentValue] = useState(0);

  useEffect(() => {
    // Initialize counter values with current proposed values
    const initialValues: {[key: number]: number} = {};
    items.forEach(item => {
      if (item.id) {
        initialValues[item.id] = item.proposed_value;
      }
    });
    setCounterValues(initialValues);
  }, [items]);

  const handleSelectItem = (itemId: number) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };
  
  const handleSelectAll = () => {
    if (selectedItems.length === items.filter(i => i.status === 'pending').length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.filter(i => i.status === 'pending').map(i => i.id!));
    }
  };

  const handleCounterValueChange = (itemId: number, value: number) => {
    setCounterValues(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const handleApplyAdjustment = () => {
    const newValues = { ...counterValues };
    
    selectedItems.forEach(itemId => {
      const item = items.find(i => i.id === itemId);
      if (item) {
        if (adjustmentType === 'fixed') {
          // Apply fixed value to all selected items
          newValues[itemId] = adjustmentValue;
        } else {
          // Apply percentage adjustment
          const originalValue = item.proposed_value;
          const percentAdjustment = adjustmentValue / 100;
          newValues[itemId] = originalValue * (1 + percentAdjustment);
        }
      }
    });
    
    setCounterValues(newValues);
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos um item para enviar contraproposta",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setLoading(true);
      
      const batchItems = selectedItems.map(itemId => ({
        item_id: itemId,
        counter_value: counterValues[itemId],
        notes: globalNote
      }));
      
      await negotiationService.batchCounterOffer(negotiationId, batchItems);
      
      toast({
        title: "Sucesso",
        description: `Contraproposta enviada para ${selectedItems.length} ${selectedItems.length === 1 ? 'item' : 'itens'}`,
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao enviar contraproposta em lote:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar contraproposta em lote",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter only pending items
  const pendingItems = items.filter(item => item.status === 'pending');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            Contraproposta em Lote
          </DialogTitle>
          <DialogDescription>
            Envie contrapropostas para múltiplos itens de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="bg-muted/30 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-medium">Ajuste em Lote</h3>
            
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <Label htmlFor="adjustment-type">Tipo de Ajuste</Label>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="fixed" 
                      name="adjustment-type" 
                      checked={adjustmentType === 'fixed'} 
                      onChange={() => setAdjustmentType('fixed')}
                    />
                    <Label htmlFor="fixed" className="cursor-pointer">Valor Fixo</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      id="percentage" 
                      name="adjustment-type" 
                      checked={adjustmentType === 'percentage'} 
                      onChange={() => setAdjustmentType('percentage')}
                    />
                    <Label htmlFor="percentage" className="cursor-pointer">Percentual</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <Label htmlFor="adjustment-value">
                  {adjustmentType === 'fixed' ? 'Valor (R$)' : 'Percentual (%)'}
                </Label>
                <div className="relative mt-1.5">
                  <Input 
                    id="adjustment-value"
                    type="number"
                    step={adjustmentType === 'fixed' ? "0.01" : "1"}
                    value={adjustmentValue}
                    onChange={(e) => setAdjustmentValue(parseFloat(e.target.value) || 0)}
                    className="pl-8"
                  />
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center text-muted-foreground">
                    {adjustmentType === 'fixed' ? 'R$' : '%'}
                  </div>
                </div>
              </div>
              
              <Button onClick={handleApplyAdjustment} type="button" variant="secondary">
                Aplicar aos Selecionados
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="global-notes" className="mb-2 block">Observação para Todos os Itens</Label>
            <Textarea 
              id="global-notes"
              value={globalNote}
              onChange={(e) => setGlobalNote(e.target.value)}
              placeholder="Observação que será aplicada a todos os itens selecionados"
              className="min-h-[80px]"
            />
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={selectedItems.length === pendingItems.length && pendingItems.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead className="text-right">Valor Proposto</TableHead>
                  <TableHead className="text-right">Contraproposta</TableHead>
                  <TableHead>Diferença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      Nenhum item pendente disponível para contraproposta
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingItems.map(item => {
                    const itemId = item.id!;
                    const isSelected = selectedItems.includes(itemId);
                    const originalValue = item.proposed_value;
                    const counterValue = counterValues[itemId] || 0;
                    const diffPercent = originalValue > 0 
                      ? ((counterValue - originalValue) / originalValue) * 100 
                      : 0;
                    
                    return (
                      <TableRow key={itemId} className={isSelected ? "bg-secondary/10" : undefined}>
                        <TableCell>
                          <Checkbox 
                            checked={isSelected}
                            onCheckedChange={() => handleSelectItem(itemId)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{item.tuss?.name}</div>
                          <div className="text-xs text-muted-foreground">{item.tuss?.code}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          R$ {originalValue.toFixed(2).replace('.', ',')}
                        </TableCell>
                        <TableCell>
                          <div className="relative">
                            <Input 
                              type="number"
                              step="0.01"
                              min="0"
                              value={counterValue}
                              onChange={(e) => handleCounterValueChange(itemId, parseFloat(e.target.value) || 0)}
                              disabled={!isSelected}
                              className={`pl-8 ${isSelected ? 'border-secondary' : ''}`}
                            />
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center text-muted-foreground">
                              R$
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`text-sm flex items-center ${
                            diffPercent > 0 ? 'text-green-600' : 
                            diffPercent < 0 ? 'text-red-600' : 'text-muted-foreground'
                          }`}>
                            {diffPercent !== 0 && (
                              <>
                                {diffPercent > 0 ? '+' : ''}
                                {diffPercent.toFixed(2).replace('.', ',')}%
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || selectedItems.length === 0}
            className="bg-secondary hover:bg-secondary/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Enviar Contraproposta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 