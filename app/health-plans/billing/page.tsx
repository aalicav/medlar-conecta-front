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
import { CalendarIcon, Download, FileText, Receipt } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const statusMap = {
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

  const handleDownloadReport = async (format: 'csv' | 'pdf') => {
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
      params.append('format', format);

      const response = await api.get(`/billing/report?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio_faturamento.${format}`);
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
        const status = statusMap[row.original.status];
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
                <SelectItem value="">Todos</SelectItem>
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
        loading={loading}
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
                  <Badge variant={statusMap[selectedBatch.status].color as any}>
                    {statusMap[selectedBatch.status].label}
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
                          <p>Tipo: {item.provider.type === 'professional' ? 'Profissional' : 'Clínica'}</p>
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
    </div>
  );
} 