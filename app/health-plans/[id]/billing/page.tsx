'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, Filter, Search } from 'lucide-react';
import { PatientJourneyModal } from '@/components/modals/patient-journey-modal';
import { api } from '@/lib/api';

interface BillingBatch {
  id: number;
  reference_period_start: string;
  reference_period_end: string;
  billing_date: string;
  due_date: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'glosa' | 'renegotiated';
  items_count: number;
  items: BillingItem[];
  fiscal_documents: FiscalDocument[];
  payment_proofs: PaymentProof[];
}

interface BillingItem {
  id: number;
  appointment: {
    id: number;
    patient: {
      name: string;
      cpf: string;
    };
    professional: {
      name: string;
      specialty: {
        name: string;
      };
    };
    clinic: {
      name: string;
    };
    procedure: {
      tuss_code: string;
      name: string;
    };
    scheduled_date: string;
    scheduled_time: string;
    journey: {
      scheduled_at: string;
      confirmed_at: string;
      attendance_confirmed_at: string;
      attended: boolean;
      guide_status: string;
    };
  };
  amount: number;
}

interface FiscalDocument {
  id: number;
  number: string;
  issue_date: string;
  file_url: string;
}

interface PaymentProof {
  id: number;
  date: string;
  amount: number;
  file_url: string;
}

interface GlosaItem {
  id: number;
  billing_item_id: number;
  amount: number;
  reason: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

interface JourneyModalState {
  isOpen: boolean;
  journey: BillingItem['appointment']['journey'] | null;
}

export default function HealthPlanBillingPage() {
  const params = useParams();
  const healthPlanId = typeof params?.id === 'string' ? params.id : '';
  const [loading, setLoading] = useState(true);
  const [billingBatches, setBillingBatches] = useState<BillingBatch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BillingBatch | null>(null);
  const [journeyModal, setJourneyModal] = useState<JourneyModalState>({
    isOpen: false,
    journey: null
  });
  const [filters, setFilters] = useState({
    status: '',
    start_date: '',
    end_date: '',
    search: ''
  });
  const [glosas, setGlosas] = useState<GlosaItem[]>([]);

  useEffect(() => {
    loadBillingData();
  }, [healthPlanId, filters]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/health-plans/${healthPlanId}/billing`, { params: filters });
      setBillingBatches(response.data.batches);
      setGlosas(response.data.glosas);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      paid: { label: 'Pago', className: 'bg-green-50 text-green-700 border-green-200' },
      overdue: { label: 'Em Atraso', className: 'bg-red-50 text-red-700 border-red-200' },
      glosa: { label: 'Glosado', className: 'bg-purple-50 text-purple-700 border-purple-200' },
      renegotiated: { label: 'Renegociado', className: 'bg-blue-50 text-blue-700 border-blue-200' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const handleJourneyClick = (journey: BillingItem['appointment']['journey']) => {
    setJourneyModal({
      isOpen: true,
      journey
    });
  };

  const handleCloseJourneyModal = () => {
    setJourneyModal({
      isOpen: false,
      journey: null
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Faturamento</h1>
          <p className="text-gray-500">Gerenciamento de cobranças e faturamentos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <FileText className="w-4 h-4 mr-2" />
            Gerar Relatório
          </Button>
          <Button variant="outline" onClick={() => {}}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Em Atraso</SelectItem>
                  <SelectItem value="glosa">Glosado</SelectItem>
                  <SelectItem value="renegotiated">Renegociado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="billing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="billing">Faturamentos</TabsTrigger>
          <TabsTrigger value="glosas">Glosas</TabsTrigger>
        </TabsList>

        <TabsContent value="billing">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Período de Referência</TableHead>
                    <TableHead>Data Faturamento</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingBatches.map((batch) => (
                    <TableRow key={batch.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setSelectedBatch(batch)}>
                      <TableCell>{batch.id}</TableCell>
                      <TableCell>
                        {format(new Date(batch.reference_period_start), 'dd/MM/yyyy', { locale: ptBR })} - 
                        {format(new Date(batch.reference_period_end), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell>{format(new Date(batch.billing_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>{format(new Date(batch.due_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>R$ {batch.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{getStatusBadge(batch.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="glosas">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Faturamento</TableHead>
                    <TableHead>Valor Glosado</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {glosas.map((glosa) => (
                    <TableRow key={glosa.id}>
                      <TableCell>{glosa.id}</TableCell>
                      <TableCell>{glosa.billing_item_id}</TableCell>
                      <TableCell>R$ {glosa.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>{glosa.reason}</TableCell>
                      <TableCell>{getStatusBadge(glosa.status)}</TableCell>
                      <TableCell>{format(new Date(glosa.created_at), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedBatch && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Detalhes do Faturamento #{selectedBatch.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Informações Gerais</h3>
                  <div className="space-y-2">
                    <p><span className="text-gray-500">Período:</span> {format(new Date(selectedBatch.reference_period_start), 'dd/MM/yyyy')} - {format(new Date(selectedBatch.reference_period_end), 'dd/MM/yyyy')}</p>
                    <p><span className="text-gray-500">Data Faturamento:</span> {format(new Date(selectedBatch.billing_date), 'dd/MM/yyyy')}</p>
                    <p><span className="text-gray-500">Vencimento:</span> {format(new Date(selectedBatch.due_date), 'dd/MM/yyyy')}</p>
                    <p><span className="text-gray-500">Valor Total:</span> R$ {selectedBatch.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    <p><span className="text-gray-500">Status:</span> {getStatusBadge(selectedBatch.status)}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Notas Fiscais</h3>
                  <div className="space-y-2">
                    {selectedBatch.fiscal_documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between">
                        <span>NF-e #{doc.number}</span>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Comprovantes de Pagamento</h3>
                  <div className="space-y-2">
                    {selectedBatch.payment_proofs.map((proof) => (
                      <div key={proof.id} className="flex items-center justify-between">
                        <span>{format(new Date(proof.date), 'dd/MM/yyyy')} - R$ {proof.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={proof.file_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Atendimentos Faturados</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Jornada</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedBatch.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.appointment.patient.name}</TableCell>
                        <TableCell>{item.appointment.patient.cpf}</TableCell>
                        <TableCell>{item.appointment.professional.name}</TableCell>
                        <TableCell>{item.appointment.professional.specialty.name}</TableCell>
                        <TableCell>
                          {item.appointment.procedure.tuss_code} - {item.appointment.procedure.name}
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.appointment.scheduled_date), 'dd/MM/yyyy')} {item.appointment.scheduled_time}
                        </TableCell>
                        <TableCell>R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleJourneyClick(item.appointment.journey)}
                          >
                            Ver Jornada
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {journeyModal.journey && (
        <PatientJourneyModal
          isOpen={journeyModal.isOpen}
          onClose={handleCloseJourneyModal}
          journey={journeyModal.journey}
        />
      )}
    </div>
  );
} 