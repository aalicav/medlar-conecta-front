'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDown, Download, Filter, RefreshCcw, Search, Send } from 'lucide-react';
import WhatsappService, { WhatsappMessage, WhatsappFilter, PaginatedResponse } from '@/app/services/whatsappService';

// Client component that uses useSearchParams
const WhatsAppMessagesContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [pagination, setPagination] = useState<Omit<PaginatedResponse<any>, 'data'>>({
    current_page: 1,
    from: 0,
    last_page: 1,
    per_page: 10,
    to: 0,
    total: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  
  // Initialize filters state using searchParams
  const initialFilters = {
    status: searchParams.get('status') || '',
    recipient: searchParams.get('recipient') || '',
    start_date: searchParams.get('start_date') || '',
    end_date: searchParams.get('end_date') || '',
    sort_field: searchParams.get('sort_field') || 'created_at',
    sort_order: searchParams.get('sort_order') || 'desc',
    per_page: searchParams.get('per_page') ? parseInt(searchParams.get('per_page') as string) : 10,
    page: searchParams.get('page') ? parseInt(searchParams.get('page') as string) : 1,
  };
  
  const [filters, setFilters] = useState<WhatsappFilter>(initialFilters);
  
  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const response = await WhatsappService.getMessages(filters);
      setMessages(response.data);
      
      const { data, ...paginationData } = response;
      setPagination(paginationData);
      
      setError(null);
    } catch (err) {
      setError('Erro ao carregar mensagens do WhatsApp');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);
  
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);
  
  const applyFilters = useCallback(() => {
    const newFilters = {
      ...filters,
      page: 1, // Reset to first page on filter change
    };
    
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value.toString());
      }
    });
    
    router.push(`/dashboard/whatsapp/mensagens?${params.toString()}`);
  }, [filters, router]);
  
  const resetFilters = useCallback(() => {
    const defaultFilters = {
      status: '',
      recipient: '',
      start_date: '',
      end_date: '',
      sort_field: 'created_at',
      sort_order: 'desc',
      per_page: 10,
      page: 1,
    };
    
    setFilters(defaultFilters);
    router.push('/dashboard/whatsapp/mensagens');
  }, [router]);
  
  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({
      ...prev,
      page,
    }));
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/dashboard/whatsapp/mensagens?${params.toString()}`);
  }, [searchParams, router]);
  
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', variant: 'outline', className: 'bg-amber-50 text-amber-700 border-amber-200' },
      sent: { label: 'Enviado', variant: 'outline', className: 'bg-blue-50 text-blue-700 border-blue-200' },
      delivered: { label: 'Entregue', variant: 'outline', className: 'bg-teal-50 text-teal-700 border-teal-200' },
      read: { label: 'Lido', variant: 'outline', className: 'bg-purple-50 text-purple-700 border-purple-200' },
      failed: { label: 'Falha', variant: 'outline', className: 'bg-red-50 text-red-700 border-red-200' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mensagens de WhatsApp</h1>
          <p className="text-gray-500">Gerenciar e monitorar mensagens enviadas</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/whatsapp">Voltar ao Dashboard</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/whatsapp/nova-mensagem">Nova Mensagem</Link>
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Filtros</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {filterOpen ? 'Esconder Filtros' : 'Mostrar Filtros'}
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        
        {filterOpen && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Status</label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) => setFilters({...filters, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="read">Lido</SelectItem>
                    <SelectItem value="failed">Falha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Telefone</label>
                <Input
                  placeholder="Número do destinatário"
                  value={filters.recipient || ''}
                  onChange={(e) => setFilters({...filters, recipient: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Data Inicial</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.start_date ? format(new Date(filters.start_date), 'PPP', { locale: ptBR }) : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.start_date ? new Date(filters.start_date) : undefined}
                      onSelect={(date) => setFilters({...filters, start_date: date ? format(date, 'yyyy-MM-dd') : ''})}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Data Final</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.end_date ? format(new Date(filters.end_date), 'PPP', { locale: ptBR }) : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.end_date ? new Date(filters.end_date) : undefined}
                      onSelect={(date) => setFilters({...filters, end_date: date ? format(date, 'yyyy-MM-dd') : ''})}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Ordenar por</label>
                <Select
                  value={filters.sort_field || 'created_at'}
                  onValueChange={(value) => setFilters({...filters, sort_field: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Campo de ordenação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Data de Criação</SelectItem>
                    <SelectItem value="sent_at">Data de Envio</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="recipient">Destinatário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Ordem</label>
                <Select
                  value={filters.sort_order || 'desc'}
                  onValueChange={(value) => setFilters({...filters, sort_order: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ordem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Decrescente</SelectItem>
                    <SelectItem value="asc">Crescente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Itens por página</label>
                <Select
                  value={filters.per_page?.toString() || '10'}
                  onValueChange={(value) => setFilters({...filters, per_page: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Itens por página" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetFilters}>
                Limpar Filtros
              </Button>
              <Button onClick={applyFilters}>
                Aplicar Filtros
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 flex items-center">
          <span className="mr-2">⚠️</span>
          {error}
        </div>
      )}
      
      <Card>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">ID</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Última atualização</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={7} className="h-14">
                        <div className="h-4 bg-gray-100 rounded-md animate-pulse"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhuma mensagem encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>{message.id}</TableCell>
                      <TableCell>{message.recipient}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {message.message || (message.media_url ? '📎 Arquivo anexado' : '—')}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(message.status)}</TableCell>
                      <TableCell>
                        {message.sent_at ? format(new Date(message.sent_at), 'dd/MM/yyyy HH:mm') : '—'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(message.updated_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/dashboard/whatsapp/mensagens/${message.id}`}>
                              Detalhes
                            </Link>
                          </Button>
                          
                          {message.status === 'failed' && (
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={async () => {
                                try {
                                  await WhatsappService.resendMessage(message.id);
                                  fetchMessages();
                                } catch (err) {
                                  console.error('Erro ao reenviar mensagem:', err);
                                }
                              }}
                            >
                              <RefreshCcw className="h-4 w-4 mr-1" />
                              Reenviar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {!loading && pagination.last_page > 1 && (
            <div className="py-4 px-6 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Mostrando {pagination.from} a {pagination.to} de {pagination.total} mensagens
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => handlePageChange(Math.max(1, pagination.current_page - 1))}
                      className={pagination.current_page <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, pagination.last_page) }).map((_, i) => {
                    let pageNum: number;
                    
                    if (pagination.last_page <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.current_page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.current_page >= pagination.last_page - 2) {
                      pageNum = pagination.last_page - 4 + i;
                    } else {
                      pageNum = pagination.current_page - 2 + i;
                    }
                    
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink
                          isActive={pageNum === pagination.current_page}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => handlePageChange(Math.min(pagination.last_page, pagination.current_page + 1))}
                      className={pagination.current_page >= pagination.last_page ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Main page component with Suspense boundary
export default function WhatsAppMessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <WhatsAppMessagesContent />
    </Suspense>
  );
} 