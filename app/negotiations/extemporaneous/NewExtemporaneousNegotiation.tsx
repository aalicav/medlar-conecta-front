"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { createExtemporaneousNegotiation } from "@/services/extemporaneous-negotiations"
import api from "@/services/api-client"

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

export function NewExtemporaneousNegotiation({ onSuccess }: NewExtemporaneousNegotiationProps) {
  const [entityType, setEntityType] = useState<string>("")
  const [entityId, setEntityId] = useState<string>("")
  const [tussProcedureId, setTussProcedureId] = useState<string>("")
  const [negotiatedPrice, setNegotiatedPrice] = useState<string>("")
  const [justification, setJustification] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingEntities, setIsLoadingEntities] = useState(false)
  const [isLoadingProcedures, setIsLoadingProcedures] = useState(false)
  const [entities, setEntities] = useState<Entity[]>([])
  const [procedures, setProcedures] = useState<TussProcedure[]>([])

  // Load entities when type changes
  const handleEntityTypeChange = async (type: string) => {
    setEntityType(type)
    setEntityId("")
    setEntities([])
    setTussProcedureId("")
    setProcedures([])

    setIsLoadingEntities(true)
    try {
      const endpoint = type === 'App\\Models\\Clinic' ? '/clinics' : '/health-plans'
      const response = await api.get(endpoint, {
        params: {
          status: 'active',
          per_page: 100
        }
      })

      if (response.data.status === 'success') {
        setEntities(response.data.data)
      } else {
        throw new Error('Failed to load entities')
      }
    } catch (error) {
      console.error('Error loading entities:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as entidades",
        variant: "destructive"
      })
    } finally {
      setIsLoadingEntities(false)
    }
  }

  // Load procedures when entity changes
  const handleEntityChange = async (id: string) => {
    setEntityId(id)
    setTussProcedureId("")
    setProcedures([])

    setIsLoadingProcedures(true)
    try {
      const response = await api.get('/tuss-procedures', {
        params: {
          per_page: 100,
          is_active: true
        }
      })

      if (response.data.status === 'success') {
        setProcedures(response.data.data)
      } else {
        throw new Error('Failed to load procedures')
      }
    } catch (error) {
      console.error('Error loading procedures:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os procedimentos",
        variant: "destructive"
      })
    } finally {
      setIsLoadingProcedures(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!entityType || !entityId || !tussProcedureId || !negotiatedPrice || !justification) {
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
        justification
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
        setEntities([])
        setProcedures([])
        
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
    return type === 'App\\Models\\Clinic' ? 'Clínica' : 'Plano de Saúde'
  }

  const getEntitySelectLabel = (type: string) => {
    return type === 'App\\Models\\Clinic' ? 'a clínica' : 'o plano'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Negociação Extemporânea</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                <SelectItem value="App\\Models\\Clinic">Clínica</SelectItem>
                <SelectItem value="App\\Models\\HealthPlan">Plano de Saúde</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {entityType && (
            <div className="space-y-2">
              <Label htmlFor="entity">
                {getEntityTypeLabel(entityType)} *
              </Label>
              <Select
                value={entityId}
                onValueChange={handleEntityChange}
                disabled={isLoading || isLoadingEntities}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Selecione ${getEntitySelectLabel(entityType)}`} />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingEntities ? (
                    <SelectItem value="" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando...
                      </div>
                    </SelectItem>
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
                    <SelectItem value="" disabled>
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Carregando...
                      </div>
                    </SelectItem>
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