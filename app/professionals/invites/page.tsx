'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table/data-table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SolicitationInvite {
  id: number;
  solicitation_id: number;
  provider_type: string;
  provider_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  responded_at: string | null;
  response_notes: string | null;
  created_at: string;
  updated_at: string;
  solicitation: {
    id: number;
    health_plan_id: number;
    patient_id: number;
    tuss_id: number;
    status: string;
    preferred_date_start: string | null;
    preferred_date_end: string | null;
    priority: string;
    description: string | null;
    patient: {
      id: number;
      name: string;
      birth_date: string;
      gender: string;
      email: string;
      address: string;
      city: string;
      state: string;
    };
    tuss: {
      id: number;
      code: string;
      name: string;
      description: string;
    };
    health_plan: {
      id: number;
      name: string;
      cnpj: string;
      ans_code: string;
    };
  };
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'yellow' },
  accepted: { label: 'Aceito', color: 'green' },
  rejected: { label: 'Rejeitado', color: 'red' },
};

export default function InvitesPage() {
  const [invites, setInvites] = useState<SolicitationInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvite, setSelectedInvite] = useState<SolicitationInvite | null>(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [availabilityDetails, setAvailabilityDetails] = useState<any>(null);
  const [availableDate, setAvailableDate] = useState<Date>();
  const [availableTime, setAvailableTime] = useState('');
  const [notes, setNotes] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState([]);
  const { toast } = useToast();

  const fetchInvites = async () => {
    try {
      const response = await api.get('/invites');
      setInvites(response.data.data.data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os convites',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleAccept = async () => {
    if (!selectedInvite || !availableDate || !availableTime) {
      console.log('Missing required fields:', {
        selectedInvite,
        availableDate,
        availableTime
      });
      return;
    }

    try {
      console.log('Accepting invite with data:', {
        inviteId: selectedInvite.id,
        availableDate: format(availableDate, 'yyyy-MM-dd'),
        availableTime,
        notes
      });

      // Primeiro aceita o convite
      await api.post(`/invites/${selectedInvite.id}/accept`, {
        available_date: format(availableDate, 'yyyy-MM-dd'),
        available_time: availableTime,
        notes,
      });

      // Depois cria a disponibilidade
      const response = await api.post('/availabilities', {
        professional_id: selectedInvite.provider_id,
        solicitation_id: selectedInvite.solicitation_id,
        available_date: format(availableDate, 'yyyy-MM-dd'),
        available_time: availableTime,
        notes,
        status: 'pending'
      });

      console.log('Availability created:', response.data);

      setAvailabilityDetails(response.data.data);
      setShowAcceptModal(false);
      setShowAvailabilityModal(true);

      toast({
        title: 'Sucesso',
        description: 'Convite aceito e disponibilidade criada com sucesso',
      });

      fetchInvites();
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao aceitar convite',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedInvite) return;

    try {
      await api.post(`/invites/${selectedInvite.id}/reject`, {
        notes,
      });

      toast({
        title: 'Sucesso',
        description: 'Convite rejeitado com sucesso',
      });

      setShowRejectModal(false);
      fetchInvites();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao rejeitar convite',
        variant: 'destructive',
      });
    }
  };

  const handlePaginationChange = (page: number, newPageSize: number) => {
    setCurrentPage(page);
    setPageSize(newPageSize);
  };

  const handleSortingChange = (newSorting: any) => {
    setSorting(newSorting);
  };

  const columns = [
    {
      accessorKey: 'solicitation.patient.name',
      header: 'Paciente',
    },
    {
      accessorKey: 'solicitation.tuss.description',
      header: 'Procedimento',
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
      header: 'Data do Convite',
      cell: ({ row }: any) => format(new Date(row.original.created_at), 'dd/MM/yyyy HH:mm'),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: any) => {
        const invite = row.original;
        if (invite.status !== 'pending') return null;

        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedInvite(invite);
                setShowAcceptModal(true);
              }}
            >
              Aceitar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedInvite(invite);
                setShowRejectModal(true);
              }}
            >
              Rejeitar
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Convites Recebidos</h1>

      <DataTable
        columns={columns}
        data={invites}
        isLoading={loading}
        currentPage={currentPage}
        pageSize={pageSize}
        onPaginationChange={handlePaginationChange}
        onSortingChange={handleSortingChange}
        totalItems={invites.length}
        pageCount={Math.ceil(invites.length / pageSize)}
      />

      {/* Modal de Aceite */}
      {showAcceptModal && selectedInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-[500px] p-6">
            <h2 className="text-xl font-bold mb-4">Aceitar Convite</h2>
            <p className="mb-4">
              Paciente: {selectedInvite.solicitation.patient.name}<br />
              Procedimento: {selectedInvite.solicitation.tuss.description}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data de Disponibilidade</label>
                {selectedInvite?.solicitation.preferred_date_start && selectedInvite?.solicitation.preferred_date_end ? (
                  <p className="text-sm text-gray-500 mb-2">
                    Período disponível: {format(new Date(selectedInvite.solicitation.preferred_date_start), 'dd/MM/yyyy', { locale: ptBR })} até {format(new Date(selectedInvite.solicitation.preferred_date_end), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                ) : (
                  <p className="text-sm text-red-500 mb-2">
                    Não há período disponível para seleção
                  </p>
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !availableDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {availableDate ? format(availableDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={availableDate}
                      onSelect={setAvailableDate}
                      disabled={(date) => {
                        if (!selectedInvite?.solicitation.preferred_date_start || !selectedInvite?.solicitation.preferred_date_end) {
                          return true;
                        }
                        const start = new Date(selectedInvite.solicitation.preferred_date_start);
                        const end = new Date(selectedInvite.solicitation.preferred_date_end);
                        return date < start || date > end;
                      }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                {availableDate && (
                  <p className="text-sm text-gray-500 mt-2">
                    Data selecionada: {format(availableDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Horário (formato 24h)</label>
                <Input
                  type="time"
                  value={availableTime}
                  onChange={(e) => {
                    const time = e.target.value;
                    setAvailableTime(time);
                  }}
                />
                {availableTime && (
                  <p className="text-sm text-gray-500 mt-2">
                    Horário selecionado: {availableTime.slice(0, 5)}h
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione observações sobre a disponibilidade..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowAcceptModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAccept}>
                Confirmar
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Rejeição */}
      {showRejectModal && selectedInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-[500px] p-6">
            <h2 className="text-xl font-bold mb-4">Rejeitar Convite</h2>
            <p className="mb-4">
              Paciente: {selectedInvite.solicitation.patient.name}<br />
              Procedimento: {selectedInvite.solicitation.tuss.description}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Motivo da Rejeição</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informe o motivo da rejeição..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleReject}>
                Confirmar Rejeição
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Disponibilidade */}
      {showAvailabilityModal && availabilityDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <Card className="w-[500px] p-6">
            <h2 className="text-xl font-bold mb-4">Disponibilidade Criada</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Paciente</label>
                <p className="text-gray-700">{selectedInvite?.solicitation.patient.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Procedimento</label>
                <p className="text-gray-700">{selectedInvite?.solicitation.tuss.description}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <p className="text-gray-700">{format(new Date(availabilityDetails.available_date), 'dd/MM/yyyy')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Horário</label>
                <p className="text-gray-700">{availabilityDetails.available_time}</p>
              </div>

              {availabilityDetails.notes && (
                <div>
                  <label className="block text-sm font-medium mb-1">Observações</label>
                  <p className="text-gray-700">{availabilityDetails.notes}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Badge variant="secondary">Pendente</Badge>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={() => setShowAvailabilityModal(false)}>
                Fechar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 