"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { fetchResource, type QueryParams } from "@/services/resource-service"
import { FileText, Edit, CheckCircle, XCircle, Search, Calendar, Clock, Loader2, Receipt, MoreHorizontal, RefreshCw, Bell } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDateTime } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import api from "@/services/api-client"
import { AppointmentModal } from "@/components/appointments/appointment-modal"
import { CreateAppointmentModal } from "@/components/appointments/create-appointment-modal"
import { useAuth } from "@/contexts/auth-context"

interface Appointment {
  id: number
  solicitation_id: number
  provider_type: string
  provider_id: number
  status: string
  scheduled_date: string
  confirmed_date: string | null
  completed_date: string | null
  cancelled_date: string | null
  confirmed_by: number | null
  completed_by: number | null
  cancelled_by: number | null
  created_by: number | null
  created_at: string
  updated_at: string
  solicitation: {
    id: number
    health_plan_id: number
    patient_id: number
    tuss_id: number
    status: string
    priority: string
    description: string | null
    requested_by: number | null
    scheduled_automatically: boolean
    completed_at: string | null
    cancelled_at: string | null
    cancel_reason: string | null
    state: string | null
    city: string | null
    created_at: string
    updated_at: string
    health_plan: {
      id: number
      name: string
      cnpj: string
      ans_code: string
      description: string | null
      municipal_registration: string
      legal_representative_name: string
      legal_representative_cpf: string
      legal_representative_position: string
      legal_representative_id: number | null
      operational_representative_name: string
      operational_representative_cpf: string
      operational_representative_position: string
      operational_representative_id: number | null
      address: string
      city: string
      state: string
      postal_code: string
      logo: string
      status: string
      approved_at: string
      has_signed_contract: boolean
      created_at: string
      updated_at: string
    }
    patient: {
      id: number
      name: string
      cpf: string
      birth_date: string
      gender: string
      health_plan_id: number
      health_card_number: string
      address: string
      city: string
      state: string
      postal_code: string
      created_at: string
      updated_at: string
      age: number
    }
    tuss: {
      id: number
      code: string
      description: string
      category: string
      subcategory: string | null
      type: string | null
      amb_code: string | null
      amb_description: string | null
      created_at: string
      updated_at: string
    }
    requested_by_user: any | null
    is_active: boolean
  }
  provider: {
    id: number
    name: string
    cpf: string
    professional_type: string
    professional_id: number | null
    specialty: string
    registration_number: string | null
    registration_state: string | null
    clinic_id: number | null
    bio: string | null
    photo: string | null
    status: string
    approved_at: string
    is_active: boolean
    created_at: string
    updated_at: string
  }
  confirmed_by_user: any | null
  completed_by_user: any | null
  cancelled_by_user: any | null
  is_active: boolean
  is_upcoming: boolean
  is_past_due: boolean
  patient: {
    id: number
    name: string
    cpf: string
  }
  health_plan: {
    id: number
    name: string
  }
  procedure: {
    id: number
    code: string
    description: string
  }
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
    column: "scheduled_date",
    direction: "desc",
  })
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [dateFilters, setDateFilters] = useState({
    scheduled_from: "",
    scheduled_to: "",
    created_from: "",
    created_to: "",
  })
  const [isGeneratingNFe, setIsGeneratingNFe] = useState(false)

  // Resend notifications state
  const [showResendDialog, setShowResendDialog] = useState(false)
  const [selectedAppointmentForResend, setSelectedAppointmentForResend] = useState<Appointment | null>(null)
  const [selectedNotificationTypes, setSelectedNotificationTypes] = useState<string[]>([])
  const [isResendingNotifications, setIsResendingNotifications] = useState(false)

  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [showCreateAppointmentModal, setShowCreateAppointmentModal] = useState(false)

  const { hasPermission } = useAuth()

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

  const handleConfirmAppointment = async (id: number) => {
    setIsActionLoading(true)
    try {
      await api.post(`/appointments/${id}/confirm`)
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
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) {
      return
    }

    setIsActionLoading(true)
    try {
      await api.post(`/appointments/${id}/cancel`, {
        cancellation_reason: "Cancelado pelo usuário"
      })
      
      toast({
        title: "Sucesso",
        description: "Agendamento cancelado com sucesso",
      })
      
      fetchData()
    } catch (error: any) {
      console.error("Error cancelling appointment:", error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao cancelar agendamento",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleGenerateNFe = async (appointmentId: number) => {
    setIsGeneratingNFe(true)
    try {
      const response = await api.post(`/appointments/${appointmentId}/generate-nfe`)
      
      toast({
        title: "Sucesso",
        description: `Nota fiscal gerada com sucesso! Número: ${response.data.nfe_number}`,
      })
      
      // Redirecionar para a página da NFe
      window.open(`/health-plans/billing/nfe/${response.data.nfe_id}`, '_blank')
      
    } catch (error: any) {
      console.error("Error generating NFe:", error)
      
      let errorMessage = "Erro ao gerar nota fiscal"
      
      if (error.response?.status === 400) {
        if (error.response.data.message.includes('Já existe uma nota fiscal')) {
          // Se já existe NFe, redirecionar para ela
          window.open(`/health-plans/billing/nfe/${error.response.data.nfe_id}`, '_blank')
          errorMessage = "Nota fiscal já existe para este agendamento"
        } else {
          errorMessage = error.response.data.message
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsGeneratingNFe(false)
    }
  }

  const handleOpenResendDialog = (appointment: Appointment) => {
    setSelectedAppointmentForResend(appointment)
    
    // Pre-select notification types based on appointment status
    const availableTypes = []
    if (appointment.status === 'scheduled') availableTypes.push('scheduled', 'reminder')
    if (appointment.status === 'confirmed') availableTypes.push('confirmed', 'reminder')
    if (appointment.status === 'completed') availableTypes.push('completed')
    if (appointment.status === 'cancelled') availableTypes.push('cancelled')
    if (appointment.status === 'missed') availableTypes.push('missed')
    
    setSelectedNotificationTypes(availableTypes.length > 0 ? [availableTypes[0]] : [])
    setShowResendDialog(true)
  }

  const handleResendNotifications = async () => {
    if (!selectedAppointmentForResend || selectedNotificationTypes.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um tipo de notificação",
        variant: "destructive"
      })
      return
    }

    setIsResendingNotifications(true)
    try {
      const response = await api.post(`/appointments/${selectedAppointmentForResend.id}/resend-notifications`, {
        notification_types: selectedNotificationTypes
      })
      
      const { sent_count, failed_count, sent_notifications, failed_notifications } = response.data.data
      
      if (sent_count > 0) {
        toast({
          title: "Sucesso",
          description: `${sent_count} notificação(ões) reenviada(s) com sucesso`,
        })
      }
      
      if (failed_count > 0) {
        const failedTypes = failed_notifications.map((f: any) => f.type).join(', ')
        toast({
          title: "Aviso",
          description: `${failed_count} notificação(ões) falharam: ${failedTypes}`,
          variant: "destructive"
        })
      }
      
      setShowResendDialog(false)
      setSelectedAppointmentForResend(null)
      setSelectedNotificationTypes([])
    } catch (error: any) {
      console.error("Error resending notifications:", error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao reenviar notificações",
        variant: "destructive"
      })
    } finally {
      setIsResendingNotifications(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline">Agendado</Badge>
            </TooltipTrigger>
            <TooltipContent>
              Agendamento realizado
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
        <div className="max-w-[200px] truncate" title={row.original.patient?.name}>
          {row.original.patient?.name}
          <div className="text-xs text-muted-foreground">
            {row.original.patient?.cpf}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "professional_name",
      header: "Profissional",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.original.provider?.name}>
          {row.original.provider && (
            <div className="text-xs text-muted-foreground">
              {row.original.provider?.name}
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
        <div className="max-w-[200px] truncate" title={row.original.procedure?.code}>
          {row.original.procedure?.description}
        </div>
      ),
    },
    {
      accessorKey: "scheduled_date",
      header: "Data/Hora",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          {formatDateTime(row.getValue("scheduled_date"))}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isActionLoading}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Ações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => router.push(`/appointments/${appointment.id}`)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Ver Detalhes
              </DropdownMenuItem>

              {appointment.status === "scheduled" && (
                <>
                  <DropdownMenuItem
                    onClick={() => router.push(`/appointments/${appointment.id}/edit`)}
                    disabled={isActionLoading}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleConfirmAppointment(appointment.id)}
                    disabled={isActionLoading}
                    className="text-green-600"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirmar
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => handleCancelAppointment(appointment.id)}
                    disabled={isActionLoading}
                    className="text-red-600"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancelar
                  </DropdownMenuItem>
                </>
              )}

              {appointment.status === "completed" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      disabled={isGeneratingNFe}
                      className="text-blue-600"
                    >
                      {isGeneratingNFe ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Receipt className="mr-2 h-4 w-4" />
                      )}
                      Gerar NFe
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Gerar Nota Fiscal</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja gerar uma nota fiscal para este agendamento? 
                        Esta ação criará uma nota fiscal eletrônica baseada nos dados do procedimento.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleGenerateNFe(appointment.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Gerar NFe
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleOpenResendDialog(appointment)}
                className="text-orange-600"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reenviar Notificações
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
            <p className="text-muted-foreground">Gerencie os agendamentos de procedimentos médicos</p>
          </div>
            {hasPermission("create appointment") && (
            <CreateAppointmentModal
              open={showCreateAppointmentModal}
              onOpenChange={setShowCreateAppointmentModal}
              onSuccess={() => {
                setShowCreateAppointmentModal(false)
                fetchData()
              }}
            />
          )}
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
                    <SelectItem value="scheduled">Agendado</SelectItem>
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

        <AppointmentModal
          open={showAppointmentModal}
          onOpenChange={setShowAppointmentModal}
          selectedSolicitation={null}
          onSuccess={() => {
            setShowAppointmentModal(false)
            fetchData()
          }}
          showDirectScheduling={false}
        />

      {/* Resend Notifications Dialog */}
      <Dialog open={showResendDialog} onOpenChange={setShowResendDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reenviar Notificações</DialogTitle>
            <DialogDescription>
              Selecione os tipos de notificação que deseja reenviar para este agendamento
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointmentForResend && (
            <div className="space-y-4">
              {/* Appointment Info */}
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm">
                  <div><strong>Paciente:</strong> {selectedAppointmentForResend.patient?.name}</div>
                  <div><strong>Data:</strong> {formatDateTime(selectedAppointmentForResend.scheduled_date)}</div>
                  <div><strong>Status:</strong> {getStatusBadge(selectedAppointmentForResend.status)}</div>
                </div>
              </div>

              {/* Notification Types */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tipos de Notificação</Label>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scheduled"
                      checked={selectedNotificationTypes.includes('scheduled')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedNotificationTypes(prev => [...prev, 'scheduled'])
                        } else {
                          setSelectedNotificationTypes(prev => prev.filter(t => t !== 'scheduled'))
                        }
                      }}
                    />
                    <Label htmlFor="scheduled" className="text-sm">
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Notificação de Agendamento
                      </div>
                    </Label>
                  </div>

                  {['confirmed', 'completed'].includes(selectedAppointmentForResend.status) && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="confirmed"
                        checked={selectedNotificationTypes.includes('confirmed')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedNotificationTypes(prev => [...prev, 'confirmed'])
                          } else {
                            setSelectedNotificationTypes(prev => prev.filter(t => t !== 'confirmed'))
                          }
                        }}
                      />
                      <Label htmlFor="confirmed" className="text-sm">
                        <div className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Notificação de Confirmação
                        </div>
                      </Label>
                    </div>
                  )}

                  {selectedAppointmentForResend.status === 'completed' && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="completed"
                        checked={selectedNotificationTypes.includes('completed')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedNotificationTypes(prev => [...prev, 'completed'])
                          } else {
                            setSelectedNotificationTypes(prev => prev.filter(t => t !== 'completed'))
                          }
                        }}
                      />
                      <Label htmlFor="completed" className="text-sm">
                        <div className="flex items-center">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Notificação de Conclusão
                        </div>
                      </Label>
                    </div>
                  )}

                  {selectedAppointmentForResend.status === 'cancelled' && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cancelled"
                        checked={selectedNotificationTypes.includes('cancelled')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedNotificationTypes(prev => [...prev, 'cancelled'])
                          } else {
                            setSelectedNotificationTypes(prev => prev.filter(t => t !== 'cancelled'))
                          }
                        }}
                      />
                      <Label htmlFor="cancelled" className="text-sm">
                        <div className="flex items-center">
                          <XCircle className="mr-2 h-4 w-4" />
                          Notificação de Cancelamento
                        </div>
                      </Label>
                    </div>
                  )}

                  {selectedAppointmentForResend.status === 'missed' && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="missed"
                        checked={selectedNotificationTypes.includes('missed')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedNotificationTypes(prev => [...prev, 'missed'])
                          } else {
                            setSelectedNotificationTypes(prev => prev.filter(t => t !== 'missed'))
                          }
                        }}
                      />
                      <Label htmlFor="missed" className="text-sm">
                        <div className="flex items-center">
                          <XCircle className="mr-2 h-4 w-4" />
                          Notificação de Falta
                        </div>
                      </Label>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="reminder"
                      checked={selectedNotificationTypes.includes('reminder')}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedNotificationTypes(prev => [...prev, 'reminder'])
                        } else {
                          setSelectedNotificationTypes(prev => prev.filter(t => t !== 'reminder'))
                        }
                      }}
                    />
                    <Label htmlFor="reminder" className="text-sm">
                      <div className="flex items-center">
                        <Bell className="mr-2 h-4 w-4" />
                        Lembrete do Agendamento
                      </div>
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResendDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleResendNotifications}
              disabled={isResendingNotifications || selectedNotificationTypes.length === 0}
            >
              {isResendingNotifications && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reenviar Notificações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  )
}
