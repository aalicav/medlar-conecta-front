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
  AlertTriangle, CheckCircle, XCircle, Printer
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
} from "@/components/ui/tooltip"

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
  tuss_code: string
  status: string
  scheduled_date: string
  created_at: string
  notes?: string
  cancellation_reason?: string
  completion_notes?: string
  patient: {
    id: number
    name: string
    cpf: string
    health_card_number: string
    birth_date: string
    gender: string
  }
  health_plan: {
    id: number
    name: string
    ans_code: string
  }
  professional?: {
    id: number
    name: string
    specialties: string[]
    crm?: string
  }
  clinic?: {
    id: number
    name: string
    address: string
    phone: string
  }
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
  
  const fetchAppointment = async () => {
    if (!appointmentId) {
      router.push('/appointments')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.get(`/appointments/${appointmentId}`)
      setAppointment(response.data.data)
    } catch (error) {
      console.error("Error fetching appointment:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do agendamento",
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
      fetchAppointment()
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
      fetchAppointment()
    } catch (error) {
      console.error("Error completing appointment:", error)
      toast({
        title: "Erro",
        description: "Não foi possível concluir o agendamento",
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

  const handlePrintGuide = () => {
    router.push(`/appointments/${appointmentId}/guide`)
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

  const canEdit = appointment.status === "pending"
  const canCancel = appointment.status === "pending" || appointment.status === "confirmed"
  const canComplete = appointment.status === "confirmed"
  const canConfirm = appointment.status === "pending"
  const showGuide = appointment.status === "confirmed" || appointment.status === "completed"
  
  return (
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
              <p className="text-sm text-muted-foreground">{appointment.patient.name}</p>
            </div>
            <div>
              <Label>CPF</Label>
              <p className="text-sm text-muted-foreground">{appointment.patient.cpf}</p>
            </div>
            <div>
              <Label>Carteirinha</Label>
              <p className="text-sm text-muted-foreground">{appointment.patient.health_card_number}</p>
            </div>
            <div>
              <Label>Data de Nascimento</Label>
              <p className="text-sm text-muted-foreground">{appointment.patient.birth_date}</p>
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
              <p className="text-sm text-muted-foreground">{appointment.health_plan.name}</p>
            </div>
            <div>
              <Label>Código ANS</Label>
              <p className="text-sm text-muted-foreground">{appointment.health_plan.ans_code}</p>
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
              <p className="text-sm text-muted-foreground">{appointment.tuss_code}</p>
            </div>
            <div>
              <Label>Descrição</Label>
              <p className="text-sm text-muted-foreground">{appointment.tuss_name}</p>
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
            {appointment.clinic ? (
              <>
                <div>
                  <Label>Clínica</Label>
                  <p className="text-sm text-muted-foreground">{appointment.clinic.name}</p>
                </div>
                <div>
                  <Label>Endereço</Label>
                  <p className="text-sm text-muted-foreground">{appointment.clinic.address}</p>
                </div>
                <div>
                  <Label>Telefone</Label>
                  <p className="text-sm text-muted-foreground">{appointment.clinic.phone}</p>
                </div>
              </>
            ) : appointment.professional ? (
              <>
                <div>
                  <Label>Profissional</Label>
                  <p className="text-sm text-muted-foreground">{appointment.professional.name}</p>
                </div>
                <div>
                  <Label>CRM</Label>
                  <p className="text-sm text-muted-foreground">{appointment.professional.crm}</p>
                </div>
                <div>
                  <Label>Especialidades</Label>
                  <p className="text-sm text-muted-foreground">
                    {appointment.professional.specialties.join(", ")}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Informações não disponíveis</p>
            )}
          </CardContent>
        </Card>

        {appointment.notes && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{appointment.notes}</p>
            </CardContent>
          </Card>
        )}

        {appointment.status === "cancelled" && appointment.cancellation_reason && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle className="text-destructive">Motivo do Cancelamento</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{appointment.cancellation_reason}</p>
            </CardContent>
          </Card>
        )}

        {appointment.status === "completed" && appointment.completion_notes && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Anotações da Conclusão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {appointment.completion_notes}
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
  )
} 