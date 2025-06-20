"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { fetchResource, type QueryParams } from "@/services/resource-service"
import { Plus, FileText, Edit, CheckCircle, XCircle, Search, Calendar, Clock, Loader2, Receipt, MoreHorizontal, RefreshCw, Bell } from "lucide-react"
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
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface Solicitation {
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
  price: number | null
  pricing_contract: {
    id: number
    price: number
    notes: string | null
    start_date: string
    end_date: string | null
  } | null
  provider: {
    id: number
    name: string
    type: string
    addresses: Array<{
      id: number
      street: string
      number: string
      complement: string | null
      neighborhood: string
      city: string
      state: string
      postal_code: string
      is_primary: boolean
      full_address: string
    }>
  }
}

interface Professional {
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
  addresses: Address[]
}

interface Address {
  id: number
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  postal_code: string
  is_primary: boolean
  full_address: string
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
  const [solicitations, setSolicitations] = useState<Solicitation[]>([])
  const [selectedSolicitation, setSelectedSolicitation] = useState<Solicitation | null>(null)
  const [availabilities, setAvailabilities] = useState<ProfessionalAvailability[]>([])
  const [showAvailabilities, setShowAvailabilities] = useState(false)
  const [selectedAvailability, setSelectedAvailability] = useState<ProfessionalAvailability | null>(null)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [customAddress, setCustomAddress] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    postal_code: ''
  })
  const [isSearchingCep, setIsSearchingCep] = useState(false)
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [isGeneratingNFe, setIsGeneratingNFe] = useState(false)

  // Resend notifications state
  const [showResendDialog, setShowResendDialog] = useState(false)
  const [selectedAppointmentForResend, setSelectedAppointmentForResend] = useState<Appointment | null>(null)
  const [selectedNotificationTypes, setSelectedNotificationTypes] = useState<string[]>([])
  const [isResendingNotifications, setIsResendingNotifications] = useState(false)

  const [showDirectScheduling, setShowDirectScheduling] = useState(false)
  const [directSchedulingDate, setDirectSchedulingDate] = useState("")
  const [directSchedulingTime, setDirectSchedulingTime] = useState("")
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProvider, setSelectedProvider] = useState<Professional | null>(null)

  const [showAppointmentModal, setShowAppointmentModal] = useState(false)

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

  const handleSelectAvailability = (availability: ProfessionalAvailability) => {
    if (!selectedSolicitation) return
    setShowAppointmentModal(true)
  }

  const handleSearchCep = async (cep: string) => {
    if (cep.length !== 8) return
    
    setIsSearchingCep(true)
    try {
      // Requisição direta para a API do ViaCEP
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        throw new Error('CEP não encontrado')
      }

      setCustomAddress({
        street: data.logradouro,
        number: '',
        complement: data.complemento || '',
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        postal_code: data.cep
      })
      
      toast({
        title: "Sucesso",
        description: "Endereço encontrado"
      })
    } catch (error) {
      console.error("Error searching CEP:", error)
      toast({
        title: "Erro",
        description: "CEP não encontrado",
        variant: "destructive"
      })
    } finally {
      setIsSearchingCep(false)
    }
  }

  const handleCreateAppointmentWithAddress = async () => {
    if (!selectedAvailability) return
    
    setIsActionLoading(true)
    try {
      const payload: any = {
        notes: ''
      }
      
      if (selectedAddressId) {
        payload.address_id = selectedAddressId
      } else {
        // Use custom address
        payload.custom_address = customAddress
      }
      
      await api.post(`/availabilities/${selectedAvailability.id}/select`, payload)
      
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso"
      })
      
      setShowAddressModal(false)
      setShowAvailabilities(false)
      setSelectedAvailability(null)
      setSelectedAddressId(null)
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

  // Função para buscar profissionais quando uma solicitação é selecionada no modo direto
  const fetchProfessionals = async (solicitationId: number) => {
    try {
      const response = await api.get(`/solicitations/${solicitationId}/available-professionals`)
      setProfessionals(response.data.data)
    } catch (error) {
      console.error("Error fetching professionals:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os profissionais",
        variant: "destructive"
      })
    }
  }

  // Função para buscar detalhes do profissional selecionado
  const fetchProviderDetails = async (providerId: number) => {
    try {
      const response = await api.get(`/professionals/${providerId}`)
      setSelectedProvider(response.data.data)
    } catch (error) {
      console.error("Error fetching provider details:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do profissional",
        variant: "destructive"
      })
    }
  }

  // Função para criar agendamento direto
  const handleCreateDirectAppointment = () => {
    if (!selectedSolicitation) return
    setShowAppointmentModal(true)
  }

  // Atualizar useEffect para carregar profissionais quando uma solicitação é selecionada no modo direto
  useEffect(() => {
    if (selectedSolicitation && showDirectScheduling) {
      fetchProfessionals(selectedSolicitation.id)
    }
  }, [selectedSolicitation, showDirectScheduling])

  // Atualizar useEffect para carregar detalhes do profissional quando selecionado
  useEffect(() => {
    if (selectedProviderId) {
      fetchProviderDetails(selectedProviderId)
    }
  }, [selectedProviderId])

  return (
    <TooltipProvider>
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
                  Escolha o método de agendamento
                </DialogDescription>
              </DialogHeader>

              <div className="flex items-center space-x-2 mb-4">
                <Label htmlFor="scheduling-type">Tipo de Agendamento:</Label>
                <Select
                  onValueChange={(value) => {
                    if (value === 'direct') {
                      setShowDirectScheduling(true)
                      setSelectedSolicitation(null)
                      setAvailabilities([])
                    } else {
                      setShowDirectScheduling(false)
                    }
                  }}
                  defaultValue="availability"
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="availability">Por Disponibilidade</SelectItem>
                    <SelectItem value="direct">Agendamento Direto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!showDirectScheduling ? (
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
                            if (!showDirectScheduling) {
                              fetchAvailabilities(solicitation.id)
                            }
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                  <div className="font-medium text-sm truncate">{solicitation.patient?.name || 'Paciente não especificado'}</div>
                                  <div className="text-muted-foreground truncate">
                                    CPF: {solicitation.patient?.cpf || '-'} • {solicitation.patient?.age || '-'} anos
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {solicitation.health_plan?.name || 'Plano não especificado'}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-1.5">
                                <div className="truncate">
                                  <span className="font-medium">Plano:</span> {solicitation.health_plan?.name || '-'}
                                  <div className="text-muted-foreground truncate">
                                    ANS: {solicitation.health_plan?.ans_code || '-'}
                                  </div>
                                </div>
                                <div className="truncate">
                                  <span className="font-medium">Carteira:</span> {solicitation.patient?.health_card_number || '-'}
                                </div>
                              </div>

                              <div className="truncate">
                                <span className="font-medium">Procedimento:</span> {solicitation.tuss?.description || '-'}
                                <div className="text-muted-foreground truncate">
                                  Código TUSS: {solicitation.tuss?.code || '-'}
                                </div>
                              </div>

                              {solicitation.description && (
                                <div className="truncate">
                                  <span className="font-medium">Observação:</span> {solicitation.description}
                                </div>
                              )}

                              <div className="truncate">
                                <span className="font-medium">Solicitado por:</span> {solicitation.requested_by_user?.name || '-'}
                                <div className="text-muted-foreground truncate">
                                  {solicitation.requested_by_user?.email || '-'}
                                </div>
                              </div>

                              <div className="truncate">
                                <span className="font-medium">Prioridade:</span> {solicitation.priority || '-'}
                              </div>
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
                                    <div className="font-medium text-sm truncate">
                                      {availability.provider?.name || 'Profissional não especificado'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatDateTime(availability.available_date)} às{" "}
                                      {availability.available_time}
                                    </div>
                                    {availability.price && (
                                      <div className="text-sm font-semibold text-green-600 mt-1">
                                        R$ {availability.price.toFixed(2)}
                                      </div>
                                    )}
                                    {availability.provider?.addresses && availability.provider.addresses.length > 0 && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        <span className="font-medium">Endereços disponíveis:</span> {availability.provider.addresses.length}
                                      </div>
                                    )}
                                  </div>
                                  {getStatusBadge(availability.status)}
                                </div>

                                {availability.notes && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {availability.notes}
                                  </div>
                                )}

                                {availability.pricing_contract?.notes && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    <span className="font-medium">Observações do Preço:</span> {availability.pricing_contract.notes}
                                  </div>
                                )}

                                {availability.status === "pending" && (
                                  <Button
                                    className="w-full text-xs h-8"
                                    onClick={() => handleSelectAvailability(availability)}
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
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm">Solicitação</h3>
                    <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2">
                      {solicitations.map((solicitation) => (
                        <Card
                          key={solicitation.id}
                          className={`cursor-pointer transition-colors ${
                            selectedSolicitation?.id === solicitation.id
                              ? "border-primary"
                              : "hover:border-muted-foreground"
                          }`}
                          onClick={() => setSelectedSolicitation(solicitation)}
                        >
                          <CardContent className="p-3">
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                  <div className="font-medium text-sm truncate">{solicitation.patient?.name || 'Paciente não especificado'}</div>
                                  <div className="text-muted-foreground truncate">
                                    CPF: {solicitation.patient?.cpf || '-'} • {solicitation.patient?.age || '-'} anos
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {solicitation.health_plan?.name || 'Plano não especificado'}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-1.5">
                                <div className="truncate">
                                  <span className="font-medium">Plano:</span> {solicitation.health_plan?.name || '-'}
                                  <div className="text-muted-foreground truncate">
                                    ANS: {solicitation.health_plan?.ans_code || '-'}
                                  </div>
                                </div>
                                <div className="truncate">
                                  <span className="font-medium">Carteira:</span> {solicitation.patient?.health_card_number || '-'}
                                </div>
                              </div>

                              <div className="truncate">
                                <span className="font-medium">Procedimento:</span> {solicitation.tuss?.description || '-'}
                                <div className="text-muted-foreground truncate">
                                  Código TUSS: {solicitation.tuss?.code || '-'}
                                </div>
                              </div>

                              {solicitation.description && (
                                <div className="truncate">
                                  <span className="font-medium">Observação:</span> {solicitation.description}
                                </div>
                              )}

                              <div className="truncate">
                                <span className="font-medium">Solicitado por:</span> {solicitation.requested_by_user?.name || '-'}
                                <div className="text-muted-foreground truncate">
                                  {solicitation.requested_by_user?.email || '-'}
                                </div>
                              </div>

                              <div className="truncate">
                                <span className="font-medium">Prioridade:</span> {solicitation.priority || '-'}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {selectedSolicitation && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Data e Hora</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setDirectSchedulingDate(e.target.value)}
                          />
                          <Input
                            type="time"
                            onChange={(e) => setDirectSchedulingTime(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Profissional</Label>
                        <Select onValueChange={(value) => setSelectedProviderId(Number(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o profissional" />
                          </SelectTrigger>
                          <SelectContent>
                            {professionals.map((professional) => (
                              <SelectItem key={professional.id} value={professional.id.toString()}>
                                {professional.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Endereço</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Usar endereço existente</Label>
                            {selectedProvider?.addresses?.map((address: Address) => (
                              <Card
                                key={address.id}
                                className={`cursor-pointer mt-2 transition-colors ${
                                  selectedAddressId === address.id
                                    ? "border-primary"
                                    : "hover:border-muted-foreground"
                                }`}
                                onClick={() => {
                                  setSelectedAddressId(address.id)
                                  setCustomAddress({
                                    street: '',
                                    number: '',
                                    complement: '',
                                    neighborhood: '',
                                    city: '',
                                    state: '',
                                    postal_code: ''
                                  })
                                }}
                              >
                                <CardContent className="p-3">
                                  <div className="space-y-1">
                                    <div className="text-sm font-medium">
                                      {address.street}, {address.number}
                                      {address.is_primary && (
                                        <Badge variant="outline" className="ml-2 text-xs">Principal</Badge>
                                      )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {address.complement && `${address.complement}, `}
                                      {address.neighborhood} - {address.city}/{address.state}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      CEP: {address.postal_code}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>

                          <div>
                            <Label>Ou usar endereço personalizado</Label>
                            <div className="space-y-2 mt-2">
                              <Input
                                placeholder="CEP"
                                value={customAddress.postal_code}
                                onChange={(e) => {
                                  const cep = e.target.value.replace(/\D/g, '')
                                  setCustomAddress(prev => ({ ...prev, postal_code: cep }))
                                  if (cep.length === 8) {
                                    handleSearchCep(cep)
                                  }
                                }}
                                maxLength={8}
                              />
                              <Input
                                placeholder="Rua"
                                value={customAddress.street}
                                onChange={(e) => setCustomAddress(prev => ({ ...prev, street: e.target.value }))}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Número"
                                  value={customAddress.number}
                                  onChange={(e) => setCustomAddress(prev => ({ ...prev, number: e.target.value }))}
                                />
                                <Input
                                  placeholder="Complemento"
                                  value={customAddress.complement}
                                  onChange={(e) => setCustomAddress(prev => ({ ...prev, complement: e.target.value }))}
                                />
                              </div>
                              <Input
                                placeholder="Bairro"
                                value={customAddress.neighborhood}
                                onChange={(e) => setCustomAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  placeholder="Cidade"
                                  value={customAddress.city}
                                  onChange={(e) => setCustomAddress(prev => ({ ...prev, city: e.target.value }))}
                                />
                                <Input
                                  placeholder="Estado"
                                  value={customAddress.state}
                                  onChange={(e) => setCustomAddress(prev => ({ ...prev, state: e.target.value }))}
                                  maxLength={2}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button 
                        className="w-full"
                        onClick={handleCreateDirectAppointment}
                        disabled={
                          !selectedSolicitation ||
                          !directSchedulingDate ||
                          !directSchedulingTime ||
                          !selectedProviderId ||
                          (!selectedAddressId && (!customAddress.street || !customAddress.number))
                        }
                      >
                        {isActionLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Criar Agendamento
                      </Button>
                    </div>
                  )}
                </div>
              )}
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
          selectedSolicitation={selectedSolicitation}
          onSuccess={() => {
            setShowAppointmentModal(false)
            setShowAvailabilities(false)
            fetchData()
          }}
          showDirectScheduling={showDirectScheduling}
        />
      </div>

      {/* Address Selection Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Selecionar Endereço para Agendamento</DialogTitle>
            <DialogDescription>
              Escolha um endereço existente ou informe um endereço personalizado para o agendamento
            </DialogDescription>
          </DialogHeader>
          
          {selectedAvailability && (
            <div className="space-y-6">
              {/* Provider Info */}
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-medium text-sm mb-2">Informações do Profissional</h3>
                <div className="text-sm text-muted-foreground">
                  <div><strong>Nome:</strong> {selectedAvailability.provider.name}</div>
                  <div><strong>Data/Hora:</strong> {formatDateTime(selectedAvailability.available_date)} às {selectedAvailability.available_time}</div>
                  {selectedAvailability.price && (
                    <div><strong>Preço:</strong> R$ {selectedAvailability.price.toFixed(2)}</div>
                  )}
                </div>
              </div>

              {/* Existing Addresses */}
              {selectedAvailability.provider.addresses && selectedAvailability.provider.addresses.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-sm">Endereços Disponíveis</h3>
                  <div className="space-y-2">
                    {selectedAvailability.provider.addresses.map((address: Address) => (
                      <Card
                        key={address.id}
                        className={`cursor-pointer transition-colors ${
                          selectedAddressId === address.id
                            ? "border-primary"
                            : "hover:border-muted-foreground"
                        }`}
                        onClick={() => setSelectedAddressId(address.id)}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">
                                {address.street}, {address.number}
                                {address.is_primary && (
                                  <Badge variant="outline" className="ml-2 text-xs">Principal</Badge>
                                )}
                              </div>
                              <input
                                type="radio"
                                name="address"
                                checked={selectedAddressId === address.id}
                                onChange={() => setSelectedAddressId(address.id)}
                                className="ml-2"
                              />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {address.complement && `${address.complement}, `}
                              {address.neighborhood} - {address.city}/{address.state}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              CEP: {address.postal_code}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Address */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm">Endereço Personalizado</h3>
                  <input
                    type="radio"
                    name="address"
                    checked={selectedAddressId === null}
                    onChange={() => setSelectedAddressId(null)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cep"
                        placeholder="00000-000"
                        value={customAddress.postal_code}
                        onChange={(e) => {
                          const cep = e.target.value.replace(/\D/g, '')
                          setCustomAddress(prev => ({ ...prev, postal_code: cep }))
                          if (cep.length === 8) {
                            handleSearchCep(cep)
                          }
                        }}
                        maxLength={8}
                      />
                      {isSearchingCep && (
                        <Button variant="outline" size="icon" disabled>
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="street">Logradouro</Label>
                    <Input
                      id="street"
                      placeholder="Rua/Avenida"
                      value={customAddress.street}
                      onChange={(e) => setCustomAddress(prev => ({ ...prev, street: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      placeholder="123"
                      value={customAddress.number}
                      onChange={(e) => setCustomAddress(prev => ({ ...prev, number: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      placeholder="Apto 101"
                      value={customAddress.complement}
                      onChange={(e) => setCustomAddress(prev => ({ ...prev, complement: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      placeholder="Centro"
                      value={customAddress.neighborhood}
                      onChange={(e) => setCustomAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      placeholder="São Paulo"
                      value={customAddress.city}
                      onChange={(e) => setCustomAddress(prev => ({ ...prev, city: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      placeholder="SP"
                      value={customAddress.state}
                      onChange={(e) => setCustomAddress(prev => ({ ...prev, state: e.target.value }))}
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddressModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateAppointmentWithAddress}
              disabled={isActionLoading || (!selectedAddressId && (!customAddress.street || !customAddress.number))}
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </TooltipProvider>
  )
}
