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
  AlertTriangle, CheckCircle, XCircle, RefreshCw
} from "lucide-react"
import api from "@/services/api-client"
import { formatDate } from "@/lib/utils"
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

interface Solicitation {
  id: number
  health_plan_id: number
  patient_id: number
  tuss_id: number
  status: string
  priority: string
  notes: string | null
  preferred_date_start: string
  preferred_date_end: string
  preferred_location_lat: number | null
  preferred_location_lng: number | null
  max_distance_km: number | null
  scheduled_automatically: boolean
  completed_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  created_at: string
  updated_at: string
  health_plan: {
    id: number
    name: string
  }
  patient: {
    id: number
    name: string
  }
  tuss: {
    id: number
    code: string
    name: string
  }
  requested_by_user: {
    id: number
    name: string
  }
  appointments: Array<{
    id: number
    scheduled_date: string
    status: string
    provider: {
      id: number
      name: string
      type?: string
    }
  }>
  is_active: boolean
  days_remaining: number
  is_expired: boolean
}

export default function SolicitationDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const solicitationId = params.id as string
  
  const [solicitation, setSolicitation] = useState<Solicitation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isActionLoading, setIsActionLoading] = useState(false)
  
  const fetchSolicitation = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/solicitations/${solicitationId}`)
      setSolicitation(response.data.data)
    } catch (error) {
      console.error("Error fetching solicitation:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da solicitação",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  useEffect(() => {
    fetchSolicitation()
  }, [solicitationId])
  
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
      await api.post(`/solicitations/${solicitationId}/cancel`, {
        cancel_reason: cancelReason
      })
      
      toast({
        title: "Sucesso",
        description: "Solicitação cancelada com sucesso",
      })
      
      setIsCancelDialogOpen(false)
      fetchSolicitation()
    } catch (error) {
      console.error("Error cancelling solicitation:", error)
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a solicitação",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }
  
  const handleComplete = async () => {
    setIsActionLoading(true)
    try {
      await api.post(`/solicitations/${solicitationId}/complete`)
      
      toast({
        title: "Sucesso",
        description: "Solicitação completada com sucesso",
      })
      
      fetchSolicitation()
    } catch (error) {
      console.error("Error completing solicitation:", error)
      toast({
        title: "Erro",
        description: "Não foi possível completar a solicitação",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }
  
  const handleForceSchedule = async () => {
    setIsActionLoading(true)
    try {
      await api.post(`/solicitations/${solicitationId}/force-schedule`)
      
      toast({
        title: "Sucesso",
        description: "Solicitação enviada para agendamento",
      })
      
      fetchSolicitation()
    } catch (error) {
      console.error("Error forcing schedule:", error)
      toast({
        title: "Erro",
        description: "Não foi possível agendar a solicitação",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!solicitation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Solicitação não encontrada</h2>
        <p className="text-muted-foreground mt-2">A solicitação não foi encontrada ou foi removida</p>
        <Button onClick={() => router.push("/solicitations")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para lista
        </Button>
      </div>
    )
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
        return <Badge variant="destructive">Falha</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">Alta</Badge>
      case "normal":
        return <Badge variant="secondary">Normal</Badge>
      case "low":
        return <Badge variant="outline">Baixa</Badge>
      case "urgent":
        return <Badge variant="destructive" className="animate-pulse">Urgente</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }
  
  const canEdit = solicitation.status === "pending" || solicitation.status === "processing" || solicitation.status === "failed";
  const canCancel = solicitation.status !== "cancelled" && solicitation.status !== "completed";
  const canComplete = solicitation.status === "scheduled" && solicitation.appointments && 
                     solicitation.appointments.every(app => app.status === "completed");
  const canSchedule = solicitation.status === "pending" || solicitation.status === "processing" || solicitation.status === "failed";
  const canRetry = solicitation.status === "failed";
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <div className="flex items-center">
            <h1 className="text-3xl font-bold tracking-tight mr-2">Solicitação #{solicitation.id}</h1>
            {getStatusBadge(solicitation.status)}
          </div>
          <p className="text-muted-foreground">
            Criada em {formatDate(solicitation.created_at)}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          {canEdit && (
            <Button variant="outline" onClick={() => router.push(`/solicitations/${solicitation.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          )}
          {canSchedule && (
            <Button variant="outline" onClick={() => router.push(`/appointments/new?solicitation_id=${solicitation.id}`)}>
              <Calendar className="h-4 w-4 mr-2" />
              Agendar
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Detalhes da Solicitação</CardTitle>
            <CardDescription>Informações do procedimento solicitado</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Procedimento TUSS</h3>
              <p>{solicitation.tuss.code} - {solicitation.tuss.name}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Prioridade</h3>
              <p>{getPriorityBadge(solicitation.priority)}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Data Preferencial (Início)</h3>
              <p className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                {formatDate(solicitation.preferred_date_start)}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Data Preferencial (Fim)</h3>
              <p className="flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                {formatDate(solicitation.preferred_date_end)}
              </p>
            </div>
            
            {solicitation.is_active && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Prazo Restante</h3>
                <p className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  {solicitation.days_remaining > 0 
                    ? `${solicitation.days_remaining} dias` 
                    : "Expirado"}
                </p>
              </div>
            )}
            
            <div className="sm:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground">Observações</h3>
              <p className="mt-1">{solicitation.notes || "Sem observações"}</p>
            </div>
            
            {(solicitation.preferred_location_lat && solicitation.preferred_location_lng) && (
              <div className="sm:col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">Localização Preferencial</h3>
                <p className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                  Latitude: {solicitation.preferred_location_lat}, Longitude: {solicitation.preferred_location_lng}
                  {solicitation.max_distance_km && (
                    <span className="ml-2 text-muted-foreground">
                      (Raio máximo: {solicitation.max_distance_km} km)
                    </span>
                  )}
                </p>
              </div>
            )}
            
            {solicitation.status === "cancelled" && (
              <div className="sm:col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">Motivo do Cancelamento</h3>
                <p className="mt-1 flex items-start">
                  <XCircle className="h-4 w-4 mr-1 mt-1 text-destructive" />
                  <span>{solicitation.cancel_reason || "Sem motivo registrado"}</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cancelada em {solicitation.cancelled_at ? formatDate(solicitation.cancelled_at) : 'N/A'}
                </p>
              </div>
            )}
            
            {solicitation.status === "completed" && (
              <div className="sm:col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">Concluída em</h3>
                <p className="mt-1 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                  <span>{solicitation.completed_at ? formatDate(solicitation.completed_at) : 'N/A'}</span>
                </p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between pt-6 border-t">
            <div className="flex space-x-2">
              {canCancel && (
                <Button variant="destructive" onClick={() => setIsCancelDialogOpen(true)}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancelar Solicitação
                </Button>
              )}
            </div>
            
            <div className="flex space-x-2">
              {canComplete && (
                <Button variant="default" onClick={handleComplete} disabled={isActionLoading}>
                  {isActionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Marcar como Concluída
                </Button>
              )}
              
              {canRetry && (
                <Button variant="outline" onClick={handleForceSchedule} disabled={isActionLoading}>
                  {isActionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  Tentar Agendar
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Paciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                <User className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="font-medium">{solicitation.patient.name}</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push(`/patients/${solicitation.patient.id}`)}
              >
                Ver Detalhes do Paciente
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Plano de Saúde</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                <Building className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="font-medium">{solicitation.health_plan.name}</span>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push(`/health-plans/${solicitation.health_plan.id}`)}
              >
                Ver Detalhes do Plano
              </Button>
            </CardContent>
          </Card>
          
          {solicitation.appointments && solicitation.appointments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos</CardTitle>
                <CardDescription>{solicitation.appointments.length} agendamento(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {solicitation.appointments.map((appointment) => (
                  <div key={appointment.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Agendamento #{appointment.id}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(appointment.scheduled_date)}
                        </p>
                      </div>
                      <Badge>{appointment.status}</Badge>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Provedor:</span> {appointment.provider.name}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-3 w-full"
                      onClick={() => router.push(`/appointments/${appointment.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Solicitação</DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento desta solicitação. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Motivo do Cancelamento</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Informe o motivo do cancelamento"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isActionLoading}>
              {isActionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 