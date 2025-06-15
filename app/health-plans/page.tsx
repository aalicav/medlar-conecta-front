"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { createResource, deleteResource, fetchResource, updateResource, type QueryParams } from "@/services/resource-service"
import { Plus, FileText, Edit, Trash2, List, MoreHorizontal, CheckCircle2, Search, X, Link, Link2Off, Users } from "lucide-react"
import type { ColumnDef, SortingState } from "@tanstack/react-table"
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
  municipal_registration?: string
  ans_code: string
  description?: string
  email: string
  status: string
  has_signed_contract: boolean
  address: string
  city: string
  state: string
  postal_code: string
  logo?: string
  logo_url?: string
  created_at: string
  updated_at: string
  legal_representative_name: string
  legal_representative_cpf: string
  legal_representative_position: string
  legal_representative_email: string
  operational_representative_name: string
  operational_representative_cpf: string
  operational_representative_position: string
  operational_representative_email: string
  phones: Array<{
    id: number
    number: string
    type: 'mobile' | 'landline' | 'whatsapp' | 'fax'
  }>
  documents?: Array<{
    id: number
    type: 'contract' | 'ans_certificate' | 'authorization' | 'financial' | 'legal' | 'identification' | 'agreement' | 'technical' | 'other'
    description: string
    file_path: string
    file_name: string
    file_type: string
    file_size: number
    reference_date?: string
    expiration_date?: string
  }>
  parent?: {
    id: number
    name: string
  }
  parent_relation_type?: 'subsidiary' | 'franchise' | 'branch' | 'partner' | 'other'
  children?: HealthPlan[]
  approver?: {
    id: number
    name: string
  }
  user?: {
    id: number
    name: string
    email: string
  }
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

  const handleSortingChange = (sorting: SortingState) => {
    if (sorting.length > 0) {
      setSorting({
        column: sorting[0].id,
        direction: sorting[0].desc ? "desc" : "asc"
      })
    }
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

  const handleDeleteHealthPlan = async (id: number) => {
    try {
      await deleteResource(`health-plans/${id}`)
      toast({
        title: "Plano excluído",
        description: "O plano de saúde foi excluído com sucesso.",
      })
      fetchData()
    } catch (error) {
      console.error("Error deleting health plan:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o plano de saúde.",
        variant: "destructive",
      })
    }
  }

  const handleApproveHealthPlan = async (id: number) => {
    try {
      await updateResource(`health-plans/${id}/approve`, {
        status: 'approved'
      })
      toast({
        title: "Plano aprovado",
        description: "O plano de saúde foi aprovado com sucesso.",
      })
      fetchData()
    } catch (error) {
      console.error("Error approving health plan:", error)
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o plano de saúde.",
        variant: "destructive",
      })
    }
  }

  const columns: ColumnDef<HealthPlan>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => {
        const plan = row.original
        return (
          <div className="flex items-center gap-2">
            {plan.logo_url && (
              <img 
                src={plan.logo_url} 
                alt={plan.name} 
                className="w-8 h-8 rounded-full object-cover"
              />
            )}
            <div>
              <div className="font-medium">{plan.name}</div>
              <div className="text-sm text-muted-foreground">
                {plan.cnpj}
              </div>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "ans_code",
      header: "Código ANS",
    },
    {
      accessorKey: "city",
      header: "Cidade/UF",
      cell: ({ row }) => {
        const plan = row.original
        return `${plan.city}/${plan.state}`
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={
            status === "approved" ? "success" :
            status === "pending" ? "warning" :
            "destructive"
          }>
            {status === "approved" ? "Aprovado" :
             status === "pending" ? "Pendente" :
             "Rejeitado"}
          </Badge>
        )
      }
    },
    {
      accessorKey: "has_signed_contract",
      header: "Contrato",
      cell: ({ row }) => {
        const hasContract = row.getValue("has_signed_contract") as boolean
        return (
          <Badge variant={hasContract ? "success" : "secondary"}>
            {hasContract ? "Assinado" : "Pendente"}
          </Badge>
        )
      }
    },
    {
      accessorKey: "parent",
      header: "Vinculação",
      cell: ({ row }) => {
        const plan = row.original
        if (plan.parent) {
          return (
            <div className="flex items-center gap-1">
              <Link className="h-4 w-4" />
              <span className="text-sm">{plan.parent.name}</span>
              <Badge variant="outline" className="ml-1">
                {plan.parent_relation_type === 'subsidiary' ? 'Subsidiária' :
                 plan.parent_relation_type === 'franchise' ? 'Franquia' :
                 plan.parent_relation_type === 'branch' ? 'Filial' :
                 plan.parent_relation_type === 'partner' ? 'Parceiro' :
                 'Outro'}
              </Badge>
            </div>
          )
        }
        return <span className="text-muted-foreground">Independente</span>
      }
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const plan = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              
              <DropdownMenuItem onClick={() => router.push(`/health-plans/${plan.id}`)}>
                <FileText className="mr-2 h-4 w-4" />
                Detalhes
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => router.push(`/health-plans/${plan.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>

              {plan.status === "pending" && (
                <DropdownMenuItem onClick={() => handleActivateHealthPlan(plan.id)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aprovar
                </DropdownMenuItem>
              )}

              {plan.parent && (
                <DropdownMenuItem onClick={() => openRemoveParentDialog(plan)}>
                  <Link2Off className="mr-2 h-4 w-4" />
                  Desvincular
                </DropdownMenuItem>
              )}

              {plan.children && plan.children.length > 0 && (
                <DropdownMenuItem onClick={() => router.push(`/health-plans/${plan.id}/children`)}>
                  <Users className="mr-2 h-4 w-4" />
                  Ver Vinculados ({plan.children.length})
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => handleDeleteHealthPlan(plan.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      }
    }
  ]

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Planos de Saúde</h1>
        <Button onClick={() => router.push("/health-plans/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Busca Geral</Label>
              <Input
                placeholder="Buscar por nome, CNPJ, etc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {!searchTerm && (
              <>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    placeholder="Nome do plano"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input
                    placeholder="CNPJ"
                    value={cnpjFilter}
                    onChange={(e) => setCnpjFilter(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Código ANS</Label>
                  <Input
                    placeholder="Código ANS"
                    value={ansCodeFilter}
                    onChange={(e) => setAnsCodeFilter(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
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
                  <Label>Contrato</Label>
                  <Select value={hasContractFilter} onValueChange={setHasContractFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status do contrato" />
                    </SelectTrigger>
                    <SelectContent>
                      
                      <SelectItem value="true">Assinado</SelectItem>
                      <SelectItem value="false">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Plano</Label>
                  <Select value={parentFilter} onValueChange={setParentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de plano" />
                    </SelectTrigger>
                    <SelectContent>
                      
                      <SelectItem value="true">Principal</SelectItem>
                      <SelectItem value="false">Vinculado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters} className="mr-2">
              <X className="mr-2 h-4 w-4" />
              Limpar Filtros
            </Button>
            <Button onClick={() => fetchData()}>
              <Search className="mr-2 h-4 w-4" />
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        pageCount={pagination.pageCount}
        currentPage={pagination.pageIndex + 1}
        pageSize={pagination.pageSize}
        totalItems={pagination.total}
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
      />

      {/* Modal para adicionar plano pai */}
      <Dialog open={isParentModalOpen} onOpenChange={setIsParentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular a Plano</DialogTitle>
            <DialogDescription>
              Selecione o plano ao qual deseja vincular {selectedHealthPlan?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Buscar Plano</Label>
              <Input
                placeholder="Digite o nome ou CNPJ do plano..."
                value={parentSearchTerm}
                onChange={(e) => {
                  setParentSearchTerm(e.target.value)
                  searchParentPlans(e.target.value)
                }}
              />
            </div>

            {parentSearchLoading ? (
              <div className="text-center py-2">Buscando planos...</div>
            ) : parentOptions.length > 0 ? (
              <div className="space-y-2">
                {parentOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`p-2 rounded cursor-pointer hover:bg-accent ${
                      selectedParent?.id === option.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedParent(option)}
                  >
                    <div className="font-medium">{option.name}</div>
                    <div className="text-sm text-muted-foreground">{option.cnpj}</div>
                  </div>
                ))}
              </div>
            ) : parentSearchTerm.length > 0 ? (
              <div className="text-center py-2 text-muted-foreground">
                Nenhum plano encontrado
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Tipo de Vinculação</Label>
              <Select value={parentRelationType} onValueChange={setParentRelationType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subsidiary">Subsidiária</SelectItem>
                  <SelectItem value="franchise">Franquia</SelectItem>
                  <SelectItem value="branch">Filial</SelectItem>
                  <SelectItem value="partner">Parceiro</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsParentModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={associatePlanToParent}
              disabled={!selectedParent || !parentRelationType}
            >
              Vincular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para remover vinculação */}
      <AlertDialog open={isRemoveParentDialogOpen} onOpenChange={setIsRemoveParentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular Plano</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desvincular {selectedHealthPlan?.name} do plano {selectedHealthPlan?.parent?.name}?
              Esta ação não pode ser desfeita.
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
