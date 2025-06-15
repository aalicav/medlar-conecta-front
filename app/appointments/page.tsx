"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { fetchResource, type QueryParams } from "@/services/resource-service"
import { Plus, FileText, Edit, CheckCircle, XCircle, Search, Calendar, Clock } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDateTime } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "@/components/ui/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import api from "@/services/api-client"

interface Appointment {
  id: number
  professional_id: number
  professional_name: string
  clinic_id: number
  clinic_name: string
  patient_id: number
  patient_name: string
  health_plan_id: number
  health_plan_name: string
  tuss_id: number
  tuss_name: string
  status: string
  scheduled_for: string
  created_at: string
}

interface Solicitation {
  id: number
  patient_name: string
  procedure_name: string
  preferred_date_start: string
  preferred_date_end: string
  status: string
  patient: {
    id: number
    name: string
    cpf: string
    birth_date: string
    gender: string
    health_card_number: string
    age: number
  }
  health_plan: {
    id: number
    name: string
    cnpj: string
    ans_code: string
  }
  tuss: {
    id: number
    code: string
    description: string
  }
  requested_by_user: {
    id: number
    name: string
    email: string
  }
  description: string
}

interface ProfessionalAvailability {
  id: number
  professional: {
    id: number
    name: string
  }
  available_date: string
  available_time: string
  notes: string
  status: string
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [data, setData] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  })
  const [sorting, setSorting] = useState<{ column: string; direction: "asc" | "desc" }>({
    column: "scheduled_for",
    direction: "desc",
  })
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [dateFilters, setDateFilters] = useState({
    scheduled_from: "",
    scheduled_to: "",
    created_from: "",
    created_to: "",
  })
  const [solicitations, setSolicitations] = useState<Solicitation[]>([])
  const [selectedSolicitation, setSelectedSolicitation] = useState<Solicitation | null>(null)
  const [availabilities, setAvailabilities] = useState<ProfessionalAvailability[]>([])
  const [showAvailabilities, setShowAvailabilities] = useState(false)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const params: QueryParams = {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        sort_by: sorting.column,
        sort_order: sorting.direction,
        ...filters,
        ...dateFilters
      }

      const response = await fetchResource<Appointment[]>("appointments", params)

      setData(response.data)
      setPagination({
        ...pagination,
        pageCount: response.meta?.last_page || 1,
        total: response.meta?.total || 0,
      })
    } catch (error) {
      console.error("Error fetching appointments:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos",
        variant: "destructive"
      })
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
      scheduled_from: "",
      scheduled_to: "",
      created_from: "",
      created_to: "",
    })
  }

  useEffect(() => {
    fetchSolicitations()
  }, [])

  const fetchSolicitations = async () => {
    try {
      const response = await api.get("/solicitations", {
        params: {
          status: "pending"
        }
      })
      setSolicitations(response.data.data)
    } catch (error) {
      console.error("Error fetching solicitations:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as solicitações",
        variant: "destructive"
      })
    }
  }

  const fetchAvailabilities = async (solicitationId: number) => {
    try {
      const response = await api.get(`/solicitations/${solicitationId}/availabilities`)
      setAvailabilities(response.data.data)
    } catch (error) {
      console.error("Error fetching availabilities:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as disponibilidades",
        variant: "destructive"
      })
    }
  }

  const handleCreateAppointment = async (availabilityId: number) => {
    setIsActionLoading(true)
    try {
      await api.post(`/availabilities/${availabilityId}/select`)
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso"
      })
      setShowAvailabilities(false)
      fetchData()
    } catch (error) {
      console.error("Error creating appointment:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleConfirmAppointment = async (id: number) => {
    setIsActionLoading(true)
    try {
      await api.put(`/appointments/${id}/confirm`)
      toast({
        title: "Sucesso",
        description: "Agendamento confirmado com sucesso"
      })
      fetchData()
    } catch (error) {
      console.error("Error confirming appointment:", error)
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o agendamento",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCancelAppointment = async (id: number) => {
    setIsActionLoading(true)
    try {
      await api.put(`/appointments/${id}/cancel`)
      toast({
        title: "Sucesso",
        description: "Agendamento cancelado com sucesso"
      })
      fetchData()
    } catch (error) {
      console.error("Error cancelling appointment:", error)
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline">Pendente</Badge>
            </TooltipTrigger>
            <TooltipContent>
              Aguardando confirmação
            </TooltipContent>
          </Tooltip>
        )
      case "confirmed":
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge>Confirmado</Badge>
            </TooltipTrigger>
            <TooltipContent>
              Agendamento confirmado
            </TooltipContent>
          </Tooltip>
        )
      case "completed":
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary">Concluído</Badge>
            </TooltipTrigger>
            <TooltipContent>
              Procedimento realizado
            </TooltipContent>
          </Tooltip>
        )
      case "cancelled":
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive">Cancelado</Badge>
            </TooltipTrigger>
            <TooltipContent>
              Agendamento cancelado
            </TooltipContent>
          </Tooltip>
        )
      case "missed":
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="destructive">Não Compareceu</Badge>
            </TooltipTrigger>
            <TooltipContent>
              Paciente não compareceu
            </TooltipContent>
          </Tooltip>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const columns: ColumnDef<Appointment>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "patient_name",
      header: "Paciente",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("patient_name")}>
          {row.getValue("patient_name")}
          <div className="text-xs text-muted-foreground">
            {row.original.health_plan_name}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "professional_name",
      header: "Profissional",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("professional_name")}>
          {row.getValue("professional_name")}
          {row.original.clinic_name && (
            <div className="text-xs text-muted-foreground">
              {row.original.clinic_name}
            </div>
          )}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "tuss_name",
      header: "Procedimento",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("tuss_name")}>
          {row.getValue("tuss_name")}
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "scheduled_for",
      header: "Data/Hora",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          {formatDateTime(row.getValue("scheduled_for"))}
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
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const appointment = row.original
        return (
          <div className="flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/appointments/${appointment.id}`)}
                >
                  <FileText className="h-4 w-4" />
                  <span className="sr-only">Ver detalhes</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver detalhes</TooltipContent>
            </Tooltip>

            {appointment.status === "pending" && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/appointments/${appointment.id}/edit`)}
                      disabled={isActionLoading}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Editar agendamento</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-success"
                      onClick={() => handleConfirmAppointment(appointment.id)}
                      disabled={isActionLoading}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="sr-only">Confirmar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Confirmar agendamento</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleCancelAppointment(appointment.id)}
                      disabled={isActionLoading}
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="sr-only">Cancelar</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Cancelar agendamento</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie os agendamentos de procedimentos médicos</p>
        </div>
        <Dialog open={showAvailabilities} onOpenChange={setShowAvailabilities}>
          <DialogTrigger asChild>
            <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
              <DialogDescription>
                Selecione uma solicitação para ver as disponibilidades dos profissionais
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Solicitações Pendentes</h3>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                  {solicitations.map((solicitation) => (
                    <Card
                      key={solicitation.id}
                      className={`cursor-pointer transition-colors ${
                        selectedSolicitation?.id === solicitation.id
                          ? "border-primary"
                          : "hover:border-muted-foreground"
                      }`}
                      onClick={() => {
                        setSelectedSolicitation(solicitation)
                        fetchAvailabilities(solicitation.id)
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{solicitation.patient.name}</div>
                              <div className="text-muted-foreground truncate">
                                CPF: {solicitation.patient.cpf} • {solicitation.patient.age} anos
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {solicitation.health_plan.name}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <div className="truncate">
                              <span className="font-medium">Plano:</span> {solicitation.health_plan.name}
                              <div className="text-muted-foreground truncate">
                                ANS: {solicitation.health_plan.ans_code}
                              </div>
                            </div>
                            <div className="truncate">
                              <span className="font-medium">Carteira:</span> {solicitation.patient.health_card_number}
                            </div>
                          </div>

                          <div className="truncate">
                            <span className="font-medium">Procedimento:</span> {solicitation.tuss.description}
                            <div className="text-muted-foreground truncate">
                              Código TUSS: {solicitation.tuss.code}
                            </div>
                          </div>

                          {solicitation.description && (
                            <div className="truncate">
                              <span className="font-medium">Observação:</span> {solicitation.description}
                            </div>
                          )}

                          <div className="truncate">
                            <span className="font-medium">Solicitado por:</span> {solicitation.requested_by_user.name}
                            <div className="text-muted-foreground truncate">
                              {solicitation.requested_by_user.email}
                            </div>
                          </div>

                          {solicitation.preferred_date_start && solicitation.preferred_date_end && (
                            <div className="truncate">
                              <span className="font-medium">Período preferido:</span>
                              <div className="text-muted-foreground truncate">
                                {formatDateTime(solicitation.preferred_date_start)} -{" "}
                                {formatDateTime(solicitation.preferred_date_end)}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {solicitations.length === 0 && (
                    <div className="text-center text-muted-foreground py-4 text-sm">
                      Nenhuma solicitação pendente
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium text-sm">Disponibilidades</h3>
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                  {selectedSolicitation ? (
                    availabilities.map((availability) => (
                      <Card key={availability.id}>
                        <CardContent className="p-3">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <div className="font-medium text-sm truncate">{availability.professional.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDateTime(availability.available_date)} às{" "}
                                  {availability.available_time}
                                </div>
                              </div>
                              {getStatusBadge(availability.status)}
                            </div>

                            {availability.notes && (
                              <div className="text-xs text-muted-foreground truncate">
                                {availability.notes}
                              </div>
                            )}

                            {availability.status === "pending" && (
                              <Button
                                className="w-full text-xs h-8"
                                onClick={() => handleCreateAppointment(availability.id)}
                                disabled={isActionLoading}
                              >
                                {isActionLoading ? "Criando..." : "Criar Agendamento"}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center text-muted-foreground py-4 text-sm">
                      Selecione uma solicitação para ver as disponibilidades
                    </div>
                  )}
                  {selectedSolicitation && availabilities.length === 0 && (
                    <div className="text-center text-muted-foreground py-4 text-sm">
                      Nenhuma disponibilidade registrada
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Use os filtros abaixo para encontrar agendamentos específicos
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="missed">Não Compareceu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="patient-filter">Paciente</Label>
              <Input
                id="patient-filter"
                placeholder="Nome do paciente"
                value={filters.patient_name || ""}
                onChange={(e) => handleFilterChange("patient_name", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="professional-filter">Profissional</Label>
              <Input
                id="professional-filter"
                placeholder="Nome do profissional"
                value={filters.professional_name || ""}
                onChange={(e) => handleFilterChange("professional_name", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="clinic-filter">Clínica</Label>
              <Input
                id="clinic-filter"
                placeholder="Nome da clínica"
                value={filters.clinic_name || ""}
                onChange={(e) => handleFilterChange("clinic_name", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="scheduled-from">Data do Agendamento (início)</Label>
              <Input
                id="scheduled-from"
                type="date"
                name="scheduled_from"
                value={dateFilters.scheduled_from}
                onChange={handleDateFilterChange}
              />
            </div>

            <div>
              <Label htmlFor="scheduled-to">Data do Agendamento (fim)</Label>
              <Input
                id="scheduled-to"
                type="date"
                name="scheduled_to"
                value={dateFilters.scheduled_to}
                onChange={handleDateFilterChange}
              />
            </div>

            <div>
              <Label htmlFor="created-from">Data de Criação (início)</Label>
              <Input
                id="created-from"
                type="date"
                name="created_from"
                value={dateFilters.created_from}
                onChange={handleDateFilterChange}
              />
            </div>

            <div>
              <Label htmlFor="created-to">Data de Criação (fim)</Label>
              <Input
                id="created-to"
                type="date"
                name="created_to"
                value={dateFilters.created_to}
                onChange={handleDateFilterChange}
              />
            </div>
          </div>

          <div className="flex justify-end">
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
    </div>
  )
}
