'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Stepper, Step } from '@/components/ui/stepper';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/app/hooks/use-auth';

interface Approval {
  id: string;
  step: string;
  status: 'pending' | 'completed' | 'rejected';
  notes: string;
  completed_at: string | null;
  user: {
    id: string;
    name: string;
  } | null;
}

interface Contractable {
  id: string;
  name: string;
  [key: string]: any;
}

interface Contract {
  id: string;
  contract_number: string;
  contractable_type: string;
  contractable_id: string;
  contractable: Contractable | null;
  type: string;
  status: string;
  approvals: Approval[];
  [key: string]: any;
}

interface ContractApprovalWorkflowProps {
  contract: Contract;
  onContractUpdated?: (contract: Contract) => void;
}

const workflowSteps = [
  {
    step: 'submission',
    label: 'Submissão',
    description: 'O contrato é elaborado pela equipe comercial e submetido para aprovação.',
    role: 'commercial'
  },
  {
    step: 'legal_review',
    label: 'Análise Jurídica',
    description: 'O jurídico analisa e valida os aspectos legais do contrato.',
    role: 'legal'
  },
  {
    step: 'commercial_review',
    label: 'Liberação Comercial',
    description: 'A equipe comercial revisa o contrato após análise jurídica.',
    role: 'commercial'
  },
  {
    step: 'director_approval',
    label: 'Aprovação da Direção',
    description: 'Dr. Ítalo ou outro diretor dá a aprovação final do contrato.',
    role: 'director'
  },
  {
    step: 'approved',
    label: 'Aprovado',
    description: 'O contrato está aprovado e pronto para assinatura.',
    role: null
  }
];

