"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { fetchResourceById, deleteResource, updateResource } from "@/services/resource-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ArrowLeft, CalendarIcon, Edit, FileText, List, Phone, Trash2, User, CheckCircle2, XCircle, RefreshCw, Building2 } from "lucide-react"
import { formatDate, formatDateTime } from "@/utils/format-date"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/data-table/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ConditionalRender } from "@/components/conditional-render"
import { EditModal } from "@/components/modals/edit-modal"

interface Professional {
  id: number
  name: string
  cnpj: string
  cpf?: string
  description: string
  cnes: string | null
  technical_director: string | null
  technical_director_document: string | null
  technical_director_professional_id: string | null
  parent_clinic_id: number | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  logo: string | null
  status: string
  approved_at: string | null
  has_signed_contract: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  phones: {
    id: number
    number: string
    country_code: string
    type: string
    is_whatsapp: boolean
    is_primary: boolean
    formatted_number: string
    phoneable_type: string
    phoneable_id: number
    created_at: string
    updated_at: string
  }[]
  addresses: {
    id: number
    street: string
    number: string | null
    complement: string | null
    neighborhood: string
    city: string
    state: string
    postal_code: string
    latitude: number | null
    longitude: number | null
    is_primary: boolean
    addressable_type: string
    addressable_id: number
    created_at: string
    updated_at: string
  }[]
  documents: any[]
  approver: {
    id: number
    name: string
  } | null
  contract: any | null
  parent_clinic: any | null
  pricing_contracts: any[]
  professionals: any[]
  professionals_count: number
  appointments_count: number
  branches_count: number
  documentType?: "cpf" | "cnpj"
}

interface Appointment {
  id: number
  scheduled_at: string
  status: string
  patient_name: string
  notes: string
  created_at: string
}

interface ApiResponse {
  id: number
  name: string
  [key: string]: any
}

