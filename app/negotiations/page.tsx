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
  FileCheck,
  Edit,
  Info
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import type { ApiResponse, ForkGroupItem } from '@/app/types/api';
import { 
  type Negotiation, 
  type NegotiationStatus,
} from '@/types/negotiations';

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
import { NegotiationActions } from '@/app/negotiations/components/NegotiationActions';
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
import { Role, NegotiationApprovalRequest } from '../types/negotiations';
import { DataTable } from "@/components/data-table/data-table";
import { formatDateTime } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { fetchResource } from '@/services/resource-service';
import { ColumnDef } from '@tanstack/react-table';

interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface PaginatedApiResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

interface User {
  id: number;
  entity_id?: number;
  roles: string[];
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
  cancelled: 'Cancelado',
  forked: 'Negociação Bifurcada',
  expired: 'Negociação Expirada',
  pending_approval: 'Aguardando Aprovação',
  pending_director_approval: 'Aguardando Aprovação da Direção'
};

// Updated status variant mapping
const getStatusVariant = (status: NegotiationStatus): "default" | "secondary" | "destructive" | "outline" | null => {
  switch (status) {
    case 'approved':
    case 'complete':
      return 'default'; // was 'success'
    case 'rejected':
      return 'destructive';
    case 'pending':
    case 'pending_approval':
    case 'pending_director_approval':
    case 'partially_complete':
    case 'partially_approved':
      return 'outline'; // was 'warning'
    case 'forked':
    case 'expired':
      return 'secondary';
    default:
      return 'secondary';
  }
};

// Updated status description function
const getStatusDescription = (status: NegotiationStatus): string => {
  switch (status) {
    case 'draft':
      return 'Rascunho inicial aguardando envio para aprovação interna';
    case 'submitted':
      return 'Enviado para a entidade, aguardando respostas';
    case 'pending':
      return 'Em análise interna para aprovação';
    case 'approved':
      return 'Aprovado internamente, aguardando aprovação da entidade';
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
    case 'forked':
      return 'Negociação bifurcada em múltiplas';
    case 'expired':
      return 'Negociação expirada por limite de tempo';
    case 'pending_approval':
      return 'Aguardando aprovação interna';
    case 'pending_director_approval':
      return 'Aguardando aprovação da direção';
    default:
      return 'Status desconhecido';
  }
};

