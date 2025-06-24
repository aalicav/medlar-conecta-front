"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Printer, Send, Download, ArrowLeft } from "lucide-react"
import apiClient from "@/services/api-client"
import { toast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"

interface Appointment {
  id: number
  scheduled_date: string
  status: string
  provider_type: string
  provider_id: number
  provider: {
    id: number
    name: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
  }
  solicitation: {
    id: number
    patient: {
      id: number
      name: string
      cpf: string
      health_card_number: string
      email?: string
      phone?: string
    }
    health_plan: {
      id: number
      name: string
      ans_code?: string
    }
    tuss: {
      id: number
      code: string
      name: string
      description: string
    }
  }
  guide_path?: string
  guide_generated_at?: string
}

export default function AppointmentGuidePage() {
  const router = useRouter()
  const params = useParams()
  const appointmentId = params.id as string
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await apiClient.get(`/appointments/${appointmentId}`)
        if (response.data) {
          setAppointment(response.data.data)
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados do agendamento",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error("Erro ao carregar dados do agendamento:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do agendamento",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [appointmentId])
  
  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }
  
  const handleSendGuide = async () => {
    setIsSending(true)
    try {
      const response = await apiClient.post(`/appointments/${appointmentId}/send-guide`)
      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Guia enviada para o prestador com sucesso"
        })
      } else {
        throw new Error(response.data.message || "Erro ao enviar guia")
      }
    } catch (error) {
      console.error("Erro ao enviar guia:", error)
      toast({
        title: "Erro",
        description: "Não foi possível enviar a guia para o prestador",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }
  
  const handleDownload = async () => {
    try {
      // Start download
      window.open(`/api/appointments/${appointmentId}/download-guide`, '_blank')
    } catch (error) {
      console.error("Erro ao baixar guia:", error)
      toast({
        title: "Erro",
        description: "Não foi possível baixar a guia",
        variant: "destructive"
      })
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

  return (
    <div className="space-y-6 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guia de Atendimento</h1>
          <p className="text-muted-foreground">
            Agendamento #{appointment.id} - {formatDate(appointment.scheduled_date)}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
          
          <Button variant="outline" onClick={handlePrint} disabled={isPrinting}>
            {isPrinting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            Imprimir
          </Button>
          
          <Button variant="default" onClick={handleSendGuide} disabled={isSending}>
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Enviar ao Prestador
          </Button>
        </div>
      </div>
      
      {/* Guia de Atendimento */}
      <Card className="p-6 print:shadow-none print:border-none" id="guide-content">
        <CardContent className="p-0">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold">CONECTA SAÚDE</h2>
              <p className="text-sm text-muted-foreground">Sistema de Gestão de Saúde</p>
            </div>
            <div className="text-right">
              <h3 className="font-bold">GUIA DE ATENDIMENTO</h3>
              <p className="text-sm">#{appointment.id}</p>
              <Badge className="mt-1">{appointment.status}</Badge>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Dados do Paciente</h3>
              <div className="space-y-1">
                <p><span className="text-muted-foreground">Nome:</span> {appointment.solicitation.patient.name}</p>
                <p><span className="text-muted-foreground">CPF:</span> {appointment.solicitation.patient.cpf}</p>
                <p><span className="text-muted-foreground">Carteirinha:</span> {appointment.solicitation.patient.health_card_number}</p>
                <p><span className="text-muted-foreground">Plano:</span> {appointment.solicitation.health_plan.name}</p>
                {appointment.solicitation.health_plan.ans_code && (
                  <p><span className="text-muted-foreground">Código ANS:</span> {appointment.solicitation.health_plan.ans_code}</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Dados do Atendimento</h3>
              <div className="space-y-1">
                <p><span className="text-muted-foreground">Data:</span> {formatDate(appointment.scheduled_date)}</p>
                <p><span className="text-muted-foreground">Hora:</span> {new Date(appointment.scheduled_date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
                <p><span className="text-muted-foreground">Procedimento:</span> {appointment.solicitation.tuss.code}</p>
                <p><span className="text-muted-foreground">Descrição:</span> {appointment.solicitation.tuss.description}</p>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Prestador</h3>
            <div className="space-y-1">
              <p><span className="text-muted-foreground">Nome:</span> {appointment.provider.name}</p>
              <p><span className="text-muted-foreground">Tipo:</span> {appointment.provider_type === "App\\Models\\Clinic" ? "Estabelecimento" : "Profissional"}</p>
              {appointment.provider.address && (
                <p>
                  <span className="text-muted-foreground">Endereço:</span> {appointment.provider.address}
                  {appointment.provider.city && `, ${appointment.provider.city}`}
                  {appointment.provider.state && ` - ${appointment.provider.state}`}
                </p>
              )}
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="grid grid-cols-2 gap-8 mt-12">
            <div className="border-t pt-4">
              <p className="text-center text-muted-foreground text-sm mb-10">Assinatura do Profissional</p>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-center text-muted-foreground text-sm mb-10">Assinatura do Paciente</p>
            </div>
          </div>
          
          <div className="mt-16 text-xs text-muted-foreground space-y-1">
            <p>Esta guia deve ser impressa, assinada pelo profissional e pelo paciente, e anexada no sistema após o atendimento.</p>
            <p>Data de geração: {new Date().toLocaleDateString()} às {new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 