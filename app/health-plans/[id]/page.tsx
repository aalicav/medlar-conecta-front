"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { fetchResourceById, performResourceAction } from "@/services/resource-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { formatDate, getStorageUrl } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { ArrowLeft, Edit, CheckCircle, Upload, FileText, List, Mail, Phone, User, Building2, MapPin, Download, Trash2, AlertTriangle, Calendar, X, DollarSign } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import api from "@/services/api-client"
import { ConditionalRender } from "@/components/conditional-render"

interface HealthPlan {
  id: number
  name: string
  status: string
  cnpj: string
  ans_code: string
  municipal_registration?: string
  description?: string
  legal_representative_name: string
  legal_representative_cpf: string
  legal_representative_position: string
  legal_representative_id: number
  legal_representative?: any
  operational_representative_name: string
  operational_representative_cpf: string
  operational_representative_position: string
  operational_representative_id: number
  operational_representative?: any
  address: string
  city: string
  state: string
  postal_code: string
  logo?: string
  phones: any[]
  documents: any[]
  user?: any
  created_at: string
  updated_at: string
}

export default function HealthPlanDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { hasPermission } = useAuth()
  const healthPlanId = params?.id ? Number(params.id) : 0
  const [healthPlan, setHealthPlan] = useState<HealthPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<number | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState("")
  const [documentExpiration, setDocumentExpiration] = useState("")
  const [documentObservation, setDocumentObservation] = useState("")

  useEffect(() => {
    const fetchHealthPlan = async () => {
      try {
        const data = await fetchResourceById("health-plans", healthPlanId)
        setHealthPlan(data as HealthPlan)
      } catch (error) {
        console.error("Error fetching health plan:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do plano de saúde.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (healthPlanId) {
      fetchHealthPlan()
    }
  }, [healthPlanId])

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      await performResourceAction("health-plans", healthPlanId, "approve")
      toast({
        title: "Plano aprovado",
        description: "O plano de saúde foi aprovado com sucesso.",
      })
      // Refresh the data
      const data = await fetchResourceById("health-plans", healthPlanId)
      setHealthPlan(data as HealthPlan)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível aprovar o plano de saúde.",
        variant: "destructive",
      })
    } finally {
      setIsApproving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default">Ativo</Badge>
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>
      case "inactive":
        return <Badge variant="destructive">Inativo</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const handleDocumentUpload = async () => {
    if (!documentFile || !documentType) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um arquivo e tipo de documento",
        variant: "destructive",
      })
      return
    }
    
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('documents[0][file]', documentFile)
      formData.append('documents[0][type]', documentType)
      formData.append('documents[0][description]', documentType === 'other' ? documentObservation : documentType)
      
      if (documentExpiration) {
        formData.append('documents[0][expiration_date]', documentExpiration)
      }
      
      await api.post(`/health-plans/${healthPlanId}/documents`, formData, {
        headers: {
          'Accept': 'application/json',
        }
      })
      
      toast({
        title: "Documento enviado",
        description: "O documento foi enviado com sucesso",
        variant: "default",
      })
      
      // Reset form
      setDocumentFile(null)
      setDocumentType("")
      setDocumentExpiration("")
      setDocumentObservation("")
      setShowUploadDialog(false)
      
      // Refresh data
      const data = await fetchResourceById("health-plans", healthPlanId)
      setHealthPlan(data as HealthPlan)
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Erro",
        description: "Não foi possível fazer o upload do documento",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }
  
  const handleDocumentDelete = async (documentId: number) => {
    setIsDeleting(documentId)
    
    try {
      await api.delete(`/documents/${documentId}`)
      
      toast({
        title: "Documento excluído",
        description: "O documento foi excluído com sucesso",
        variant: "default",
      })
      
      // Refresh data
      const data = await fetchResourceById("health-plans", healthPlanId)
      setHealthPlan(data as HealthPlan)
    } catch (error) {
      console.error("Error deleting document:", error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o documento",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }
  
  const getDocumentTypeLabel = (type: string) => {
    const types = {
      "contract": "Contrato",
      "ans_certificate": "Certificado ANS",
      "authorization": "Autorização",
      "financial": "Financeiro",
      "legal": "Legal",
      "identification": "Identificação",
      "agreement": "Acordo",
      "technical": "Técnico",
      "other": "Outro"
    }
    return types[type as keyof typeof types] || type
  }
  
  const isDocumentExpired = (date: string) => {
    if (!date) return false
    return new Date(date) < new Date()
  }
  
  const isDocumentExpiringInDays = (date: string, days = 30) => {
    if (!date) return false
    const expirationDate = new Date(date)
    const today = new Date()
    const daysInMilliseconds = days * 24 * 60 * 60 * 1000
    return expirationDate > today && expirationDate.getTime() - today.getTime() < daysInMilliseconds
  }

  const getExpirationStatus = (date: string) => {
    if (isDocumentExpired(date)) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Expirado
        </Badge>
      )
    }
    if (isDocumentExpiringInDays(date, 30)) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Expira em breve
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        {formatDate(date)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-10 w-[250px]" />
            <Skeleton className="mt-2 h-4 w-[350px]" />
          </div>
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  if (!healthPlan) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Plano de Saúde</h1>
            <p className="text-muted-foreground">Não foi possível carregar os detalhes do plano</p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center gap-4">
          {healthPlan?.logo && (
            <div className="h-16 w-16 rounded-lg overflow-hidden">
              <img src={getStorageUrl(healthPlan.logo)} alt={`${healthPlan.name} logo`} className="h-full w-full object-contain" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{healthPlan?.name}</h1>
            <p className="text-muted-foreground">Detalhes do plano de saúde</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button variant="outline" onClick={() => router.push(`/health-plans/${healthPlanId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="representatives">Representantes</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="contracts">Contratos</TabsTrigger>
          <TabsTrigger value="pricing">Tabela de Valores</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações Gerais
              </CardTitle>
              <CardDescription>Detalhes do plano de saúde</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Nome</h3>
                  <p className="text-base">{healthPlan.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                  <p className="text-base">{getStatusBadge(healthPlan.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">CNPJ</h3>
                  <p className="text-base">{healthPlan.cnpj}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Código ANS</h3>
                  <p className="text-base">{healthPlan.ans_code}</p>
                </div>
                {healthPlan.municipal_registration && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Inscrição Municipal</h3>
                    <p className="text-base">{healthPlan.municipal_registration}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Data de Criação</h3>
                  <p className="text-base">{formatDate(healthPlan.created_at)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Última Atualização</h3>
                  <p className="text-base">{formatDate(healthPlan.updated_at)}</p>
                </div>
              </div>

              {healthPlan.description && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Descrição</h3>
                  <p className="text-base">{healthPlan.description}</p>
                </div>
              )}
            </CardContent>
            {healthPlan.status === "pending" && hasPermission("approve health plans") && (
              <CardFooter>
                <Button onClick={handleApprove} disabled={isApproving}>
                  {isApproving ? (
                    <>Aprovando...</>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Aprovar Plano
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
              <CardDescription>Endereço do plano de saúde</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Endereço</h3>
                  <p className="text-base">{healthPlan.address}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Cidade</h3>
                  <p className="text-base">{healthPlan.city}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Estado</h3>
                  <p className="text-base">{healthPlan.state}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">CEP</h3>
                  <p className="text-base">{healthPlan.postal_code}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {healthPlan.phones && healthPlan.phones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Telefones
                </CardTitle>
                <CardDescription>Contatos telefônicos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {healthPlan.phones.map((phone, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="outline">{phone.type === "mobile" ? "Celular" : 
                        phone.type === "landline" ? "Fixo" : 
                        phone.type === "whatsapp" ? "WhatsApp" : 
                        phone.type === "fax" ? "Fax" : phone.type}</Badge>
                      <span>{phone.formatted_number || phone.number}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="representatives" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Representante Legal
              </CardTitle>
              <CardDescription>Dados do representante legal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Nome</h3>
                  <p className="text-base">{healthPlan.legal_representative_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">CPF</h3>
                  <p className="text-base">{healthPlan.legal_representative_cpf}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Cargo</h3>
                  <p className="text-base">{healthPlan.legal_representative_position}</p>
                </div>
                {healthPlan.legal_representative && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p className="text-base">{healthPlan.legal_representative.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Representante Operacional
              </CardTitle>
              <CardDescription>Dados do representante operacional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Nome</h3>
                  <p className="text-base">{healthPlan.operational_representative_name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">CPF</h3>
                  <p className="text-base">{healthPlan.operational_representative_cpf}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Cargo</h3>
                  <p className="text-base">{healthPlan.operational_representative_position}</p>
                </div>
                {healthPlan.operational_representative && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p className="text-base">{healthPlan.operational_representative.email}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentos
                </CardTitle>
                <CardDescription>Documentos do plano de saúde</CardDescription>
              </div>
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar Documento
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Enviar novo documento</DialogTitle>
                    <DialogDescription>
                      Faça upload de documentos para o plano de saúde
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="file">Arquivo</Label>
                      <Input 
                        id="file" 
                        type="file" 
                        onChange={(e) => e.target.files && setDocumentFile(e.target.files[0])}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      <p className="text-sm text-muted-foreground">
                        Formatos aceitos: PDF, DOC, DOCX, JPG, PNG. Tamanho máximo: 10MB
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Tipo de Documento</Label>
                      <Select value={documentType} onValueChange={setDocumentType}>
                        <SelectTrigger id="type">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contract">Contrato</SelectItem>
                          <SelectItem value="ans_certificate">Certificado ANS</SelectItem>
                          <SelectItem value="authorization">Autorização</SelectItem>
                          <SelectItem value="financial">Financeiro</SelectItem>
                          <SelectItem value="legal">Legal</SelectItem>
                          <SelectItem value="identification">Identificação</SelectItem>
                          <SelectItem value="agreement">Acordo</SelectItem>
                          <SelectItem value="technical">Técnico</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {documentType === "other" && (
                      <div className="grid gap-2">
                        <Label htmlFor="observation">Descrição</Label>
                        <Input 
                          id="observation" 
                          value={documentObservation}
                          onChange={(e) => setDocumentObservation(e.target.value)}
                          placeholder="Descreva o tipo de documento"
                        />
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="expiration">Data de Expiração</Label>
                      <Input 
                        id="expiration" 
                        type="date"
                        value={documentExpiration}
                        onChange={(e) => setDocumentExpiration(e.target.value)} 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button onClick={handleDocumentUpload} disabled={isUploading}>
                      {isUploading ? (
                        <>Enviando...</>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Enviar
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {healthPlan?.documents && healthPlan.documents.length > 0 ? (
                <div className="space-y-4">
                  {healthPlan.documents.map((document: any) => (
                    <div key={document.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="bg-muted rounded-md p-2">
                            <FileText className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <h4 className="text-base font-medium">{document.file_name || document.name}</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <Badge variant="secondary">
                                {getDocumentTypeLabel(document.type)}
                              </Badge>
                              {document.expiration_date && getExpirationStatus(document.expiration_date)}
                              <Badge variant="outline" className="text-xs">
                                {(document.file_size / 1024).toFixed(2)} KB
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Enviado em: {formatDate(document.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="icon" asChild>
                            <a href={getStorageUrl(document.file_path)} target="_blank" rel="noopener noreferrer" download>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDocumentDelete(document.id)}
                            disabled={isDeleting === document.id}
                          >
                            {isDeleting === document.id ? (
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {document.observation && (
                        <div className="mt-2 text-sm border-t pt-2">
                          <p className="text-muted-foreground">{document.observation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="mb-2 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Nenhum documento encontrado</h3>
                  <p className="text-sm text-muted-foreground">
                    Não há documentos cadastrados para este plano de saúde.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contratos
              </CardTitle>
              <CardDescription>Contratos associados ao plano de saúde</CardDescription>
            </CardHeader>
            <CardContent>
              <ConditionalRender hideOnContractData>
                <div className="contract-details">
                  {/* Informações de contratos */}
                </div>
              </ConditionalRender>
            </CardContent>
            <CardFooter>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Gerar Contrato
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Tabela de Valores
              </CardTitle>
              <CardDescription>Gerencie os valores cobrados para cada procedimento TUSS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure os valores que serão cobrados para cada procedimento TUSS neste plano de saúde.
                  Você pode adicionar valores individualmente ou importar um arquivo CSV.
                </p>
                <div className="flex gap-2">
                  <Button onClick={() => router.push(`/health-plans/${healthPlanId}/pricing`)}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Gerenciar Valores
                  </Button>
                  <Button variant="outline" onClick={() => {
                    const link = document.createElement('a')
                    link.href = '/templates/health-plan-pricing-template.csv'
                    link.download = 'modelo-valores-plano-saude.csv'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Modelo CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
