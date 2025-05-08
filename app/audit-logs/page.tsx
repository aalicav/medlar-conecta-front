'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/services/api-client';
import { toast } from '@/components/ui/use-toast';
import AuditDetailModal from './components/AuditDetailModal';

type Audit = {
  id: number;
  event: 'created' | 'updated' | 'deleted' | 'restored';
  auditable_type: string;
  auditable_id: number;
  user_id: number;
  user_type: string;
  old_values: any;
  new_values: any;
  url?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at?: string;
  formatted_date: string;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  auditable: {
    id: number;
    type: string;
    name: string;
  } | null;
};

type AuditStatistics = {
  total: number;
  created: number;
  updated: number;
  deleted: number;
  restored: number;
  recent: Audit[];
  by_model: Array<{
    auditable_type: string;
    count: number;
  }>;
};

export default function AuditLogsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [audits, setAudits] = useState<Audit[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    perPage: 15,
  });
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Filters state
  const [filters, setFilters] = useState({
    user_id: '',
    event: '',
    auditable_type: '',
    auditable_id: '',
    start_date: null as Date | null,
    end_date: null as Date | null,
    sort_field: 'created_at',
    sort_order: 'desc',
  });

  // Columns definition for the data table
  const columns: ColumnDef<Audit>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'event',
      header: 'Evento',
      cell: ({ row }) => {
        const event = row.getValue('event') as string;
        return (
          <Badge 
            variant={
              event === 'created' ? 'success' : 
              event === 'updated' ? 'warning' : 
              event === 'deleted' ? 'destructive' : 
              'outline'
            }
          >
            {
              event === 'created' ? 'Criado' : 
              event === 'updated' ? 'Atualizado' : 
              event === 'deleted' ? 'Excluído' : 
              event === 'restored' ? 'Restaurado' : 
              event
            }
          </Badge>
        );
      },
    },
    {
      accessorKey: 'auditable',
      header: 'Entidade',
      cell: ({ row }) => {
        const auditable = row.original.auditable;
        return auditable ? (
          <div className="flex flex-col">
            <span className="font-medium">{auditable.name || 'N/A'}</span>
            <span className="text-xs text-muted-foreground">
              {auditable.type.replace('App\\Models\\', '')} #{auditable.id}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        );
      },
    },
    {
      accessorKey: 'user',
      header: 'Usuário',
      cell: ({ row }) => {
        const user = row.original.user;
        return user ? (
          <div className="flex flex-col">
            <span className="font-medium">{user.name || 'N/A'}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        ) : (
          <span className="text-muted-foreground">Sistema</span>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Data/Hora',
      cell: ({ row }) => {
        const date = row.original.created_at;
        return date ? format(new Date(date), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) : 'N/A';
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(row.original.id)}
          >
            Detalhes
          </Button>
        );
      },
    },
  ];

  const fetchAudits = async () => {
    setLoading(true);
    try {
      // Build query parameters based on filters
      const params = new URLSearchParams();
      
      if (filters.user_id) params.append('user_id', filters.user_id);
      if (filters.event) params.append('event', filters.event);
      if (filters.auditable_type) params.append('auditable_type', filters.auditable_type);
      if (filters.auditable_id) params.append('auditable_id', filters.auditable_id);
      
      if (filters.start_date) {
        const formattedDate = format(filters.start_date, 'yyyy-MM-dd');
        params.append('start_date', formattedDate);
      }
      
      if (filters.end_date) {
        const formattedDate = format(filters.end_date, 'yyyy-MM-dd');
        params.append('end_date', formattedDate);
      }
      
      params.append('sort_field', filters.sort_field);
      params.append('sort_order', filters.sort_order);
      params.append('page', pagination.page.toString());
      params.append('per_page', pagination.perPage.toString());
      
      const response = await api.get(`/audit-logs?${params.toString()}`);
      
      setAudits(response.data.data);
      setPagination({
        ...pagination,
        total: response.data.total,
      });
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
      toast({
        title: 'Erro',
        description: 'Falha ao buscar registros de auditoria',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/audit-logs/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to fetch audit statistics', error);
    }
  };

  const fetchAuditDetails = async (id: number) => {
    setDetailLoading(true);
    try {
      const response = await api.get(`/audit-logs/${id}`);
      setSelectedAudit(response.data);
      setModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch audit details', error);
      toast({
        title: 'Erro',
        description: 'Falha ao buscar detalhes do log de auditoria',
        variant: 'destructive',
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetails = (id: number) => {
    setSelectedAudit(null); // Reset selected audit
    fetchAuditDetails(id);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      user_id: '',
      event: '',
      auditable_type: '',
      auditable_id: '',
      start_date: null,
      end_date: null,
      sort_field: 'created_at',
      sort_order: 'desc',
    });
  };

  const handleApplyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchAudits();
  };

  useEffect(() => {
    fetchAudits();
    fetchStatistics();
  }, []);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Logs de Auditoria</h1>
        <Button 
          variant="outline" 
          onClick={() => {
            fetchAudits();
            fetchStatistics();
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">Todos os Logs</TabsTrigger>
          <TabsTrigger value="statistics">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
              <CardDescription>Filtre os logs de auditoria por diversos critérios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Evento</label>
                  <Select
                    value={filters.event}
                    onValueChange={(value) => handleFilterChange('event', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Criação</SelectItem>
                      <SelectItem value="updated">Atualização</SelectItem>
                      <SelectItem value="deleted">Exclusão</SelectItem>
                      <SelectItem value="restored">Restauração</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Entidade</label>
                  <Input
                    placeholder="Ex: App\Models\HealthPlan"
                    value={filters.auditable_type}
                    onChange={(e) => handleFilterChange('auditable_type', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ID da Entidade</label>
                  <Input
                    placeholder="Ex: 123"
                    value={filters.auditable_id}
                    onChange={(e) => handleFilterChange('auditable_id', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">ID do Usuário</label>
                  <Input
                    placeholder="Ex: 456"
                    value={filters.user_id}
                    onChange={(e) => handleFilterChange('user_id', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Inicial</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.start_date ? (
                          format(filters.start_date, 'dd/MM/yyyy', { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.start_date || undefined}
                        onSelect={(date) => handleFilterChange('start_date', date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data Final</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.end_date ? (
                          format(filters.end_date, 'dd/MM/yyyy', { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.end_date || undefined}
                        onSelect={(date) => handleFilterChange('end_date', date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" onClick={handleResetFilters}>
                  Limpar Filtros
                </Button>
                <Button onClick={handleApplyFilters}>
                  Aplicar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registros de Auditoria</CardTitle>
              <CardDescription>
                Visualize ações realizadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={audits}
                isLoading={loading}
              />
              {audits.length > 0 && (
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = pagination.page - 1;
                      if (newPage >= 1) {
                        setPagination(prev => ({ ...prev, page: newPage }));
                        fetchAudits();
                      }
                    }}
                    disabled={pagination.page <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newPage = pagination.page + 1;
                      if (newPage <= Math.ceil(pagination.total / pagination.perPage)) {
                        setPagination(prev => ({ ...prev, page: newPage }));
                        fetchAudits();
                      }
                    }}
                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.perPage)}
                  >
                    Próximo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {statistics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total de Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{statistics.total}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Criações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-green-600">{statistics.created}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Atualizações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-amber-600">{statistics.updated}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Exclusões</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-600">{statistics.deleted}</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Logs Recentes</CardTitle>
                    <CardDescription>
                      Últimas atividades registradas no sistema
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statistics.recent.map((audit) => (
                        <div key={audit.id} className="border-b pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge 
                                variant={
                                  audit.event === 'created' ? 'success' : 
                                  audit.event === 'updated' ? 'warning' : 
                                  audit.event === 'deleted' ? 'destructive' : 
                                  'outline'
                                }
                              >
                                {
                                  audit.event === 'created' ? 'Criado' : 
                                  audit.event === 'updated' ? 'Atualizado' : 
                                  audit.event === 'deleted' ? 'Excluído' : 
                                  audit.event === 'restored' ? 'Restaurado' : 
                                  audit.event
                                }
                              </Badge>
                              <p className="font-medium mt-1">
                                {audit.auditable?.name || 'Entidade desconhecida'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                por {audit.user?.name || 'Sistema'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end">
                              <p className="text-sm text-muted-foreground">
                                {audit.formatted_date ? 
                                  format(new Date(audit.formatted_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 
                                  'Data desconhecida'
                                }
                              </p>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="mt-1 h-7 px-2"
                                onClick={() => handleViewDetails(audit.id)}
                              >
                                Detalhes
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Atividade por Entidade</CardTitle>
                    <CardDescription>
                      Distribuição de logs por tipo de entidade
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {statistics.by_model.map((model) => (
                        <div key={model.auditable_type} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {model.auditable_type.replace('App\\Models\\', '')}
                            </p>
                          </div>
                          <Badge variant="secondary">{model.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Audit Detail Modal */}
      <AuditDetailModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        audit={selectedAudit}
        loading={detailLoading}
      />
    </div>
  );
} 