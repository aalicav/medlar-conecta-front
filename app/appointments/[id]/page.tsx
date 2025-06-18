"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { 
  Loader2, Edit, ArrowLeft, Calendar, MapPin, 
  AlertCircle, Clock, User, Building, FileText, 
  AlertTriangle, CheckCircle, XCircle, Printer, Search
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
  const [isActionLoading, setIsActionLoading] = useState(false)
  
  // Estados para busca de TUSS
  const [tussSearchOpen, setTussSearchOpen] = useState(false)
  const [tussSearchValue, setTussSearchValue] = useState("")
  const [tussOptions, setTussOptions] = useState<Tuss[]>([])
  const [isLoadingTuss, setIsLoadingTuss] = useState(false)
  const [selectedTuss, setSelectedTuss] = useState<Tuss | null>(null)
  
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
    setIsActionLoading(true)
    try {
      await api.post(`/appointments/${appointmentId}/complete`, {
        completion_notes: completionNotes
      })
      
      toast({
        title: "Sucesso",
        description: "Agendamento concluído com sucesso",
      })
      
      setIsCompleteDialogOpen(false)
      setCompletionNotes("")
      fetchAppointment()
    } catch (error: any) {
      console.error("Error completing appointment:", error)
      
      let errorMessage = "Não foi possível concluir o agendamento"
      
      if (error.response?.status === 404) {
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
              
              {/* Busca de TUSS */}
              <div className="pt-4 border-t">
                <Label>Buscar Outros Procedimentos TUSS</Label>
                <Popover open={tussSearchOpen} onOpenChange={setTussSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={tussSearchOpen}
                      className="w-full justify-between"
                    >
                      {selectedTuss ? (
                        `${selectedTuss.code} - ${selectedTuss.description}`
                      ) : (
                        "Buscar procedimentos TUSS..."
                      )}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Digite para buscar procedimentos TUSS..."
                        value={tussSearchValue}
                        onValueChange={setTussSearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {isLoadingTuss ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Buscando...
                            </div>
                          ) : tussSearchValue.length < 3 ? (
                            "Digite pelo menos 3 caracteres para buscar"
                          ) : (
                            "Nenhum procedimento encontrado"
                          )}
                        </CommandEmpty>
                        <CommandGroup>
                          {tussOptions.map((tuss) => (
                            <CommandItem
                              key={tuss.id}
                              value={`${tuss.code} ${tuss.description}`}
                              onSelect={() => {
                                setSelectedTuss(tuss)
                                setTussSearchOpen(false)
                                setTussSearchValue("")
                              }}
                            >
                              <div className="flex flex-col">
                                <div className="font-medium">
                                  {tuss.code} - {tuss.description}
                                </div>
                                {tuss.category && (
                                  <div className="text-sm text-muted-foreground">
                                    Categoria: {tuss.category}
                                  </div>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                {selectedTuss && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium">Procedimento Selecionado:</div>
                        <div className="text-sm text-muted-foreground">
                          <strong>{selectedTuss.code}</strong> - {selectedTuss.description}
                        </div>
                        {selectedTuss.category && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Categoria: {selectedTuss.category}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyTussCode(selectedTuss.code)}
                          className="h-6 w-6 p-0"
                        >
                          <FileText className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearTussSearch}
                          className="h-6 w-6 p-0"
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
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
                    <p className="text-sm text-muted-foreground">{appointment.provider.registration_number}</p>
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
        <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Concluir Agendamento</DialogTitle>
              <DialogDescription>
                Confirme a conclusão do atendimento e adicione observações se necessário.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
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
              <Button variant="outline" onClick={() => setIsCompleteDialogOpen(false)} disabled={isActionLoading}>
                Voltar
              </Button>
              <Button onClick={handleComplete} disabled={isActionLoading}>
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