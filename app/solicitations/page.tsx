"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { fetchResource, type QueryParams, type SortOrder } from "@/services/resource-service"
import { Plus, FileText, Edit, Calendar, AlertCircle, Loader2, MoreHorizontal, RefreshCw } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDate } from "@/lib/utils"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import api from "@/services/api-client"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { CreateAppointmentModal } from "@/components/appointments/create-appointment-modal"

interface Solicitation {
  id: number
  health_plan_id: number
  health_plan_name: string
  patient_id: number
  patient_name: string
  tuss_id: number
  tuss_code: string
  tuss_name: string
  status: string
  priority: string
  preferred_date_start: string
  preferred_date_end: string
  created_at: string
  notes: string | null
  patient: {
    id: number
    name: string
    cpf: string
    health_card_number: string
    birth_date: string
    gender: string
    address: string
    city: string
    state: string
    postal_code: string
    age: number
  }
  health_plan: {
    id: number
    name: string
    cnpj: string
    ans_code: string
    status: string
  }
  tuss: {
    id: number
    code: string
    description: string
    category: string
  }
  requested_by_user?: {
    id: number
    name: string
    email: string
  }
  appointments?: Array<{
    id: number
    status: string
    scheduled_date: string
  }>
  is_active?: boolean
  days_remaining?: number
  is_expired?: boolean
}

interface ExtendedQueryParams extends QueryParams {
  sort_by?: string;
  sort_order?: SortOrder;
  date_from?: string;
  date_to?: string;
  created_from?: string;
  created_to?: string;
  status?: string;
  priority?: string;
  health_plan_id?: string;
  patient_id?: string;
  tuss_id?: string;
}

