"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Download, 
  FileSignature, 
  Edit,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Clock,
  FileText,
  User,
  Building,
  Heart
} from "lucide-react"
import { getContract, downloadContract, signContract } from "@/services/contracts"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

export default function ContractDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params

  const [isLoading, setIsLoading] = useState(true)
  const [contract, setContract] = useState<any>(null)
  const [isSignDialogOpen, setIsSignDialogOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [signatureToken, setSignatureToken] = useState("")
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)

  useEffect(() => {
    fetchContract()
  }, [id])

  const fetchContract = async () => {
    setIsLoading(true)
    try {
      const response = await getContract(parseInt(id))
      if (response.status === 'success') {
        setContract(response.data)
      } else {
        toast({
          title: "Erro ao carregar contrato",
          description: response.message || "Não foi possível carregar os detalhes do contrato.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch contract:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Ocorreu um erro ao tentar carregar as informações do contrato.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const blob = await downloadContract(parseInt(id))
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Contrato_${contract.contract_number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (error) {
      console.error("Failed to download contract:", error)
      toast({
        title: "Erro ao baixar contrato",
        description: "Ocorreu um erro ao tentar baixar o arquivo do contrato.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleSign = async () => {
    setIsSigning(true)
    try {
      const response = await signContract(parseInt(id), signatureToken || undefined)
      if (response.status === 'success') {
        toast({
          title: "Contrato assinado",
          description: "O contrato foi assinado com sucesso.",
        })
        setIsSignDialogOpen(false)
        fetchContract() // Refresh contract data to reflect signed status
      } else {
        toast({
          title: "Erro ao assinar contrato",
          description: response.message || "Não foi possível assinar o contrato.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to sign contract:", error)
      toast({
        title: "Erro ao assinar contrato",
        description: "Ocorreu um erro ao tentar assinar o contrato.",
        variant: "destructive",
      })
    } finally {
      setIsSigning(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR').format(date)
  }

  const getContractTypeName = (type) => {
    const typeMap = {
      health_plan: 'Plano de Saúde',
      clinic: 'Clínica',
      professional: 'Profissional'
    }
    
    return typeMap[type] || type
  }

  const getEntityIcon = (type) => {
    if (type === 'health_plan') return <Heart className="h-5 w-5" />
    if (type === 'clinic') return <Building className="h-5 w-5" />
    if (type === 'professional') return <User className="h-5 w-5" />
    return <FileText className="h-5 w-5" />
  }

  const renderStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pendente', variant: 'outline' },
      active: { label: 'Ativo', variant: 'success' },
      expired: { label: 'Expirado', variant: 'destructive' },
      cancelled: { label: 'Cancelado', variant: 'destructive' }
    }
    
    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' }
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/contracts')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isLoading ? (
                <Skeleton className="h-9 w-48" />
              ) : (
                `Contrato ${contract.contract_number}`
              )}
            </h1>
            <p className="text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-5 w-64 mt-1" />
              ) : (
                `Detalhes do contrato com ${contract.contractable?.name || 'entidade'}`
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={isLoading || isDownloading}
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? 'Baixando...' : 'Baixar PDF'}
          </Button>
          
          {contract && !contract.is_signed && (
            <>
              <Button
                variant="outline"
                onClick={() => router.push(`/contracts/${id}/edit`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              
              <Button
                onClick={() => setIsSignDialogOpen(true)}
              >
                <FileSignature className="mr-2 h-4 w-4" />
                Assinar
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-52 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Contrato</CardTitle>
              <CardDescription>
                Detalhes e status do contrato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Número do Contrato</span>
                <span className="font-mono">{contract.contract_number}</span>
              </div>
              
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Status</span>
                <div className="flex items-center gap-2">
                  {renderStatusBadge(contract.status)}
                  {contract.status === 'active' && contract.end_date && new Date(contract.end_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                    <div className="flex items-center text-amber-500">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span className="text-xs">Expira em breve</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Assinado</span>
                <div>
                  {contract.is_signed ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      <span>Sim, em {formatDate(contract.signed_at)}</span>
                    </div>
                  ) : (
                    <span className="text-red-500">Não assinado</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Data de Início</span>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{formatDate(contract.start_date)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Data de Término</span>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{contract.end_date ? formatDate(contract.end_date) : 'Sem data de término'}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pb-2">
                <span className="text-sm font-medium">Data de Criação</span>
                <span>{formatDate(contract.created_at)}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Entidade Vinculada</CardTitle>
              <CardDescription>
                Informações sobre a entidade relacionada a este contrato
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Tipo</span>
                <div className="flex items-center gap-1">
                  {getEntityIcon(contract.type)}
                  <span>{getContractTypeName(contract.type)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-medium">Nome</span>
                <span className="font-medium">{contract.contractable?.name || 'N/A'}</span>
              </div>

              {contract.contractable && (
                <>
                  {contract.type === 'health_plan' && (
                    <>
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-sm font-medium">ANS</span>
                        <span>{contract.contractable.registration_number || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between pb-2">
                        <span className="text-sm font-medium">CNPJ</span>
                        <span>{contract.contractable.tax_id || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  
                  {contract.type === 'clinic' && (
                    <>
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-sm font-medium">CNPJ</span>
                        <span>{contract.contractable.tax_id || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between pb-2">
                        <span className="text-sm font-medium">Endereço</span>
                        <span className="text-right">{contract.contractable.address || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  
                  {contract.type === 'professional' && (
                    <>
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-sm font-medium">Especialidade</span>
                        <span>{contract.contractable.specialization || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="text-sm font-medium">Registro</span>
                        <span>{contract.contractable.license_number || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between pb-2">
                        <span className="text-sm font-medium">CPF</span>
                        <span>{contract.contractable.cpf || 'N/A'}</span>
                      </div>
                    </>
                  )}
                </>
              )}
              
              <Separator className="my-2" />
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push(`/${
                    contract.type === 'health_plan' 
                      ? 'health-plans' 
                      : contract.type === 'clinic' 
                        ? 'clinics' 
                        : 'professionals'
                  }/${contract.contractable_id}`)}
                >
                  Ver detalhes da entidade
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Dados do Contrato</CardTitle>
              <CardDescription>
                Informações preenchidas no contrato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {contract.template_data && Object.entries(contract.template_data).map(([key, value]) => (
                  <div key={key} className="border rounded-md p-3">
                    <div className="text-sm font-medium mb-1">{key}</div>
                    <div className="text-sm break-words">{value || '-'}</div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full"
              >
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? 'Baixando...' : 'Baixar Contrato em PDF'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      
      <Dialog open={isSignDialogOpen} onOpenChange={setIsSignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assinar Contrato</DialogTitle>
            <DialogDescription>
              Você está prestes a assinar digitalmente o contrato <strong>{contract?.contract_number}</strong> com <strong>{contract?.contractable?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Esta ação não pode ser desfeita. Ao assinar o contrato, você concorda com todos os termos e condições nele estabelecidos.
            </p>
            
            <div className="space-y-2">
              <label htmlFor="signature-token" className="text-sm font-medium">
                Token de assinatura (opcional)
              </label>
              <Input
                id="signature-token"
                placeholder="Digite o token de assinatura se houver"
                value={signatureToken}
                onChange={(e) => setSignatureToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Se você recebeu um token de assinatura, informe-o aqui. Caso contrário, deixe em branco.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSign}
              disabled={isSigning}
            >
              {isSigning ? 'Assinando...' : 'Assinar Contrato'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 