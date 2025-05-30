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
  AlertTriangle, CheckCircle, XCircle, RefreshCw, X
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
  scheduling_failure_reason?: string
  scheduling_attempts?: number
}

export default function SolicitationDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const solicitationId = params?.id ? String(params.id) : ''
  
  const [solicitation, setSolicitation] = useState<Solicitation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isActionLoading, setIsActionLoading] = useState(false)
  
  const fetchSolicitation = async () => {
    if (!solicitationId) {
      router.push('/solicitations')
      return
    }

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
  
  const handleRetryScheduling = async () => {
    setIsActionLoading(true)
    try {
      await api.post(`/solicitations/${solicitationId}/force-schedule`)
      
      toast({
        title: "Sucesso",
        description: "Solicitação enviada para agendamento automático",
      })
      
      fetchSolicitation()
    } catch (error) {
      console.error("Error retrying scheduling:", error)
      toast({
        title: "Erro",
        description: "Não foi possível reenviar a solicitação para agendamento",
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
      
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status da Solicitação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Status Atual</Label>
                <div className="mt-1">{getStatusBadge(solicitation.status)}</div>
              </div>
              
              {solicitation.status === "failed" && (
                <div>
                  <Label>Motivo da Falha</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {solicitation.scheduling_failure_reason || "Não foi possível realizar o agendamento automático"}
                  </p>
                </div>
              )}
              
              {solicitation.status === "cancelled" && solicitation.cancel_reason && (
                <div>
                  <Label>Motivo do Cancelamento</Label>
                  <p className="text-sm text-muted-foreground mt-1">{solicitation.cancel_reason}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                {canCancel && (
                  <Button variant="outline" onClick={() => setIsCancelDialogOpen(true)} disabled={isActionLoading}>
                    {isActionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                    Cancelar
                  </Button>
                )}
                
                {canComplete && (
                  <Button variant="outline" onClick={handleComplete} disabled={isActionLoading}>
                    {isActionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Concluir
                  </Button>
                )}
                
                {canRetry && (
                  <Button variant="outline" onClick={handleRetryScheduling} disabled={isActionLoading}>
                    {isActionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                    Tentar Novamente
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <Label>Nome</Label>
                <p className="text-sm text-muted-foreground">{solicitation.patient.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plano de Saúde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <Label>Nome do Plano</Label>
                <p className="text-sm text-muted-foreground">{solicitation.health_plan.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Procedimento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <Label>Código TUSS</Label>
                <p className="text-sm text-muted-foreground">{solicitation.tuss.code}</p>
              </div>
              <div>
                <Label>Descrição</Label>
                <p className="text-sm text-muted-foreground">{solicitation.tuss.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {solicitation.status === "failed" && (
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Falha no Agendamento Automático
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Motivo da Falha</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {solicitation.scheduling_failure_reason || "Não foi possível realizar o agendamento automático"}
                </p>
              </div>
              {solicitation.scheduling_attempts && (
                <div>
                  <Label>Tentativas de Agendamento</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {solicitation.scheduling_attempts} tentativa(s)
                  </p>
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleRetryScheduling}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Tentar Novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Solicitação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta solicitação? Esta ação não pode ser desfeita.
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
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isActionLoading}>
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 