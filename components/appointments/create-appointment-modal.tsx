"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Plus } from "lucide-react"
import api from "@/services/api-client"
import { formatDateTime } from "@/lib/utils"

interface Solicitation {
  id: number
  health_plan_id: number
  patient_id: number
  tuss_id: number
  status: string
  priority: string
  description: string | null
  requested_by: number | null
  scheduled_automatically: boolean
  completed_at: string | null
  cancelled_at: string | null
  cancel_reason: string | null
  state: string | null
  city: string | null
  created_at: string
  updated_at: string
  health_plan: {
    id: number
    name: string
    cnpj: string
    ans_code: string
    description: string | null
    municipal_registration: string
    legal_representative_name: string
    legal_representative_cpf: string
    legal_representative_position: string
    legal_representative_id: number | null
    operational_representative_name: string
    operational_representative_cpf: string
    operational_representative_position: string
    operational_representative_id: number | null
    address: string
    city: string
    state: string
    postal_code: string
    logo: string
    status: string
    approved_at: string
    has_signed_contract: boolean
    created_at: string
    updated_at: string
  }
  patient: {
    id: number
    name: string
    cpf: string
    birth_date: string
    gender: string
    health_plan_id: number
    health_card_number: string
    address: string
    city: string
    state: string
    postal_code: string
    created_at: string
    updated_at: string
    age: number
  }
  tuss: {
    id: number
    code: string
    description: string
    category: string
    subcategory: string | null
    type: string | null
    amb_code: string | null
    amb_description: string | null
    created_at: string
    updated_at: string
  }
  requested_by_user: any | null
  is_active: boolean
}

interface ProfessionalAvailability {
  id: number
  professional: {
    id: number
    name: string
  }
  available_date: string
  available_time: string
  notes: string
  status: string
  price: number | null
  pricing_contract: {
    id: number
    price: number
    notes: string | null
    start_date: string
    end_date: string | null
  } | null
  provider: {
    id: number
    name: string
    type: string
    addresses: Array<{
      id: number
      street: string
      number: string
      complement: string | null
      neighborhood: string
      city: string
      state: string
      postal_code: string
      is_primary: boolean
      full_address: string
    }>
  }
}

interface Professional {
  id: number
  name: string
  cpf: string
  professional_type: string
  professional_id: number | null
  specialty: string
  registration_number: string | null
  registration_state: string | null
  clinic_id: number | null
  bio: string | null
  photo: string | null
  status: string
  approved_at: string
  is_active: boolean
  created_at: string
  updated_at: string
  addresses: Address[]
}

interface Address {
  id: number
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  postal_code: string
  is_primary: boolean
  full_address: string
}

interface CreateAppointmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  preSelectedSolicitation?: Solicitation | null
  showTriggerButton?: boolean
}

