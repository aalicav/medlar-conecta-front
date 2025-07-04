"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axios from "@/lib/axios";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  DollarSign, 
  FileText, 
  Calendar, 
  User, 
  Check, 
  X,
  TrendingUp,
  TrendingDown,
  Percent
} from "lucide-react";

// Define interface for verification object
interface Verification {
  id: number;
  entity_type: string;
  entity_id: number;
  value_type: string;
  original_value: number;
  verified_value?: number;
  status: 'pending' | 'verified' | 'rejected' | 'auto_approved';
  notes?: string;
  verification_reason?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  auto_approve_threshold?: number;
  requester?: {
    id: number;
    name: string;
  };
  requester_id?: number;
  verifier?: {
    id: number;
    name: string;
  };
  created_at: string;
  verified_at?: string;
  
  // Billing integration
  billing_batch_id?: number;
  billing_item_id?: number;
  appointment_id?: number;
  billingBatch?: {
    id: number;
    reference_period_start: string;
    reference_period_end: string;
    total_amount: number;
    status: string;
  };
  billingItem?: {
    id: number;
    description: string;
    unit_price: number;
    total_amount: number;
    tuss_code?: string;
    tuss_description?: string;
  };
  appointment?: {
    id: number;
    scheduled_date: string;
    patient_name?: string;
    professional_name?: string;
  };
}

