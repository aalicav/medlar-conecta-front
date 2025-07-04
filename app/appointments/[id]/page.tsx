"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { 
  Loader2, Edit, ArrowLeft, Calendar, MapPin, 
  AlertCircle, Clock, User, Building, FileText, 
  AlertTriangle, CheckCircle, XCircle, Printer, Search, Receipt, Eye
} from "lucide-react"
import api from "@/services/api-client"
import { formatDateTime } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
  address: {
    id: number
    street: string
    number: string
    complement: string | null
    neighborhood: string | null
    city: string
    state: string
    postal_code: string
    latitude: number | null
    longitude: number | null
    is_primary: boolean
    is_temporary: number
    addressable_type: string
    addressable_id: number
    created_at: string
    updated_at: string
  } | null
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

interface Tuss {
  id: number
  code: string
  description: string
  category?: string
  subcategory?: string | null
  type?: string | null
  amb_code?: string | null
  amb_description?: string | null
}

interface ValueVerification {
  id: number;
  value_type: string;
  original_value: number;
  verified_value?: number;
  status: 'pending' | 'verified' | 'rejected' | 'auto_approved';
  verification_reason?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  billing_batch_id?: number;
  billing_item_id?: number;
  appointment_id?: number;
  created_at: string;
}

export default function AppointmentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const appointmentId = params?.id ? String(params.id) : ''
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [completionNotes, setCompletionNotes] = useState("")
  const [patientAttended, setPatientAttended] = useState<boolean | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [isGeneratingNFe, setIsGeneratingNFe] = useState(false)
  
  // Estados para busca de TUSS
  const [tussSearchOpen, setTussSearchOpen] = useState(false)
  const [tussSearchValue, setTussSearchValue] = useState("")
  const [tussOptions, setTussOptions] = useState<Tuss[]>([])
  const [isLoadingTuss, setIsLoadingTuss] = useState(false)
  const [selectedTuss, setSelectedTuss] = useState<Tuss | null>(null)
  
  const [verifications, setVerifications] = useState<ValueVerification[]>([])
  const [loadingVerifications, setLoadingVerifications] = useState(false)
  
  // Teste do toast para verificar se está funcionando
  useEffect(() => {
    // Remover este teste após confirmar que está funcionando
    // toast({
    //   title: "Teste",
    //   description: "Toast está funcionando",
    // })
  }, [])
  
  // Função para buscar TUSS
  const searchTuss = async (searchTerm: string) => {
    if (searchTerm.length < 3) return
    
    setIsLoadingTuss(true)
    try {
      const response = await api.get('/tuss', {
        params: { search: searchTerm }
      })
      
      if (response?.data?.data) {
        setTussOptions(response.data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar TUSS:', error)
      toast({
        title: "Erro",
        description: "Não foi possível buscar os procedimentos TUSS",
        variant: "destructive"
      })
    } finally {
      setIsLoadingTuss(false)
    }
  }
  
  // Debounce para busca de TUSS
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (tussSearchValue.length >= 3) {
        searchTuss(tussSearchValue)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [tussSearchValue])
  
  // Função para limpar a busca de TUSS
  const clearTussSearch = () => {
    setSelectedTuss(null)
    setTussSearchValue("")
    setTussOptions([])
    setTussSearchOpen(false)
  }
  
  // Função para copiar código TUSS
  const copyTussCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast({
        title: "Código copiado",
        description: `Código TUSS ${code} copiado para a área de transferência`,
      })
    } catch (error) {
      console.error('Erro ao copiar código:', error)
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código",
        variant: "destructive"
      })
    }
  }
  
  const formatAddress = (address: any) => {
    if (!address) return "Não informado"
    
    let formatted = `${address.street}, ${address.number}`
    if (address.complement) {
      formatted += ` - ${address.complement}`
    }
    if (address.neighborhood) {
      formatted += `, ${address.neighborhood}`
    }
    formatted += `, ${address.city} - ${address.state}, CEP: ${address.postal_code}`
    
    return formatted
  }
  
  const fetchAppointment = async () => {
    if (!appointmentId) {
      router.push('/appointments')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.get(`/appointments/${appointmentId}`)
      setAppointment(response.data.data)
    } catch (error: any) {
      console.error("Error fetching appointment:", error)
      
      // Melhorar o tratamento de erro
      let errorMessage = "Não foi possível carregar os dados do agendamento"
      
      if (error.response?.status === 404) {
        errorMessage = "Agendamento não encontrado"
      } else if (error.response?.status === 403) {
        errorMessage = "Você não tem permissão para visualizar este agendamento"
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchAppointment()
  }, [appointmentId])
  
  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast({
        title: "Erro",
        description: "O motivo do cancelamento é obrigatório",
        variant: "destructive"
      })
      return
    }
    
    setIsActionLoading(true)
    try {
      await api.post(`/appointments/${appointmentId}/cancel`, {
        cancellation_reason: cancelReason
      })
      
      toast({
        title: "Sucesso",
        description: "Agendamento cancelado com sucesso",
      })
      
      setIsCancelDialogOpen(false)
      setCancelReason("")
      fetchAppointment()
    } catch (error: any) {
      console.error("Error cancelling appointment:", error)
      
      let errorMessage = "Não foi possível cancelar o agendamento"
      
      if (error.response?.status === 404) {
        errorMessage = "Agendamento não encontrado"
      } else if (error.response?.status === 403) {
        errorMessage = "Você não tem permissão para cancelar este agendamento"
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }
  
  const handleComplete = async () => {
    // Validate that attendance is selected
    if (patientAttended === null || patientAttended === undefined) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, selecione se o paciente compareceu ou não ao agendamento",
        variant: "destructive"
      })
      return
    }

    setIsActionLoading(true)
    try {
      const requestData = {
        patient_attended: patientAttended,
        notes: completionNotes || undefined
      }
      
      console.log('Sending completion data:', requestData)
      
      await api.post(`/appointments/${appointmentId}/complete`, requestData)
      
      toast({
        title: "Sucesso",
        description: patientAttended 
          ? "Agendamento concluído com sucesso - Paciente compareceu" 
          : "Agendamento concluído com sucesso - Paciente não compareceu",
      })
      
      setIsCompleteDialogOpen(false)
      setCompletionNotes("")
      setPatientAttended(null)
      fetchAppointment()
    } catch (error: any) {
      console.error("Error completing appointment:", error)
      console.error("Error response:", error.response?.data)
      
      let errorMessage = "Não foi possível concluir o agendamento"
      
      if (error.response?.status === 422 && error.response?.data?.errors?.patient_attended) {
        errorMessage = "Por favor, selecione se o paciente compareceu ou não ao agendamento"
      } else if (error.response?.status === 404) {
        errorMessage = "Agendamento não encontrado"
      } else if (error.response?.status === 403) {
        errorMessage = "Você não tem permissão para concluir este agendamento"
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCloseCompleteDialog = () => {
    setIsCompleteDialogOpen(false)
    setCompletionNotes("")
    setPatientAttended(null)
  }

  const handleConfirm = async () => {
    setIsActionLoading(true)
    try {
      await api.post(`/appointments/${appointmentId}/confirm`)
      
      toast({
        title: "Sucesso",
        description: "Agendamento confirmado com sucesso",
      })
      
      fetchAppointment()
    } catch (error: any) {
      console.error("Error confirming appointment:", error)
      
      let errorMessage = "Não foi possível confirmar o agendamento"
      
      if (error.response?.status === 404) {
        errorMessage = "Agendamento não encontrado"
      } else if (error.response?.status === 403) {
        errorMessage = "Você não tem permissão para confirmar este agendamento"
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handlePrintGuide = () => {
    router.push(`/appointments/${appointmentId}/guide`)
  }

  const handleGenerateNFe = async () => {
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
  
  // Fetch value verifications for this appointment
  useEffect(() => {
    const fetchVerifications = async () => {
      if (!appointment) return;
      
      try {
        setLoadingVerifications(true);
        const response = await api.get(`/billing/value-verifications?appointment_id=${appointment.id}`);
        if (response.data.data) {
          setVerifications(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching verifications:', error);
      } finally {
        setLoadingVerifications(false);
      }
    };

    fetchVerifications();
  }, [appointment]);

  const getValueTypeDisplay = (valueType: string): string => {
    switch (valueType) {
      case 'appointment_price':
        return 'Preço do Agendamento';
      case 'procedure_price':
        return 'Preço do Procedimento';
      case 'specialty_price':
        return 'Preço da Especialidade';
      case 'contract_price':
        return 'Preço do Contrato';
      case 'billing_amount':
        return 'Valor de Cobrança';
      default:
        return valueType;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'low':
        return 'blue';
      case 'medium':
        return 'orange';
      case 'high':
        return 'red';
      case 'critical':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'verified':
        return 'green';
      case 'rejected':
        return 'red';
      case 'auto_approved':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'verified':
        return 'Verificado';
      case 'rejected':
        return 'Rejeitado';
      case 'auto_approved':
        return 'Auto-aprovado';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!appointment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Agendamento não encontrado</h2>
        <p className="text-muted-foreground mt-2">O agendamento não foi encontrado ou foi removido</p>
        <Button onClick={() => router.push("/appointments")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para lista
        </Button>
      </div>
    )
  }

  const canEdit = appointment.status === "scheduled"
  const canCancel = appointment.status === "scheduled" || appointment.status === "confirmed"
  const canComplete = appointment.status === "confirmed"
  const canConfirm = appointment.status === "scheduled"
  const showGuide = appointment.status === "confirmed" || appointment.status === "completed"
  
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Agendamento #{appointment.id}</h1>
              {getStatusBadge(appointment.status)}
            </div>
            <p className="text-muted-foreground">
              Criado em {formatDateTime(appointment.created_at)}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>

            {showGuide && (
              <Button variant="outline" onClick={handlePrintGuide}>
                <Printer className="h-4 w-4 mr-2" />
                Guia
              </Button>
            )}
            
            {appointment.status === "completed" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" disabled={isGeneratingNFe}>
                    {isGeneratingNFe ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Receipt className="h-4 w-4 mr-2" />
                    )}
                    Gerar NFe
                  </Button>
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
                      onClick={handleGenerateNFe}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Gerar NFe
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {canEdit && (
              <Button variant="outline" onClick={() => router.push(`/appointments/${appointment.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}

            {canConfirm && (
              <Button variant="outline" onClick={handleConfirm} disabled={isActionLoading}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
            )}

            {canComplete && (
              <Button variant="outline" onClick={() => setIsCompleteDialogOpen(true)} disabled={isActionLoading}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Concluir
              </Button>
            )}

            {canCancel && (
              <Button 
                variant="outline" 
                className="text-destructive hover:text-destructive" 
                onClick={() => setIsCancelDialogOpen(true)}
                disabled={isActionLoading}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
        
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome</Label>
                <p className="text-sm text-muted-foreground">{appointment.solicitation.patient.name}</p>
              </div>
              <div>
                <Label>CPF</Label>
                <p className="text-sm text-muted-foreground">{appointment.solicitation.patient.cpf}</p>
              </div>
              <div>
                <Label>Carteirinha</Label>
                <p className="text-sm text-muted-foreground">{appointment.solicitation.patient.health_card_number}</p>
              </div>
              <div>
                <Label>Data de Nascimento</Label>
                <p className="text-sm text-muted-foreground">{appointment.solicitation.patient.birth_date}</p>
              </div>
              <div>
                <Label>Idade</Label>
                <p className="text-sm text-muted-foreground">{appointment.solicitation.patient.age} anos</p>
              </div>
              <div>
                <Label>Gênero</Label>
                <p className="text-sm text-muted-foreground">{appointment.solicitation.patient.gender}</p>
              </div>
              <div>
                <Label>Endereço</Label>
                <p className="text-sm text-muted-foreground">
                  {appointment.solicitation.patient.address}, {appointment.solicitation.patient.city} - {appointment.solicitation.patient.state}
                </p>
                <p className="text-sm text-muted-foreground">CEP: {appointment.solicitation.patient.postal_code}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plano de Saúde</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome do Plano</Label>
                <p className="text-sm text-muted-foreground">{appointment.solicitation.health_plan.name}</p>
              </div>
              <div>
                <Label>Código ANS</Label>
                <p className="text-sm text-muted-foreground">{appointment.solicitation.health_plan.ans_code}</p>
              </div>
              <div>
                <Label>CNPJ</Label>
                <p className="text-sm text-muted-foreground">{appointment.solicitation.health_plan.cnpj}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Procedimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Código TUSS</Label>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">{appointment.procedure.code}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyTussCode(appointment.procedure.code)}
                    className="h-6 w-6 p-0"
                  >
                    <FileText className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <p className="text-sm text-muted-foreground">{appointment.procedure.description}</p>
              </div>
              <div>
                <Label>Data/Hora</Label>
                <p className="text-sm text-muted-foreground">{formatDateTime(appointment.scheduled_date)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Local do Atendimento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {appointment.provider ? (
                <>
                  <div>
                    <Label>Profissional</Label>
                    <p className="text-sm text-muted-foreground">{appointment.provider.name}</p>
                  </div>
                  <div>
                    <Label>CRM</Label>
                    <p className="text-sm text-muted-foreground">{appointment.provider.registration_number || "Não informado"}</p>
                  </div>
                  <div>
                    <Label>Especialidades</Label>
                    <p className="text-sm text-muted-foreground">
                      {appointment.provider.specialty}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Informações não disponíveis</p>
              )}
            </CardContent>
          </Card>

          {appointment.address && (
            <Card>
              <CardHeader>
                <CardTitle>Endereço do Atendimento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Endereço</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatAddress(appointment.address)}
                  </p>
                </div>
                {appointment.address.neighborhood && (
                  <div>
                    <Label>Bairro</Label>
                    <p className="text-sm text-muted-foreground">{appointment.address.neighborhood}</p>
                  </div>
                )}
                <div>
                  <Label>Cidade/Estado</Label>
                  <p className="text-sm text-muted-foreground">
                    {appointment.address.city} - {appointment.address.state}
                  </p>
                </div>
                <div>
                  <Label>CEP</Label>
                  <p className="text-sm text-muted-foreground">{appointment.address.postal_code}</p>
                </div>
                {appointment.address.is_temporary === 1 && (
                  <div>
                    <Badge variant="outline" className="text-orange-600 border-orange-600">
                      Endereço Temporário
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Status do Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status Atual</Label>
                <div className="mt-1">
                  {getStatusBadge(appointment.status)}
                </div>
              </div>
              
              {appointment.confirmed_date && (
                <div>
                  <Label>Confirmado em</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(appointment.confirmed_date)}
                    {appointment.confirmed_by_user && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        por {appointment.confirmed_by_user.name}
                      </span>
                    )}
                  </p>
                </div>
              )}
              
              {appointment.completed_date && (
                <div>
                  <Label>Concluído em</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(appointment.completed_date)}
                    {appointment.completed_by_user && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        por {appointment.completed_by_user.name}
                      </span>
                    )}
                  </p>
                </div>
              )}
              
              {appointment.cancelled_date && (
                <div>
                  <Label>Cancelado em</Label>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(appointment.cancelled_date)}
                    {appointment.cancelled_by_user && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        por {appointment.cancelled_by_user.name}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {appointment.solicitation.description && (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{appointment.solicitation.description}</p>
              </CardContent>
            </Card>
          )}

          {appointment.solicitation.cancel_reason && (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle className="text-destructive">Motivo do Cancelamento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{appointment.solicitation.cancel_reason}</p>
              </CardContent>
            </Card>
          )}

          {appointment.solicitation.completed_at && (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Anotações da Conclusão</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {appointment.solicitation.completed_at}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Value Verifications Section */}
        {verifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Verificações de Valores</CardTitle>
              <CardDescription>
                Este agendamento possui {verifications.length} verificação(ões) de valores associada(s).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Verificações de valores para este agendamento
                  </p>
                  <Link href="/value-verifications">
                    <Button size="sm">
                      Ver Todas
                    </Button>
                  </Link>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor Original</TableHead>
                      <TableHead>Valor Verificado</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Data Criação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {verifications.map((verification) => (
                      <TableRow key={verification.id}>
                        <TableCell>
                          <Link href={`/value-verifications/${verification.id}`} className="text-blue-600 hover:underline">
                            {verification.id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getValueTypeDisplay(verification.value_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(verification.original_value)}</TableCell>
                        <TableCell>
                          {verification.verified_value ? formatCurrency(verification.verified_value) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityColor(verification.priority) === 'red' ? 'destructive' : 'secondary'}>
                            {verification.priority.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(verification.status) === 'green' ? 'default' : 'secondary'}>
                            {getStatusText(verification.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                                {verification.verification_reason}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{verification.verification_reason}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{new Date(verification.created_at).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell>
                          <Link href={`/value-verifications/${verification.id}`}>
                            <Button size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancel Dialog */}
        <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar Agendamento</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cancel-reason">Motivo do Cancelamento</Label>
                <Textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Digite o motivo do cancelamento"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} disabled={isActionLoading}>
                Voltar
              </Button>
              <Button variant="destructive" onClick={handleCancel} disabled={isActionLoading}>
                {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Cancelamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Complete Dialog */}
        <Dialog open={isCompleteDialogOpen} onOpenChange={handleCloseCompleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Concluir Agendamento</DialogTitle>
              <DialogDescription>
                Confirme a conclusão do atendimento e adicione observações se necessário.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Attendance Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Comparecimento</Label>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="attended"
                      name="attendance"
                      checked={patientAttended === true}
                      onChange={() => setPatientAttended(true)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <Label htmlFor="attended" className="text-sm cursor-pointer">
                      <div className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        Paciente compareceu
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="missed"
                      name="attendance"
                      checked={patientAttended === false}
                      onChange={() => setPatientAttended(false)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <Label htmlFor="missed" className="text-sm cursor-pointer">
                      <div className="flex items-center">
                        <XCircle className="mr-2 h-4 w-4 text-red-600" />
                        Paciente não compareceu
                      </div>
                    </Label>
                  </div>
                </div>
                
                {/* Error message */}
                {patientAttended === null && (
                  <div className="text-sm text-red-600 mt-2">
                    * Selecione se o paciente compareceu ou não
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="completion-notes">Observações da Conclusão</Label>
                <Textarea
                  id="completion-notes"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Adicione observações sobre o atendimento (opcional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseCompleteDialog} disabled={isActionLoading}>
                Voltar
              </Button>
              <Button 
                onClick={handleComplete} 
                disabled={isActionLoading || patientAttended === null || patientAttended === undefined}
              >
                {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Conclusão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
} 