export function CreateAppointmentModal({ open, onOpenChange, onSuccess, preSelectedSolicitation, showTriggerButton }: CreateAppointmentModalProps) {
  const [solicitations, setSolicitations] = useState<Solicitation[]>([])
  const [selectedSolicitation, setSelectedSolicitation] = useState<Solicitation | null>(null)
  const [availabilities, setAvailabilities] = useState<ProfessionalAvailability[]>([])
  const [showDirectScheduling, setShowDirectScheduling] = useState(false)
  const [directSchedulingDate, setDirectSchedulingDate] = useState("")
  const [directSchedulingTime, setDirectSchedulingTime] = useState("")
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [selectedProvider, setSelectedProvider] = useState<Professional | null>(null)
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null)
  const [customAddress, setCustomAddress] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    postal_code: ''
  })
  const [isSearchingCep, setIsSearchingCep] = useState(false)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [providerType, setProviderType] = useState<string>("")

  useEffect(() => {
    if (open && !preSelectedSolicitation) {
      fetchSolicitations()
    }
  }, [open, preSelectedSolicitation])

  useEffect(() => {
    if (selectedSolicitation && showDirectScheduling && providerType) {
      fetchProfessionals(selectedSolicitation.id, providerType)
    }
  }, [selectedSolicitation, showDirectScheduling, providerType])

  useEffect(() => {
    if (selectedProviderId && providerType) {
      fetchProviderDetails(selectedProviderId, providerType)
    }
  }, [selectedProviderId, providerType])

  // Effect to handle pre-selected solicitation
  useEffect(() => {
    if (preSelectedSolicitation) {
      setSelectedSolicitation(preSelectedSolicitation)
      setSolicitations([preSelectedSolicitation])
      // Automatically fetch availabilities for the pre-selected solicitation
      fetchAvailabilities(preSelectedSolicitation.id)
    }
  }, [preSelectedSolicitation])

  const fetchSolicitations = async (): Promise<void> => {
    try {
      // If we have a pre-selected solicitation, don't fetch the list
      if (preSelectedSolicitation) {
        setSolicitations([preSelectedSolicitation])
        return
      }
      
      const response = await api.get("/solicitations", {
        params: {
          status: ["pending", "processing"]
        }
      })
      setSolicitations(response.data.data)
    } catch (error) {
      console.error("Error fetching solicitations:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as solicitações",
        variant: "destructive"
      })
    }
  }

  const fetchAvailabilities = async (solicitationId: number) => {
    try {
      const response = await api.get(`/solicitations/${solicitationId}/availabilities`)
      setAvailabilities(response.data.data)
    } catch (error) {
      console.error("Error fetching availabilities:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as disponibilidades",
        variant: "destructive"
      })
    }
  }

  const fetchProfessionals = async (solicitationId: number, type: string) => {
    try {
      const endpoint = type === 'App\\Models\\Clinic' 
        ? `/solicitations/${solicitationId}/available-clinics`
        : `/solicitations/${solicitationId}/available-professionals`
      
      const response = await api.get(endpoint)
      setProfessionals(response.data.data)
    } catch (error) {
      console.error("Error fetching professionals:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os profissionais",
        variant: "destructive"
      })
    }
  }

  const fetchProviderDetails = async (providerId: number, type: string) => {
    try {
      const endpoint = type === 'App\\Models\\Clinic' 
        ? `/clinics/${providerId}`
        : `/professionals/${providerId}`
      
      const response = await api.get(endpoint)
      setSelectedProvider(response.data.data)
    } catch (error) {
      console.error("Error fetching provider details:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do profissional",
        variant: "destructive"
      })
    }
  }

  const handleSearchCep = async (cep: string) => {
    if (cep.length !== 8) return
    
    setIsSearchingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()

      if (data.erro) {
        throw new Error('CEP não encontrado')
      }

      setCustomAddress({
        street: data.logradouro,
        number: '',
        complement: data.complemento || '',
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        postal_code: data.cep
      })
      
      toast({
        title: "Sucesso",
        description: "Endereço encontrado"
      })
    } catch (error) {
      console.error("Error searching CEP:", error)
      toast({
        title: "Erro",
        description: "CEP não encontrado",
        variant: "destructive"
      })
    } finally {
      setIsSearchingCep(false)
    }
  }

  const handleCreateDirectAppointment = async () => {
    if (!selectedSolicitation || !selectedProviderId || !providerType) return
    
    setIsActionLoading(true)
    try {
      const payload: any = {
        solicitation_id: selectedSolicitation.id,
        provider_id: selectedProviderId,
        provider_type: providerType,
        scheduled_date: `${directSchedulingDate}T${directSchedulingTime}:00`,
        notes: ''
      }
      
      if (selectedAddressId) {
        payload.address_id = selectedAddressId
      } else {
        payload.custom_address = customAddress
      }
      
      await api.post('/appointments', payload)
      
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso"
      })
      
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error creating appointment:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleSelectAvailability = async (availability: ProfessionalAvailability) => {
    if (!selectedSolicitation) return
    
    setIsActionLoading(true)
    try {
      await api.post(`/availabilities/${availability.id}/select`)
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso"
      })
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error) {
      console.error("Error creating appointment:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedSolicitation(null)
    setAvailabilities([])
    setShowDirectScheduling(false)
    setDirectSchedulingDate("")
    setDirectSchedulingTime("")
    setSelectedProviderId(null)
    setProfessionals([])
    setSelectedProvider(null)
    setSelectedAddressId(null)
    setProviderType("")
    setCustomAddress({
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      postal_code: ''
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pendente</Badge>
      case "confirmed":
        return <Badge>Confirmado</Badge>
      case "completed":
        return <Badge variant="secondary">Concluído</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTriggerButton && (
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agendamento
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Escolha o método de agendamento
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 mb-4">
          <Label htmlFor="scheduling-type">Tipo de Agendamento:</Label>
          <Select
            onValueChange={(value) => {
              if (value === 'direct') {
                setShowDirectScheduling(true)
                setSelectedSolicitation(null)
                setAvailabilities([])
              } else {
                setShowDirectScheduling(false)
              }
            }}
            defaultValue="availability"
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione o método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="availability">Por Disponibilidade</SelectItem>
              <SelectItem value="direct">Agendamento Direto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!showDirectScheduling ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Solicitações Pendentes e em Processamento</h3>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2">
                {solicitations.map((solicitation) => (
                  <Card
                    key={solicitation.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSolicitation?.id === solicitation.id
                        ? "border-primary"
                        : "hover:border-muted-foreground"
                    }`}
                    onClick={() => {
                      setSelectedSolicitation(solicitation)
                      if (!showDirectScheduling) {
                        fetchAvailabilities(solicitation.id)
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{solicitation.patient?.name || 'Paciente não especificado'}</div>
                            <div className="text-muted-foreground truncate">
                              CPF: {solicitation.patient?.cpf || '-'} • {solicitation.patient?.age || '-'} anos
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {solicitation.health_plan?.name || 'Plano não especificado'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="truncate">
                            <span className="font-medium">Plano:</span> {solicitation.health_plan?.name || '-'}
                            <div className="text-muted-foreground truncate">
                              ANS: {solicitation.health_plan?.ans_code || '-'}
                            </div>
                          </div>
                          <div className="truncate">
                            <span className="font-medium">Carteira:</span> {solicitation.patient?.health_card_number || '-'}
                          </div>
                        </div>

                        <div className="truncate">
                          <span className="font-medium">Procedimento:</span> {solicitation.tuss?.description || '-'}
                          <div className="text-muted-foreground truncate">
                            Código TUSS: {solicitation.tuss?.code || '-'}
                          </div>
                        </div>

                        {solicitation.description && (
                          <div className="truncate">
                            <span className="font-medium">Observação:</span> {solicitation.description}
                          </div>
                        )}

                        <div className="truncate">
                          <span className="font-medium">Solicitado por:</span> {solicitation.requested_by_user?.name || '-'}
                          <div className="text-muted-foreground truncate">
                            {solicitation.requested_by_user?.email || '-'}
                          </div>
                        </div>

                        <div className="truncate">
                          <span className="font-medium">Prioridade:</span> {solicitation.priority || '-'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {solicitations.length === 0 && (
                  <div className="text-center text-muted-foreground py-4 text-sm">
                    Nenhuma solicitação pendente ou em processamento
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm">Disponibilidades</h3>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {selectedSolicitation ? (
                  availabilities.map((availability) => (
                    <Card key={availability.id}>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">
                                {availability.provider?.name || 'Profissional não especificado'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDateTime(availability.available_date)} às{" "}
                                {availability.available_time}
                              </div>
                              {availability.price && (
                                <div className="text-sm font-semibold text-green-600 mt-1">
                                  R$ {availability.price.toFixed(2)}
                                </div>
                              )}
                              {availability.provider?.addresses && availability.provider.addresses.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  <span className="font-medium">Endereços disponíveis:</span> {availability.provider.addresses.length}
                                </div>
                              )}
                            </div>
                            {getStatusBadge(availability.status)}
                          </div>

                          {availability.notes && (
                            <div className="text-xs text-muted-foreground truncate">
                              {availability.notes}
                            </div>
                          )}

                          {availability.pricing_contract?.notes && (
                            <div className="text-xs text-muted-foreground truncate">
                              <span className="font-medium">Observações do Preço:</span> {availability.pricing_contract.notes}
                            </div>
                          )}

                          {availability.status === "pending" && (
                            <Button
                              className="w-full text-xs h-8"
                              onClick={() => handleSelectAvailability(availability)}
                              disabled={isActionLoading}
                            >
                              {isActionLoading ? "Criando..." : "Criar Agendamento"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-4 text-sm">
                    Selecione uma solicitação para ver as disponibilidades
                  </div>
                )}
                {selectedSolicitation && availabilities.length === 0 && (
                  <div className="text-center text-muted-foreground py-4 text-sm">
                    Nenhuma disponibilidade registrada
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Solicitação</h3>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2">
                {solicitations.map((solicitation) => (
                  <Card
                    key={solicitation.id}
                    className={`cursor-pointer transition-colors ${
                      selectedSolicitation?.id === solicitation.id
                        ? "border-primary"
                        : "hover:border-muted-foreground"
                    }`}
                    onClick={() => setSelectedSolicitation(solicitation)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{solicitation.patient?.name || 'Paciente não especificado'}</div>
                            <div className="text-muted-foreground truncate">
                              CPF: {solicitation.patient?.cpf || '-'} • {solicitation.patient?.age || '-'} anos
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {solicitation.health_plan?.name || 'Plano não especificado'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="truncate">
                            <span className="font-medium">Plano:</span> {solicitation.health_plan?.name || '-'}
                            <div className="text-muted-foreground truncate">
                              ANS: {solicitation.health_plan?.ans_code || '-'}
                            </div>
                          </div>
                          <div className="truncate">
                            <span className="font-medium">Carteira:</span> {solicitation.patient?.health_card_number || '-'}
                          </div>
                        </div>

                        <div className="truncate">
                          <span className="font-medium">Procedimento:</span> {solicitation.tuss?.description || '-'}
                          <div className="text-muted-foreground truncate">
                            Código TUSS: {solicitation.tuss?.code || '-'}
                          </div>
                        </div>

                        {solicitation.description && (
                          <div className="truncate">
                            <span className="font-medium">Observação:</span> {solicitation.description}
                          </div>
                        )}

                        <div className="truncate">
                          <span className="font-medium">Solicitado por:</span> {solicitation.requested_by_user?.name || '-'}
                          <div className="text-muted-foreground truncate">
                            {solicitation.requested_by_user?.email || '-'}
                          </div>
                        </div>

                        <div className="truncate">
                          <span className="font-medium">Prioridade:</span> {solicitation.priority || '-'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {selectedSolicitation && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Data e Hora</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDirectSchedulingDate(e.target.value)}
                    />
                    <Input
                      type="time"
                      onChange={(e) => setDirectSchedulingTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Profissional</Label>
                  <Select onValueChange={(value) => {
                    setProviderType(value)
                    setSelectedProviderId(null)
                    setProfessionals([])
                    setSelectedProvider(null)
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de profissional" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="App\\Models\\Professional">Profissional</SelectItem>
                      <SelectItem value="App\\Models\\Clinic">Estabelecimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {providerType && (
                  <div className="space-y-2">
                    <Label>Profissional/Estabelecimento</Label>
                    <Select onValueChange={(value) => setSelectedProviderId(Number(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Selecione ${providerType.includes('Clinic') ? 'a clínica' : 'o profissional'}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {professionals.map((professional) => (
                          <SelectItem key={professional.id} value={professional.id.toString()}>
                            {professional.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Usar endereço existente</Label>
                      {selectedProvider?.addresses?.map((address: Address) => (
                        <Card
                          key={address.id}
                          className={`cursor-pointer mt-2 transition-colors ${
                            selectedAddressId === address.id
                              ? "border-primary"
                              : "hover:border-muted-foreground"
                          }`}
                          onClick={() => {
                            setSelectedAddressId(address.id)
                            setCustomAddress({
                              street: '',
                              number: '',
                              complement: '',
                              neighborhood: '',
                              city: '',
                              state: '',
                              postal_code: ''
                            })
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="space-y-1">
                              <div className="text-sm font-medium">
                                {address.street}, {address.number}
                                {address.is_primary && (
                                  <Badge variant="outline" className="ml-2 text-xs">Principal</Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {address.complement && `${address.complement}, `}
                                {address.neighborhood} - {address.city}/{address.state}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                CEP: {address.postal_code}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div>
                      <Label>Ou usar endereço personalizado</Label>
                      <div className="space-y-2 mt-2">
                        <Input
                          placeholder="CEP"
                          value={customAddress.postal_code}
                          onChange={(e) => {
                            const cep = e.target.value.replace(/\D/g, '')
                            setCustomAddress(prev => ({ ...prev, postal_code: cep }))
                            if (cep.length === 8) {
                              handleSearchCep(cep)
                            }
                          }}
                          maxLength={8}
                        />
                        <Input
                          placeholder="Rua"
                          value={customAddress.street}
                          onChange={(e) => setCustomAddress(prev => ({ ...prev, street: e.target.value }))}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Número"
                            value={customAddress.number}
                            onChange={(e) => setCustomAddress(prev => ({ ...prev, number: e.target.value }))}
                          />
                          <Input
                            placeholder="Complemento"
                            value={customAddress.complement}
                            onChange={(e) => setCustomAddress(prev => ({ ...prev, complement: e.target.value }))}
                          />
                        </div>
                        <Input
                          placeholder="Bairro"
                          value={customAddress.neighborhood}
                          onChange={(e) => setCustomAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="Cidade"
                            value={customAddress.city}
                            onChange={(e) => setCustomAddress(prev => ({ ...prev, city: e.target.value }))}
                          />
                          <Input
                            placeholder="Estado"
                            value={customAddress.state}
                            onChange={(e) => setCustomAddress(prev => ({ ...prev, state: e.target.value }))}
                            maxLength={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={handleCreateDirectAppointment}
                  disabled={
                    !selectedSolicitation ||
                    !directSchedulingDate ||
                    !directSchedulingTime ||
                    !selectedProviderId ||
                    !providerType ||
                    (!selectedAddressId && (!customAddress.street || !customAddress.number))
                  }
                >
                  {isActionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Criar Agendamento
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 