export default function ProfessionalDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Detect entity type from URL params or data
  const [entityType, setEntityType] = useState<'professional' | 'clinic'>('professional')

  // Fetch professional data
  useEffect(() => {
    const fetchProfessional = async () => {
      try {
        setLoading(true)
        
        // Try to determine the entity type from URL params first
        const urlType = searchParams?.get('type')
        let endpoint = 'professionals'
        let currentEntityType: 'professional' | 'clinic' = 'professional'
        
        if (urlType === 'clinic') {
          endpoint = 'clinics'
          currentEntityType = 'clinic'
        } else {
          // Try to fetch as professional first, if it fails, try as clinic
          try {
            const response = await fetchResourceById<Professional>('professionals', params.id)
            if (response) {
              endpoint = 'professionals'
              currentEntityType = 'professional'
            }
          } catch (error) {
            // If professional fails, try as clinic
            try {
              const clinicResponse = await fetchResourceById<Professional>('clinics', params.id)
              if (clinicResponse) {
                endpoint = 'clinics'
                currentEntityType = 'clinic'
              }
            } catch (clinicError) {
              // If both fail, default to professional
              endpoint = 'professionals'
              currentEntityType = 'professional'
            }
          }
        }
        
        setEntityType(currentEntityType)
        const response = await fetchResourceById<Professional>(endpoint, params.id)
        
        if (response) {
          // Determine document type based on actual data
          let documentType: "cpf" | "cnpj" = "cpf";
          if (currentEntityType === 'clinic' || (response.cnpj && response.cnpj.trim() !== "")) {
            documentType = "cnpj";
          } else if (response.cpf && response.cpf.trim() !== "") {
            documentType = "cpf";
          }
          
          console.log('Document type detection:', {
            currentEntityType,
            hasCnpj: response.cnpj && response.cnpj.trim() !== "",
            hasCpf: response.cpf && response.cpf.trim() !== "",
            cnpj: response.cnpj,
            cpf: response.cpf,
            finalDocumentType: documentType
          });
          
          const professionalData: Professional = {
            ...response,
            documentType: documentType,
            // Ensure all required fields are present with their correct types
            id: response.id,
            name: response.name,
            cnpj: response.cnpj || (response as any).document,
            description: response.description,
            phones: response.phones || [],
            addresses: response.addresses || [],
            cnes: response.cnes,
            technical_director: response.technical_director,
            technical_director_document: response.technical_director_document,
            technical_director_professional_id: response.technical_director_professional_id,
            parent_clinic_id: response.parent_clinic_id,
            address: response.addresses?.[0]?.street || response.address || null,
            city: response.addresses?.[0]?.city || response.city || null,
            state: response.addresses?.[0]?.state || response.state || null,
            postal_code: response.addresses?.[0]?.postal_code || response.postal_code || null,
            latitude: response.latitude,
            longitude: response.longitude,
            logo: response.logo,
            status: response.status,
            approved_at: response.approved_at,
            has_signed_contract: response.has_signed_contract,
            is_active: response.is_active,
            created_at: response.created_at,
            updated_at: response.updated_at,
            documents: response.documents || [],
            approver: response.approver,
            contract: response.contract,
            parent_clinic: response.parent_clinic,
            pricing_contracts: response.pricing_contracts || [],
            professionals: response.professionals || [],
            professionals_count: response.professionals_count,
            appointments_count: response.appointments_count,
            branches_count: response.branches_count
          }
          setProfessional(professionalData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados solicitados",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfessional()
  }, [params.id, searchParams])

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoadingAppointments(true)
        // This would be your actual API call
        // const appointments = await fetchProfessionalAppointments(params.id)
        // setAppointments(appointments)
      } catch (error) {
        console.error("Error fetching appointments:", error)
      } finally {
        setLoadingAppointments(false)
      }
    }

    if (professional) {
      fetchAppointments()
    }
  }, [professional, params.id])

  const handleEdit = () => {
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    // Refresh professional data
    const refetchProfessional = async () => {
      try {
        const data = await fetchResourceById("professionals", params.id)
        setProfessional(data as Professional)
        toast({
          title: "Profissional atualizado",
          description: "Os dados foram atualizados com sucesso",
        })
      } catch (error) {
        console.error("Error refetching professional:", error)
      }
    }
    
    refetchProfessional()
  }

  const handleDelete = async () => {
    try {
      setUpdating(true)
      await deleteResource(`professionals/${params.id}`)
      toast({
        title: "Profissional removido",
        description: "O profissional foi removido com sucesso",
      })
      router.push("/professionals")
    } catch (error) {
      console.error("Error deleting professional:", error)
      toast({
        title: "Erro ao remover profissional",
        description: "Não foi possível remover o profissional",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateStatus = async (isActive: boolean) => {
    try {
      setUpdating(true)
      await updateResource(`professionals/${params.id}`, { is_active: isActive })
      setProfessional(prev => prev ? { ...prev, is_active: isActive } : null)
      toast({
        title: `Profissional ${isActive ? "ativado" : "desativado"}`,
        description: `O profissional foi ${isActive ? "ativado" : "desativado"} com sucesso`,
      })
    } catch (error) {
      console.error("Error updating professional status:", error)
      toast({
        title: "Erro ao atualizar status",
        description: "Não foi possível atualizar o status do profissional",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  // Add helper function to check if it's a clinic/establishment
  const isClinic = professional?.documentType === "cnpj" || 
                   (professional?.cnpj && professional.cnpj.trim() !== "" && !professional?.cpf)

  // Fix the formatDate error by providing a default value
  const formatDateWithDefault = (date?: string) => {
    if (!date) return "-"
    return formatDate(date)
  }

  // Get entity-specific information
  const getEntityInfo = () => {
    if (isClinic) {
      return {
        title: professional?.name || "Estabelecimento",
        subtitle: professional?.description || "Estabelecimento de Saúde",
        documentLabel: "CNPJ",
        documentValue: professional?.cnpj || "-",
        icon: Building2,
        typeLabel: "Estabelecimento",
        statusLabel: professional?.status === "approved" ? "Aprovado" : "Pendente",
        mainInfo: [
          { label: "CNES", value: professional?.cnes || "-" },
          { label: "Diretor Técnico", value: professional?.technical_director || "-" },
          { label: "Registro Sanitário", value: (professional as any)?.health_reg_number || "-" },
          { label: "Data de Fundação", value: (professional as any)?.foundation_date ? formatDateWithDefault((professional as any).foundation_date) : "-" }
        ]
      }
    } else {
      return {
        title: professional?.name || "Profissional",
        subtitle: (professional as any)?.specialty || "Profissional de Saúde",
        documentLabel: "CPF",
        documentValue: professional?.cpf || "-",
        icon: User,
        typeLabel: "Profissional",
        statusLabel: professional?.status === "approved" ? "Aprovado" : "Pendente",
        mainInfo: [
          { label: "Especialidade", value: (professional as any)?.specialty || "-" },
          { label: "Conselho", value: `${(professional as any)?.council_type || ""} ${(professional as any)?.council_number || ""}`.trim() || "-" },
          { label: "Estado do Conselho", value: (professional as any)?.council_state || "-" },
          { label: "Data de Nascimento", value: (professional as any)?.birth_date ? formatDateWithDefault((professional as any).birth_date) : "-" }
        ]
      }
    }
  }

  const entityInfo = getEntityInfo()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!professional) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold mb-4">Profissional não encontrado</h2>
        <p className="text-muted-foreground mb-4">O profissional que você procura não existe ou foi removido.</p>
        <Button onClick={() => router.push("/professionals")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para profissionais
        </Button>
      </div>
    )
  }

  const appointmentColumns: ColumnDef<Appointment>[] = [
    {
      accessorKey: "scheduled_at",
      header: "Data/Hora",
      cell: ({ row }) => {
        const date = new Date(row.getValue("scheduled_at"))
        return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR })
      },
    },
    {
      accessorKey: "patient_name",
      header: "Paciente",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const statusColors = {
          scheduled: "bg-blue-100 text-blue-800",
          confirmed: "bg-green-100 text-green-800",
          cancelled: "bg-red-100 text-red-800",
          completed: "bg-gray-100 text-gray-800",
        }
        return (
          <Badge className={statusColors[status as keyof typeof statusColors] || "bg-gray-100 text-gray-800"}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "notes",
      header: "Observações",
      cell: ({ row }) => {
        const notes = row.getValue("notes") as string
        return notes ? (
          <span className="truncate max-w-[200px]" title={notes}>
            {notes}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/professionals")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <entityInfo.icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{entityInfo.title}</h1>
              <p className="text-muted-foreground">
                {entityInfo.subtitle} • {entityInfo.documentLabel}: {entityInfo.documentValue}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleEdit} disabled={updating}>
            <Edit className="mr-2 h-4 w-4" />
            Editar {entityInfo.typeLabel}
          </Button>
          
          <Button
            variant={professional.is_active ? "outline" : "default"}
            onClick={() => handleUpdateStatus(!professional.is_active)}
            disabled={updating}
          >
            {updating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : professional.is_active ? (
              <XCircle className="mr-2 h-4 w-4" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {professional.is_active ? "Desativar" : "Ativar"}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={updating}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir {isClinic ? "este estabelecimento" : "este profissional"}? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Status and Photo */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant={professional.status === "approved" ? "default" : "secondary"}>
            {entityInfo.statusLabel}
          </Badge>
          <Badge variant={professional.is_active ? "default" : "secondary"}>
            {professional.is_active ? "Ativo" : "Inativo"}
          </Badge>
          {professional.has_signed_contract && (
            <Badge variant="outline">
              Contrato Assinado
            </Badge>
          )}
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {entityInfo.typeLabel}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">
            <entityInfo.icon className="mr-2 h-4 w-4" />
            Detalhes
          </TabsTrigger>
          <TabsTrigger value="appointments">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Agendamentos ({professional.appointments_count})
          </TabsTrigger>
          {isClinic && (
            <TabsTrigger value="professionals">
              <User className="mr-2 h-4 w-4" />
              Profissionais ({professional.professionals_count})
            </TabsTrigger>
          )}
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            Documentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <entityInfo.icon className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="font-medium text-muted-foreground">{entityInfo.documentLabel}</dt>
                    <dd className="font-medium">{entityInfo.documentValue}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Nome</dt>
                    <dd className="font-medium">{professional.name}</dd>
                  </div>
                  {entityInfo.mainInfo.map((info, index) => (
                    <div key={index}>
                      <dt className="font-medium text-muted-foreground">{info.label}</dt>
                      <dd>{info.value}</dd>
                    </div>
                  ))}
                  <div>
                    <dt className="font-medium text-muted-foreground">Email</dt>
                    <dd>{(professional as any)?.email || (professional as any)?.user?.email || "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-muted-foreground">Data de Cadastro</dt>
                    <dd>{formatDateWithDefault(professional.created_at)}</dd>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Professional/Clinic Specific Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isClinic ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  {isClinic ? "Informações do Estabelecimento" : "Informações Profissionais"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {isClinic ? (
                    <>
                      <div>
                        <dt className="font-medium text-muted-foreground">CNES</dt>
                        <dd>{professional.cnes || "-"}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Diretor Técnico</dt>
                        <dd>{professional.technical_director || "-"}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Documento do Diretor</dt>
                        <dd>{professional.technical_director_document || "-"}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Horário de Funcionamento</dt>
                        <dd>{(professional as any)?.business_hours || "-"}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="font-medium text-muted-foreground">Serviços Oferecidos</dt>
                        <dd>{(professional as any)?.services || "-"}</dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <dt className="font-medium text-muted-foreground">Especialidade</dt>
                        <dd>{(professional as any)?.specialty || "-"}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Conselho</dt>
                        <dd>{(professional as any)?.council_type || "-"}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Número do Conselho</dt>
                        <dd>{(professional as any)?.council_number || "-"}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Estado do Conselho</dt>
                        <dd>{(professional as any)?.council_state || "-"}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Data de Nascimento</dt>
                        <dd>{(professional as any)?.birth_date ? formatDateWithDefault((professional as any).birth_date) : "-"}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-muted-foreground">Gênero</dt>
                        <dd>{(professional as any)?.gender || "-"}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="font-medium text-muted-foreground">Biografia</dt>
                        <dd>{(professional as any)?.bio || "-"}</dd>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {professional.phones && professional.phones.length > 0 ? (
                  professional.phones.map((phone) => (
                    <div key={phone.id} className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{phone.formatted_number}</span>
                      <Badge variant="outline" className="text-xs">
                        {phone.type}
                      </Badge>
                      {phone.is_whatsapp && (
                        <Badge variant="outline" className="text-xs bg-green-100">
                          WhatsApp
                        </Badge>
                      )}
                      {phone.is_primary && (
                        <Badge variant="outline" className="text-xs">
                          Principal
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum telefone cadastrado</p>
                )}
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Localização</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {professional.addresses && professional.addresses.length > 0 ? (
                  professional.addresses.map((address) => (
                    <div key={address.id} className="text-sm">
                      <div className="space-y-1">
                        <p>{address.street} {address.number && `nº ${address.number}`}</p>
                        <p>{address.neighborhood}</p>
                        <p>{address.city}, {address.state}</p>
                        <p>CEP: {address.postal_code}</p>
                        {address.complement && <p>Complemento: {address.complement}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum endereço cadastrado</p>
                )}
              </CardContent>
            </Card>

            {/* Services and Hours (only for clinics) */}
            {isClinic && (
              <Card>
                <CardHeader>
                  <CardTitle>Serviços e Horários</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Horário de Funcionamento</h4>
                      <p className="text-sm">{professional.contract || "Não informado"}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Serviços Oferecidos</h4>
                      <p className="text-sm">{professional.pricing_contracts.map(pc => pc.services).join(", ") || "Não informado"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Clinic Information (only for professionals) */}
            {!isClinic && professional.parent_clinic && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Estabelecimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{professional.parent_clinic.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Estabelecimento associada
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/professionals/${professional.parent_clinic?.id}`)}
                    >
                      Ver detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos</CardTitle>
              <CardDescription>
                Histórico de agendamentos do profissional
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingAppointments ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : appointments.length > 0 ? (
                <DataTable columns={appointmentColumns} data={appointments} />
              ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Nenhum agendamento</h3>
                  <p className="text-muted-foreground">
                    Este profissional ainda não possui agendamentos.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professionals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profissionais</CardTitle>
              <CardDescription>
                Profissionais associados ao profissional
              </CardDescription>
            </CardHeader>
            <CardContent>
              {professional.professionals && professional.professionals.length > 0 ? (
                <div className="space-y-4">
                  {professional.professionals.map((prof) => (
                    <div key={prof.id} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{prof.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {prof.description}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/professionals/${prof.id}`)}
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Nenhum profissional associado</h3>
                  <p className="text-muted-foreground">
                    Este profissional ainda não possui profissionais associados.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Documentos</CardTitle>
              <CardDescription>
                Documentos enviados {isClinic ? "pela clínica" : "pelo profissional"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {professional.documents && professional.documents.length > 0 ? (
                <div className="space-y-4">
                  {professional.documents.map((document, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">{document.type}</h4>
                          <p className="text-sm text-muted-foreground">
                            {document.description || "Sem descrição"}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Ver documento
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Nenhum documento</h3>
                  <p className="text-muted-foreground">
                    {isClinic 
                      ? "Esta clínica ainda não enviou documentos."
                      : "Este profissional ainda não enviou documentos."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <EditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        entityType={entityType as "clinic" | "professional"}
        entityId={params.id}
        title={isClinic ? "Editar Estabelecimento" : "Editar Profissional"}
      />
    </div>
  )
} 