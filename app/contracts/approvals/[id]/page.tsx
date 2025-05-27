"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getContractApprovalDetails, getContractApprovalHistory, submitLegalReview, submitCommercialReview, submitDirectorApproval } from "@/services/contract-approvals";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/app/hooks/auth";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ApprovalFlow } from "@/components/contracts/ApprovalFlow";
import { formatDate } from "@/app/utils/format";
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, XCircle, FileText, Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ContractApprovalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [contract, setContract] = useState<any>(null);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [suggestedChanges, setSuggestedChanges] = useState("");
  const [selectedAction, setSelectedAction] = useState<"approve" | "reject" | null>(null);
  
  const contractId = params.id as string;
  
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch contract details
      const contractResponse = await getContractApprovalDetails(parseInt(contractId));
      setContract(contractResponse?.data?.data || null);
      
      // Fetch approval history
      const historyResponse = await getContractApprovalHistory(parseInt(contractId));
      setApprovals(historyResponse?.data?.data || []);
    } catch (error) {
      console.error("Error fetching contract details:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do contrato.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [contractId]);
  
  // Determine if user can take action based on contract status and user role
  const canTakeAction = () => {
    if (!contract || !user) return false;
    
    if (user.role === 'legal' && contract.status === 'pending_approval') {
      return true;
    }
    
    if (user.role === 'commercial_manager' && contract.status === 'legal_review') {
      return true;
    }
    
    if (user.role === 'director' && contract.status === 'commercial_review') {
      return true;
    }
    
    // Admin can take any action
    if (user.role === 'admin' || user.role === 'super_admin') {
      return true;
    }
    
    return false;
  };
  
  // Get the appropriate action label based on user role
  const getActionLabel = () => {
    if (!user) return "";
    
    if (user.role === 'legal') {
      return "Análise Jurídica";
    }
    
    if (user.role === 'commercial_manager') {
      return "Análise Comercial";
    }
    
    if (user.role === 'director') {
      return "Aprovação Final";
    }
    
    return "Ação";
  };
  
  const handleSubmitAction = async () => {
    if (!selectedAction || !contract) return;
    
    if (notes.trim().length < 5) {
      toast({
        title: "Erro",
        description: "Por favor, adicione observações (mínimo 5 caracteres).",
        variant: "destructive",
      });
      return;
    }
    
    setActionLoading(true);
    
    try {
      // Different API calls based on user role and status
      if (user?.role === 'legal' || contract.status === 'pending_approval') {
        await submitLegalReview(contract.id, {
          action: selectedAction,
          notes: notes.trim(),
          suggested_changes: suggestedChanges.trim() || undefined
        });
      } else if (user?.role === 'commercial_manager' || contract.status === 'legal_review') {
        await submitCommercialReview(contract.id, {
          action: selectedAction,
          notes: notes.trim()
        });
      } else if (user?.role === 'director' || contract.status === 'commercial_review') {
        await submitDirectorApproval(contract.id, {
          action: selectedAction,
          notes: notes.trim()
        });
      }
      
      toast({
        title: selectedAction === 'approve' ? "Aprovado com sucesso" : "Rejeitado com sucesso",
        description: selectedAction === 'approve' 
          ? "O contrato foi aprovado e avançou para a próxima etapa do fluxo." 
          : "O contrato foi rejeitado e retornou para revisão.",
      });
      
      // Refetch data to update UI
      fetchData();
      
      // Reset form
      setSelectedAction(null);
      setNotes("");
      setSuggestedChanges("");
      
    } catch (error) {
      console.error("Error submitting action:", error);
      toast({
        title: "Erro",
        description: "Não foi possível processar sua ação. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  const getStatusLabel = (status: string) => {
    const statusLabels: Record<string, string> = {
      'pending_approval': 'Aguardando Análise Jurídica',
      'legal_review': 'Aprovado pelo Jurídico',
      'commercial_review': 'Aguardando Aprovação Final',
      'approved': 'Aprovado',
      'draft': 'Rascunho'
    };
    
    return statusLabels[status] || status;
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando detalhes do contrato...</span>
        </div>
      </div>
    );
  }
  
  if (!contract) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Contrato não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>O contrato solicitado não foi encontrado ou você não tem permissão para visualizá-lo.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/contracts/approvals")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para a lista
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Contrato #{contract.contract_number}</CardTitle>
              <CardDescription>
                Detalhes e fluxo de aprovação do contrato
              </CardDescription>
            </div>
            <Badge>
              {getStatusLabel(contract.status)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Approval Flow Timeline */}
          {approvals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Fluxo de Aprovação</h3>
              <ApprovalFlow approvals={approvals} />
            </div>
          )}
          
          <Separator />
          
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="details">Detalhes do Contrato</TabsTrigger>
              <TabsTrigger value="content">Conteúdo</TabsTrigger>
              {approvals.length > 0 && (
                <TabsTrigger value="history">Histórico de Aprovações</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Informações do Contrato</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Número:</span>
                      <span>{contract.contract_number}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">Tipo:</span>
                      <span className="capitalize">
                        {contract.type === 'health_plan' 
                          ? 'Operadora' 
                          : contract.type === 'clinic' 
                            ? 'Clínica' 
                            : contract.type === 'professional' 
                              ? 'Profissional' 
                              : contract.type}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">Entidade:</span>
                      <span>{contract.contractable?.name || "N/A"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">Data de Início:</span>
                      <span>{formatDate(contract.start_date, "dd/MM/yyyy")}</span>
                    </div>
                    {contract.end_date && (
                      <>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="font-medium">Data de Término:</span>
                          <span>{formatDate(contract.end_date, "dd/MM/yyyy")}</span>
                        </div>
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">Criado por:</span>
                      <span>{contract.creator?.name || "N/A"}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">Data de Criação:</span>
                      <span>{formatDate(contract.created_at, "dd/MM/yyyy")}</span>
                    </div>
                  </div>
                </div>
                
                {/* If user can take action, show the approval/rejection form */}
                {canTakeAction() && (
                  <div className="space-y-4 bg-muted p-4 rounded-md">
                    <h3 className="text-lg font-medium">{getActionLabel()}</h3>
                    
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <Button
                          variant={selectedAction === "approve" ? "default" : "outline"}
                          className="flex-1"
                          onClick={() => setSelectedAction("approve")}
                          disabled={actionLoading}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          variant={selectedAction === "reject" ? "destructive" : "outline"}
                          className="flex-1"
                          onClick={() => setSelectedAction("reject")}
                          disabled={actionLoading}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                      
                      {selectedAction && (
                        <>
                          <Label htmlFor="approval-notes">Observações</Label>
                          <Textarea
                            id="approval-notes"
                            placeholder="Adicione suas observações aqui..."
                            className="min-h-[80px]"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            disabled={actionLoading}
                          />
                          
                          {selectedAction === "reject" && user?.role === 'legal' && (
                            <>
                              <Label htmlFor="suggested-changes">Sugestões de Alterações</Label>
                              <Textarea
                                id="suggested-changes"
                                placeholder="Sugira alterações específicas no contrato..."
                                className="min-h-[80px]"
                                value={suggestedChanges}
                                onChange={(e) => setSuggestedChanges(e.target.value)}
                                disabled={actionLoading}
                              />
                            </>
                          )}
                          
                          <Button
                            onClick={handleSubmitAction}
                            disabled={!selectedAction || notes.trim().length < 5 || actionLoading}
                            className="w-full mt-2"
                          >
                            {actionLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processando...
                              </>
                            ) : (
                              <>
                                {selectedAction === "approve" ? "Confirmar Aprovação" : "Confirmar Rejeição"}
                              </>
                            )}
                          </Button>
                          
                          {selectedAction === "reject" && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertTitle>Atenção</AlertTitle>
                              <AlertDescription>
                                A rejeição fará com que o contrato retorne à etapa anterior do fluxo.
                              </AlertDescription>
                            </Alert>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="content">
              <div className="space-y-4">
                <div className="p-4 border rounded-md overflow-auto max-h-[600px]">
                  <div className="flex justify-center items-center p-8 text-center text-muted-foreground">
                    <div className="space-y-2">
                      <FileText className="h-12 w-12 mx-auto" />
                      <h3 className="text-lg font-medium">Visualização do Contrato</h3>
                      <p>Esta é uma visualização simplificada. Para ver o documento completo, faça o download.</p>
                      <Button variant="outline" className="mt-2">
                        Baixar Contrato
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {approvals.length > 0 && (
              <TabsContent value="history">
                <div className="space-y-4">
                  {approvals.map((approval) => (
                    <Card key={approval.id}>
                      <CardHeader className="py-3">
                        <div className="flex justify-between items-center">
                          <div className="font-medium">
                            {approval.step === 'submission' ? 'Submissão' :
                             approval.step === 'legal_review' ? 'Análise Jurídica' :
                             approval.step === 'commercial_review' ? 'Análise Comercial' :
                             approval.step === 'director_approval' ? 'Aprovação da Direção' :
                             approval.step}
                          </div>
                          <Badge
                            variant={approval.status === 'completed' ? 'success' : 
                                   approval.status === 'rejected' ? 'destructive' : 'outline'}
                          >
                            {approval.status === 'completed' ? 'Concluído' :
                             approval.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                          </Badge>
                        </div>
                      </CardHeader>
                      {(approval.notes || approval.user || approval.completed_at) && (
                        <CardContent className="py-2">
                          {approval.user && (
                            <div className="text-sm mb-2">
                              <span className="font-medium">Responsável: </span>
                              {approval.user.name}
                            </div>
                          )}
                          {approval.completed_at && (
                            <div className="text-sm mb-2">
                              <span className="font-medium">Data: </span>
                              {formatDate(approval.completed_at, "dd/MM/yyyy HH:mm")}
                            </div>
                          )}
                          {approval.notes && (
                            <div className="mt-2">
                              <span className="font-medium text-sm">Observações: </span>
                              <p className="text-sm mt-1 p-2 bg-muted rounded-md">{approval.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
        
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={() => router.push("/contracts/approvals")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a lista
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 