"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Edit, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  UserCheck, 
  CalendarClock, 
  FileText,
  Building
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "@/components/ui/use-toast"
import api from "@/services/api-client"

interface Clinic {
  id: number
  name: string
  cnpj: string
  updated_at: string
  status: "pending" | "approved" | "rejected"
  description: string
  city: string
  state: string
  address: string
  postal_code: string
  is_active: boolean
  has_signed_contract: boolean
  technical_director: string
  technical_director_document: string
  created_at: string
  approved_at: string | null
  phones: {
    id: number
    number: string
    type: string
  }[]
  documents: {
    id: number
    type: string
    description: string
    file_path: string
    created_at: string
  }[]
  logo: string | null
  approver: {
    id: number
    name: string
  } | null
  branches_count: number
  professionals_count: number
}

export default function ClinicDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [clinic, setClinic] = useState<Clinic | null>(null)
  
  useEffect(() => {
    const fetchClinic = async () => {
      setIsLoading(true)
      try {
        const response = await api.get(`/clinics/${params.id}?with_counts=true`)
        if (response.data && response.data.data) {
          setClinic(response.data.data)
        }
      } catch (error) {
        console.error("Failed to fetch clinic:", error)
        toast({
          title: "Erro ao carregar clínica",
          description: "Não foi possível carregar os dados da clínica",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchClinic()
  }, [params.id])
  
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprovada</Badge>
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejeitada</Badge>
      default:
        return <Badge variant="outline">Desconhecido</Badge>
    }
  }
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-6 w-full" />
              ))}
            </CardContent>
          </Card>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-6 w-full" />
                ))}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 2 }).map((_, index) => (
                  <Skeleton key={index} className="h-6 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }
  
  if (!clinic) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px]">
        <h2 className="text-2xl font-bold mb-2">Clínica não encontrada</h2>
        <p className="text-muted-foreground mb-6">Não foi possível encontrar os dados da clínica solicitada</p>
        <Button onClick={() => router.push('/clinics')}>
          Voltar para lista de clínicas
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/clinics')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{clinic.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              {renderStatusBadge(clinic.status)}
              {clinic.is_active ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativa</Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Inativa</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/clinics/${clinic.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          {clinic.status === "approved" && (
            <Button 
              variant="outline"
              onClick={() => router.push(`/clinics/${clinic.id}/branches`)}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Gerenciar Filiais
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações da Clínica</CardTitle>
            <CardDescription>Detalhes cadastrais e informações gerais da clínica</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-shrink-0">
                <Avatar className="w-24 h-24">
                  {clinic.logo ? (
                    <AvatarImage src={clinic.logo} alt={clinic.name} />
                  ) : (
                    <AvatarFallback className="text-xl">
                      <Building className="w-10 h-10" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>
              <div className="flex-1 space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">CNPJ</p>
                  <p className="font-medium">{clinic.cnpj}</p>
                </div>
                {clinic.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p>{clinic.description}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Endereço</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Endereço Completo</p>
                  <div className="flex items-start mt-1">
                    <MapPin className="w-4 h-4 mt-1 mr-2 text-muted-foreground" />
                    <p>{clinic.address}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cidade/Estado</p>
                  <p className="font-medium">{clinic.city}, {clinic.state}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CEP</p>
                  <p>{clinic.postal_code}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Contatos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clinic.phones.map((phone) => (
                  <div key={phone.id}>
                    <p className="text-sm text-muted-foreground">
                      {phone.type === 'mobile' && 'Celular'}
                      {phone.type === 'landline' && 'Telefone Fixo'}
                      {phone.type === 'whatsapp' && 'WhatsApp'}
                      {phone.type === 'fax' && 'Fax'}
                    </p>
                    <div className="flex items-center mt-1">
                      <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                      <p>{phone.number}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Diretor Técnico</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{clinic.technical_director}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Documento</p>
                  <p>{clinic.technical_director_document}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-end">
            <p className="text-sm text-muted-foreground">
              Última atualização: {new Date(clinic.updated_at).toLocaleDateString('pt-BR')}
            </p>
          </CardFooter>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status e Aprovação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex items-center mt-1">
                  {renderStatusBadge(clinic.status)}
                </div>
              </div>
              
              {clinic.status === "approved" && clinic.approver && (
                <div>
                  <p className="text-sm text-muted-foreground">Aprovado por</p>
                  <div className="flex items-center mt-1">
                    <UserCheck className="w-4 h-4 mr-2 text-muted-foreground" />
                    <p>{clinic.approver.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    em {new Date(clinic.approved_at!).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground">Data de Cadastro</p>
                <div className="flex items-center mt-1">
                  <CalendarClock className="w-4 h-4 mr-2 text-muted-foreground" />
                  <p>{new Date(clinic.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Contrato</p>
                <div className="flex items-center mt-1">
                  <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                  <p>{clinic.has_signed_contract ? 'Assinado' : 'Não assinado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Filiais</p>
                <p className="text-2xl font-bold">{clinic.branches_count}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Profissionais</p>
                <p className="text-2xl font-bold">{clinic.professionals_count}</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-2">
              {clinic.status === "approved" && (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => router.push(`/clinics/${clinic.id}/professionals`)}
                  >
                    Ver Profissionais
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => router.push(`/clinics/${clinic.id}/branches`)}
                  >
                    Ver Filiais
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => router.push(`/clinics/${clinic.id}/procedures`)}
                  >
                    Gerenciar Procedimentos
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {clinic.documents && clinic.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
            <CardDescription>Documentos cadastrados para esta clínica</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clinic.documents.map((document) => (
                <Card key={document.id} className="border">
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">{document.description}</CardTitle>
                    <CardDescription>
                      {document.type === 'license' && 'Licença'}
                      {document.type === 'contract' && 'Contrato'}
                      {document.type === 'technical_certificate' && 'Certificado Técnico'}
                      {document.type === 'other' && 'Outro'}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between py-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      Enviado em {new Date(document.created_at).toLocaleDateString('pt-BR')}
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(document.file_path, '_blank')}
                    >
                      Visualizar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 