"use client"

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Filter,
  FileDown,
  Loader2,
  GitFork,
  Clock,
  FileCheck
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import type { ApiResponse } from '@/app/types/api';
import { 
  Negotiation, 
  NegotiationStatus,
  type ForkGroupItem
} from '@/services/negotiationService';

import { negotiationService } from '@/services/negotiationService';

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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useAuth } from '@/contexts/auth-context';
import { NegotiationItemActions } from '@/app/negotiations/components/NegotiationItemActions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Updated status labels to match backend
const statusLabels: Record<NegotiationStatus, string> = {
  draft: 'Rascunho',
  submitted: 'Enviado para Entidade',
  pending: 'Em Análise Interna',
  approved: 'Aprovado Internamente',
  complete: 'Aprovado pela Entidade',
  partially_complete: 'Parcialmente Aprovado pela Entidade',
  partially_approved: 'Parcialmente Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado'
};

// Updated status variant mapping
const getStatusVariant = (status: NegotiationStatus): "default" | "secondary" | "destructive" | "outline" | "warning" => {
  switch (status) {
    case 'draft': return 'outline';
    case 'submitted': return 'secondary';
    case 'pending': return 'warning';
    case 'complete': return 'default';
    case 'partially_complete': return 'warning';
    case 'approved': return 'default';
    case 'partially_approved': return 'warning';
    case 'rejected': return 'destructive';
    case 'cancelled': return 'outline';
    default: return 'outline';
  }
};

// Updated status description function
const getStatusDescription = (status: NegotiationStatus): string => {
  switch (status) {
    case 'draft':
      return 'Rascunho inicial aguardando envio para aprovação interna';
    case 'submitted':
      return 'Em análise pela entidade, aguardando respostas para envio à aprovação interna';
    case 'pending':
      return 'Em análise interna para aprovação';
    case 'approved':
      return 'Aprovado internamente, negociação enviada automaticamente à entidade para aprovação final';
    case 'complete':
      return 'Aprovado pela entidade (aprovação completa)';
    case 'partially_complete':
      return 'Parcialmente aprovado pela entidade';
    case 'partially_approved':
      return 'Alguns itens foram aprovados, outros rejeitados';
    case 'rejected':
      return 'Rejeitado internamente ou pela entidade';
    case 'cancelled':
      return 'Cancelado manualmente';
    default:
      return 'Status desconhecido';
  }
};