export default function ValueVerificationDetail() {
  const params = useParams();
  const router = useRouter();
  const { hasRole, user } = useAuth();
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifyValue, setVerifyValue] = useState("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  
  const id = params?.id as string;
  const isDirector = hasRole(["director", "super_admin"]);
  const canVerify = hasRole(["director", "super_admin", "financial"]);
  
  // Fetch verification details
  useEffect(() => {
    const fetchVerification = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/value-verifications/${id}`);
        
        if (response.data.data) {
          setVerification(response.data.data);
        } else {
          setError('Failed to load verification details');
        }
      } catch (error) {
        console.error('Error fetching verification:', error);
        setError('Failed to load verification details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchVerification();
    }
  }, [id]);
  
  // Check if current user can verify
  const canPerformAction = canVerify && 
                          verification?.status === 'pending' && 
                          verification?.requester?.id !== user?.id;
  
  // Format value type for display
  const getValueTypeDisplay = (valueType: string): string => {
    switch (valueType) {
      case 'appointment_price':
        return 'Preço do Agendamento';
      case 'procedure_price':
        return 'Preço do Procedimento';
      case 'specialty_price':
        return 'Preço da Especialidade';
      case 'contract_price':
        return 'Preço do Contrato';
      case 'billing_amount':
        return 'Valor de Cobrança';
      default:
        return valueType;
    }
  };

  const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'low':
        return 'secondary';
      case 'medium':
        return 'default';
      case 'high':
        return 'destructive';
      case 'critical':
        return 'destructive';
      default:
        return 'default';
    }
  };
  
  // Status display with badge
  const renderStatus = (status: string) => {
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";
    let text = 'Desconhecido';
    let icon = null;
    
    switch (status) {
      case 'pending':
        variant = 'secondary';
        text = 'Pendente';
        icon = <Clock className="h-4 w-4" />;
        break;
      case 'verified':
        variant = 'default';
        text = 'Verificado';
        icon = <CheckCircle className="h-4 w-4" />;
        break;
      case 'rejected':
        variant = 'destructive';
        text = 'Rejeitado';
        icon = <XCircle className="h-4 w-4" />;
        break;
      case 'auto_approved':
        variant = 'outline';
        text = 'Auto-aprovado';
        icon = <Check className="h-4 w-4" />;
        break;
    }
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        {icon}
        {text}
      </Badge>
    );
  };

  const getDifferencePercentage = (): number => {
    if (!verification || !verification.verified_value) return 0;
    const difference = Math.abs(verification.original_value - verification.verified_value);
    return (difference / verification.original_value) * 100;
  };
  
  // Handle verification submission
  const handleVerify = async () => {
    if (!verifyValue) return;
    
    try {
      setSubmitting(true);
      
      const response = await axios.post(`/billing/value-verifications/${id}/verify`, {
        verified_value: parseFloat(verifyValue),
        notes: verifyNotes
      });
      
      if (response.data.message) {
        // Update the verification in state
        setVerification(response.data.data);
        setVerifyModalOpen(false);
        
        // Reset form
        setVerifyValue("");
        setVerifyNotes("");
      } else {
        console.error('Error verifying value');
      }
    } catch (error: any) {
      console.error('Error verifying value:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle rejection submission
  const handleReject = async () => {
    if (!rejectNotes) return;
    
    try {
      setSubmitting(true);
      
      const response = await axios.post(`/billing/value-verifications/${id}/reject`, {
        notes: rejectNotes
      });
      
      if (response.data.message) {
        // Update the verification in state
        setVerification(response.data.data);
        setRejectModalOpen(false);
        
        // Reset form
        setRejectNotes("");
      } else {
        console.error('Error rejecting value');
      }
    } catch (error: any) {
      console.error('Error rejecting value:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Verificação não encontrada'}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Verificação #{verification.id}</h1>
            <p className="text-muted-foreground">
              {getValueTypeDisplay(verification.value_type)}
            </p>
          </div>
          
          <div className="flex gap-2">
            {canPerformAction && (
              <>
                <Button 
                  onClick={() => {
                    setVerifyValue(verification.original_value.toString());
                    setVerifyNotes("");
                    setVerifyModalOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Verificar
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setRejectNotes("");
                    setRejectModalOpen(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Rejeitar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Original</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(verification.original_value)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Verificado</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${verification.verified_value ? 'text-green-600' : 'text-muted-foreground'}`}>
              {verification.verified_value ? formatCurrency(verification.verified_value) : 'Não verificado'}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diferença</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {verification.verified_value ? 
                formatCurrency(Math.abs(verification.original_value - verification.verified_value)) : 
                'N/A'
              }
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variação</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getDifferencePercentage() > 10 ? 'text-red-600' : 'text-green-600'}`}>
              {getDifferencePercentage().toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Verificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div>{renderStatus(verification.status)}</div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Valor</Label>
                  <Badge variant="outline">{getValueTypeDisplay(verification.value_type)}</Badge>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Prioridade</Label>
                  <Badge variant={getPriorityVariant(verification.priority)}>
                    {verification.priority?.toUpperCase() || 'NÃO DEFINIDA'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Data de Vencimento</Label>
                  <div className="text-sm text-muted-foreground">
                    {verification.due_date ? 
                      formatDateTime(verification.due_date) : 'Não definida'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Limite Auto-aprovação</Label>
                  <div className="text-sm text-muted-foreground">
                    {verification.auto_approve_threshold ? 
                      `${verification.auto_approve_threshold}%` : 'Não definido'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Solicitante</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {verification.requester ? verification.requester.name : '-'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Verificador</Label>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {verification.verifier ? verification.verifier.name : '-'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Data de Criação</Label>
                  <div className="text-sm text-muted-foreground">
                    {formatDateTime(verification.created_at)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Data de Verificação</Label>
                  <div className="text-sm text-muted-foreground">
                    {verification.verified_at ? 
                      formatDateTime(verification.verified_at) : '-'}
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Motivo da Verificação</Label>
                <div className="text-sm text-muted-foreground">
                  {verification.verification_reason || '-'}
                </div>
              </div>
              
              {verification.notes && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Observações</Label>
                    <div className="text-sm text-muted-foreground">
                      {verification.notes}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Billing Information */}
          {(verification.billingBatch || verification.billingItem || verification.appointment) && (
            <Card>
              <CardHeader>
                <CardTitle>Informações de Cobrança</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {verification.billingBatch && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Lote de Cobrança</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Link href={`/billing/batches/${verification.billingBatch.id}`}>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <FileText className="h-3 w-3" />
                            Lote #{verification.billingBatch.id}
                          </Badge>
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          Período: {verification.billingBatch.reference_period_start} a {verification.billingBatch.reference_period_end}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total: {formatCurrency(verification.billingBatch.total_amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Status: {verification.billingBatch.status}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {verification.billingItem && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Item de Cobrança</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Link href={`/billing/items/${verification.billingItem.id}`}>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <DollarSign className="h-3 w-3" />
                            Item #{verification.billingItem.id}
                          </Badge>
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          {verification.billingItem.description}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Preço Unitário: {formatCurrency(verification.billingItem.unit_price)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total: {formatCurrency(verification.billingItem.total_amount)}
                        </div>
                        {verification.billingItem.tuss_code && (
                          <div className="text-sm text-muted-foreground">
                            Código TUSS: {verification.billingItem.tuss_code}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  
                  {verification.appointment && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Agendamento</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Link href={`/appointments/${verification.appointment.id}`}>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Calendar className="h-3 w-3" />
                            #{verification.appointment.id}
                          </Badge>
                        </Link>
                        <div className="text-sm text-muted-foreground">
                          Data: {formatDateTime(verification.appointment.scheduled_date)}
                        </div>
                        {verification.appointment.patient_name && (
                          <div className="text-sm text-muted-foreground">
                            Paciente: {verification.appointment.patient_name}
                          </div>
                        )}
                        {verification.appointment.professional_name && (
                          <div className="text-sm text-muted-foreground">
                            Profissional: {verification.appointment.professional_name}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Histórico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium">Criação da Verificação</div>
                    <div className="text-sm text-muted-foreground">
                      {formatDateTime(verification.created_at)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Por: {verification.requester?.name || 'Sistema'}
                    </div>
                  </div>
                </div>
                
                {verification.verified_at && (
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      verification.status === 'verified' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {verification.status === 'verified' ? 
                        <CheckCircle className="h-4 w-4" /> : 
                        <XCircle className="h-4 w-4" />
                      }
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {verification.status === 'verified' ? 'Verificação Aprovada' : 'Verificação Rejeitada'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(verification.verified_at)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Por: {verification.verifier?.name || 'Sistema'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Verify Modal */}
      <Dialog open={verifyModalOpen} onOpenChange={setVerifyModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificar Valor</DialogTitle>
            <DialogDescription>
              Confirme o valor verificado e adicione observações se necessário.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verified_value">Valor Verificado</Label>
              <Input
                id="verified_value"
                type="number"
                step="0.01"
                min="0"
                value={verifyValue}
                onChange={(e) => setVerifyValue(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify_notes">Observações</Label>
              <Textarea
                id="verify_notes"
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder="Observações sobre a verificação..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleVerify} disabled={submitting || !verifyValue}>
              Verificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Valor</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição do valor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject_notes">Motivo da Rejeição</Label>
              <Textarea
                id="reject_notes"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Motivo da rejeição..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={submitting || !rejectNotes}>
              Rejeitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 