export function ContractApprovalWorkflow({ contract, onContractUpdated }: ContractApprovalWorkflowProps) {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  
  const entityName = contract.contractable?.name || 'Não disponível';
  const entityType = mapEntityType(contract.type);
  
  // Mapa de estados do contrato para o passo atual no fluxo
  const statusStepMap: Record<string, string | null> = {
    'draft': null,
    'pending_approval': 'legal_review',
    'legal_review': 'commercial_review',
    'commercial_review': 'director_approval',
    'pending_director_approval': 'director_approval',
    'approved': 'approved'
  };
  
  const currentApprovalStep = statusStepMap[contract.status] || null;
  
  // Verificar se o usuário atual pode tomar uma ação
  const canTakeAction = () => {
    if (!currentApprovalStep || !user) return false;
    
    const currentStep = workflowSteps.find(s => s.step === currentApprovalStep);
    if (!currentStep || !currentStep.role) return false;
    
    const userRoles = user.roles || [];
    return userRoles.includes(currentStep.role) || 
           userRoles.includes('admin') || 
           userRoles.includes('super_admin');
  };
  
  // Sortear aprovações por data
  const sortedApprovals = [...(contract.approvals || [])].sort((a, b) => {
    const dateA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
    const dateB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
    return dateB - dateA;
  });
  
  // Verificar se um passo está completo
  const isStepCompleted = (step: string) => {
    return contract.approvals?.some(a => a.step === step && a.status === 'completed') || false;
  };
  
  // Verificar se um passo foi rejeitado
  const isStepRejected = (step: string) => {
    return contract.approvals?.some(a => a.step === step && a.status === 'rejected') || false;
  };
  
  // Obter o status atual de um passo
  const getStepStatus = (step: string): 'completed' | 'rejected' | 'current' | 'pending' => {
    if (isStepCompleted(step)) return 'completed';
    if (isStepRejected(step)) return 'rejected';
    if (step === currentApprovalStep) return 'current';
    
    const stepIndex = workflowSteps.findIndex(s => s.step === step);
    const currentIndex = workflowSteps.findIndex(s => s.step === currentApprovalStep);
    
    return stepIndex < currentIndex ? 'completed' : 'pending';
  };
  
  // Mapear tipo de entidade para texto legível
  function mapEntityType(type: string): string {
    const typeMap: Record<string, string> = {
      'health_plan': 'Plano de Saúde',
      'clinic': 'Clínica',
      'professional': 'Profissional'
    };
    
    return typeMap[type] || 'Entidade';
  }
  
  // Obter o papel responsável pelo passo atual
  function getCurrentResponsibleRole(): string {
    if (!currentApprovalStep) return '';
    
    const step = workflowSteps.find(s => s.step === currentApprovalStep);
    if (!step || !step.role) return '';
    
    const roleMap: Record<string, string> = {
      'commercial': 'Equipe Comercial',
      'legal': 'Equipe Jurídica',
      'director': 'Direção'
    };
    
    return roleMap[step.role] || step.role;
  }
  
  // Função para aprovar o contrato
  const approveContract = async () => {
    if (!approvalNotes.trim()) {
      toast.error('Por favor, adicione uma observação antes de aprovar o contrato.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const endpoint = getApprovalEndpoint();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          notes: approvalNotes
        }),
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        toast.success('Contrato aprovado com sucesso!');
        setApprovalNotes('');
        
        if (onContractUpdated && result.data) {
          onContractUpdated(result.data);
        } else {
          router.refresh();
        }
      } else {
        toast.error(`Erro ao aprovar o contrato: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao aprovar contrato:', error);
      toast.error('Erro ao aprovar o contrato. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Função para rejeitar o contrato
  const rejectContract = async () => {
    if (!approvalNotes.trim()) {
      toast.error('Por favor, adicione uma observação antes de rejeitar o contrato.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const endpoint = getApprovalEndpoint();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          notes: approvalNotes
        }),
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        toast.success('Contrato rejeitado.');
        setApprovalNotes('');
        
        if (onContractUpdated && result.data) {
          onContractUpdated(result.data);
        } else {
          router.refresh();
        }
      } else {
        toast.error(`Erro ao rejeitar o contrato: ${result.message}`);
      }
    } catch (error) {
      console.error('Erro ao rejeitar contrato:', error);
      toast.error('Erro ao rejeitar o contrato. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Obter o endpoint correto para o estágio atual
  function getApprovalEndpoint(): string {
    const contractId = contract.id;
    
    const endpointMap: Record<string, string> = {
      'legal_review': `/api/contracts/${contractId}/legal-review`,
      'commercial_review': `/api/contracts/${contractId}/commercial-review`,
      'director_approval': `/api/contracts/${contractId}/director-approval`
    };
    
    return endpointMap[currentApprovalStep || ''] || `/api/contracts/${contractId}/approve`;
  }
  
  // Renderizar o status de uma aprovação
  function renderApprovalStatus(status: string) {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  }
  
  // Obter o nome legível de um passo
  function getStepName(step: string): string {
    const foundStep = workflowSteps.find(s => s.step === step);
    return foundStep ? foundStep.label : step;
  }
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Fluxo de Aprovação do Contrato</CardTitle>
        <div className="text-sm text-muted-foreground">
          <span>{entityType}: {entityName}</span>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Stepper de fluxo de aprovação */}
        <Stepper className="mt-4 mb-8">
          {workflowSteps.map((step, index) => (
            <Step 
              key={step.step}
              status={getStepStatus(step.step)}
              title={step.label}
              description={step.description}
              icon={
                isStepCompleted(step.step) ? <CheckCircle className="h-5 w-5" /> :
                isStepRejected(step.step) ? <XCircle className="h-5 w-5" /> :
                step.step === currentApprovalStep ? <AlertCircle className="h-5 w-5" /> :
                <Clock className="h-5 w-5" />
              }
            />
          ))}
        </Stepper>
        
        {/* Detalhes do estágio atual e ações */}
        {currentApprovalStep && (
          <div className="bg-muted p-4 rounded-md border mb-4">
            <h3 className="text-lg font-semibold">
              {workflowSteps.find(s => s.step === currentApprovalStep)?.label}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {workflowSteps.find(s => s.step === currentApprovalStep)?.description}
            </p>
            
            {canTakeAction() ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="approval-notes" className="block text-sm font-medium mb-1">
                    Observações
                  </label>
                  <Textarea
                    id="approval-notes"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    rows={4}
                    placeholder="Adicione suas observações aqui..."
                    className="w-full"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button
                    variant="destructive"
                    onClick={rejectContract}
                    disabled={isSubmitting}
                  >
                    <XCircle className="h-4 w-4 mr-2" /> Rejeitar
                  </Button>
                  <Button
                    variant="default"
                    onClick={approveContract}
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" /> Aprovar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 bg-background rounded-md text-muted-foreground italic">
                Aguardando ação de {getCurrentResponsibleRole()}
              </div>
            )}
          </div>
        )}
        
        {/* Histórico de aprovações */}
        {sortedApprovals.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4 pb-2 border-b">Histórico do Fluxo de Aprovação</h3>
            <div className="space-y-4">
              {sortedApprovals.map((approval) => (
                <div 
                  key={approval.id} 
                  className="p-4 border-l-4 border-primary bg-muted rounded-r-md"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {renderApprovalStatus(approval.status)}
                      <span className="ml-2 font-medium">{getStepName(approval.step)}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {approval.completed_at ? formatDate(approval.completed_at) : 'Pendente'}
                    </span>
                  </div>
                  
                  {approval.user && (
                    <div className="text-sm mb-2">
                      <span className="text-muted-foreground mr-1">Por:</span> {approval.user.name}
                    </div>
                  )}
                  
                  {approval.notes && (
                    <div className="bg-background rounded-md p-3 text-sm mt-2">
                      {approval.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ContractApprovalWorkflow; 