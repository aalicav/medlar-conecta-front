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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/auth-context';

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
  provider?: {
    id: number;
    name: string;
    specialty?: string;
    professional_type?: string;
    council_number?: string;
    council_type?: string;
    city?: string;
    state?: string;
    address?: string;
    addresses?: Array<{
      id: number;
      address: string;
      city: string;
      state: string;
      postal_code: string;
    }>;
  };
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
  const { hasRole } = useAuth();

  // Função para verificar se o usuário tem role de admin
  const isAdmin = () => {
    return hasRole('super_admin') || hasRole('network_manager') || hasRole('director');
  }

  // Função para verificar se o usuário é profissional
  const isProfessional = () => {
    const roles = localStorage.getItem('user_roles')
    if (!roles) return false
    const userRoles = JSON.parse(roles)
    return userRoles.some((role: string) => 
      ['professional'].includes(role)
    )
  }

  // Função para verificar se o usuário é admin de clínica
  const isClinicAdmin = () => {
    const roles = localStorage.getItem('user_roles')
    if (!roles) return false
    const userRoles = JSON.parse(roles)
    return userRoles.some((role: string) => 
      ['clinic_admin'].includes(role)
    )
  }

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
    // Coluna adicional apenas para admins
    ...(isAdmin() ? [{
      accessorKey: 'solicitation.health_plan.name',
      header: 'Plano de Saúde',
      cell: ({ row }: any) => {
        const healthPlan = row.original.solicitation.health_plan;
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {healthPlan.name}
            </div>
            <div className="text-xs text-gray-500">
              ANS: {healthPlan.ans_code}
            </div>
          </div>
        );
      },
    }] : []),
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: any) => {
        const status = statusMap[row.original.status];
        return <Badge variant={status.color as any}>{status.label}</Badge>;
      },
    },
    // Coluna adicional apenas para admins
    ...(isAdmin() ? [{
      accessorKey: 'provider_info',
      header: 'Prestador',
      cell: ({ row }: any) => {
        const invite = row.original;
        const provider = invite.provider;
        
        const getProviderSummary = () => {
          if (!provider) return `ID: ${invite.provider_id}`;
          
          const type = invite.provider_type === 'App\\Models\\Professional' ? 'Profissional' : 'Clínica';
          const name = provider.name;
          
          if (invite.provider_type === 'App\\Models\\Professional') {
            const specialty = provider.specialty ? ` - ${provider.specialty}` : '';
            const location = provider.city && provider.state ? ` (${provider.city}/${provider.state})` : '';
            return `${name}${specialty}${location}`;
          } else {
            // Para clínicas, mostrar primeiro endereço se disponível
            const firstAddress = provider.addresses && provider.addresses.length > 0 
              ? ` (${provider.addresses[0].city}/${provider.addresses[0].state})` 
              : '';
            return `${name}${firstAddress}`;
          }
        };

        const getTooltipContent = () => {
          if (!provider) return `ID do Prestador: ${invite.provider_id}`;
          
          const type = invite.provider_type === 'App\\Models\\Professional' ? 'Profissional' : 'Clínica';
          let details = [`Tipo: ${type}`, `Nome: ${provider.name}`];
          
          if (invite.provider_type === 'App\\Models\\Professional') {
            if (provider.specialty) details.push(`Especialidade: ${provider.specialty}`);
            if (provider.professional_type) details.push(`Tipo: ${provider.professional_type}`);
            if (provider.council_number) details.push(`Conselho: ${provider.council_type} ${provider.council_number}`);
            if (provider.city && provider.state) details.push(`Localização: ${provider.city} - ${provider.state}`);
            if (provider.address) details.push(`Endereço: ${provider.address}`);
          } else {
            if (provider.addresses && provider.addresses.length > 0) {
              details.push('Endereços:');
              provider.addresses.forEach((addr: any, index: number) => {
                const prefix = index === 0 ? '• Principal: ' : `• ${index + 1}: `;
                details.push(`${prefix}${addr.address}, ${addr.city} - ${addr.state}`);
              });
            }
          }
          
          return details.join('\n');
        };
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <span className="text-sm hover:text-blue-600 transition-colors">{getProviderSummary()}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs whitespace-pre-line">
                <p>{getTooltipContent()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    }] : []),
    {
      accessorKey: 'created_at',
      header: 'Data do Convite',
      cell: ({ row }: any) => format(new Date(row.original.created_at), 'dd/MM/yyyy HH:mm'),
    },
    // Coluna adicional apenas para admins
    ...(isAdmin() ? [{
      accessorKey: 'solicitation.priority',
      header: 'Prioridade',
      cell: ({ row }: any) => {
        const priority = row.original.solicitation.priority;
        const priorityMap: Record<string, { label: string; color: string }> = {
          low: { label: 'Baixa', color: 'green' },
          medium: { label: 'Média', color: 'yellow' },
          high: { label: 'Alta', color: 'red' },
          urgent: { label: 'Urgente', color: 'destructive' },
        };
        const priorityInfo = priorityMap[priority] || { label: priority, color: 'default' };
        return <Badge variant={priorityInfo.color as any}>{priorityInfo.label}</Badge>;
      },
    }] : []),
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          {isAdmin() ? 'Convites Recebidos - Visão Administrativa' : 'Meus Convites'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isAdmin() 
            ? 'Gerencie todos os convites do sistema com informações detalhadas'
            : 'Visualize e responda aos convites enviados para você'
          }
        </p>
      </div>

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

            {/* Informações adicionais apenas para admins */}
            {isAdmin() && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-sm mb-2">Informações Adicionais (Admin)</h3>
                <div className="space-y-1 text-xs">
                  <div><strong>Plano de Saúde:</strong> {selectedInvite.solicitation.health_plan.name}</div>
                  <div><strong>ANS:</strong> {selectedInvite.solicitation.health_plan.ans_code}</div>
                  <div><strong>Prioridade:</strong> {selectedInvite.solicitation.priority}</div>
                  <div><strong>Tipo de Prestador:</strong> {selectedInvite.provider_type === 'App\\Models\\Professional' ? 'Profissional' : 'Clínica'}</div>
                  <div><strong>ID do Prestador:</strong> {selectedInvite.provider_id}</div>
                  {selectedInvite.provider && (
                    <div><strong>Nome do Prestador:</strong> {selectedInvite.provider.name}</div>
                  )}
                </div>
              </div>
            )}

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

            {/* Informações adicionais apenas para admins */}
            {isAdmin() && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-sm mb-2">Informações Adicionais (Admin)</h3>
                <div className="space-y-1 text-xs">
                  <div><strong>Plano de Saúde:</strong> {selectedInvite.solicitation.health_plan.name}</div>
                  <div><strong>ANS:</strong> {selectedInvite.solicitation.health_plan.ans_code}</div>
                  <div><strong>Prioridade:</strong> {selectedInvite.solicitation.priority}</div>
                  <div><strong>Tipo de Prestador:</strong> {selectedInvite.provider_type === 'App\\Models\\Professional' ? 'Profissional' : 'Clínica'}</div>
                  <div><strong>ID do Prestador:</strong> {selectedInvite.provider_id}</div>
                  {selectedInvite.provider && (
                    <div><strong>Nome do Prestador:</strong> {selectedInvite.provider.name}</div>
                  )}
                </div>
              </div>
            )}

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