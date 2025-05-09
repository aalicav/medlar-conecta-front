import React from "react";
import { Circle, CheckCircle2, XCircle, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/app/utils/format";

type ApprovalStep = {
  step: string;
  status: 'pending' | 'completed' | 'rejected';
  user_id: number | null;
  user_name?: string;
  completed_at: string | null;
  notes?: string;
};

type ApprovalFlowProps = {
  approvals: ApprovalStep[];
  className?: string;
};

export function ApprovalFlow({ approvals, className }: ApprovalFlowProps) {
  // Step labels in Portuguese
  const stepLabels: Record<string, string> = {
    submission: "Submissão",
    legal_review: "Análise Jurídica",
    commercial_review: "Análise Comercial",
    director_approval: "Aprovação da Direção"
  };

  // Order steps in the correct sequence
  const orderedSteps = ['submission', 'legal_review', 'commercial_review', 'director_approval'];
  const sortedApprovals = [...approvals].sort((a, b) => {
    return orderedSteps.indexOf(a.step) - orderedSteps.indexOf(b.step);
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 justify-between mb-6">
        {sortedApprovals.map((approval, index) => {
          const isLast = index === sortedApprovals.length - 1;
          
          return (
            <React.Fragment key={approval.step}>
              <div className="flex flex-col items-center">
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    approval.status === 'completed' ? "bg-green-100 text-green-600" :
                    approval.status === 'rejected' ? "bg-red-100 text-red-600" :
                    "bg-gray-100 text-gray-400"
                  )}
                >
                  {approval.status === 'completed' ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : approval.status === 'rejected' ? (
                    <XCircle className="h-6 w-6" />
                  ) : (
                    <Clock className="h-6 w-6" />
                  )}
                </div>
                <span className="text-sm font-medium mt-2">{stepLabels[approval.step] || approval.step}</span>
                {approval.user_name && (
                  <span className="text-xs text-muted-foreground mt-1">{approval.user_name}</span>
                )}
                {approval.completed_at && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(approval.completed_at, "dd/MM/yyyy HH:mm")}
                  </span>
                )}
              </div>
              
              {!isLast && (
                <div className="hidden md:flex items-center justify-center">
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Current Status Section */}
      {approvals.length > 0 && (
        <div className="p-4 rounded-md bg-muted">
          <h3 className="text-sm font-semibold mb-2">Status Atual</h3>
          <div>
            {(() => {
              const currentStep = approvals.find(a => a.status === 'pending');
              
              if (currentStep) {
                return (
                  <div className="text-sm">
                    <span className="font-medium">Aguardando: </span>
                    <span>{stepLabels[currentStep.step] || currentStep.step}</span>
                  </div>
                );
              }
              
              const lastCompletedStep = [...approvals]
                .filter(a => a.status === 'completed')
                .sort((a, b) => orderedSteps.indexOf(b.step) - orderedSteps.indexOf(a.step))[0];
                
              const lastRejectedStep = [...approvals]
                .filter(a => a.status === 'rejected')
                .sort((a, b) => orderedSteps.indexOf(b.step) - orderedSteps.indexOf(a.step))[0];
              
              if (lastRejectedStep) {
                return (
                  <div className="text-sm text-red-600">
                    <span className="font-medium">Rejeitado em: </span>
                    <span>{stepLabels[lastRejectedStep.step] || lastRejectedStep.step}</span>
                    {lastRejectedStep.notes && (
                      <div className="mt-1 text-xs">
                        <span className="font-medium">Motivo: </span>
                        <span>{lastRejectedStep.notes}</span>
                      </div>
                    )}
                  </div>
                );
              }
              
              if (lastCompletedStep && lastCompletedStep.step === 'director_approval') {
                return (
                  <div className="text-sm text-green-600">
                    <span className="font-medium">Processo concluído! </span>
                    <span>Contrato aprovado pela Direção</span>
                  </div>
                );
              }
              
              return (
                <div className="text-sm text-yellow-600">
                  <span>Status não identificado</span>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
} 