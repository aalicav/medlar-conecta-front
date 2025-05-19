import React, { useState } from 'react';
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, GitBranch, Plus, X } from 'lucide-react';
import { Negotiation, negotiationService, NegotiationItem } from '@/app/services/negotiationService';
import { useToast } from '@/components/ui/use-toast';
import { ForkGroupItem } from '../services/types';
import { Badge } from '@/components/ui/badge';

interface NegotiationForkDialogProps {
  negotiation: Negotiation;
  onComplete: () => void;
}

export function NegotiationForkDialog({ negotiation, onComplete }: NegotiationForkDialogProps) {
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  
  // Estados para controlar os grupos de itens
  const [groups, setGroups] = useState<Array<{
    title: string;
    notes: string;
    itemIds: number[];
  }>>([
    { title: '', notes: '', itemIds: [] }
  ]);

  // Estado para controlar quais itens já foram selecionados
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());

  // Adicionar um novo grupo
  const addGroup = () => {
    setGroups([...groups, { title: '', notes: '', itemIds: [] }]);
  };

  // Remover um grupo
  const removeGroup = (index: number) => {
    // Remover os IDs selecionados deste grupo do conjunto de IDs selecionados
    const updatedSelectedIds = new Set(selectedItemIds);
    groups[index].itemIds.forEach(id => updatedSelectedIds.delete(id));
    
    const updatedGroups = [...groups];
    updatedGroups.splice(index, 1);
    
    setGroups(updatedGroups);
    setSelectedItemIds(updatedSelectedIds);
  };

  // Atualizar título ou notas de um grupo
  const updateGroupField = (index: number, field: 'title' | 'notes', value: string) => {
    const updatedGroups = [...groups];
    updatedGroups[index][field] = value;
    setGroups(updatedGroups);
  };

  // Atualizar os itens selecionados em um grupo
  const updateGroupItems = (groupIndex: number, itemId: number, checked: boolean) => {
    const updatedGroups = [...groups];
    const currentGroup = updatedGroups[groupIndex];
    
    // Atualizar o conjunto de IDs selecionados
    const updatedSelectedIds = new Set(selectedItemIds);
    
    if (checked) {
      // Adicionar item ao grupo e ao conjunto de selecionados
      if (!currentGroup.itemIds.includes(itemId)) {
        currentGroup.itemIds.push(itemId);
        updatedSelectedIds.add(itemId);
      }
    } else {
      // Remover item do grupo e do conjunto de selecionados
      currentGroup.itemIds = currentGroup.itemIds.filter(id => id !== itemId);
      updatedSelectedIds.delete(itemId);
    }
    
    setGroups(updatedGroups);
    setSelectedItemIds(updatedSelectedIds);
  };

  // Verificar se um item está selecionado em um grupo
  const isItemSelectedInGroup = (groupIndex: number, itemId: number) => {
    return groups[groupIndex].itemIds.includes(itemId);
  };

  // Verificar se um item está selecionado em outro grupo
  const isItemSelectedInOtherGroup = (groupIndex: number, itemId: number) => {
    return selectedItemIds.has(itemId) && !isItemSelectedInGroup(groupIndex, itemId);
  };

  // Validar o formulário antes de enviar
  const validateForm = (): boolean => {
    // Verificar se todos os grupos têm título
    if (groups.some(group => !group.title.trim())) {
      toast({
        title: "Atenção",
        description: "Todos os grupos devem ter um título definido",
        variant: "destructive"
      });
      return false;
    }
    
    // Verificar se todos os grupos têm pelo menos um item
    if (groups.some(group => group.itemIds.length === 0)) {
      toast({
        title: "Atenção",
        description: "Todos os grupos devem ter pelo menos um item selecionado",
        variant: "destructive"
      });
      return false;
    }
    
    // Garantir que pelo menos um item da negociação foi selecionado
    if (selectedItemIds.size === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um item para bifurcar a negociação",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  // Manipular o envio do formulário
  const handleFork = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Converter os grupos para o formato esperado pela API
      const itemGroups: ForkGroupItem[] = groups.map(group => ({
        title: group.title,
        notes: group.notes,
        items: group.itemIds
      }));
      
      await negotiationService.forkNegotiation(negotiation.id, itemGroups);
      
      toast({
        title: "Sucesso",
        description: "Negociação bifurcada com sucesso",
      });
      
      setOpen(false);
      onComplete();
    } catch (error) {
      console.error('Erro ao bifurcar negociação:', error);
      toast({
        title: "Erro",
        description: "Falha ao bifurcar negociação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Formatador de moeda
  const formatCurrency = (value: number): string => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <GitBranch className="h-4 w-4" />
          Bifurcar Negociação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bifurcar Negociação em Múltiplas</DialogTitle>
          <DialogDescription>
            Divida esta negociação em múltiplas negociações separadas, agrupando os itens da forma que preferir.
            Cada grupo criado resultará em uma nova negociação independente.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-6 py-4">
          {groups.map((group, groupIndex) => (
            <div key={groupIndex} className="border rounded-lg p-4 relative">
              <div className="absolute top-2 right-2">
                {groups.length > 1 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeGroup(groupIndex)}
                    className="h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <h3 className="font-medium mb-3">Grupo {groupIndex + 1}</h3>
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor={`group-title-${groupIndex}`}>Título da Negociação</Label>
                  <Input 
                    id={`group-title-${groupIndex}`}
                    value={group.title}
                    onChange={(e) => updateGroupField(groupIndex, 'title', e.target.value)}
                    placeholder="Ex: Negociação de Procedimentos Cardiológicos"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor={`group-notes-${groupIndex}`}>Observações (opcional)</Label>
                  <Textarea 
                    id={`group-notes-${groupIndex}`}
                    value={group.notes}
                    onChange={(e) => updateGroupField(groupIndex, 'notes', e.target.value)}
                    placeholder="Observações adicionais sobre este grupo"
                    rows={2}
                  />
                </div>
                
                <Separator />
                
                <div className="grid gap-2">
                  <Label>Itens da Negociação</Label>
                  <div className="border rounded-md p-3 max-h-60 overflow-y-auto">
                    {negotiation.items.map((item: NegotiationItem) => {
                      const isSelectedInOther = isItemSelectedInOtherGroup(groupIndex, item.id || 0);
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`flex items-start space-x-3 py-2 px-1 border-b last:border-0 
                            ${isSelectedInOther ? 'opacity-40' : ''}`}
                        >
                          <Checkbox 
                            id={`item-${groupIndex}-${item.id}`}
                            checked={isItemSelectedInGroup(groupIndex, item.id || 0)}
                            onCheckedChange={(checked) => {
                              updateGroupItems(groupIndex, item.id || 0, checked === true);
                            }}
                            disabled={isSelectedInOther}
                          />
                          <div className="grid gap-1.5 w-full">
                            <div className="flex justify-between items-start w-full">
                              <Label
                                htmlFor={`item-${groupIndex}-${item.id}`}
                                className={`font-medium ${isSelectedInOther ? 'line-through' : ''}`}
                              >
                                {item.tuss?.name || 'Item sem nome'}
                              </Label>
                              <div className="text-sm font-medium">
                                {formatCurrency(Number(item.proposed_value))}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {item.tuss?.code && (
                                <Badge variant="outline" className="text-xs">
                                  {item.tuss.code}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <Button 
            variant="outline" 
            className="w-full gap-2" 
            onClick={addGroup}
          >
            <Plus className="h-4 w-4" />
            Adicionar Outro Grupo
          </Button>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleFork} 
            disabled={loading || groups.length === 0}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Bifurcar em {groups.length} Negociação{groups.length !== 1 ? 'ções' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 