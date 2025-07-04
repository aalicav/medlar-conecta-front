"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import axios from "@/lib/axios";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock, 
  Search, 
  Filter, 
  RefreshCw, 
  DollarSign, 
  FileText, 
  Calendar,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  User,
  CalendarDays
} from "lucide-react";

// Define types for our verification objects
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

export default function ValueVerificationsPage() {
  const { hasRole, user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchText, setSearchText] = useState("");
  const [valueTypeFilter, setValueTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [filteredData, setFilteredData] = useState<Verification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    auto_approved: 0,
    overdue: 0,
    high_priority: 0
  });

  // Modal states
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [verifyValue, setVerifyValue] = useState("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");

  const isDirector = hasRole(["director", "super_admin"]);
  const canVerify = hasRole(["director", "super_admin", "financial"]);

  // Fetch all verification data
  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/billing/value-verifications');
        if (response.data.data) {
          setVerifications(response.data.data || []);
          setStatistics(response.data.meta?.statistics || {
            total: 0,
            pending: 0,
            verified: 0,
            rejected: 0,
            auto_approved: 0,
            overdue: 0,
            high_priority: 0
          });
        } else {
          console.error('Error loading verifications:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching verifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerifications();
  }, []);

  // Filter data based on active tab, search text, value type, and priority
  useEffect(() => {
    setIsLoading(true);
    
    let filtered = verifications;
    
    // Filter by status (tab)
    if (activeTab !== "all") {
      filtered = filtered.filter(item => item.status === activeTab);
    }
    
    // Filter by search text
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter(item => 
        (item.verification_reason?.toLowerCase().includes(lowerSearchText)) ||
        (item.notes?.toLowerCase().includes(lowerSearchText)) ||
        (item.requester?.name?.toLowerCase().includes(lowerSearchText)) ||
        (item.billingItem?.description?.toLowerCase().includes(lowerSearchText)) ||
        (item.appointment?.patient_name?.toLowerCase().includes(lowerSearchText))
      );
    }
    
    // Filter by value type
    if (valueTypeFilter) {
      filtered = filtered.filter(item => item.value_type === valueTypeFilter);
    }

    // Filter by priority
    if (priorityFilter) {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }
    
    setFilteredData(filtered);
    setIsLoading(false);
    
  }, [activeTab, searchText, valueTypeFilter, priorityFilter, verifications]);

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

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'verified':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'auto_approved':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'verified':
        return 'Verificado';
      case 'rejected':
        return 'Rejeitado';
      case 'auto_approved':
        return 'Auto-aprovado';
      default:
        return status;
    }
  };

  const handleVerify = (verification: Verification) => {
    setSelectedVerification(verification);
    setVerifyValue(verification.original_value.toString());
    setVerifyNotes('');
    setVerifyModalOpen(true);
  };

  const handleReject = (verification: Verification) => {
    setSelectedVerification(verification);
    setRejectNotes('');
    setRejectModalOpen(true);
  };

  const onVerifySubmit = async () => {
    if (!selectedVerification) return;

    try {
      const response = await axios.post(`/billing/value-verifications/${selectedVerification.id}/verify`, {
        verified_value: parseFloat(verifyValue),
        notes: verifyNotes
      });

      if (response.data.message) {
        setVerifyModalOpen(false);
        // Refresh data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error verifying value:', error);
    }
  };

  const onRejectSubmit = async () => {
    if (!selectedVerification) return;

    try {
      const response = await axios.post(`/billing/value-verifications/${selectedVerification.id}/reject`, {
        notes: rejectNotes
      });

      if (response.data.message) {
        setRejectModalOpen(false);
        // Refresh data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error rejecting value:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Verificação de Valores</h1>
        <p className="text-muted-foreground">
          Gerencie a verificação de valores para cobranças e agendamentos
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statistics.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statistics.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.verified + statistics.auto_approved}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.overdue}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
        <div className="flex flex-wrap gap-4 items-center">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
            placeholder="Buscar por motivo, notas, solicitante..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            
            <Select value={valueTypeFilter} onValueChange={setValueTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de valor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointment_price">Preço do Agendamento</SelectItem>
                <SelectItem value="procedure_price">Preço do Procedimento</SelectItem>
                <SelectItem value="specialty_price">Preço da Especialidade</SelectItem>
                <SelectItem value="contract_price">Preço do Contrato</SelectItem>
                <SelectItem value="billing_amount">Valor de Cobrança</SelectItem>
              </SelectContent>
          </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Crítica</SelectItem>
              </SelectContent>
          </Select>

          <Button 
              variant="outline"
            onClick={() => window.location.reload()}
              className="flex items-center gap-2"
          >
              <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
                Pendentes
              <Badge variant="secondary" className="ml-1">{statistics.pending}</Badge>
            </TabsTrigger>
            <TabsTrigger value="verified" className="flex items-center gap-2">
                Verificados
              <Badge variant="secondary" className="ml-1">{statistics.verified + statistics.auto_approved}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
                Rejeitados
              <Badge variant="secondary" className="ml-1">{statistics.rejected}</Badge>
            </TabsTrigger>
            <TabsTrigger value="auto_approved" className="flex items-center gap-2">
                Auto-aprovados
              <Badge variant="secondary" className="ml-1">{statistics.auto_approved}</Badge>
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
                Vencidos
              <Badge variant="secondary" className="ml-1">{statistics.overdue}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredData.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor Original</TableHead>
                      <TableHead>Valor Verificado</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Cobrança</TableHead>
                      <TableHead>Agendamento</TableHead>
                      <TableHead>Solicitante</TableHead>
                      <TableHead>Data Criação</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((verification) => (
                      <TableRow key={verification.id}>
                        <TableCell>
                          <Link href={`/value-verifications/${verification.id}`} className="font-medium hover:underline">
                            {verification.id}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getValueTypeDisplay(verification.value_type)}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(verification.original_value)}</TableCell>
                        <TableCell>
                          {verification.verified_value ? formatCurrency(verification.verified_value) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityVariant(verification.priority)}>
                            {verification.priority.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(verification.status)}>
                            {getStatusText(verification.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" title={verification.verification_reason}>
                          {verification.verification_reason}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {verification.billingBatch && (
                              <Link href={`/billing/batches/${verification.billingBatch.id}`}>
                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                  <FileText className="h-3 w-3" />
                                  Lote #{verification.billingBatch.id}
                                </Badge>
                              </Link>
                            )}
                            {verification.billingItem && (
                              <Link href={`/billing/items/${verification.billingItem.id}`}>
                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                  <DollarSign className="h-3 w-3" />
                                  Item #{verification.billingItem.id}
                                </Badge>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {verification.appointment ? (
                            <Link href={`/appointments/${verification.appointment.id}`}>
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <Calendar className="h-3 w-3" />
                                #{verification.appointment.id}
                              </Badge>
                            </Link>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {verification.requester ? verification.requester.name : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(verification.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link href={`/value-verifications/${verification.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {canVerify && verification.status === 'pending' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleVerify(verification)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleReject(verification)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">Nenhuma verificação encontrada</h3>
                <p className="text-muted-foreground">Não há verificações de valores que correspondam aos filtros aplicados.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

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
            <Button onClick={onVerifySubmit}>
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
            <Button variant="destructive" onClick={onRejectSubmit}>
                Rejeitar
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 