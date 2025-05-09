"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSchedulingException, approveSchedulingException, rejectSchedulingException } from "@/services/api"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDate } from "@/app/utils/format"
import { parseISO } from "date-fns"
import { useAuth } from "@/app/hooks/auth"
import { CheckIcon, XIcon, ArrowLeftIcon } from "lucide-react"

export default function SchedulingExceptionDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useAuth()
  const [exception, setException] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  
  const fetchException = async () => {
    setLoading(true)
    try {
      const response = await getSchedulingException(params.id)
      if (response?.data?.data) {
        setException(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching scheduling exception:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes da exceção de agendamento.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchException()
  }, [params.id])
  
  const handleApprove = async () => {
    setApproving(true)
    try {
      await approveSchedulingException(params.id)
      toast({
        title: "Exceção aprovada",
        description: "A exceção de agendamento foi aprovada com sucesso.",
      })
      fetchException() // Recarregar os dados atualizados
    } catch (error) {
      console.error("Error approving exception:", error)
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a exceção.",
        variant: "destructive",
      })
    } finally {
      setApproving(false)
    }
  }
  
  const handleReject = async () => {
    if (rejectionReason.trim().length < 5) {
      toast({
        title: "Erro",
        description: "Por favor, forneça um motivo para a rejeição (mínimo 5 caracteres).",
        variant: "destructive",
      })
      return
    }
    
    setRejecting(true)
    try {
      await rejectSchedulingException(params.id, { rejection_reason: rejectionReason.trim() })
      toast({
        title: "Exceção rejeitada",
        description: "A exceção de agendamento foi rejeitada.",
      })
      fetchException() // Recarregar os dados atualizados
    } catch (error) {
      console.error("Error rejecting exception:", error)
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a exceção.",
        variant: "destructive",
      })
    } finally {
      setRejecting(false)
    }
  }
  
  // Verificar se o usuário tem permissão para aprovar/rejeitar exceções
  const canApproveReject = user?.role === 'admin' || user?.role === 'super_admin'
  
  // Determinar status da exceção
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Aprovada</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejeitada</Badge>
      default:
        return <Badge>Pendente</Badge>
    }
  }
  
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Carregando...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-6 bg-muted animate-pulse rounded w-1/3" />
              <div className="h-6 bg-muted animate-pulse rounded w-1/2" />
              <div className="h-6 bg-muted animate-pulse rounded w-2/3" />
              <div className="h-6 bg-muted animate-pulse rounded w-1/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  if (!exception) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Exceção não encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <p>A exceção de agendamento solicitada não foi encontrada.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/scheduling-exceptions")}>
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Voltar para a lista
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }
  
  const priceDifference = exception.recommended_provider_price 
    ? ((exception.provider_price - exception.recommended_provider_price) / exception.recommended_provider_price * 100).toFixed(1)
    : null
  
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Exceção de Agendamento #{exception.id}</CardTitle>
              <CardDescription>
                Detalhes da solicitação de exceção
              </CardDescription>
            </div>
            <div>
              {getStatusBadge(exception.status)}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Dados principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações da Solicitação</h3>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">ID da Solicitação:</div>
                <div>#{exception.solicitation_id}</div>
                
                <div className="font-medium">Solicitado por:</div>
                <div>{exception.requester_name}</div>
                
                <div className="font-medium">Data da Solicitação:</div>
                <div>{formatDate(parseISO(exception.created_at), "dd/MM/yyyy HH:mm")}</div>
                
                {exception.status === 'approved' && (
                  <>
                    <div className="font-medium">Aprovado por:</div>
                    <div>{exception.approver_name}</div>
                    
                    <div className="font-medium">Data de Aprovação:</div>
                    <div>{formatDate(parseISO(exception.approved_at), "dd/MM/yyyy HH:mm")}</div>
                  </>
                )}
                
                {exception.status === 'rejected' && (
                  <>
                    <div className="font-medium">Rejeitado por:</div>
                    <div>{exception.rejecter_name}</div>
                    
                    <div className="font-medium">Data de Rejeição:</div>
                    <div>{formatDate(parseISO(exception.rejected_at), "dd/MM/yyyy HH:mm")}</div>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dados do Prestador</h3>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">Nome:</div>
                <div>{exception.provider_name}</div>
                
                <div className="font-medium">Valor:</div>
                <div className="font-bold">R$ {Number(exception.provider_price).toFixed(2)}</div>
                
                {exception.recommended_provider_price && (
                  <>
                    <div className="font-medium">Valor Recomendado:</div>
                    <div className="text-green-600 font-bold">
                      R$ {Number(exception.recommended_provider_price).toFixed(2)}
                    </div>
                    
                    <div className="font-medium">Diferença:</div>
                    <div className="text-red-500 font-bold">
                      {priceDifference}% acima do recomendado
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Justificativa */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Justificativa da Solicitação</h3>
            <div className="p-4 bg-muted rounded-md">
              {exception.justification}
            </div>
          </div>
          
          {/* Motivo da rejeição (se rejeitada) */}
          {exception.status === 'rejected' && exception.rejection_reason && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Motivo da Rejeição</h3>
                <Alert variant="destructive">
                  <AlertDescription>{exception.rejection_reason}</AlertDescription>
                </Alert>
              </div>
            </>
          )}
          
          {/* Área de aprovação/rejeição (apenas para admins e se estiver pendente) */}
          {canApproveReject && exception.status === 'pending' && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Ações</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-medium">Aprovar Exceção</h4>
                    <p className="text-sm text-muted-foreground">
                      Ao aprovar, o agendamento será realizado com o prestador solicitado, 
                      mesmo com valor acima do recomendado.
                    </p>
                    <Button 
                      variant="default" 
                      className="w-full" 
                      onClick={handleApprove}
                      disabled={approving}
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      {approving ? "Aprovando..." : "Aprovar Exceção"}
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Rejeitar Exceção</h4>
                    <Textarea
                      placeholder="Informe o motivo da rejeição"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      disabled={rejecting}
                    />
                    <Button 
                      variant="destructive" 
                      className="w-full" 
                      onClick={handleReject}
                      disabled={rejecting || rejectionReason.trim().length < 5}
                    >
                      <XIcon className="h-4 w-4 mr-2" />
                      {rejecting ? "Rejeitando..." : "Rejeitar Exceção"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => router.push("/scheduling-exceptions")}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Voltar para a lista
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 