export default function NegotiationList() {
  const { toast } = useToast();
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    entity_type: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10
  });
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
  const [showForkDialog, setShowForkDialog] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [itemGroups, setItemGroups] = useState<ForkGroupItem[]>([
    { name: '', items: [] },
    { name: '', items: [] }
  ]);

  const loadNegotiations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await negotiationService.getNegotiations({
        status: filters.status as NegotiationStatus,
        entity_type: filters.entity_type,
        search: filters.search,
        page: pagination.currentPage,
        per_page: pagination.perPage
      });

      if (response.data) {
        setNegotiations(response.data);
        setPagination(prev => ({
          ...prev,
          currentPage: response.meta?.current_page || prev.currentPage,
          totalPages: response.meta?.last_page || prev.totalPages,
          perPage: response.meta?.per_page || prev.perPage
        }));
      }
    } catch (error) {
      console.error('Error loading negotiations:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar negociações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.currentPage, pagination.perPage, toast]);

  useEffect(() => {
    loadNegotiations();
  }, [loadNegotiations]);

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleEntityTypeChange = (entityType: string) => {
    setFilters(prev => ({ ...prev, entity_type: entityType }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleFork = async () => {
    if (!selectedNegotiation) return;

    try {
      await negotiationService.forkNegotiation(selectedNegotiation.id, itemGroups);
      
      toast({
        title: "Sucesso",
        description: "Negociação bifurcada com sucesso",
      });
      
      setShowForkDialog(false);
      setItemGroups([
        { name: '', items: [] },
        { name: '', items: [] }
      ]);
      setSelectedNegotiation(null);
      loadNegotiations();
    } catch (error) {
      console.error('Error forking negotiation:', error);
      toast({
        title: "Erro",
        description: "Falha ao bifurcar negociação",
        variant: "destructive"
      });
    }
  };

  const handleItemGroupChange = (groupIndex: number, itemId: number) => {
    setItemGroups(prev => {
      const newGroups = [...prev];
      const currentGroup = newGroups[groupIndex];
      
      // Remove item from all groups first
      newGroups.forEach(group => {
        group.items = group.items.filter(id => id !== itemId);
      });
      
      // Add to selected group
      if (!currentGroup.items.includes(itemId)) {
        currentGroup.items.push(itemId);
      }
      
      return newGroups;
    });
  };

  const handleTitleChange = (groupIndex: number, title: string) => {
    setItemGroups(prev => {
      const newGroups = [...prev];
      newGroups[groupIndex].name = title;
      return newGroups;
    });
  };

  const handleAction = async (negotiation: Negotiation, action: string) => {
    try {
      switch (action) {
        case 'submit':
          await negotiationService.submitForApproval(negotiation.id);
          toast({
            title: "Sucesso",
            description: "Negociação enviada para aprovação",
          });
          break;
        case 'cancel':
          await negotiationService.cancelNegotiation(negotiation.id);
          toast({
            title: "Sucesso",
            description: "Negociação cancelada com sucesso",
          });
          break;
        case 'complete':
          await negotiationService.markAsComplete(negotiation.id);
          toast({
            title: "Sucesso",
            description: "Negociação marcada como completa",
          });
          break;
        case 'partially_complete':
          await negotiationService.markAsPartiallyComplete(negotiation.id);
          toast({
            title: "Sucesso",
            description: "Negociação marcada como parcialmente completa",
          });
          break;
        case 'new_cycle':
          await negotiationService.startNewCycle(negotiation.id);
          toast({
            title: "Sucesso",
            description: "Novo ciclo iniciado com sucesso",
          });
          break;
        case 'fork':
          setSelectedNegotiation(negotiation);
          setSelectedItems([]);
          setShowForkDialog(true);
          break;
      }
      if (action !== 'fork') {
        loadNegotiations();
      }
    } catch (error) {
      console.error('Error performing action:', error);
      toast({
        title: "Erro",
        description: "Falha ao executar ação",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/negotiations/new" className="shrink-0">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Negociação
          </Button>
        </Link>
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar negociações..."
              value={filters.search}
              onChange={handleSearch}
              className="w-full pl-10"
            />
          </div>
        </div>
        <Select
          value={filters.status}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.entity_type}
          onValueChange={handleEntityTypeChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="App\Models\HealthPlan">Plano de Saúde</SelectItem>
            <SelectItem value="App\Models\Professional">Profissional</SelectItem>
            <SelectItem value="App\Models\Clinic">Clínica</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data Início</TableHead>
              <TableHead>Data Fim</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : negotiations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-muted-foreground">
                    Nenhuma negociação encontrada
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              negotiations.map((negotiation) => (
                <TableRow key={negotiation.id}>
                  <TableCell>
                    <Link 
                      href={`/negotiations/${negotiation.id}`}
                      className="font-medium hover:underline"
                    >
                      {negotiation.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {negotiation.negotiable?.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(negotiation.status)}>
                      {statusLabels[negotiation.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(negotiation.start_date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(negotiation.end_date), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem asChild>
                          <Link href={`/negotiations/${negotiation.id}`} className="flex items-center">
                            <FileText className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>

                        {negotiation.status === 'draft' && (
                          <DropdownMenuItem onClick={() => handleAction(negotiation, 'submit')} className="text-blue-600 focus:text-blue-600">
                            <FileCheck className="mr-2 h-4 w-4" />
                            Enviar para Aprovação
                          </DropdownMenuItem>
                        )}

                        {negotiation.status === 'submitted' && (
                          <DropdownMenuItem onClick={() => handleAction(negotiation, 'cancel')} className="text-red-600 focus:text-red-600">
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar
                          </DropdownMenuItem>
                        )}

                        {negotiation.status === 'approved' && (
                          <>
                            <DropdownMenuItem onClick={() => handleAction(negotiation, 'complete')} className="text-green-600 focus:text-green-600">
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Marcar como Completo
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAction(negotiation, 'partially_complete')} className="text-yellow-600 focus:text-yellow-600">
                              <Clock className="mr-2 h-4 w-4" />
                              Marcar como Parcialmente Completo
                            </DropdownMenuItem>
                          </>
                        )}

                        {(negotiation.status === 'complete' || negotiation.status === 'partially_complete') && negotiation.negotiation_cycle < negotiation.max_cycles_allowed && (
                          <DropdownMenuItem onClick={() => handleAction(negotiation, 'new_cycle')} className="text-blue-600 focus:text-blue-600">
                            <Clock className="mr-2 h-4 w-4" />
                            Iniciar Novo Ciclo
                          </DropdownMenuItem>
                        )}

                        {negotiation.status !== 'draft' && negotiation.status !== 'cancelled' && (
                          <DropdownMenuItem onClick={() => handleAction(negotiation, 'fork')} className="text-purple-600 focus:text-purple-600">
                            <GitFork className="mr-2 h-4 w-4" />
                            Bifurcar Negociação
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showForkDialog} onOpenChange={setShowForkDialog}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Bifurcar Negociação</DialogTitle>
            <DialogDescription>
              Divida os itens em pelo menos dois grupos para criar novas negociações
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {itemGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="border rounded-lg p-4">
                <div className="mb-4">
                  <Label htmlFor={`group-${groupIndex}-title`}>Título do Grupo {groupIndex + 1}</Label>
                  <Input
                    id={`group-${groupIndex}-title`}
                    value={group.name}
                    onChange={(e) => handleTitleChange(groupIndex, e.target.value)}
                    placeholder="Digite o título da nova negociação"
                    className="mt-1"
                  />
                </div>
                <div className="space-y-2">
                  {selectedNegotiation?.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`group-${groupIndex}-item-${item.id}`}
                        checked={group.items.includes(item.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleItemGroupChange(groupIndex, item.id);
                          }
                        }}
                      />
                      <Label htmlFor={`group-${groupIndex}-item-${item.id}`} className="flex-1">
                        {item.tuss.description} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.proposed_value))}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowForkDialog(false);
                setItemGroups([
                  { name: '', items: [] },
                  { name: '', items: [] }
                ]);
                setSelectedNegotiation(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleFork}
              disabled={itemGroups.some(group => !group.name || group.items.length === 0)}
            >
              Bifurcar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
};