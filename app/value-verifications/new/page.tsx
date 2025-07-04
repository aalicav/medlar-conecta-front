"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "@/lib/axios";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Info, Loader2 } from "lucide-react";

// Define the form values interface
interface VerificationFormValues {
  entity_type: string;
  entity_id: number;
  original_value: number;
  notes: string;
}

// Define entity interfaces
interface Entity {
  id: number;
  [key: string]: any;
}

interface Contract extends Entity {
  contract_number: string;
  entity?: {
    name: string;
  };
}

interface ExtemporaneousNegotiation extends Entity {
  requested_value: number;
}

interface Negotiation extends Entity {
  title: string;
}

export default function NewValueVerificationPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [entityType, setEntityType] = useState<string>("");
  const [entityId, setEntityId] = useState<string>("");
  const [originalValue, setOriginalValue] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  
  // When entity type changes, fetch entities of that type
  useEffect(() => {
    if (!entityType) return;
    
    const fetchEntities = async () => {
      try {
        setLoadingEntities(true);
        let endpoint = '';
        
        switch (entityType) {
          case 'contract':
            endpoint = '/contracts?status=active';
            break;
          case 'extemporaneous_negotiation':
            endpoint = '/extemporaneous-negotiations?status=pending';
            break;
          case 'negotiation':
            endpoint = '/negotiations?status=draft,submitted';
            break;
          default:
            return;
        }
        
        const response = await axios.get(endpoint);
        
        if (response.data.status === 'success' || (response.data.data && Array.isArray(response.data.data))) {
          const data = response.data.data?.data || response.data.data || [];
          setEntities(data);
        } else {
          console.error('Error loading entities:', response.data.message);
        }
      } catch (error) {
        console.error(`Error fetching ${entityType}:`, error);
      } finally {
        setLoadingEntities(false);
      }
    };
    
    fetchEntities();
  }, [entityType]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!entityType || !entityId || !originalValue || !notes) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await axios.post('/value-verifications', {
        entity_type: entityType,
        entity_id: parseInt(entityId),
        original_value: parseFloat(originalValue),
        notes: notes
      });
      
      if (response.data.status === 'success') {
        // Redirect to verification details page
        router.push(`/value-verifications/${response.data.data.id}`);
      } else {
        console.error('Error creating verification:', response.data.message);
      }
    } catch (error: any) {
      console.error('Error creating verification:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Generate options for entity select
  const renderEntityOptions = () => {
    if (!entityType) return [];
    
    return entities.map(entity => {
      let label = '';
      
      switch (entityType) {
        case 'contract':
          const contract = entity as Contract;
          label = `Contrato #${contract.contract_number} - ${contract.entity?.name || 'Sem nome'}`;
          break;
        case 'extemporaneous_negotiation':
          const extemp = entity as ExtemporaneousNegotiation;
          label = `Neg. Extemporânea #${entity.id} - ${formatCurrency(extemp.requested_value)}`;
          break;
        case 'negotiation':
          const negotiation = entity as Negotiation;
          label = `Negociação #${entity.id} - ${negotiation.title}`;
          break;
      }
      
      return (
        <SelectItem key={entity.id} value={entity.id.toString()}>
          {label}
        </SelectItem>
      );
    });
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center space-x-4">
        <Link href="/value-verifications">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Verificação de Valor</h1>
          <p className="text-muted-foreground">
            Crie uma nova verificação de valor para validação
          </p>
        </div>
      </div>
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Esta verificação será enviada para validação por um diretor, de acordo com o princípio de dupla checagem de valores financeiros.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Dados da Verificação</CardTitle>
          <CardDescription>
            Preencha os dados necessários para criar a verificação de valor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="entity_type">Tipo de Entidade</Label>
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de entidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contrato</SelectItem>
                  <SelectItem value="extemporaneous_negotiation">Negociação Extemporânea</SelectItem>
                  <SelectItem value="negotiation">Negociação de Especialidades</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="entity_id">Entidade</Label>
              <Select 
                value={entityId} 
                onValueChange={setEntityId}
                disabled={!entityType || loadingEntities}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a entidade" />
                </SelectTrigger>
                <SelectContent>
                  {loadingEntities ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Carregando...</span>
                    </div>
                  ) : (
                    renderEntityOptions()
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="original_value">Valor a Verificar</Label>
              <Input
                id="original_value"
                type="number"
                step="0.01"
                min="0"
                value={originalValue}
                onChange={(e) => setOriginalValue(e.target.value)}
                placeholder="0.00"
                className="font-mono"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Descreva o contexto deste valor, justificativa e quaisquer outras informações relevantes para a verificação"
                rows={4}
              />
            </div>
            
            <Separator />
            
            <div className="flex justify-end space-x-4">
              <Link href="/value-verifications">
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={submitting || !entityType || !entityId || !originalValue || !notes}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar para Verificação
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 