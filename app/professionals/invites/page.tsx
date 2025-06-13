'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface SolicitationInvite {
  id: number;
  status: 'pending' | 'accepted' | 'rejected';
  responded_at: string | null;
  response_notes: string | null;
  created_at: string;
  solicitation: {
    id: number;
    patient: {
      name: string;
      birth_date: string;
      gender: string;
    };
    tuss: {
      code: string;
      description: string;
    };
    preferred_date_start: string;
    preferred_date_end: string;
  };
}

const statusMap = {
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
  const [availableDate, setAvailableDate] = useState<Date>();
  const [availableTime, setAvailableTime] = useState('');
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const fetchInvites = async () => {
    try {
      const response = await api.get('/invites');
      setInvites(response.data.data);
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
    if (!selectedInvite || !availableDate || !availableTime) return;

    try {
      await api.post(`/invites/${selectedInvite.id}/accept`, {
        available_date: format(availableDate, 'yyyy-MM-dd'),
        available_time: availableTime,
        notes,
      });

      toast({
        title: 'Sucesso',
        description: 'Convite aceito com sucesso',
      });

      setShowAcceptModal(false);
      fetchInvites();
    } catch (error: any) {
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
        loading={loading}
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {availableDate ? format(availableDate, 'dd/MM/yyyy') : 'Selecione uma data'}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={availableDate}
                      onSelect={setAvailableDate}
                      disabled={(date) => {
                        const start = new Date(selectedInvite.solicitation.preferred_date_start);
                        const end = new Date(selectedInvite.solicitation.preferred_date_end);
                        return date < start || date > end;
                      }}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Horário</label>
                <Input
                  type="time"
                  value={availableTime}
                  onChange={(e) => setAvailableTime(e.target.value)}
                />
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
    </div>
  );
} 