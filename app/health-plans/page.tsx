"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { createResource, deleteResource, fetchResource, updateResource, type QueryParams } from "@/services/resource-service"
import { Plus, FileText, Edit, Trash2, List, MoreHorizontal, CheckCircle2, Search, X, Link, Link2Off, Users } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface HealthPlan {
  id: number
  name: string
  cnpj: string
  ans_code: string
  description: string
  status: string
  has_signed_contract: boolean
  created_at: string
  updated_at: string
  parent?: {
    id: number
    name: string
  }
  parent_relation_type?: string
}

export default function HealthPlansPage() {
  const router = useRouter()
  const [data, setData] = useState<HealthPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  })
  const [sorting, setSorting] = useState<{ column: string; direction: "asc" | "desc" }>({
    column: "name",
    direction: "asc",
  })
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [nameFilter, setNameFilter] = useState<string>("")
  const [cnpjFilter, setCnpjFilter] = useState<string>("")
  const [ansCodeFilter, setAnsCodeFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [hasContractFilter, setHasContractFilter] = useState<string>("")
  const [parentFilter, setParentFilter] = useState<string>("")
  
  // Modal para adicionar plano pai
  const [isParentModalOpen, setIsParentModalOpen] = useState(false)
  const [selectedHealthPlan, setSelectedHealthPlan] = useState<HealthPlan | null>(null)
  const [parentSearchTerm, setParentSearchTerm] = useState("")
  const [parentOptions, setParentOptions] = useState<HealthPlan[]>([])
  const [selectedParent, setSelectedParent] = useState<HealthPlan | null>(null)
  const [parentSearchLoading, setParentSearchLoading] = useState(false)
  const [parentRelationType, setParentRelationType] = useState("subsidiary")
  
  // Modal para confirmar remoção de vinculação
  const [isRemoveParentDialogOpen, setIsRemoveParentDialogOpen] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const params: QueryParams = {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        sort_by: sorting.column,
        sort_order: sorting.direction,
        filters: {},
        search: searchTerm
      }

      // Não use a busca geral se tivermos filtros específicos
      if (!searchTerm) {
        // Adicionar filtros individuais
        const filters: Record<string, string> = {}
        if (nameFilter) filters.name = nameFilter;
        if (cnpjFilter) filters.cnpj = cnpjFilter;
        if (ansCodeFilter) filters.ans_code = ansCodeFilter;
        if (statusFilter) filters.status = statusFilter;
        if (hasContractFilter) filters.has_signed_contract = hasContractFilter;
        if (parentFilter) filters.is_parent = parentFilter;
        
        params.filters = filters;
      }

      const response = await fetchResource<HealthPlan[]>("health-plans", params)

      setData(response.data)
      setPagination({
        ...pagination,
        pageCount: response.meta?.last_page || 0,
        total: response.meta?.total || 0,
      })
    } catch (error) {
      console.error("Error fetching health plans:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os planos de saúde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false)
    }
  }

  // Buscar planos de saúde para associação como pai
  const searchParentPlans = async (term: string) => {
    if (!term || term.length < 2) return;
    
    setParentSearchLoading(true);
    try {
      const response = await fetchResource<HealthPlan[]>("health-plans", {
        search: term,
        per_page: 5,
        filters: {
          status: "approved"
        }
      });
      
      // Filtrar para excluir o plano atual e seus descendentes (se necessário)
      const filteredOptions = response.data.filter(plan => 
        plan.id !== selectedHealthPlan?.id
      );
      
      setParentOptions(filteredOptions);
    } catch (error) {
      console.error("Error searching parent plans:", error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar planos para associação.",
        variant: "destructive",
      });
    } finally {
      setParentSearchLoading(false);
    }
  };

  // Associar plano ao pai selecionado
  const associatePlanToParent = async () => {
    if (!selectedHealthPlan || !selectedParent) return;
    
    try {
      await createResource(`health-plans/${selectedHealthPlan.id}/parent`, {
        parent_id: selectedParent.id,
        parent_relation_type: parentRelationType
      });
      
      toast({
        title: "Plano associado",
        description: `${selectedHealthPlan.name} agora é um(a) ${parentRelationType} de ${selectedParent.name}.`,
      });
      
      // Reset form and close modal
      setSelectedParent(null);
      setParentSearchTerm("");
      setIsParentModalOpen(false);
      
      // Refresh data
      fetchData();
    } catch (error) {
      console.error("Error associating plan:", error);
      toast({
        title: "Erro",
        description: "Não foi possível associar o plano ao plano pai.",
        variant: "destructive",
      });
    }
  };

  // Desvincular plano do pai
  const removeParentAssociation = async () => {
    if (!selectedHealthPlan) return;
    
    try {
      await deleteResource(`health-plans/${selectedHealthPlan.id}/parent`,);
      
      toast({
        title: "Plano desvinculado",
        description: `${selectedHealthPlan.name} agora é um plano independente.`,
      });
      
      setIsRemoveParentDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error removing association:", error);
      toast({
        title: "Erro",
        description: "Não foi possível desvincular o plano.",
        variant: "destructive",
      });
    }
  };

  // Abrir modal para adicionar plano pai
  const openParentModal = (healthPlan: HealthPlan) => {
    setSelectedHealthPlan(healthPlan);
    setParentOptions([]);
    setParentSearchTerm("");
    setSelectedParent(null);
    setParentRelationType("subsidiary");
    setIsParentModalOpen(true);
  };

  // Abrir diálogo para confirmar desvinculação
  const openRemoveParentDialog = (healthPlan: HealthPlan) => {
    setSelectedHealthPlan(healthPlan);
    setIsRemoveParentDialogOpen(true);
  };

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize, sorting])

  // Quando os filtros mudarem, reseta a paginação e busca novamente
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      pageIndex: 0
    }))
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, nameFilter, cnpjFilter, ansCodeFilter, statusFilter, hasContractFilter, parentFilter])

  // Efeito para buscar planos pai quando o termo de busca muda
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (parentSearchTerm) {
        searchParentPlans(parentSearchTerm);
      }
    }, 500);
    
    return () => clearTimeout(delaySearch);
  }, [parentSearchTerm]);

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({
      ...pagination,
      pageIndex: page - 1,
      pageSize,
    })
  }

  const handleSortingChange = (column: string, direction: "asc" | "desc") => {
    setSorting({ column, direction })
  }

  // Limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm("");
    setNameFilter("");
    setCnpjFilter("");
    setAnsCodeFilter("");
    setStatusFilter("");
    setHasContractFilter("");
    setParentFilter("");
  }

  const handleActivateHealthPlan = async (id: number) => {
    try {
      await createResource(`health-plans/${id}/approve`, {
        status: 'approved'
      });
      
      toast({
        title: "Plano ativado",
        description: "O plano de saúde foi ativado com sucesso.",
      });
      
      fetchData();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível ativar o plano de saúde.",
        variant: "destructive",
      });
      console.error("Error activating health plan:", error);
    }
  }

  const columns: ColumnDef<HealthPlan>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("name")}</div>
          {row.original.parent && (
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Link className="h-3 w-3" />
              <span>
                {row.original.parent_relation_type === "subsidiary" 
                  ? "Subsidiária de" 
                  : row.original.parent_relation_type === "franchise" 
                  ? "Franquia de" 
                  : row.original.parent_relation_type === "branch" 
                  ? "Filial de" 
                  : row.original.parent_relation_type === "partner"
                  ? "Parceira de"
                  : "Vinculada a"} {row.original.parent.name}
              </span>
            </div>
          )}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "approved" ? "outline" : status === "pending" ? "secondary" : "default"}>
            {status === "approved" ? "Aprovado" : status === "pending" ? "Pendente" : status}
          </Badge>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: "cnpj",
      header: "CNPJ",
      enableSorting: true,
    },
    {
      accessorKey: "ans_code",
      header: "Código ANS",
      enableSorting: true,
    },
    {
      accessorKey: "description",
      header: "Descrição",
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.getValue("description")}>
          {row.getValue("description") || "-"}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const healthPlan = row.original
        const isActive = healthPlan.status === "approved" && healthPlan.has_signed_contract

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/health-plans/${healthPlan.id}`)}>
                <FileText className="mr-2 h-4 w-4" />
                Ver detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/health-plans/${healthPlan.id}/procedures`)}>
                <List className="mr-2 h-4 w-4" />
                Gerenciar procedimentos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/health-plans/${healthPlan.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {!isActive && healthPlan.status !== 'approved' && (
                <DropdownMenuItem onClick={() => handleActivateHealthPlan(healthPlan.id)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aprovar plano
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              
              {/* Opções de vinculação de plano pai */}
              {healthPlan.parent ? (
                <DropdownMenuItem onClick={() => openRemoveParentDialog(healthPlan)}>
                  <Link2Off className="mr-2 h-4 w-4" />
                  Desvincular do plano pai
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => openParentModal(healthPlan)}>
                  <Link className="mr-2 h-4 w-4" />
                  Associar a plano pai
                </DropdownMenuItem>
              )}
              
              <DropdownMenuItem onClick={() => router.push(`/health-plans/${healthPlan.id}/children`)}>
                <Users className="mr-2 h-4 w-4" />
                Gerenciar planos filhos
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => console.log("Delete health plan:", healthPlan.id)}>
                <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                <span className="text-destructive">Excluir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Planos de Saúde</h1>
          <p className="text-muted-foreground">Gerencie os planos de saúde cadastrados no sistema</p>
        </div>
        <Button onClick={() => router.push("/health-plans/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Busca Geral (Nome ou CNPJ)</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                placeholder="Nome do plano"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                disabled={!!searchTerm}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="CNPJ"
                value={cnpjFilter}
                onChange={(e) => setCnpjFilter(e.target.value)}
                disabled={!!searchTerm}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ans_code">Código ANS</Label>
              <Input
                id="ans_code"
                placeholder="Código ANS"
                value={ansCodeFilter}
                onChange={(e) => setAnsCodeFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecione um status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="has_contract">Contrato Assinado</Label>
              <Select value={hasContractFilter} onValueChange={setHasContractFilter}>
                <SelectTrigger id="has_contract">
                  <SelectValue placeholder="Status do contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Assinado</SelectItem>
                  <SelectItem value="false">Não assinado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="parent_status">Hierarquia</Label>
              <Select value={parentFilter} onValueChange={setParentFilter}>
                <SelectTrigger id="parent_status">
                  <SelectValue placeholder="Filtrar por hierarquia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Planos Principais</SelectItem>
                  <SelectItem value="false">Planos Filhos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Limpar filtros
              </Button>
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
            handleSortingChange(sorting[0].id, sorting[0].desc ? "desc" : "asc")
          }
        }}
        pageCount={pagination.pageCount}
        currentPage={pagination.pageIndex + 1}
        pageSize={pagination.pageSize}
        totalItems={pagination.total}
        isLoading={isLoading}
      />
      
      {/* Modal para associar plano a um plano pai */}
      <Dialog open={isParentModalOpen} onOpenChange={setIsParentModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Associar a Plano Pai</DialogTitle>
            <DialogDescription>
              Vincule este plano a um plano de saúde principal. Essa relação permite administrar planos em hierarquia.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search-parent">Buscar Plano Pai</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-parent"
                  placeholder="Digite o nome ou CNPJ..."
                  className="pl-8"
                  value={parentSearchTerm}
                  onChange={(e) => setParentSearchTerm(e.target.value)}
                />
                {parentSearchLoading && (
                  <div className="absolute right-3 top-2.5">
                    <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Resultados da busca */}
              {parentOptions.length > 0 && (
                <div className="border rounded-md mt-2 max-h-[200px] overflow-y-auto">
                  {parentOptions.map((plan) => (
                    <div 
                      key={plan.id}
                      className={`p-2 border-b last:border-0 cursor-pointer hover:bg-accent transition-colors ${selectedParent?.id === plan.id ? 'bg-accent' : ''}`}
                      onClick={() => setSelectedParent(plan)}
                    >
                      <div className="font-medium">{plan.name}</div>
                      <div className="text-xs text-muted-foreground">CNPJ: {plan.cnpj}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {parentSearchTerm && parentOptions.length === 0 && !parentSearchLoading && (
                <div className="text-sm text-muted-foreground mt-2">
                  Nenhum plano encontrado com este termo.
                </div>
              )}
            </div>
            
            {selectedParent && (
              <>
                <div className="bg-accent/30 p-3 rounded-md">
                  <p className="font-medium">{selectedParent.name}</p>
                  <p className="text-sm text-muted-foreground">CNPJ: {selectedParent.cnpj}</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="relation-type">Tipo de Relação</Label>
                  <Select value={parentRelationType} onValueChange={setParentRelationType}>
                    <SelectTrigger id="relation-type">
                      <SelectValue placeholder="Selecione o tipo de relação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subsidiary">Subsidiária</SelectItem>
                      <SelectItem value="franchise">Franquia</SelectItem>
                      <SelectItem value="branch">Filial</SelectItem>
                      <SelectItem value="partner">Parceira</SelectItem>
                      <SelectItem value="other">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsParentModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={associatePlanToParent}
              disabled={!selectedParent}
            >
              Associar Plano
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para confirmar remoção de vinculação */}
      <AlertDialog open={isRemoveParentDialogOpen} onOpenChange={setIsRemoveParentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular Plano</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desvincular este plano do seu plano pai? 
              Isso tornará o plano independente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={removeParentAssociation}>
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
