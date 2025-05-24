"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Phone, Check, X, Loader2, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import apiClient from "@/services/api-client"
import { toast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { formatDate } from "@/lib/utils"

interface PendingConfirmation {
  id: number
  scheduled_date: string
  patient_name: string
  patient_phone: string
  procedure_name: string
  provider_name: string
  provider_type: string
  provider_id: number
}

export function ConfirmationScheduler() {
  const [pendingConfirmations, setPendingConfirmations] = useState<PendingConfirmation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConfirming, setIsConfirming] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<PendingConfirmation | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [confirmationNotes, setConfirmationNotes] = useState("")
  const [isConfirmed, setIsConfirmed] = useState(true)

  // Carregar solicitações que precisam de confirmação de 48h
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await apiClient.get("/appointments/pending-confirmations")
        if (response.data.success) {
          setPendingConfirmations(response.data.data)
        }
      } catch (error) {
        console.error("Erro ao carregar confirmações pendentes:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as confirmações pendentes",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
    // Atualizar a cada 30 minutos
    const interval = setInterval(fetchData, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Abrir diálogo de confirmação
  const openConfirmDialog = (appointment: PendingConfirmation, confirmed: boolean) => {
    setSelectedAppointment(appointment)
    setIsConfirmed(confirmed)
    setConfirmationNotes("")
    setIsDialogOpen(true)
  }

  // Marcar como confirmado
  const handleConfirm = async () => {
    if (!selectedAppointment) return
    
    setIsConfirming(true)
    try {
      const response = await apiClient.post(`/appointments/${selectedAppointment.id}/confirm-48h`, {
        confirmed: isConfirmed,
        confirmation_notes: confirmationNotes
      })
      
      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: isConfirmed 
            ? "Confirmação registrada com sucesso" 
            : "Ausência registrada com sucesso"
        })
        
        // Atualizar lista
        setPendingConfirmations(prev => 
          prev.filter(item => item.id !== selectedAppointment.id)
        )
        
        // Fechar diálogo
        setIsDialogOpen(false)
      } else {
        throw new Error(response.data.message || "Erro ao confirmar agendamento")
      }
    } catch (error) {
      console.error("Erro ao confirmar agendamento:", error)
      toast({
        title: "Erro",
        description: "Não foi possível registrar a confirmação",
        variant: "destructive"
      })
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Confirmações Pendentes (48h)</h2>
          <p className="text-muted-foreground">
            Agendamentos que precisam de confirmação nas próximas 48 horas
          </p>
        </div>
        
        <Button variant="outline" onClick={() => window.location.reload()}>
          Atualizar
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pendingConfirmations.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Nenhuma confirmação pendente</h3>
            <p className="text-muted-foreground">
              Não há agendamentos que precisam de confirmação nas próximas 48 horas.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingConfirmations.map((appointment) => (
            <Card key={appointment.id} className="overflow-hidden border-2 border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {appointment.patient_name}
                </CardTitle>
                <CardDescription>
                  {appointment.procedure_name}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-2 pb-4">
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(appointment.scheduled_date)}</span>
                    <span className="text-muted-foreground">
                      {new Date(appointment.scheduled_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>Prestador: {appointment.provider_name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{appointment.patient_phone || "Sem telefone"}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full col-span-1"
                    onClick={() => window.open(`tel:${appointment.patient_phone}`)}
                    disabled={!appointment.patient_phone}
                  >
                    <Phone className="w-4 h-4 mr-1" /> Ligar
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="w-full col-span-1"
                    onClick={() => openConfirmDialog(appointment, false)}
                  >
                    <X className="w-4 h-4 mr-1" /> Ausente
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="w-full col-span-1"
                    onClick={() => openConfirmDialog(appointment, true)}
                  >
                    <Check className="w-4 h-4 mr-1" /> Confirmar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Diálogo de confirmação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isConfirmed ? "Confirmar Agendamento" : "Registrar Ausência"}
            </DialogTitle>
            <DialogDescription>
              {isConfirmed 
                ? "O paciente confirmou a presença no agendamento?"
                : "O paciente não poderá comparecer ao agendamento?"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="py-4">
              <div className="mb-4 bg-muted p-3 rounded-md">
                <p className="font-medium">{selectedAppointment.patient_name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedAppointment.scheduled_date)} às 
                  {" " + new Date(selectedAppointment.scheduled_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
                <p className="text-sm">{selectedAppointment.procedure_name}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Observações {isConfirmed ? "(opcional)" : "(obrigatório)"}
                </label>
                <Textarea
                  value={confirmationNotes}
                  onChange={(e) => setConfirmationNotes(e.target.value)}
                  placeholder={isConfirmed 
                    ? "Observações sobre a confirmação..." 
                    : "Informe o motivo da ausência..."}
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
              disabled={isConfirming}
            >
              Cancelar
            </Button>
            <Button 
              variant={isConfirmed ? "default" : "destructive"}
              onClick={handleConfirm}
              disabled={isConfirming || (!isConfirmed && !confirmationNotes.trim())}
            >
              {isConfirming ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isConfirmed ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              {isConfirmed ? "Confirmar Presença" : "Registrar Ausência"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 