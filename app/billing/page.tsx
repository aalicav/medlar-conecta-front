"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import axios from "@/lib/axios";
import { formatCurrency } from "@/lib/format";
import { 
  exportBillingBatch, 
  exportValueVerification, 
  exportVerificationsList, 
  exportBatchesList 
} from "@/lib/export-utils";
import type { Dayjs } from 'dayjs';
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontal, Eye, Download, Send, Edit, Trash2, FileText, FileSpreadsheet, CheckCircle, XCircle, DollarSign, Clock, AlertTriangle, RefreshCw, Search, Filter } from "lucide-react";

interface BillingBatch {
  id: number;
  reference_period_start: string;
  reference_period_end: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: BillingItem[];
  payment_proof?: string;
  invoice?: string;
}

interface BillingItem {
  id: number;
  patient: {
    name: string;
    cpf: string;
  };
  provider: {
    name: string;
    type: string;
    specialty: string;
  };
  procedure: {
    code: string;
    description: string;
  };
  appointment: {
    scheduled_date: string;
    booking_date: string;
    confirmation_date: string;
    attendance_confirmation: string;
    guide_status: string;
  };
  amount: number;
  status: string;
  gloss_reason?: string;
}

interface ValueVerification {
  id: number;
  value_type: string;
  original_value: number;
  verified_value?: number;
  status: 'pending' | 'verified' | 'rejected' | 'auto_approved';
  verification_reason?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  billing_batch_id?: number;
  billing_item_id?: number;
  appointment_id?: number;
  created_at: string;
}

