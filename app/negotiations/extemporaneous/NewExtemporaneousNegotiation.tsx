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
import { useToast } from "@/components/ui/use-toast"
import { Switch } from "@/components/ui/switch"

interface NewExtemporaneousNegotiationProps {
  onSuccess: () => void
}

interface Entity {
  id: number
  name: string
  cnpj?: string
  cpf?: string
  council_number?: string
  specialty?: string
  type?: string
}

interface Solicitation {
  id: number
  patient: {
    id: number
    name: string
  }
  tuss: {
    id: number
    code: string
    description: string
  }
  status: string
  priority: string
}

export function NewExtemporaneousNegotiation({ onSuccess }: NewExtemporaneousNegotiationProps) {
  const [entityType, setEntityType] = useState<string>("")
  const [entityId, setEntityId] = useState<string>("")
  const [requestedValue, setRequestedValue] = useState<string>("")
  const [justification, setJustification] = useState<string>("")
  const [solicitationId, setSolicitationId] = useState<string>("")
  const [urgencyLevel, setUrgencyLevel] = useState<string>("medium")
  const [isRequiringAddendum, setIsRequiringAddendum] = useState<boolean>(true)
  const [addendumIncluded, setAddendumIncluded] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingEntities, setIsLoadingEntities] = useState(false)
  const [isLoadingSolicitations, setIsLoadingSolicitations] = useState(false)
  const [entities, setEntities] = useState<Entity[]>([])
  const [solicitations, setSolicitations] = useState<Solicitation[]>([])
  const { toast } = useToast()

  // Buscar entidades com debounce
  const debouncedBuscarEntidades = useCallback(
    debounce(async (tipo: string, termo: string) => {
      if (!termo || termo.length < 3) {
        setEntities([]);
        return;
      }
      
      setIsLoadingEntities(true);
      try {
        let endpoint = tipo.includes('Professional') ? '/professionals' : '/clinics';
        const response = await api.get(endpoint, {
          params: {
            search: termo,
            status: 'approved',
            is_active: true,
            per_page: 100
          }
        });

        if (response?.data?.data) {
          const entidades = response.data.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            cnpj: item.cnpj,
            cpf: item.cpf,
            council_number: item.council_number,
            specialty: item.specialty,
            type: tipo
          }));
          setEntities(entidades);
        } else {
          setEntities([]);
        }
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
    }, 300),
    [toast]
  );

  // Buscar solicitações com debounce
  const debouncedBuscarSolicitacoes = useCallback(
    debounce(async (termo: string) => {
      if (!termo || termo.length < 3) {
        setSolicitations([]);
        return;
      }
      
      setIsLoadingSolicitations(true);
      try {
        const response = await api.get('/solicitations', {
          params: {
            search: termo,
            status: 'pending',
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
    }, 300),
    [toast]
  );

  // Atualizar busca de entidades quando o tipo ou termo mudar
  const handleEntitySearch = useCallback((termo: string) => {
    if (entityType) {
      debouncedBuscarEntidades(entityType, termo);
    }
  }, [entityType, debouncedBuscarEntidades]);

  // Atualizar busca de solicitações quando o termo mudar
  const handleSolicitationSearch = useCallback((termo: string) => {
    debouncedBuscarSolicitacoes(termo);
  }, [debouncedBuscarSolicitacoes]);

  // Handle solicitation selection
  const handleSolicitationChange = async (id: string) => {
    setSolicitationId(id);
    const solicitation = solicitations.find(s => s.id.toString() === id);
  };

  // Handle entity type change
  const handleEntityTypeChange = async (type: string) => {
    setEntityType(type);
    setEntityId("");
    setEntities([]);
    
    // Trigger initial search with empty term
    handleEntitySearch("");
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entityType || !entityId || !requestedValue || !justification) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/extemporaneous-negotiations', {
        negotiable_type: entityType,
        negotiable_id: entityId,
        solicitation_id: solicitationId || null,
        requested_value: parseFloat(requestedValue.replace(',', '.')),
        justification,
        urgency_level: urgencyLevel,
        is_requiring_addendum: isRequiringAddendum,
        addendum_included: addendumIncluded
      });

      if (response.status === 201) {
        toast({
          title: "Sucesso",
          description: "Negociação extemporânea criada com sucesso",
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao criar negociação:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar negociação extemporânea",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                  onChange={(e) => handleSolicitationSearch(e.target.value)}
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
                      {solicitation.patient.name}
                      {solicitation.tuss.code && ` - ${solicitation.tuss.description}`}
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
                <SelectItem value="App\Models\Professional">Profissional</SelectItem>
                <SelectItem value="App\Models\Clinic">Estabelecimento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {entityType && (
            <div className="space-y-2">
              <Label htmlFor="entity">
                {entityType === 'App\\Models\\Clinic' ? 'Estabelecimento' : 'Profissional'} *
              </Label>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Buscar ${entityType === 'App\\Models\\Clinic' ? 'clínica' : 'profissional'}...`}
                    onChange={(e) => handleEntitySearch(e.target.value)}
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
                        {entity.type === 'professional' && entity.council_number && ` - ${entity.council_number}`}
                        {entity.type === 'professional' && entity.specialty && ` (${entity.specialty})`}
                        {entity.type === 'clinic' && entity.cnpj && ` - ${entity.cnpj}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="requested-value">Valor Solicitado (R$) *</Label>
            <Input
              id="requested-value"
              type="number"
              step="0.01"
              min="0"
              value={requestedValue}
              onChange={(e) => setRequestedValue(e.target.value)}
              placeholder="0,00"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="urgency-level">Nível de Urgência *</Label>
            <Select
              value={urgencyLevel}
              onValueChange={setUrgencyLevel}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível de urgência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="requiring-addendum"
                checked={isRequiringAddendum}
                onCheckedChange={setIsRequiringAddendum}
                disabled={isLoading}
              />
              <Label htmlFor="requiring-addendum">Requer Aditivo</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="addendum-included"
                checked={addendumIncluded}
                onCheckedChange={setAddendumIncluded}
                disabled={isLoading}
              />
              <Label htmlFor="addendum-included">Aditivo Incluído</Label>
            </div>
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

          <Button 
            type="submit" 
            disabled={isLoading || !entityType || !entityId || !requestedValue || justification.length < 10}
          >
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