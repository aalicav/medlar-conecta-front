"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { createResource, deleteResource, fetchResource, updateResource, type QueryParams } from "@/services/resource-service"
import { Plus, FileText, Edit, Trash2, List, MoreHorizontal, CheckCircle2, Search, X } from "lucide-react"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Professional {
  id: number
  name: string
  cpf: string
  professional_type: string
  specialty: string
  council_type: string
  council_number: string
  council_state: string
  status: string
  has_signed_contract: boolean
  created_at: string
  updated_at: string
  is_active: boolean
  clinic?: {
    id: number
    name: string
  }
}

export default function ProfessionalsPage() {
  const router = useRouter()
  const [data, setData] = useState<Professional[]>([])
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
  const [cpfFilter, setCpfFilter] = useState<string>("")
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [hasContractFilter, setHasContractFilter] = useState<string>("")
  const [typeFilter, setTypeFilter] = useState<string>("")
  
  // For deletion confirmation
  const [professionalToDelete, setProfessionalToDelete] = useState<Professional | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)

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
        if (cpfFilter) filters.cpf = cpfFilter;
        if (specialtyFilter) filters.specialty = specialtyFilter;
        if (statusFilter) filters.status = statusFilter;
        if (hasContractFilter) filters.has_signed_contract = hasContractFilter;
        if (typeFilter) filters.professional_type = typeFilter;
        
        params.filters = filters;
      }

      const response = await fetchResource<Professional[]>("professionals", params)

      setData(response.data)
      setPagination({
        ...pagination,
        pageCount: response.meta?.last_page || 0,
        total: response.meta?.total || 0,
      })
    } catch (error) {
      console.error("Error fetching professionals:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os profissionais.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    searchTerm,
    nameFilter,
    cpfFilter,
    specialtyFilter,
    statusFilter,
    hasContractFilter,
    typeFilter
  ])

  const handleDelete = async (id: number) => {
    try {
      await deleteResource(`professionals/${id}`)
      toast({
        title: "Profissional excluído",
        description: "O profissional foi excluído com sucesso.",
      })
      fetchData()
    } catch (error) {
      console.error("Error deleting professional:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o profissional.",
        variant: "destructive",
      })
    }
  }

  const confirmDelete = (professional: Professional) => {
    setProfessionalToDelete(professional)
    setIsDeleteConfirmOpen(true)
  }

  const handleActivateProfessional = async (id: number) => {
    try {
      await updateResource(`professionals/${id}/approve`, { status: "approved" })
      toast({
        title: "Profissional aprovado",
        description: "O profissional foi aprovado com sucesso.",
      })
      fetchData()
    } catch (error) {
      console.error("Error approving professional:", error)
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o profissional.",
        variant: "destructive",
      })
    }
  }

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({
      ...pagination,
      pageIndex: page,
      pageSize: pageSize,
    })
  }

  const handleSortingChange = (sorting: any) => {
    if (sorting.length > 0) {
      setSorting({
        column: sorting[0].id,
        direction: sorting[0].desc ? "desc" : "asc"
      })
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setNameFilter("")
    setCpfFilter("")
    setSpecialtyFilter("")
    setStatusFilter("")
    setHasContractFilter("")
    setTypeFilter("")
  }

  const columns: ColumnDef<Professional>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      size: 200,
    },
    {
      accessorKey: "cpf",
      header: "CPF",
      size: 130,
    },
    {
      accessorKey: "professional_type",
      header: "Tipo",
      size: 100,
    },
    {
      accessorKey: "specialty",
      header: "Especialidade",
      size: 150,
    },
    {
      accessorKey: "council_number",
      header: "Registro",
      cell: ({ row }) => (
        <div>
          {row.original.council_type}-{row.original.council_number}/{row.original.council_state}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status
        let color = "default"
        let label = "Desconhecido"

        if (status === "pending") {
          color = "warning"
          label = "Pendente"
        } else if (status === "approved") {
          color = "success"
          label = "Aprovado"
        } else if (status === "rejected") {
          color = "destructive"
          label = "Rejeitado"
        }

        return <Badge variant={color as any}>{label}</Badge>
      },
      size: 120,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const professional = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/professionals/${professional.id}`)}>
                <FileText className="mr-2 h-4 w-4" />
                Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/professionals/${professional.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/professionals/${professional.id}/procedures`)}>
                <List className="mr-2 h-4 w-4" />
                Procedimentos
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {professional.status === "pending" && (
                <DropdownMenuItem onClick={() => handleActivateProfessional(professional.id)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aprovar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => confirmDelete(professional)} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Profissionais</h2>
          <p className="text-muted-foreground">
            Gerencie os profissionais cadastrados no sistema
          </p>
        </div>
        <Button onClick={() => router.push("/professionals/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Profissional
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="grid gap-2 flex-1">
                <Label htmlFor="search">Busca Geral</Label>
                <div className="flex gap-2">
                  <Input
                    id="search"
                    placeholder="Buscar por nome, CPF ou registro..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  {searchTerm && (
                    <Button variant="outline" size="icon" onClick={() => setSearchTerm("")}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="outline" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use a busca para encontrar rapidamente um profissional específico
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="grid gap-2 flex-1 min-w-[150px]">
                <Label htmlFor="type-filter">Tipo</Label>
                <Select
                  value={typeFilter}
                  onValueChange={setTypeFilter}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="medico">Médico</SelectItem>
                    <SelectItem value="enfermeiro">Enfermeiro</SelectItem>
                    <SelectItem value="fisioterapeuta">Fisioterapeuta</SelectItem>
                    <SelectItem value="psicologo">Psicólogo</SelectItem>
                    <SelectItem value="nutricionista">Nutricionista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 flex-1 min-w-[150px]">
                <Label htmlFor="status-filter">Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 flex-1 min-w-[180px]">
                <Label htmlFor="contract-filter">Contrato</Label>
                <Select
                  value={hasContractFilter}
                  onValueChange={setHasContractFilter}
                >
                  <SelectTrigger id="contract-filter">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Com contrato</SelectItem>
                    <SelectItem value="false">Sem contrato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid items-end">
                <Button variant="outline" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </div>

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
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Deletion */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o profissional{" "}
              <span className="font-semibold">{professionalToDelete?.name}</span>?
              <br />
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (professionalToDelete) {
                  handleDelete(professionalToDelete.id)
                  setIsDeleteConfirmOpen(false)
                  setProfessionalToDelete(null)
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 