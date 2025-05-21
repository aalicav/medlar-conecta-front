"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { fetchResourceById, deleteResource, updateResource } from "@/services/resource-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowLeft, CalendarIcon, Edit, FileText, List, Phone, Trash2, User, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { formatDate, formatDateTime } from "@/utils/format-date"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/data-table/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ConditionalRender } from "@/components/conditional-render"

interface Professional {
  id: number
  name: string
  cpf: string
  birth_date: string
  gender: string
  professional_type: string
  council_type: string
  council_number: string
  council_state: string
  specialty: string
  clinic_id: number
  address: string
  city: string
  state: string
  postal_code: string
  photo: string
  status: string
  approved_at: string
  approved_by: number
  has_signed_contract: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  phones?: {
    id: number
    number: string
    type: string
  }[]
  clinic?: {
    id: number
    name: string
  }
  approver?: {
    id: number
    name: string
  }
  documents?: any[]
  appointments_count?: number
}

export default function ProfessionalPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [appointments, setAppointments] = useState([])
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  useEffect(() => {
    const fetchProfessional = async () => {
      try {
        setIsLoading(true)
        const professionalData = await fetchResourceById<Professional>("professionals", params.id)
        
        if (!professionalData || !professionalData.id) {
          toast({
            title: "Erro",
            description: "Profissional não encontrado",
            variant: "destructive",
          })
          router.push("/professionals")
          return
        }
        
        setProfessional(professionalData)
      } catch (error) {
        console.error("Error fetching professional:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do profissional",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfessional()
  }, [params.id, router])

  const handleDelete = async () => {
    try {
      await deleteResource(`professionals/${params.id}`)
      toast({
        title: "Profissional excluído",
        description: "O profissional foi excluído com sucesso",
      })
      router.push("/professionals")
    } catch (error) {
      console.error("Error deleting professional:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o profissional",
        variant: "destructive",
      })
    }
  }

  const handleApprove = async () => {
    try {
      setIsApproving(true)
      await updateResource(`professionals/${params.id}/approve`, { 
        approved: true 
      })
      toast({
        title: "Profissional aprovado",
        description: "O profissional foi aprovado com sucesso",
      })
      
      // Refresh professional data
      const updatedProfessional = await fetchResourceById<Professional>("professionals", params.id)
      setProfessional(updatedProfessional)
    } catch (error) {
      console.error("Error approving professional:", error)
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o profissional",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const handleReject = async () => {
    try {
      setIsRejecting(true)
      await updateResource(`professionals/${params.id}/approve`, { 
        approved: false,
        rejection_reason: "Informações incompletas ou incorretas" 
      })
      toast({
        title: "Profissional rejeitado",
        description: "O profissional foi rejeitado com sucesso",
      })
      
      // Refresh professional data
      const updatedProfessional = await fetchResourceById<Professional>("professionals", params.id)
      setProfessional(updatedProfessional)
    } catch (error) {
      console.error("Error rejecting professional:", error)
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o profissional",
        variant: "destructive",
      })
    } finally {
      setIsRejecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </TabsList>
          <div className="mt-6">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </Tabs>
      </div>
    )
  }

  if (!professional) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold">Profissional não encontrado</h2>
        <p className="text-muted-foreground mb-4">O profissional que você está procurando não existe ou foi removido.</p>
        <Button onClick={() => router.push("/professionals")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para a lista
        </Button>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprovado</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeitado</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }

  const getPhoneTypeLabel = (type: string) => {
    switch (type) {
      case 'mobile':
        return 'Celular'
      case 'landline':
        return 'Fixo'
      case 'whatsapp':
        return 'WhatsApp'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/professionals")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{professional.name}</h1>
              {getStatusBadge(professional.status)}
            </div>
            <div className="text-muted-foreground mt-1">
              {professional.professional_type} - {professional.specialty}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {professional.status === 'pending' && (
            <>
              <Button 
                onClick={handleApprove} 
                variant="outline" 
                className="gap-1"
                disabled={isApproving || isRejecting}
              >
                {isApproving ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                Aprovar
              </Button>
              <Button 
                onClick={handleReject} 
                variant="outline" 
                className="gap-1"
                disabled={isApproving || isRejecting}
              >
                {isRejecting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                Rejeitar
              </Button>
            </>
          )}
          <Button onClick={() => router.push(`/professionals/${params.id}/procedures`)} variant="outline" className="gap-1">
            <List className="h-4 w-4" />
            Procedimentos
          </Button>
          <Button onClick={() => router.push(`/professionals/${params.id}/edit`)} variant="outline" className="gap-1">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-1">
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o profissional <strong>{professional.name}</strong>?
                  Esta ação não poderá ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="contacts">Contatos</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="appointments">Atendimentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium">CPF</p>
                    <p className="text-sm text-muted-foreground">{professional.cpf}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Data de Nascimento</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.birth_date ? formatDate(professional.birth_date) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tipo</p>
                    <p className="text-sm text-muted-foreground">{professional.professional_type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Especialidade</p>
                    <p className="text-sm text-muted-foreground">{professional.specialty || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Registro</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.council_type}-{professional.council_number}/{professional.council_state}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Clínica</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.clinic ? professional.clinic.name : 'Sem clínica'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <div className="mt-1">{getStatusBadge(professional.status)}</div>
                  </div>
                  {professional.status === 'approved' && (
                    <div>
                      <p className="text-sm font-medium">Aprovado em</p>
                      <p className="text-sm text-muted-foreground">
                        {professional.approved_at ? formatDateTime(professional.approved_at) : 'N/A'}
                      </p>
                    </div>
                  )}
                  {professional.approver && (
                    <div>
                      <p className="text-sm font-medium">Aprovado por</p>
                      <p className="text-sm text-muted-foreground">{professional.approver.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">Contrato</p>
                    <div className="mt-1">
                      {professional.has_signed_contract ? 
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Contrato Assinado</Badge> : 
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Sem Contrato</Badge>
                      }
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Ativo</p>
                    <div className="mt-1">
                      {professional.is_active ? 
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativo</Badge> : 
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Inativo</Badge>
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-3">
                    <p className="text-sm font-medium">Endereço Completo</p>
                    <p className="text-sm text-muted-foreground">{professional.address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Cidade</p>
                    <p className="text-sm text-muted-foreground">{professional.city}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Estado</p>
                    <p className="text-sm text-muted-foreground">{professional.state}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">CEP</p>
                    <p className="text-sm text-muted-foreground">{professional.postal_code}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="contacts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Telefones</CardTitle>
            </CardHeader>
            <CardContent>
              {professional.phones && professional.phones.length > 0 ? (
                <div className="space-y-4">
                  {professional.phones.map((phone) => (
                    <div key={phone.id} className="flex items-center space-x-3 border-b pb-3 last:border-0">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{phone.number}</p>
                        <p className="text-sm text-muted-foreground">{getPhoneTypeLabel(phone.type)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum telefone cadastrado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>Documentos anexados ao profissional</CardDescription>
            </CardHeader>
            <CardContent>
              {professional.documents && professional.documents.length > 0 ? (
                <div className="space-y-4">
                  {professional.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.description || doc.type}</p>
                          <p className="text-sm text-muted-foreground">{doc.file_name}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" asChild>
                        <a href={doc.file_path} target="_blank" rel="noopener noreferrer">Ver</a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appointments" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Atendimentos</CardTitle>
              <CardDescription>
                Total de atendimentos: {professional.appointments_count || 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {appointments && appointments.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  {/* Appointment table would go here */}
                  <p className="p-4 text-center text-muted-foreground">
                    Funcionalidade em desenvolvimento.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este profissional ainda não possui atendimentos registrados.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 