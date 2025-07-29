'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  CalendarIcon, 
  Download, 
  FileText, 
  Receipt, 
  AlertTriangle, 
  Bell, 
  Trash2,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BillingBatch {
  id: number;
  reference_period_start: string;
  reference_period_end: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'glossed' | 'renegotiated';
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
    type: 'professional' | 'clinic';
    specialty?: string;
  };
  procedure: {
    code: string;
    description: string;
  };
  appointment: {
    id: number;
    scheduled_date: string;
    booking_date: string;
    confirmation_date: string;
    attendance_confirmation: string;
    guide_status: 'attached' | 'signed' | 'missing';
  };
  amount: number;
  status: 'pending' | 'paid' | 'glossed';
  gloss_reason?: string;
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'yellow' },
  paid: { label: 'Pago', color: 'green' },
  overdue: { label: 'Em Atraso', color: 'red' },
  glossed: { label: 'Glosado', color: 'orange' },
  renegotiated: { label: 'Renegociado', color: 'blue' },
};

export default function BillingPage() {
  const [batches, setBatches] = useState<BillingBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<BillingBatch | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { toast } = useToast();
  const { hasRole } = useAuth();

  // Estados para os novos modais
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBatchForAction, setSelectedBatchForAction] = useState<BillingBatch | null>(null);
  const [verificationReason, setVerificationReason] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Controle de acesso
  const canManageBilling = hasRole(['network_manager', 'super_admin']);

  const fetchBatches = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.from) {
        params.append('date_from', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange.to) {
        params.append('date_to', format(dateRange.to, 'yyyy-MM-dd'));
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }

      const response = await api.get(`/billing?${params.toString()}`);
      setBatches(response.data.data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os faturamentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [dateRange, statusFilter]);

  const handleDownloadReport = async (reportFormat: 'csv' | 'pdf') => {
    try {
      const params = new URLSearchParams();
      if (dateRange.from) {
        params.append('date_from', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange.to) {
        params.append('date_to', format(dateRange.to, 'yyyy-MM-dd'));
      }
      if (statusFilter) {
        params.append('status', statusFilter);
      }
      params.append('format', reportFormat);

      const response = await api.get(`/billing/report?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_faturamento.${reportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o relatório',
        variant: 'destructive',
      });
    }
  };

  // Função para criar verificação de valores
  const handleCreateVerification = async () => {
    if (!selectedBatchForAction || !verificationReason.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe o motivo da verificação',
        variant: 'destructive',
      });
      return;
    }

    setIsActionLoading(true);
    try {
      // Para lotes, vamos criar verificação para o primeiro item do lote
      const firstItem = selectedBatchForAction.items?.[0];
      if (!firstItem) {
        throw new Error('Nenhum item encontrado no lote');
      }

      const response = await api.post(`/billing/billing-items/${firstItem.id}/value-verifications`, {
        reason: verificationReason,
        priority: 'medium'
      });

      toast({
        title: 'Sucesso',
        description: 'Verificação de valores criada com sucesso',
      });

      setShowVerificationModal(false);
      setVerificationReason('');
      setSelectedBatchForAction(null);
      fetchBatches(); // Recarregar dados
    } catch (error: any) {
      console.error('Error creating verification:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao criar verificação de valores',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Função para enviar notificação
  const handleSendNotification = async () => {
    if (!selectedBatchForAction || !notificationMessage.trim()) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe a mensagem da notificação',
        variant: 'destructive',
      });
      return;
    }

    setIsActionLoading(true);
    try {
      // Para lotes, vamos enviar notificação para o primeiro item do lote
      const firstItem = selectedBatchForAction.items?.[0];
      if (!firstItem) {
        throw new Error('Nenhum item encontrado no lote');
      }

      const response = await api.post('/billing/notifications', {
        billing_item_id: firstItem.id,
        message: notificationMessage,
        type: 'billing_notification'
      });

      toast({
        title: 'Sucesso',
        description: 'Notificação enviada com sucesso',
      });

      setShowNotificationModal(false);
      setNotificationMessage('');
      setSelectedBatchForAction(null);
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao enviar notificação',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Função para excluir cobrança
  const handleDeleteBilling = async () => {
    if (!selectedBatchForAction) return;

    setIsActionLoading(true);
    try {
      // Para lotes, vamos excluir o primeiro item do lote
      const firstItem = selectedBatchForAction.items?.[0];
      if (!firstItem) {
        throw new Error('Nenhum item encontrado no lote');
      }

      await api.delete(`/billing/items/${firstItem.id}`);

      toast({
        title: 'Sucesso',
        description: 'Cobrança excluída com sucesso',
      });

      setShowDeleteModal(false);
      setSelectedBatchForAction(null);
      fetchBatches(); // Recarregar dados
    } catch (error: any) {
      console.error('Error deleting billing:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao excluir cobrança',
        variant: 'destructive',
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const columns = [
    {
      accessorKey: 'reference_period_start',
      header: 'Período Início',
      cell: ({ row }: any) => formatDate(row.original.reference_period_start),
    },
    {
      accessorKey: 'reference_period_end',
      header: 'Período Fim',
      cell: ({ row }: any) => formatDate(row.original.reference_period_end),
    },
    {
      accessorKey: 'total_amount',
      header: 'Valor Total',
      cell: ({ row }: any) => formatCurrency(row.original.total_amount),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = statusMap[row.original.status] || statusMap.pending;
        return <Badge variant={status.color as any}>{status.label}</Badge>;
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Data de Criação',
      cell: ({ row }: any) => formatDateTime(row.original.created_at),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: any) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedBatch(row.original);
              setShowDetailsModal(true);
            }}
          >
            Detalhes
          </Button>
          
          {/* Botões de Ação - Apenas para network_manager e super_admin */}
          {canManageBilling && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedBatchForAction(row.original);
                  setShowVerificationModal(true);
                }}
              >
                <AlertTriangle className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedBatchForAction(row.original);
                  setShowNotificationModal(true);
                }}
              >
                <Bell className="h-4 w-4" />
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                    <AlertDialogDescription>
                      {selectedBatchForAction && (
                        <div className="space-y-2">
                          <p>Tem certeza que deseja excluir este lote de cobrança?</p>
                          <div className="p-4 bg-muted rounded-lg">
                            <p><strong>ID do Lote:</strong> #{selectedBatchForAction.id}</p>
                            <p><strong>Período:</strong> {selectedBatchForAction.reference_period_start} a {selectedBatchForAction.reference_period_end}</p>
                            <p><strong>Valor Total:</strong> {formatCurrency(selectedBatchForAction.total_amount)}</p>
                            <p><strong>Itens:</strong> {selectedBatchForAction.items?.length || 0} itens</p>
                          </div>
                          <p className="text-destructive font-medium">Esta ação não pode ser desfeita.</p>
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        setSelectedBatchForAction(row.original);
                        setShowDeleteModal(true);
                      }}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
          
          {row.original.invoice && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(row.original.invoice, '_blank')}
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}
          {row.original.payment_proof && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(row.original.payment_proof, '_blank')}
            >
              <Receipt className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Faturamentos</h1>
        <div className="flex gap-2">
          <Button onClick={() => handleDownloadReport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => handleDownloadReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Período</label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {dateRange.from ? format(dateRange.from, 'dd/MM/yyyy') : 'Data inicial'}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    {dateRange.to ? format(dateRange.to, 'dd/MM/yyyy') : 'Data final'}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Em Atraso</SelectItem>
                <SelectItem value="glossed">Glosado</SelectItem>
                <SelectItem value="renegotiated">Renegociado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={batches}
        isLoading={loading}
      />

      {/* Modal de Detalhes */}
      {showDetailsModal && selectedBatch && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Faturamento</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-1">Período de Referência</h3>
                  <p>
                    {formatDate(selectedBatch.reference_period_start)} a{' '}
                    {formatDate(selectedBatch.reference_period_end)}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Valor Total</h3>
                  <p className="text-lg font-bold">
                    {formatCurrency(selectedBatch.total_amount)}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Status</h3>
                  <Badge variant={statusMap[selectedBatch.status]?.color as any}>
                    {statusMap[selectedBatch.status]?.label}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Data de Criação</h3>
                  <p>{formatDateTime(selectedBatch.created_at)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Atendimentos Faturados</h3>
                <div className="space-y-4">
                  {selectedBatch.items.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Paciente</h4>
                          <p>Nome: {item.patient.name}</p>
                          <p>CPF: {item.patient.cpf}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Prestador</h4>
                          <p>Nome: {item.provider.name}</p>
                          <p>Tipo: {item.provider.type === 'professional' ? 'Profissional' : 'Estabelecimento'}</p>
                          {item.provider.specialty && (
                            <p>Especialidade: {item.provider.specialty}</p>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Procedimento</h4>
                          <p>Código: {item.procedure.code}</p>
                          <p>Descrição: {item.procedure.description}</p>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Valor</h4>
                          <p className="text-lg font-bold">
                            {formatCurrency(item.amount)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <h4 className="font-medium mb-2">Jornada do Paciente</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p>Data da Marcação: {formatDateTime(item.appointment.booking_date)}</p>
                              <p>Data da Confirmação: {formatDateTime(item.appointment.confirmation_date)}</p>
                              <p>Confirmação de Comparecimento: {item.appointment.attendance_confirmation}</p>
                            </div>
                            <div>
                              <p>Data e Hora do Atendimento: {formatDateTime(item.appointment.scheduled_date)}</p>
                              <p>Status da Guia: {
                                {
                                  attached: 'Anexada',
                                  signed: 'Assinada',
                                  missing: 'Não Anexada'
                                }[item.appointment.guide_status]
                              }</p>
                            </div>
                          </div>
                        </div>
                        {item.status === 'glossed' && (
                          <div className="col-span-2">
                            <h4 className="font-medium mb-2">Informações da Glosa</h4>
                            <p>Motivo: {item.gloss_reason}</p>
                          </div>
                        )}
                        
                        {/* Botões de Ação - Apenas para network_manager e super_admin */}
                        {canManageBilling && (
                          <div className="col-span-2 border-t pt-4">
                            <h4 className="font-medium mb-2">Ações</h4>
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBatchForAction(selectedBatch);
                                  setShowVerificationModal(true);
                                }}
                              >
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Criar Verificação
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedBatchForAction(selectedBatch);
                                  setShowNotificationModal(true);
                                }}
                              >
                                <Bell className="h-4 w-4 mr-2" />
                                Enviar Notificação
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {selectedBatchForAction && (
                                        <div className="space-y-2">
                                          <p>Tem certeza que deseja excluir este lote de cobrança?</p>
                                          <div className="p-4 bg-muted rounded-lg">
                                            <p><strong>ID do Lote:</strong> #{selectedBatchForAction.id}</p>
                                            <p><strong>Período:</strong> {selectedBatchForAction.reference_period_start} a {selectedBatchForAction.reference_period_end}</p>
                                            <p><strong>Valor Total:</strong> {formatCurrency(selectedBatchForAction.total_amount)}</p>
                                            <p><strong>Itens:</strong> {selectedBatchForAction.items?.length || 0} itens</p>
                                          </div>
                                          <p className="text-destructive font-medium">Esta ação não pode ser desfeita.</p>
                                        </div>
                                      )}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        setSelectedBatchForAction(selectedBatch);
                                        setShowDeleteModal(true);
                                      }}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                {selectedBatch.invoice && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedBatch.invoice, '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Nota Fiscal
                  </Button>
                )}
                {selectedBatch.payment_proof && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedBatch.payment_proof, '_blank')}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Comprovante de Pagamento
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Verificação de Valores */}
      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Verificação de Valores</DialogTitle>
            <DialogDescription>
              Crie uma verificação de valores para este item de cobrança.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedBatchForAction && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Lote Selecionado</h4>
                <p><strong>ID do Lote:</strong> #{selectedBatchForAction.id}</p>
                <p><strong>Período:</strong> {selectedBatchForAction.reference_period_start} a {selectedBatchForAction.reference_period_end}</p>
                <p><strong>Valor Total:</strong> {formatCurrency(selectedBatchForAction.total_amount)}</p>
                <p><strong>Itens:</strong> {selectedBatchForAction.items?.length || 0} itens</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="verification-reason">Motivo da Verificação</Label>
              <Textarea
                id="verification-reason"
                value={verificationReason}
                onChange={(e) => setVerificationReason(e.target.value)}
                placeholder="Descreva o motivo da verificação de valores..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerificationModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateVerification} 
              disabled={isActionLoading || !verificationReason.trim()}
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Verificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Notificação */}
      <Dialog open={showNotificationModal} onOpenChange={setShowNotificationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Notificação</DialogTitle>
            <DialogDescription>
              Envie uma notificação relacionada a este item de cobrança.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedBatchForAction && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Lote Selecionado</h4>
                <p><strong>ID do Lote:</strong> #{selectedBatchForAction.id}</p>
                <p><strong>Período:</strong> {selectedBatchForAction.reference_period_start} a {selectedBatchForAction.reference_period_end}</p>
                <p><strong>Valor Total:</strong> {formatCurrency(selectedBatchForAction.total_amount)}</p>
                <p><strong>Itens:</strong> {selectedBatchForAction.items?.length || 0} itens</p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="notification-message">Mensagem da Notificação</Label>
              <Textarea
                id="notification-message"
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Digite a mensagem da notificação..."
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotificationModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendNotification} 
              disabled={isActionLoading || !notificationMessage.trim()}
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Notificação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBatchForAction && (
                <div className="space-y-2">
                  <p>Tem certeza que deseja excluir este lote de cobrança?</p>
                  <div className="p-4 bg-muted rounded-lg">
                    <p><strong>ID do Lote:</strong> #{selectedBatchForAction.id}</p>
                    <p><strong>Período:</strong> {selectedBatchForAction.reference_period_start} a {selectedBatchForAction.reference_period_end}</p>
                    <p><strong>Valor Total:</strong> {formatCurrency(selectedBatchForAction.total_amount)}</p>
                    <p><strong>Itens:</strong> {selectedBatchForAction.items?.length || 0} itens</p>
                  </div>
                  <p className="text-destructive font-medium">Esta ação não pode ser desfeita.</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBilling}
              disabled={isActionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 