export default function BillingPage() {
  const { hasRole, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("batches");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [batches, setBatches] = useState<BillingBatch[]>([]);
  const [verifications, setVerifications] = useState<ValueVerification[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<BillingBatch[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<ValueVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingVerifications, setIsLoadingVerifications] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isNotificationModalVisible, setIsNotificationModalVisible] = useState(false);
  const [selectedBatchForNotification, setSelectedBatchForNotification] = useState<BillingBatch | null>(null);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationForm, setNotificationForm] = useState({
    type: 'billing_notification',
    recipients: 'all',
    message: ''
  });
  const [statistics, setStatistics] = useState({
    total_batches: 0,
    pending_batches: 0,
    total_amount: 0,
    pending_verifications: 0,
    high_priority_verifications: 0,
    overdue_verifications: 0
  });

  const isDirector = hasRole(["director", "super_admin"]);
  const canVerify = hasRole(["director", "super_admin", "financial"]);

  // Fetch billing batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/billing');
        if (response.data.data) {
          setBatches(response.data.data);
          setStatistics(prev => ({
            ...prev,
            total_batches: response.data.data.length,
            total_amount: response.data.data.reduce((sum: number, batch: BillingBatch) => sum + batch.total_amount, 0),
            pending_batches: response.data.data.filter((batch: BillingBatch) => batch.status === 'pending').length
          }));
        } else {
          // Dados mockados para teste
          const mockBatches: BillingBatch[] = [
            {
              id: 1,
              reference_period_start: '2024-01-01',
              reference_period_end: '2024-01-31',
              total_amount: 15000.00,
              status: 'pending',
              created_at: '2024-01-15T10:00:00Z',
              items: [
                {
                  id: 1,
                  patient: { name: 'João Silva', cpf: '123.456.789-00' },
                  provider: { name: 'Dr. Maria Santos', type: 'Médico', specialty: 'Cardiologia' },
                  procedure: { code: '001', description: 'Consulta Cardiológica' },
                  appointment: {
                    scheduled_date: '2024-01-10',
                    booking_date: '2024-01-05',
                    confirmation_date: '2024-01-08',
                    attendance_confirmation: 'confirmed',
                    guide_status: 'active'
                  },
                  amount: 150.00,
                  status: 'pending'
                }
              ]
            },
            {
              id: 2,
              reference_period_start: '2024-02-01',
              reference_period_end: '2024-02-29',
              total_amount: 25000.00,
              status: 'completed',
              created_at: '2024-02-15T14:30:00Z',
              items: [
                {
                  id: 2,
                  patient: { name: 'Ana Costa', cpf: '987.654.321-00' },
                  provider: { name: 'Dr. Pedro Oliveira', type: 'Médico', specialty: 'Ortopedia' },
                  procedure: { code: '002', description: 'Consulta Ortopédica' },
                  appointment: {
                    scheduled_date: '2024-02-12',
                    booking_date: '2024-02-08',
                    confirmation_date: '2024-02-10',
                    attendance_confirmation: 'confirmed',
                    guide_status: 'active'
                  },
                  amount: 200.00,
                  status: 'completed'
                }
              ]
            }
          ];
          
          setBatches(mockBatches);
          setStatistics(prev => ({
            ...prev,
            total_batches: mockBatches.length,
            total_amount: mockBatches.reduce((sum, batch) => sum + batch.total_amount, 0),
            pending_batches: mockBatches.filter(batch => batch.status === 'pending').length
          }));
          
          toast({
            title: 'Aviso',
            description: 'Usando dados de exemplo para demonstração',
          });
        }
      } catch (error) {
        console.error('Error fetching batches:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível conectar ao servidor',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatches();
  }, [toast]);

  // Fetch value verifications
  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        setIsLoadingVerifications(true);
        const response = await axios.get('/billing/value-verifications');
        if (response.data.data) {
          setVerifications(response.data.data);
          setStatistics(prev => ({
            ...prev,
            pending_verifications: response.data.meta?.statistics?.pending || 0,
            high_priority_verifications: response.data.meta?.statistics?.high_priority || 0,
            overdue_verifications: response.data.meta?.statistics?.overdue || 0
          }));
        } else {
          // Dados mockados para verificações
          const mockVerifications: ValueVerification[] = [
            {
              id: 1,
              value_type: 'unit_price',
              original_value: 150.00,
              status: 'pending',
              verification_reason: 'Valor unitário acima do padrão para especialidade',
              priority: 'high',
              billing_batch_id: 1,
              created_at: '2024-01-15T10:00:00Z'
            },
            {
              id: 2,
              value_type: 'total_amount',
              original_value: 2500.00,
              status: 'pending',
              verification_reason: 'Valor total discrepante com procedimento',
              priority: 'medium',
              billing_batch_id: 2,
              created_at: '2024-02-15T14:30:00Z'
            },
            {
              id: 3,
              value_type: 'quantity',
              original_value: 5,
              status: 'verified',
              verification_reason: 'Quantidade de sessões confirmada',
              priority: 'low',
              billing_batch_id: 1,
              created_at: '2024-01-16T09:00:00Z'
            }
          ];
          
          setVerifications(mockVerifications);
          setStatistics(prev => ({
            ...prev,
            pending_verifications: mockVerifications.filter(v => v.status === 'pending').length,
            high_priority_verifications: mockVerifications.filter(v => v.priority === 'high').length,
            overdue_verifications: 0
          }));
        }
      } catch (error) {
        console.error('Error fetching verifications:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as verificações de valores',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingVerifications(false);
      }
    };

    fetchVerifications();
  }, [toast]);

  // Filter batches
  useEffect(() => {
    let filtered = batches;
    
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter(batch => 
        batch.items.some(item => 
          item.patient.name.toLowerCase().includes(lowerSearchText) ||
          item.provider.name.toLowerCase().includes(lowerSearchText) ||
          item.procedure.description.toLowerCase().includes(lowerSearchText)
        )
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(batch => batch.status === statusFilter);
    }
    
    if (dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].toDate();
      const endDate = dateRange[1].toDate();
      
      filtered = filtered.filter(batch => {
        const batchDate = new Date(batch.created_at);
        return batchDate >= startDate && batchDate <= endDate;
      });
    }
    
    setFilteredBatches(filtered);
  }, [batches, searchText, statusFilter, dateRange]);

  // Filter verifications
  useEffect(() => {
    let filtered = verifications;
    
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter(verification => 
        verification.verification_reason?.toLowerCase().includes(lowerSearchText) ||
        verification.value_type.toLowerCase().includes(lowerSearchText)
      );
    }
    
    setFilteredVerifications(filtered);
  }, [verifications, searchText]);

  const getValueTypeDisplay = (valueType: string): string => {
    switch (valueType) {
      case 'unit_price':
        return 'Preço Unitário';
      case 'total_amount':
        return 'Valor Total';
      case 'quantity':
        return 'Quantidade';
      default:
        return valueType;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'critical':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'auto_approved':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  // Funções para verificações de valores
  const handleVerifyValue = async (verification: ValueVerification) => {
    console.log('Verificando valor:', verification);
    try {
      setLoadingAction(`verify_${verification.id}`);
      toast({
        title: 'Verificando',
        description: 'Verificando valor...',
      });
      
      // Simular verificação
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar o estado local
      setVerifications(prev => prev.map(v => 
        v.id === verification.id 
          ? { ...v, status: 'verified' as const }
          : v
      ));
      
      toast({
        title: 'Sucesso',
        description: 'Valor verificado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao verificar valor:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao verificar valor',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRejectValue = async (verification: ValueVerification) => {
    console.log('Rejeitando valor:', verification);
    try {
      setLoadingAction(`reject_${verification.id}`);
      toast({
        title: 'Rejeitando',
        description: 'Rejeitando valor...',
      });
      
      // Simular rejeição
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Atualizar o estado local
      setVerifications(prev => prev.map(v => 
        v.id === verification.id 
          ? { ...v, status: 'rejected' as const }
          : v
      ));
      
      toast({
        title: 'Sucesso',
        description: 'Valor rejeitado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao rejeitar valor:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao rejeitar valor',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportVerificationPDF = async (verification: ValueVerification) => {
    try {
      setLoadingAction(`pdf_verification_${verification.id}`);
      toast({
        title: 'Exportando',
        description: 'Gerando PDF da verificação...',
      });
      
      // Usar função real de export
      exportValueVerification(verification, 'pdf');
      
      toast({
        title: 'Sucesso',
        description: 'PDF da verificação gerado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF da verificação:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar PDF da verificação',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportVerificationExcel = async (verification: ValueVerification) => {
    try {
      setLoadingAction(`excel_verification_${verification.id}`);
      toast({
        title: 'Exportando',
        description: 'Gerando planilha Excel da verificação...',
      });
      
      // Usar função real de export
      exportValueVerification(verification, 'excel');
      
      toast({
        title: 'Sucesso',
        description: 'Planilha Excel da verificação gerada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao gerar Excel da verificação:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar planilha Excel da verificação',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePrintVerification = (verification: ValueVerification) => {
    toast({
      title: 'Imprimindo',
      description: `Preparando impressão da verificação #${verification.id}`,
    });
    // Aqui você pode adicionar lógica de impressão
  };

  // Funções de ação para os lotes de faturamento
  const handleViewBatch = (batch: BillingBatch) => {
    console.log('Visualizando lote:', batch);
    toast({
      title: 'Visualizando',
      description: `Abrindo detalhes do lote #${batch.id}`,
    });
    // Aqui você pode adicionar navegação para a página de detalhes
  };

  const handleDownloadInvoice = async (batch: BillingBatch) => {
    console.log('Baixando fatura do lote:', batch);
    try {
      setLoadingAction(`download_${batch.id}`);
      toast({
        title: 'Baixando',
        description: 'Preparando fatura para download...',
      });
      
      // Simular download da fatura
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: 'Sucesso',
        description: 'Fatura baixada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao baixar fatura:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao baixar fatura',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleOpenNotificationModal = (batch: BillingBatch) => {
    setSelectedBatchForNotification(batch);
    setIsNotificationModalVisible(true);
    // Resetar formulário
    setNotificationForm({
      type: 'billing_notification',
      recipients: 'all',
      message: ''
    });
  };

  const handleSendNotification = async (values: any) => {
    if (!selectedBatchForNotification) {
      toast({
        title: 'Erro',
        description: 'Nenhum lote selecionado',
        variant: 'destructive',
      });
      return;
    }

    // Debug: Log dos valores do formulário
    console.log('Form values:', values);
    console.log('Selected batch:', selectedBatchForNotification);
    console.log('Selected batch ID:', selectedBatchForNotification.id);
    console.log('Selected batch type:', typeof selectedBatchForNotification.id);

    // Verificar se o ID do lote é válido
    if (!selectedBatchForNotification.id || typeof selectedBatchForNotification.id !== 'number') {
      toast({
        title: 'Erro',
        description: 'ID do lote inválido',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSendingNotification(true);
      toast({
        title: 'Enviando',
        description: 'Enviando notificação...',
      });
      
      // Verificar se todos os campos obrigatórios estão presentes
      if (!values.message || !values.type || !values.recipients) {
        throw new Error('Campos obrigatórios não preenchidos');
      }
      
      // Chamada para a API corrigida com todos os parâmetros obrigatórios
      const requestData = {
        billing_batch_id: selectedBatchForNotification.id,
        message: values.message,
        type: values.type,
        recipients: values.recipients
      };
      
      console.log('Request data:', requestData);
      console.log('Request data type:', typeof requestData);
      console.log('Request data JSON:', JSON.stringify(requestData));
      
      // Verificar a URL da API
      const apiUrl = '/billing/notifications';
      console.log('API URL:', apiUrl);
      console.log('Axios instance:', axios);
      console.log('Axios baseURL:', axios.defaults.baseURL);
      console.log('Axios interceptors:', axios.interceptors);
      
      const response = await axios.post(apiUrl, requestData, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.data.message) {
        toast({
          title: 'Sucesso',
          description: response.data.message,
        });
      } else {
        toast({
          title: 'Sucesso',
          description: 'Notificação enviada com sucesso!',
        });
      }
      
      setIsNotificationModalVisible(false);
      setSelectedBatchForNotification(null);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      
      // Tratamento específico para erros de validação
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors)
          .flat()
          .join(', ');
        
        toast({
          title: 'Erro de Validação',
          description: errorMessages,
          variant: 'destructive',
        });
      } else {
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.error || 
                            error.message ||
                            'Erro ao enviar notificação';
        
        toast({
          title: 'Erro',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSendingNotification(false);
    }
  };

  const handleEditBatch = (batch: BillingBatch) => {
    console.log('Editando lote:', batch);
    toast({
      title: 'Editando',
      description: `Editando lote #${batch.id}`,
    });
    // Aqui você pode adicionar navegação para a página de edição
  };

  const handleDeleteBatch = async (batch: BillingBatch) => {
    console.log('Excluindo lote:', batch);
    try {
      setLoadingAction(`delete_${batch.id}`);
      toast({
        title: 'Excluindo',
        description: 'Excluindo lote...',
      });
      
      // Simular exclusão
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remover do estado local
      setBatches(prev => prev.filter(b => b.id !== batch.id));
      setFilteredBatches(prev => prev.filter(b => b.id !== batch.id));
      
      toast({
        title: 'Sucesso',
        description: 'Lote excluído com sucesso',
      });
    } catch (error) {
      console.error('Erro ao excluir lote:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir lote',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handlePrintBatch = (batch: BillingBatch) => {
    console.log('Imprimindo lote:', batch);
    toast({
      title: 'Imprimindo',
      description: `Preparando impressão do lote #${batch.id}`,
    });
    // Aqui você pode adicionar lógica de impressão
  };

  const handleExportPDF = async (batch: BillingBatch) => {
    console.log('Exportando PDF do lote:', batch);
    try {
      setLoadingAction(`pdf_${batch.id}`);
      toast({
        title: 'Exportando',
        description: 'Gerando PDF...',
      });
      
      // Usar função real de export
      exportBillingBatch(batch, 'pdf');
      
      toast({
        title: 'Sucesso',
        description: 'PDF gerado com sucesso',
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar PDF',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportExcel = async (batch: BillingBatch) => {
    console.log('Exportando Excel do lote:', batch);
    try {
      setLoadingAction(`excel_${batch.id}`);
      toast({
        title: 'Exportando',
        description: 'Gerando planilha Excel...',
      });
      
      // Usar função real de export
      exportBillingBatch(batch, 'excel');
      
      toast({
        title: 'Sucesso',
        description: 'Planilha Excel gerada com sucesso',
      });
    } catch (error) {
      console.error('Erro ao gerar Excel:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao gerar planilha Excel',
        variant: 'destructive',
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Cobranças</h1>
        <p className="text-muted-foreground">
          Gerencie lotes de cobrança e verificação de valores
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Lotes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_batches}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.total_amount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificações Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pending_verifications}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alta Prioridade</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.high_priority_verifications}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente, profissional, procedimento..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>

            {/* Botões de Export em Massa */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Exportar Dados</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => {
                    try {
                      exportBatchesList(filteredBatches, 'pdf');
                      toast({
                        title: 'Sucesso',
                        description: 'PDF dos lotes exportado com sucesso',
                      });
                    } catch (error) {
                      toast({
                        title: 'Erro',
                        description: 'Erro ao exportar PDF dos lotes',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Lotes em PDF
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => {
                    try {
                      exportBatchesList(filteredBatches, 'excel');
                      toast({
                        title: 'Sucesso',
                        description: 'Excel dos lotes exportado com sucesso',
                      });
                    } catch (error) {
                      toast({
                        title: 'Erro',
                        description: 'Erro ao exportar Excel dos lotes',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Lotes em Excel
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => {
                    try {
                      exportVerificationsList(filteredVerifications, 'pdf');
                      toast({
                        title: 'Sucesso',
                        description: 'PDF das verificações exportado com sucesso',
                      });
                    } catch (error) {
                      toast({
                        title: 'Erro',
                        description: 'Erro ao exportar PDF das verificações',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Verificações em PDF
                </DropdownMenuItem>
                
                <DropdownMenuItem 
                  onClick={() => {
                    try {
                      exportVerificationsList(filteredVerifications, 'excel');
                      toast({
                        title: 'Sucesso',
                        description: 'Excel das verificações exportado com sucesso',
                      });
                    } catch (error) {
                      toast({
                        title: 'Erro',
                        description: 'Erro ao exportar Excel das verificações',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Verificações em Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="outline"
              onClick={() => {
                toast({
                  title: 'Teste',
                  description: 'Toast de teste funcionando!',
                });
              }}
            >
              Testar Toast
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="batches" className="flex items-center gap-2">
              Lotes de Cobrança
              <Badge variant="secondary">{filteredBatches.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="verifications" className="flex items-center gap-2">
              Verificações de Valores
              <Badge variant="secondary">{statistics.pending_verifications}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="batches" className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <Link href={`/billing/batches/${batch.id}`} className="text-blue-600 hover:underline">
                        {batch.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{batch.reference_period_start}</div>
                        <div>{batch.reference_period_end}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(batch.total_amount)}</TableCell>
                    <TableCell>
                      <Badge variant={batch.status === 'pending' ? 'secondary' : 'default'}>
                        {batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{batch.items.length}</TableCell>
                    <TableCell>{new Date(batch.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            disabled={loadingAction !== null}
                          >
                            {loadingAction ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Ações do Lote #{batch.id}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => handleViewBatch(batch)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleDownloadInvoice(batch)}
                            disabled={loadingAction === `download_${batch.id}`}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            {loadingAction === `download_${batch.id}` ? 'Baixando...' : 'Baixar Fatura'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handleOpenNotificationModal(batch)}>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar Notificação
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => handleEditBatch(batch)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => handlePrintBatch(batch)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Imprimir
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => handleExportPDF(batch)}
                            disabled={loadingAction === `pdf_${batch.id}`}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            {loadingAction === `pdf_${batch.id}` ? 'Gerando PDF...' : 'Exportar PDF'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleExportExcel(batch)}
                            disabled={loadingAction === `excel_${batch.id}`}
                          >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            {loadingAction === `excel_${batch.id}` ? 'Gerando Excel...' : 'Exportar Excel'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => handleDeleteBatch(batch)}
                            disabled={loadingAction === `delete_${batch.id}`}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {loadingAction === `delete_${batch.id}` ? 'Excluindo...' : 'Excluir'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="verifications" className="space-y-4">
            {statistics.pending_verifications > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Existem {statistics.pending_verifications} verificações de valores pendentes que requerem atenção.
                </AlertDescription>
              </Alert>
            )}
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor Original</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Data Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVerifications.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell>
                      <Link href={`/value-verifications/${verification.id}`} className="text-blue-600 hover:underline">
                        {verification.id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getValueTypeDisplay(verification.value_type)}</Badge>
                    </TableCell>
                    <TableCell>{formatCurrency(verification.original_value)}</TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(verification.priority)}>
                        {verification.priority.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(verification.status)}>
                        {getStatusText(verification.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate max-w-[200px] block">
                              {verification.verification_reason}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{verification.verification_reason}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {verification.billing_batch_id ? (
                        <Link href={`/billing/batches/${verification.billing_batch_id}`}>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            #{verification.billing_batch_id}
                          </Badge>
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{new Date(verification.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            disabled={loadingAction !== null}
                          >
                            {loadingAction ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel>Ações da Verificação #{verification.id}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem asChild>
                            <Link href={`/value-verifications/${verification.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </Link>
                          </DropdownMenuItem>
                          
                          {canVerify && verification.status === 'pending' && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleVerifyValue(verification)}
                                disabled={loadingAction === `verify_${verification.id}`}
                                className="text-green-600 focus:text-green-600"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {loadingAction === `verify_${verification.id}` ? 'Verificando...' : 'Verificar Valor'}
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem 
                                onClick={() => handleRejectValue(verification)}
                                disabled={loadingAction === `reject_${verification.id}`}
                                className="text-red-600 focus:text-red-600"
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                {loadingAction === `reject_${verification.id}` ? 'Rejeitando...' : 'Rejeitar Valor'}
                              </DropdownMenuItem>
                            </>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem 
                            onClick={() => handleExportVerificationPDF(verification)}
                            disabled={loadingAction === `pdf_verification_${verification.id}`}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            {loadingAction === `pdf_verification_${verification.id}` ? 'Gerando PDF...' : 'Exportar PDF'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleExportVerificationExcel(verification)}
                            disabled={loadingAction === `excel_verification_${verification.id}`}
                          >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            {loadingAction === `excel_verification_${verification.id}` ? 'Gerando Excel...' : 'Exportar Excel'}
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => handlePrintVerification(verification)}>
                            <FileText className="mr-2 h-4 w-4" />
                            Imprimir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Modal de Notificação */}
      <Dialog open={isNotificationModalVisible} onOpenChange={setIsNotificationModalVisible}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-500" />
              Enviar Notificação
            </DialogTitle>
          </DialogHeader>
          
          {selectedBatchForNotification && (
            <div className="space-y-6">
              {/* Informações do Lote */}
              <Card className="bg-muted/50">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-muted-foreground">Lote:</span>
                      <span className="ml-2">#{selectedBatchForNotification.id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Valor Total:</span>
                      <span className="ml-2">{formatCurrency(selectedBatchForNotification.total_amount)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Período:</span>
                      <span className="ml-2">
                        {selectedBatchForNotification.reference_period_start} a {selectedBatchForNotification.reference_period_end}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-muted-foreground">Status:</span>
                      <Badge variant={selectedBatchForNotification.status === 'pending' ? 'secondary' : 'default'} className="ml-2">
                        {selectedBatchForNotification.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Formulário de Notificação */}
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSendNotification(notificationForm);
              }} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Notificação</Label>
                  <Select 
                    value={notificationForm.type} 
                    onValueChange={(value) => setNotificationForm(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="billing_notification">Notificação de Faturamento</SelectItem>
                      <SelectItem value="payment_reminder">Lembrete de Pagamento</SelectItem>
                      <SelectItem value="status_update">Atualização de Status</SelectItem>
                      <SelectItem value="custom">Mensagem Personalizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipients">Destinatários</Label>
                  <Select 
                    value={notificationForm.recipients} 
                    onValueChange={(value) => setNotificationForm(prev => ({ ...prev, recipients: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione os destinatários" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Envolvidos</SelectItem>
                      <SelectItem value="patients">Apenas Pacientes</SelectItem>
                      <SelectItem value="providers">Apenas Profissionais</SelectItem>
                      <SelectItem value="financial">Apenas Financeiro</SelectItem>
                      <SelectItem value="custom">Destinatários Específicos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Digite a mensagem da notificação..."
                    rows={4}
                    maxLength={500}
                    required
                    minLength={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 10 caracteres, máximo 500 caracteres
                  </p>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsNotificationModalVisible(false);
                      setSelectedBatchForNotification(null);
                      setNotificationForm({
                        type: 'billing_notification',
                        recipients: 'all',
                        message: ''
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSendingNotification}
                  >
                    {isSendingNotification ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Notificação
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 