export default function SolicitationsPage() {
  const router = useRouter()
  const { user, hasRole } = useAuth()
  const [data, setData] = useState<Solicitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingPending, setIsProcessingPending] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  })
  const [sorting, setSorting] = useState<{ column: string; direction: "asc" | "desc" }>({
    column: "created_at",
    direction: "desc",
  })
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [dateFilters, setDateFilters] = useState({
    date_from: "",
    date_to: "",
    created_from: "",
    created_to: "",
  })
  const [showCreateAppointmentModal, setShowCreateAppointmentModal] = useState(false)
  const [selectedSolicitationForAppointment, setSelectedSolicitationForAppointment] = useState<any>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const params: ExtendedQueryParams = {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        sort_by: sorting.column,
        sort_order: sorting.direction,
        ...filters,
        ...dateFilters
      }

      const response = await fetchResource<Solicitation[]>("solicitations", params)

      if (response.data) {
        setData(response.data)
      }
      
      if (response.meta) {
        setPagination({
          ...pagination,
          pageCount: response.meta.last_page || 0,
          total: response.meta.total || 0,
        })
      }
    } catch (error) {
      console.error("Error fetching solicitations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize, sorting, filters, dateFilters])

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

  const handleFilterChange = (columnId: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [columnId]: value,
    }))
    setPagination({
      ...pagination,
      pageIndex: 0,
    })
  }

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDateFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
    setPagination({
      ...pagination,
      pageIndex: 0,
    })
  }

  const clearFilters = () => {
    setFilters({})
    setDateFilters({
      date_from: "",
      date_to: "",
      created_from: "",
      created_to: "",
    })
  }

  const handleProcessPendingSolicitations = async () => {
    try {
      setIsProcessingPending(true)
      const response = await api.post('/solicitations/process-pending')
      
      toast({
        title: "Processamento iniciado",
        description: "O processamento das solicitações pendentes foi iniciado com sucesso.",
      })
      
      // Refresh the list after processing
      fetchData()
    } catch (error) {
      console.error("Error processing pending solicitations:", error)
      toast({
        title: "Erro",
        description: "Não foi possível processar as solicitações pendentes.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingPending(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pendente</Badge>
      case "processing":
        return <Badge>Processando</Badge>
      case "scheduled":
        return <Badge variant="secondary">Agendada</Badge>
      case "completed":
        return <Badge variant="secondary">Concluída</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>
      case "failed":
        return (
          <div className="flex items-center gap-1">
            <Badge variant="destructive">Falha</Badge>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Falha no agendamento automático</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgente</Badge>
      case "high":
        return <Badge variant="destructive">Alta</Badge>
      case "normal":
        return <Badge variant="secondary">Normal</Badge>
      case "low":
        return <Badge variant="outline">Baixa</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }

  const handleRetryScheduling = async (id: number) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/solicitations/${id}/force-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        fetchData()
      } else {
        console.error("Failed to retry scheduling")
      }
    } catch (error) {
      console.error("Error retrying scheduling:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForceSchedule = async (solicitation: Solicitation) => {
    try {
      setIsLoading(true);
      const response = await api.post(`/solicitations/${solicitation.id}/force-schedule`, {
        cancel_pending_invites: true
      });
      
      if (response.data.success) {
        toast({
          title: "Solicitação reprocessada",
          description: response.data.message || "A solicitação foi enviada para reprocessamento.",
        });
        
        fetchData();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error: any) {
      console.error("Error reprocessing solicitation:", error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Não foi possível reprocessar a solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const columns: ColumnDef<Solicitation>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "patient.name",
      header: "Paciente",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("patient.name")}>
          {row.getValue("patient.name")}
          <div className="text-xs text-muted-foreground">
            {row.original.patient.name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "health_plan_name",
      header: "Plano de Saúde",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("health_plan_name")}>
          {row.getValue("health_plan_name")}
          <div className="text-xs text-muted-foreground">
            {row.original.health_plan.name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tuss_name",
      header: "Procedimento",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("tuss_name")}>
          {row.getValue("tuss_name")}
          <div className="text-xs text-muted-foreground">
            {row.original.tuss.code}
          </div>
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
      cell: ({ row }) => formatDate(row.getValue("created_at")),
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const solicitation = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <MoreHorizontal className="h-4 w-4" />
                Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opções</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/solicitations/${solicitation.id}`)}>
                <FileText className="h-4 w-4 mr-2" />
                Ver detalhes
              </DropdownMenuItem>
              
              {(solicitation.status === "pending" || solicitation.status === "processing" || solicitation.status === "failed") && (
                <DropdownMenuItem onClick={() => router.push(`/solicitations/${solicitation.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              
              {(solicitation.status === "pending" || solicitation.status === "processing" || solicitation.status === "failed") && (hasRole('network_manager') || hasRole('super_admin')) && (
                <DropdownMenuItem onClick={() => handleForceSchedule(solicitation)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reprocessar
                </DropdownMenuItem>
              )}

              {(hasRole('network_manager') || hasRole('super_admin')) && (
                <DropdownMenuItem onClick={() => {
                  setSelectedSolicitationForAppointment(convertSolicitationForModal(solicitation))
                  setShowCreateAppointmentModal(true)
                }}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Criar Agendamento
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ];

  // Function to convert page Solicitation to modal Solicitation interface
  const convertSolicitationForModal = (solicitation: Solicitation) => {
    return {
      id: solicitation.id,
      health_plan_id: solicitation.health_plan_id,
      patient_id: solicitation.patient_id,
      tuss_id: solicitation.tuss_id,
      status: solicitation.status,
      priority: solicitation.priority,
      description: solicitation.notes,
      requested_by: null,
      scheduled_automatically: false,
      completed_at: null,
      cancelled_at: null,
      cancel_reason: null,
      state: null,
      city: null,
      created_at: solicitation.created_at,
      updated_at: solicitation.created_at,
      health_plan: {
        id: solicitation.health_plan.id,
        name: solicitation.health_plan.name,
        cnpj: solicitation.health_plan.cnpj,
        ans_code: solicitation.health_plan.ans_code,
        description: null,
        municipal_registration: '',
        legal_representative_name: '',
        legal_representative_cpf: '',
        legal_representative_position: '',
        legal_representative_id: null,
        operational_representative_name: '',
        operational_representative_cpf: '',
        operational_representative_position: '',
        operational_representative_id: null,
        address: '',
        city: '',
        state: '',
        postal_code: '',
        logo: '',
        status: solicitation.health_plan.status,
        approved_at: '',
        has_signed_contract: false,
        created_at: '',
        updated_at: ''
      },
      patient: {
        id: solicitation.patient.id,
        name: solicitation.patient.name,
        cpf: solicitation.patient.cpf,
        birth_date: solicitation.patient.birth_date,
        gender: solicitation.patient.gender,
        health_plan_id: solicitation.health_plan_id,
        health_card_number: solicitation.patient.health_card_number,
        address: solicitation.patient.address,
        city: solicitation.patient.city,
        state: solicitation.patient.state,
        postal_code: solicitation.patient.postal_code,
        created_at: '',
        updated_at: '',
        age: solicitation.patient.age
      },
      tuss: {
        id: solicitation.tuss.id,
        code: solicitation.tuss.code,
        description: solicitation.tuss.description,
        category: solicitation.tuss.category,
        subcategory: null,
        type: null,
        amb_code: null,
        amb_description: null,
        created_at: '',
        updated_at: ''
      },
      requested_by_user: solicitation.requested_by_user || null,
      is_active: solicitation.is_active || false
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitações</h1>
          <p className="text-muted-foreground">Gerencie as solicitações de procedimentos médicos</p>
        </div>
        <div className="flex gap-2">
          {(hasRole('network_manager') || hasRole('super_admin')) && (
            <Button 
              variant="outline"
              onClick={handleProcessPendingSolicitations}
              disabled={isProcessingPending}
            >
              {isProcessingPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Processar Pendentes
            </Button>
          )}
          <Button onClick={() => router.push("/solicitations/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Solicitação
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select 
                onValueChange={(value) => handleFilterChange("status", value)}
                value={filters.status || ""}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority-filter">Prioridade</Label>
              <Select 
                onValueChange={(value) => handleFilterChange("priority", value)}
                value={filters.priority || ""}
              >
                <SelectTrigger id="priority-filter">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="health_plan_id">Plano de Saúde</Label>
              <Input 
                id="health_plan_id"
                type="text" 
                name="health_plan_id"
                value={filters.health_plan_id || ""}
                onChange={(e) => handleFilterChange("health_plan_id", e.target.value)}
                placeholder="ID do plano"
              />
            </div>
            
            <div>
              <Label htmlFor="tuss_id">Código TUSS</Label>
              <Input 
                id="tuss_id"
                type="text" 
                name="tuss_id"
                value={filters.tuss_id || ""}
                onChange={(e) => handleFilterChange("tuss_id", e.target.value)}
                placeholder="ID do procedimento"
              />
            </div>
            
            <div>
              <Label htmlFor="date-from">Data preferencial (início)</Label>
              <Input 
                id="date-from"
                type="date" 
                name="date_from"
                value={dateFilters.date_from}
                onChange={handleDateFilterChange}
              />
            </div>
            
            <div>
              <Label htmlFor="date-to">Data preferencial (fim)</Label>
              <Input 
                id="date-to"
                type="date" 
                name="date_to"
                value={dateFilters.date_to}
                onChange={handleDateFilterChange}
              />
            </div>
            
            <div>
              <Label htmlFor="created-from">Criado de</Label>
              <Input 
                id="created-from"
                type="date" 
                name="created_from"
                value={dateFilters.created_from}
                onChange={handleDateFilterChange}
              />
            </div>
            
            <div>
              <Label htmlFor="created-to">Criado até</Label>
              <Input 
                id="created-to"
                type="date" 
                name="created_to"
                value={dateFilters.created_to}
                onChange={handleDateFilterChange}
              />
            </div>
          </div>
          
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
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
        onFilterChange={handleFilterChange}
        pageCount={pagination.pageCount}
        currentPage={pagination.pageIndex + 1}
        pageSize={pagination.pageSize}
        totalItems={pagination.total}
        isLoading={isLoading}
      />
      
      {/* Use the CreateAppointmentModal */}
      <CreateAppointmentModal
        open={showCreateAppointmentModal}
        onOpenChange={(open) => {
          setShowCreateAppointmentModal(open)
          if (!open) {
            setSelectedSolicitationForAppointment(null)
          }
        }}
        onSuccess={() => {
          setShowCreateAppointmentModal(false)
          setSelectedSolicitationForAppointment(null)
          fetchData()
        }}
        preSelectedSolicitation={selectedSolicitationForAppointment}
        showTriggerButton={false}
      />
    </div>
  )
}
