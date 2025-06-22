"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Search } from "lucide-react"
import { createExtemporaneousNegotiation } from "@/services/extemporaneous-negotiations"
import api from "@/services/api-client"
import debounce from 'lodash/debounce'

interface NewExtemporaneousNegotiationProps {
  onSuccess: () => void
}

interface Entity {
  id: number
  name: string
  cnpj?: string
}

interface TussProcedure {
  id: number
  code: string
  description: string
}

interface Solicitation {
  id: number
  patient_name: string
  tuss_procedure?: {
    id: number
    code: string
    description: string
  }
}

const buscarEntidades = async (tipo: string, termo: string = '') => {
  if (!tipo) return [];
  
  try {
    let endpoint = '';
    if (tipo === 'App\\Models\\Professional') {
      endpoint = '/professionals';
    } else if (tipo === 'App\\Models\\Clinic') {
      endpoint = '/clinics';
    } else {
      return [];
    }

    const response = await api.get(endpoint, { 
      params: { search: termo } 
    });
    
    if (response?.data?.data) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Erro ao buscar entidades:', error);
    return [];
  }
};

export function NewExtemporaneousNegotiation({ onSuccess }: NewExtemporaneousNegotiationProps) {
  const [entityType, setEntityType] = useState<string>("")
  const [entityId, setEntityId] = useState<string>("")
  const [tussProcedureId, setTussProcedureId] = useState<string>("")
  const [negotiatedPrice, setNegotiatedPrice] = useState<string>("")
  const [justification, setJustification] = useState<string>("")
  const [solicitationId, setSolicitationId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingEntities, setIsLoadingEntities] = useState(false)
  const [isLoadingProcedures, setIsLoadingProcedures] = useState(false)
  const [isLoadingSolicitations, setIsLoadingSolicitations] = useState(false)
  const [entities, setEntities] = useState<Entity[]>([])
  const [procedures, setProcedures] = useState<TussProcedure[]>([])
  const [solicitations, setSolicitations] = useState<Solicitation[]>([])

  // Buscar solicitações com debounce
  const buscarSolicitacoes = debounce(async (termo: string = '') => {
    if (!termo || termo.length < 3) return;
    
    setIsLoadingSolicitations(true);
    try {
      const response = await api.get('/solicitations', {
        params: {
          search: termo,
          status: 'approved',
          per_page: 100
        }
      });

      if (response?.data?.data) {
        setSolicitations(response.data.data);
      } else {
        setSolicitations([]);
      }
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as solicitações",
        variant: "destructive"
      });
      setSolicitations([]);
    } finally {
      setIsLoadingSolicitations(false);
    }
  }, 300);

  // Handle solicitation selection
  const handleSolicitationChange = async (id: string) => {
    setSolicitationId(id);
    const solicitation = solicitations.find(s => s.id.toString() === id);
    
    // If solicitation has a TUSS procedure, auto-select it
    if (solicitation?.tuss_procedure) {
      setTussProcedureId(solicitation.tuss_procedure.id.toString());
      setProcedures([solicitation.tuss_procedure]);
    } else {
      setTussProcedureId("");
      setProcedures([]);
    }
  };

  // Handle entity type change
  const handleEntityTypeChange = async (type: string) => {
    setEntityType(type);
    setEntityId("");
    setEntities([]);
    
    const novasEntidades = await buscarEntidades(type);
    setEntities(novasEntidades);
  };

  // Buscar entidades com debounce
  const buscarEntidadesDebounced = debounce(async (tipo: string, termo: string = '') => {
    if (!tipo) return;
    
    setIsLoadingEntities(true);
    try {
      const novasEntidades = await buscarEntidades(tipo, termo);
      setEntities(novasEntidades);
    } catch (error) {
      console.error('Erro ao buscar entidades:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as entidades",
        variant: "destructive"
      });
      setEntities([]);
    } finally {
      setIsLoadingEntities(false);
    }
  }, 300);

  // Buscar procedimentos TUSS com debounce
  const buscarProcedimentosTuss = debounce(async (termo: string = '') => {
    if (!termo || termo.length < 3) return;
    
    setIsLoadingProcedures(true);
    try {
      const response = await api.get('/tuss-procedures', {
        params: {
          search: termo,
          is_active: true,
          per_page: 100
        }
      });

      if (response?.data?.data) {
        setProcedures(response.data.data);
      } else {
        setProcedures([]);
      }
    } catch (error) {
      console.error('Erro ao buscar procedimentos TUSS:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os procedimentos",
        variant: "destructive"
      });
      setProcedures([]);
    } finally {
      setIsLoadingProcedures(false);
    }
  }, 300);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!solicitationId || !entityType || !entityId || !tussProcedureId || !negotiatedPrice || !justification) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      })
      return
    }

    if (justification.length < 10) {
      toast({
        title: "Erro",
        description: "A justificativa deve ter pelo menos 10 caracteres",
        variant: "destructive"
      })
      return
    }

    const price = parseFloat(negotiatedPrice)
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Erro",
        description: "O valor negociado deve ser maior que zero",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await createExtemporaneousNegotiation({
        negotiable_type: entityType,
        negotiable_id: parseInt(entityId),
        tuss_procedure_id: parseInt(tussProcedureId),
        negotiated_price: price,
        justification,
        solicitation_id: parseInt(solicitationId)
      })

      if (response.data.status === 'success') {
        toast({
          title: "Sucesso",
          description: "Negociação extemporânea criada com sucesso"
        })
        
        // Reset form
        setEntityType("")
        setEntityId("")
        setTussProcedureId("")
        setNegotiatedPrice("")
        setJustification("")
        setSolicitationId("")
        setEntities([])
        setProcedures([])
        setSolicitations([])
        
        onSuccess()
      } else {
        throw new Error('Failed to create negotiation')
      }
    } catch (error: any) {
      console.error('Error creating negotiation:', error)
      const errorMessage = error.response?.data?.message || "Não foi possível criar a negociação"
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'App\\Models\\Clinic':
        return 'Clínica'
      case 'App\\Models\\HealthPlan':
        return 'Plano de Saúde'
      default:
        return 'Entidade'
    }
  }

  const getEntitySelectLabel = (type: string) => {
    switch (type) {
      case 'App\\Models\\Clinic':
        return 'a clínica'
      case 'App\\Models\\HealthPlan':
        return 'o plano de saúde'
      default:
        return 'a entidade'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Negociação Extemporânea</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="solicitation">Solicitação *</Label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite pelo menos 3 caracteres para buscar solicitações..."
                  onChange={(e) => buscarSolicitacoes(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={solicitationId}
              onValueChange={handleSolicitationChange}
              disabled={isLoading || isLoadingSolicitations}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma solicitação" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingSolicitations ? (
                  <div className="flex items-center gap-2 p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando...
                  </div>
                ) : solicitations.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Digite pelo menos 3 caracteres para buscar
                  </div>
                ) : (
                  solicitations.map((solicitation) => (
                    <SelectItem key={solicitation.id} value={solicitation.id.toString()}>
                      {solicitation.patient_name}
                      {solicitation.tuss_procedure && ` - ${solicitation.tuss_procedure.code}`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="entity-type">Tipo de Entidade *</Label>
            <Select
              value={entityType}
              onValueChange={handleEntityTypeChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de entidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="App\\Models\\Professional">Profissional</SelectItem>
                <SelectItem value="App\\Models\\Clinic">Clínica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {entityType && (
            <div className="space-y-2">
              <Label htmlFor="entity">
                {entityType === 'App\\Models\\Clinic' ? 'Clínica' : 'Profissional'} *
              </Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Buscar ${entityType === 'App\\Models\\Clinic' ? 'clínica' : 'profissional'}...`}
                    onChange={(e) => buscarEntidadesDebounced(entityType, e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={entityId}
                onValueChange={setEntityId}
                disabled={isLoading || isLoadingEntities}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Selecione ${entityType === 'App\\Models\\Clinic' ? 'a clínica' : 'o profissional'}`} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingEntities ? (
                    <div className="flex items-center gap-2 p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Carregando...
                    </div>
                  ) : entities.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhum resultado encontrado
                    </div>
                  ) : (
                    entities.map((entity) => (
                      <SelectItem key={entity.id} value={entity.id.toString()}>
                        {entity.name}
                        {entity.cnpj && ` (${entity.cnpj})`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {entityId && (
            <div className="space-y-2">
              <Label htmlFor="procedure">Procedimento TUSS *</Label>
              
              {/* Campo de busca para procedimentos TUSS */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por código ou descrição TUSS..."
                    onChange={(e) => buscarProcedimentosTuss(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select
                value={tussProcedureId}
                onValueChange={setTussProcedureId}
                disabled={isLoading || isLoadingProcedures}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o procedimento" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingProcedures ? (
                      <div className="flex items-center gap-2 p-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando...
                      </div>
                  ) : procedures.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        Nenhum procedimento encontrado
                      </div>
                  ) : (
                    procedures.map((procedure) => (
                      <SelectItem key={procedure.id} value={procedure.id.toString()}>
                        {procedure.code} - {procedure.description}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="price">Valor Negociado (R$) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={negotiatedPrice}
              onChange={(e) => setNegotiatedPrice(e.target.value)}
              placeholder="0,00"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Justificativa *</Label>
            <Textarea
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explique o motivo desta negociação extemporânea (mínimo 10 caracteres)"
              rows={4}
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              {justification.length}/10 caracteres mínimos
            </p>
          </div>

          <Button type="submit" disabled={isLoading || !entityType || !entityId || !tussProcedureId || !negotiatedPrice || justification.length < 10}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando...
              </>
            ) : (
              'Criar Negociação'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 