export default function NegotiationsPage() {
  const router = useRouter();
  const { user } = useAuth() as { user: User | null };
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
    perPage: 10,
    total: 0
  });
  const [selectedNegotiation, setSelectedNegotiation] = useState<Negotiation | null>(null);
  const [showForkDialog, setShowForkDialog] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [itemGroups, setItemGroups] = useState<ForkGroupItem[]>([
    { name: '', items: [] },
    { name: '', items: [] }
  ]);
  const [data, setData] = useState<Negotiation[]>([]);
  const [sorting, setSorting] = useState<{ column: string; direction: "asc" | "desc" }>({
    column: "created_at",
    direction: "desc",
  });

  const loadNegotiations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await negotiationService.getNegotiations({
        status: filters.status || undefined,
        entity_type: filters.entity_type || undefined,
        search: filters.search || undefined,
        page: pagination.currentPage,
        per_page: pagination.perPage
      });

      if (response?.data) {
        setNegotiations(response.data);
      }
      
      if (response?.meta) {
        setPagination(prev => ({
          ...prev,
          currentPage: response.meta?.current_page || 1,
          totalPages: response.meta?.last_page || 1,
          perPage: response.meta?.per_page || 10,
          total: response.meta?.total || 0
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
    setFilters(prev => ({ 
      ...prev, 
      status: status as NegotiationStatus | '' 
    }));
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

  const canApproveInternally = useCallback(() => {
    if (!user) return false;
    
    // Super admin pode aprovar sua própria negociação
    if (user.roles.includes('super_admin' as Role)) return true;
    
    const allowedRoles: Role[] = ['commercial_manager', 'super_admin', 'director'];
    return user?.roles.some(role => allowedRoles.includes(role as Role));
  }, [user]);

  const canApproveExternally = useCallback((negotiation: Negotiation) => {
    if (!user) return false;

    // Super admin pode aprovar externamente qualquer negociação
    if (user.roles.includes('super_admin' as Role)) return true;

    // Check if user belongs to the target entity
    const isTargetEntity = negotiation.negotiable_id === user.entity_id;
    
    switch (negotiation.negotiable_type) {
      case 'App\\Models\\HealthPlan':
        return user.roles.includes('plan_admin' as Role) && isTargetEntity;
      case 'App\\Models\\Professional':
        return user.roles.includes('professional' as Role) && isTargetEntity;
      case 'App\\Models\\Clinic':
        return user.roles.includes('clinic_admin' as Role) && isTargetEntity;
      default:
        return false;
    }
  }, [user]);

  const handleApproval = async (negotiation: Negotiation, approved: boolean, isInternal: boolean) => {
    try {
      setLoading(true);
      
      const approvalData: NegotiationApprovalRequest = {
        approved,
        approval_notes: approved ? 'Aprovado internamente' : 'Rejeitado internamente'
      };
      
      if (isInternal) {
        await negotiationService.processApproval(negotiation.id, approvalData);
        
        toast({
          title: "Sucesso",
          description: `Negociação ${approved ? 'aprovada' : 'rejeitada'} internamente com sucesso`,
        });
      } else {
        await negotiationService.processExternalApproval(negotiation.id, {
          ...approvalData,
          approval_notes: approved ? 'Aprovado pela entidade' : 'Rejeitado pela entidade',
          approved_items: negotiation.items.map(item => ({
            item_id: item.id,
            approved_value: Number(item.proposed_value)
          }))
        });
        
        toast({
          title: "Sucesso",
          description: `Negociação ${approved ? 'aprovada' : 'rejeitada'} pela entidade com sucesso`,
        });
      }
      
      await loadNegotiations();
    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: "Erro",
        description: "Falha ao processar aprovação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        per_page: pagination.perPage,
        sort_by: sorting.column,
        sort_order: sorting.direction,
        status: filters.status || undefined,
        entity_type: filters.entity_type || undefined,
        search: filters.search || undefined,
      };

      const response = await fetchResource<Negotiation[]>("negotiations", params);

      if (response?.data) {
        setData(response.data);
      }
      
      if (response?.meta) {
        setPagination(prev => ({
          ...prev,
          currentPage: response.meta?.current_page || 1,
          totalPages: response.meta?.last_page || 1,
          perPage: response.meta?.per_page || 10,
          total: response.meta?.total || 0
        }));
      }
    } catch (error) {
      console.error("Error fetching negotiations:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as negociações",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [pagination.currentPage, pagination.perPage, sorting, filters]);

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination(prev => ({
      ...prev,
      currentPage: page,
      perPage: pageSize,
    }));
  };

  const handleSortingChange = (column: string, direction: "asc" | "desc") => {
    setSorting({ column, direction });
  };

  const handleFilterChange = (columnId: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnId]: value,
    }));
    setPagination(prev => ({
      ...prev,
      currentPage: 1,
    }));
  };

  const getStatusBadge = (status: NegotiationStatus) => {
    const label = statusLabels[status] || status;
    const variant = getStatusVariant(status) || "secondary";
    const description = getStatusDescription(status);

    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant={variant}>{label}</Badge>
        </TooltipTrigger>
        <TooltipContent>
          {description}
        </TooltipContent>
      </Tooltip>
    );
  };

  const columns: ColumnDef<Negotiation>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "negotiable_name",
      header: "Profissional/Estabelecimento",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("negotiable_name")}>
          {row.getValue("negotiable_name")}
          <div className="text-xs text-muted-foreground">
            {row.original.negotiable_type === "App\\Models\\Professional" ? "Profissional" : "Estabelecimento"}
            
          </div>
          {row.original.negotiable.name}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "procedure",
      header: "Procedimentos",
      cell: ({row}) => {
        const items = row.original.items || [];
        return (
          <div className="flex items-center gap-2">
            <div className="font-medium">{items.length} procedimento{items.length !== 1 ? 's' : ''}</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Info className="h-4 w-4" />
                  <span className="sr-only">Ver detalhes dos procedimentos</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[400px] p-4">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="text-sm">
                      <div className="font-medium">{item.tuss.description}</div>
                      <div className="text-muted-foreground">Código TUSS: {item.tuss.code}</div>
                      <div className="text-muted-foreground">Valor: R$ {Number(item.proposed_value).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      accessorKey: "total_value",
      header: "Valor",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          R$ {Number(row.getValue("total_value")).toFixed(2)}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
      enableSorting: true,
    },
    {
      accessorKey: "created_at",
      header: "Criado em",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          {formatDateTime(row.getValue("created_at"))}
        </div>
      ),
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const negotiation = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/negotiations/${negotiation.id}`)}
                >
                  <FileText className="h-4 w-4" />
                  <span className="sr-only">Ver detalhes</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver detalhes</TooltipContent>
            </Tooltip>

            <NegotiationActions
              negotiation={negotiation}
              onActionComplete={loadNegotiations}
              onShowForkDialog={(negotiation) => {
                setSelectedNegotiation(negotiation);
                setSelectedItems([]);
                setShowForkDialog(true);
              }}
            />
          </div>
        );
      },
    },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Negociações</h1>
            <p className="text-muted-foreground">Gerencie as negociações de preços com profissionais e clínicas</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => router.push('/negotiations/extemporaneous')}>
              <Clock className="mr-2 h-4 w-4" />
              Negociações Extemporâneas
            </Button>
            <Button onClick={() => router.push('/negotiations/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Negociação
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Use os filtros abaixo para encontrar negociações específicas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Tipo</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={filters.entity_type}
                  onChange={(e) => handleFilterChange("entity_type", e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="App\\Models\\Professional">Profissional</option>
                  <option value="App\\Models\\Clinic">Estabelecimento</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar negociações..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <DataTable
          columns={columns}
          data={data}
          onPaginationChange={handlePaginationChange}
          onSortingChange={(sorting) => {
            if (sorting.length > 0) {
              handleSortingChange(sorting[0].id, sorting[0].desc ? "desc" : "asc");
            }
          }}
          onFilterChange={handleFilterChange}
          pageCount={pagination.totalPages}
          currentPage={pagination.currentPage}
          pageSize={pagination.perPage}
          totalItems={pagination.total}
          isLoading={loading}
        />
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
    </TooltipProvider>
  );
}