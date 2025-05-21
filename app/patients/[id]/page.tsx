"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Edit, ArrowLeft, Trash2, Phone, Mail, CalendarIcon, MapPin, CreditCard, List, ShieldAlert } from "lucide-react"
import api from "@/services/api-client"
import { maskCPF, maskPhone, maskCEP } from "@/components/utils/masks"
import { formatDate } from "@/lib/utils"
import { fetchResourceById } from "@/services/resource-service"
import { ConditionalRender } from "@/components/conditional-render"
import { useAuth } from "@/contexts/auth-context"

interface Patient {
  id: number
  name: string
  email: string
  cpf: string
  birth_date: string
  gender: string
  health_plan_id: number | null
  health_card_number: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  created_at: string
  updated_at: string
  health_plan?: {
    id: number
    name: string
  }
  phones?: {
    id: number
    number: string
    type: string
  }[]
  age?: number
}


export default function PatientDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string
  const { getUserRole } = useAuth()
  const isNetworkManager = getUserRole() === 'network_manager'
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const loadPatient = async () => {
      if (!params.id) return;
      
      setIsLoading(true)
      try {
        const response = await fetchResourceById<Patient>('patients', params.id as string)
        setPatient(response)
      } catch (error) {
        console.error('Error loading patient:', error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do paciente",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadPatient()
  }, [params.id])
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Paciente não encontrado</h2>
        <p className="text-muted-foreground mt-2">O paciente solicitado não foi encontrado ou foi removido</p>
        <Button onClick={() => router.push("/patients")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para lista
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
          <p className="text-muted-foreground flex items-center">
            <Mail className="h-4 w-4 mr-1" />
            {patient.email}
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button variant="outline" onClick={() => router.push(`/patients/${patient.id}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          
          {/* Ocultar botão de procedimentos do plano para gerentes de rede */}
          <ConditionalRender hideForRoles={['network_manager']}>
            {patient.health_plan && (
              <Button
                variant="outline"
                onClick={() => router.push(`/patients/${patient.id}/procedures`)}
              >
                <List className="h-4 w-4 mr-2" />
                Procedimentos do Plano
              </Button>
            )}
          </ConditionalRender>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Dados pessoais do paciente</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">CPF</h3>
              <p>{patient.cpf ? maskCPF(patient.cpf) : "Não informado"}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Data de Nascimento</h3>
              <p className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1 text-muted-foreground" />
                {patient.birth_date ? formatDate(patient.birth_date) : "Não informada"}
                {patient.age && <span className="ml-2 text-muted-foreground">({patient.age} anos)</span>}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Gênero</h3>
              <p>
                {patient.gender === "male" ? "Masculino" : 
                 patient.gender === "female" ? "Feminino" : "Outro"}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Cadastrado em</h3>
              <p>{formatDate(patient.created_at)}</p>
            </div>
            
            <div className="sm:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Contatos</h3>
              {patient.phones && patient.phones.length > 0 ? (
                <div className="space-y-2">
                  {patient.phones.map((phone) => (
                    <p key={phone.id} className="flex items-center">
                      <Phone className="h-4 w-4 mr-1 text-muted-foreground" />
                      {maskPhone(phone.number)}
                      <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                        {phone.type === "mobile" ? "Celular" :
                         phone.type === "landline" ? "Fixo" : 
                         phone.type === "whatsapp" ? "WhatsApp" : "Fax"}
                      </span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhum telefone cadastrado</p>
              )}
            </div>
            
            <Separator className="sm:col-span-2 my-2" />
            
            <div className="sm:col-span-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Endereço</h3>
              {patient.address ? (
                <div className="space-y-1">
                  <p className="flex items-start">
                    <MapPin className="h-4 w-4 mr-1 mt-0.5 text-muted-foreground" />
                    {patient.address}
                  </p>
                  <p className="text-muted-foreground pl-5">
                    {[
                      patient.city,
                      patient.state,
                      patient.postal_code ? maskCEP(patient.postal_code) : null
                    ].filter(Boolean).join(" - ")}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Endereço não cadastrado</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <ConditionalRender hideOnContractData>
          <Card>
            <CardHeader>
              <CardTitle>Plano de Saúde</CardTitle>
              <CardDescription>Informações do plano</CardDescription>
            </CardHeader>
            <CardContent>
              {patient.health_plan ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Plano</h3>
                    <p className="font-medium">{patient.health_plan.name}</p>
                  </div>
                  
                  {patient.health_card_number && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Carteirinha</h3>
                      <p className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-1 text-muted-foreground" />
                        {patient.health_card_number}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <CreditCard className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="font-medium">Sem plano vinculado</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Este paciente não possui plano de saúde associado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </ConditionalRender>
        
        {/* Informação alternativa para gerentes de rede */}
        {isNetworkManager && (
          <Card className="bg-muted">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldAlert className="h-5 w-5 mr-2 text-amber-500" />
                Acesso Restrito
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Informações detalhadas de plano de saúde e contratos não estão disponíveis para seu nível de acesso.
              </p>
              <p className="text-sm mt-2">
                Entre em contato com o setor financeiro ou comercial para mais informações.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 