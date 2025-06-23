"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getExtemporaneousNegotiations, ExtemporaneousNegotiation, approveExtemporaneousNegotiation, rejectExtemporaneousNegotiation, formalizeExtemporaneousNegotiation, cancelExtemporaneousNegotiation } from "@/services/extemporaneous-negotiations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EyeIcon, PlusIcon, CheckCircle, AlertCircle, FileText, XCircle } from "lucide-react";
import { formatDate } from "@/app/utils/format";
import { parseISO } from "date-fns";
import Link from 'next/link';
import { usePermissions } from '@/app/hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/app/components/ui/loading-spinner';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { FilterIcon, Search, CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";

const formSchema = z.object({
  approval_notes: z.string().optional(),
});

const rejectFormSchema = z.object({
  rejection_notes: z.string({
    required_error: 'Informe o motivo da rejeição',
  }).min(10, 'O motivo deve ter pelo menos 10 caracteres'),
});

const formalizeFormSchema = z.object({
  addendum_number: z.string({
    required_error: 'Informe o número do aditivo',
  }),
  formalization_notes: z.string().optional(),
});

const cancelFormSchema = z.object({
  cancellation_notes: z.string({
    required_error: 'Informe o motivo do cancelamento',
  }).min(10, 'O motivo deve ter pelo menos 10 caracteres'),
});

type FormData = z.infer<typeof formSchema>;
type RejectFormData = z.infer<typeof rejectFormSchema>;
type FormalizeFormData = z.infer<typeof formalizeFormSchema>;
type CancelFormData = z.infer<typeof cancelFormSchema>;

interface ApiResponse<T> {
  status: string;
  data: T;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export default function PaginaNegociacoesExtemporaneas() {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  
  const [filtroStatus, setFiltroStatus] = useState<string>("all");
  const [termoBusca, setTermoBusca] = useState("");
  const [buscaTuss, setBuscaTuss] = useState("");
  const [filtroTipoEntidade, setFiltroTipoEntidade] = useState<string>("all");
  const [dataInicial, setDataInicial] = useState<Date | null>(null);
  const [dataFinal, setDataFinal] = useState<Date | null>(null);
  const [paginacao, setPaginacao] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [selectedNegotiation, setSelectedNegotiation] = useState<ExtemporaneousNegotiation | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showFormalizeModal, setShowFormalizeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { data, isLoading: queryLoading, refetch } = useQuery({
    queryKey: ['extemporaneous-negotiations', paginacao.pageIndex + 1, paginacao.pageSize, filtroStatus, termoBusca, buscaTuss, filtroTipoEntidade, dataInicial, dataFinal],
    queryFn: async () => {
      const response = await getExtemporaneousNegotiations({
        page: paginacao.pageIndex + 1,
        per_page: paginacao.pageSize,
        status: filtroStatus && filtroStatus !== 'all' ? filtroStatus : undefined,
        search: termoBusca || buscaTuss || undefined,
        entity_type: filtroTipoEntidade && filtroTipoEntidade !== 'all' ? filtroTipoEntidade : undefined,
        from_date: dataInicial ? formatDate(dataInicial, "yyyy-MM-dd") : undefined,
        to_date: dataFinal ? formatDate(dataFinal, "yyyy-MM-dd") : undefined,
      });
      return response.data;
    },
  });

  const approveForm = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const rejectForm = useForm<RejectFormData>({
    resolver: zodResolver(rejectFormSchema),
  });

  const formalizeForm = useForm<FormalizeFormData>({
    resolver: zodResolver(formalizeFormSchema),
  });

  const cancelForm = useForm<CancelFormData>({
    resolver: zodResolver(cancelFormSchema),
  });

  const handleApprove = async (data: FormData) => {
    if (!selectedNegotiation) return;

    setIsActionLoading(true);
    try {
      await approveExtemporaneousNegotiation(selectedNegotiation.id, {
        approval_notes: data.approval_notes
      });
      toast({
        title: "Sucesso",
        description: "Negociação aprovada com sucesso"
      });
      setShowApproveModal(false);
      setSelectedNegotiation(null);
      approveForm.reset();
      refetch();
    } catch (error) {
      console.error('Error approving negotiation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aprovar a negociação",
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReject = async (data: RejectFormData) => {
    if (!selectedNegotiation) return;

    setIsActionLoading(true);
    try {
      await rejectExtemporaneousNegotiation(selectedNegotiation.id, {
        rejection_notes: data.rejection_notes
      });
      toast({
        title: "Sucesso",
        description: "Negociação rejeitada com sucesso"
      });
      setShowRejectModal(false);
      setSelectedNegotiation(null);
      rejectForm.reset();
      refetch();
    } catch (error) {
      console.error('Error rejecting negotiation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar a negociação",
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleFormalize = async (data: FormalizeFormData) => {
    if (!selectedNegotiation) return;

    setIsActionLoading(true);
    try {
      await formalizeExtemporaneousNegotiation(selectedNegotiation.id, {
        addendum_number: data.addendum_number,
        formalization_notes: data.formalization_notes
      });
      toast({
        title: "Sucesso",
        description: "Negociação formalizada com sucesso"
      });
      setShowFormalizeModal(false);
      setSelectedNegotiation(null);
      formalizeForm.reset();
      refetch();
    } catch (error) {
      console.error('Error formalizing negotiation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível formalizar a negociação",
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async (data: CancelFormData) => {
    if (!selectedNegotiation) return;

    setIsActionLoading(true);
    try {
      await cancelExtemporaneousNegotiation(selectedNegotiation.id, {
        cancellation_notes: data.cancellation_notes
      });
      toast({
        title: "Sucesso",
        description: "Negociação cancelada com sucesso"
      });
      setShowCancelModal(false);
      setSelectedNegotiation(null);
      cancelForm.reset();
      refetch();
    } catch (error) {
      console.error('Error cancelling negotiation:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a negociação",
        variant: "destructive"
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const varianteBadgeStatus = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'outline';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'formalized':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'default';
    }
  };
  
  const columns: ColumnDef<ExtemporaneousNegotiation>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
    },
    {
      accessorKey: "negotiable",
      header: "Entidade",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          <div className="font-medium">{row.original.negotiable.name}</div>
          <div className="text-sm text-muted-foreground">
            {row.original.negotiable_type === 'App\\Models\\Clinic' ? 'Clínica' : 'Profissional'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tuss",
      header: "Procedimento",
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <div className="font-medium">{row.original.tuss?.description}</div>
          <div className="text-sm text-muted-foreground">
            Código TUSS: {row.original.tuss?.code}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "negotiated_price",
      header: "Valor Negociado",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          R$ {Number(row.getValue("negotiated_price")).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={varianteBadgeStatus(status)}>
            {status === 'pending_approval' ? 'Pendente' :
             status === 'approved' ? 'Aprovado' :
             status === 'rejected' ? 'Rejeitado' :
             status === 'formalized' ? 'Formalizado' :
             status === 'cancelled' ? 'Cancelado' : status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Criado em",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          {formatDate(parseISO(row.getValue("created_at")), "dd/MM/yyyy HH:mm")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const negotiation = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/negotiations/extemporaneous/${negotiation.id}`)}
            >
              <EyeIcon className="h-4 w-4" />
              <span className="sr-only">Ver detalhes</span>
            </Button>
            
            {negotiation.status === 'pending_approval' && hasPermission('approve extemporaneous negotiations') && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedNegotiation(negotiation);
                    setShowApproveModal(true);
                  }}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="sr-only">Aprovar</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedNegotiation(negotiation);
                    setShowRejectModal(true);
                  }}
                >
                  <AlertCircle className="h-4 w-4" />
                  <span className="sr-only">Rejeitar</span>
                </Button>
              </>
            )}
            
            {negotiation.status === 'approved' && hasPermission('formalize extemporaneous negotiations') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedNegotiation(negotiation);
                  setShowFormalizeModal(true);
                }}
              >
                <FileText className="h-4 w-4" />
                <span className="sr-only">Formalizar</span>
              </Button>
            )}

            {(negotiation.status === 'pending_approval' || negotiation.status === 'approved') && 
             hasPermission('cancel extemporaneous negotiations') && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedNegotiation(negotiation);
                  setShowCancelModal(true);
                }}
              >
                <XCircle className="h-4 w-4" />
                <span className="sr-only">Cancelar</span>
              </Button>
            )}
          </div>
        );
      },
    },
  ];
  
  // Verifica se o usuário tem permissão para criar negociações
  const podeCriarNegociacao = hasPermission('create extemporaneous negotiations');
  
  // Filtra negociações por status
  const negociacoes = data?.data?.data || [];
  const negociacoesPendentes = negociacoes.filter((n: ExtemporaneousNegotiation) => n.status === 'pending_approval');
  const negociacoesAprovadas = negociacoes.filter((n: ExtemporaneousNegotiation) => n.status === 'approved');
  const negociacoesRejeitadas = negociacoes.filter((n: ExtemporaneousNegotiation) => n.status === 'rejected');
  const negociacoesFormalizadas = negociacoes.filter((n: ExtemporaneousNegotiation) => n.status === 'formalized');
  const negociacoesCanceladas = negociacoes.filter((n: ExtemporaneousNegotiation) => n.status === 'cancelled');

  // Cria um componente de estado vazio
  const EstadoVazio = ({mensagem}: {mensagem: string}) => (
    <div className="text-center py-10">
      <p className="text-muted-foreground">{mensagem}</p>
    </div>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Negociações Extemporâneas</h1>
          <p className="text-muted-foreground">
            Gerenciar negociações de procedimentos excepcionais fora dos contratos padrão
          </p>
        </div>
        {podeCriarNegociacao && (
          <Link href="/negotiations/extemporaneous/new">
            <Button variant="default" size="lg" className="gap-2">
              <PlusIcon className="w-4 h-4" /> Nova Negociação
            </Button>
          </Link>
        )}
      </div>
      
      {/* Filtros de Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Busca por texto */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar por profissional/clínica</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome do profissional ou clínica..."
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Busca por código TUSS */}
            <div className="space-y-2">
              <Label htmlFor="tuss-search">Buscar por código TUSS</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tuss-search"
                  placeholder="Código TUSS..."
                  value={buscaTuss}
                  onChange={(e) => setBuscaTuss(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending_approval">Pendente</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                  <SelectItem value="formalized">Formalizado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por tipo de entidade */}
            <div className="space-y-2">
              <Label htmlFor="entity-type">Tipo de Entidade</Label>
              <Select value={filtroTipoEntidade} onValueChange={setFiltroTipoEntidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="App\\Models\\Clinic">Clínica</SelectItem>
                  <SelectItem value="App\\Models\\Professional">Profissional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por data inicial */}
            <div className="space-y-2">
              <Label htmlFor="start-date">Data Inicial</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start-date"
                  type="date"
                  value={dataInicial ? formatDate(dataInicial, "yyyy-MM-dd") : ""}
                  onChange={(e) => setDataInicial(e.target.value ? new Date(e.target.value) : null)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por data final */}
            <div className="space-y-2">
              <Label htmlFor="end-date">Data Final</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="end-date"
                  type="date"
                  value={dataFinal ? formatDate(dataFinal, "yyyy-MM-dd") : ""}
                  onChange={(e) => setDataFinal(e.target.value ? new Date(e.target.value) : null)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Botões de ação dos filtros */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {negociacoes.length > 0 && (
                <span>
                  {negociacoes.length} negociação{negociacoes.length !== 1 ? 'ões' : ''} encontrada{negociacoes.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTermoBusca("");
                  setBuscaTuss("");
                  setFiltroTipoEntidade("all");
                  setDataInicial(null);
                  setDataFinal(null);
                  setFiltroStatus("all");
                }}
              >
                Limpar Filtros
              </Button>
              <Button
                size="sm"
                onClick={() => refetch()}
              >
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Negociações</CardTitle>
            <CardDescription>
              Todas as negociações extemporâneas que necessitam de aprovação fora dos termos contratuais padrão
            </CardDescription>
          </div>
          {podeCriarNegociacao && (
            <Link href="/negotiations/extemporaneous/new">
              <Button variant="outline" size="sm" className="gap-2">
                <PlusIcon className="w-4 h-4" /> Nova
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {queryLoading ? (
            <div className="flex justify-center items-center p-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <Tabs defaultValue="pending">
              <TabsList className="mb-4">
                <TabsTrigger value="pending">
                  Pendentes ({negociacoesPendentes.length})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Aprovadas ({negociacoesAprovadas.length})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Rejeitadas ({negociacoesRejeitadas.length})
                </TabsTrigger>
                <TabsTrigger value="formalized">
                  Formalizadas ({negociacoesFormalizadas.length})
                </TabsTrigger>
                <TabsTrigger value="cancelled">
                  Canceladas ({negociacoesCanceladas.length})
                </TabsTrigger>
                <TabsTrigger value="all">
                  Todas ({negociacoes.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="pending">
                {negociacoesPendentes.length > 0 ? (
                  <DataTable 
                    columns={columns} 
                    data={negociacoesPendentes}
                  />
                ) : (
                  <EstadoVazio mensagem="Nenhuma negociação pendente encontrada" />
                )}
              </TabsContent>
              
              <TabsContent value="approved">
                {negociacoesAprovadas.length > 0 ? (
                  <DataTable 
                    columns={columns} 
                    data={negociacoesAprovadas}
                  />
                ) : (
                  <EstadoVazio mensagem="Nenhuma negociação aprovada encontrada" />
                )}
              </TabsContent>
              
              <TabsContent value="rejected">
                {negociacoesRejeitadas.length > 0 ? (
                  <DataTable 
                    columns={columns} 
                    data={negociacoesRejeitadas}
                  />
                ) : (
                  <EstadoVazio mensagem="Nenhuma negociação rejeitada encontrada" />
                )}
              </TabsContent>

              <TabsContent value="formalized">
                {negociacoesFormalizadas.length > 0 ? (
                  <DataTable 
                    columns={columns} 
                    data={negociacoesFormalizadas}
                  />
                ) : (
                  <EstadoVazio mensagem="Nenhuma negociação formalizada encontrada" />
                )}
              </TabsContent>

              <TabsContent value="cancelled">
                {negociacoesCanceladas.length > 0 ? (
                  <DataTable 
                    columns={columns} 
                    data={negociacoesCanceladas}
                  />
                ) : (
                  <EstadoVazio mensagem="Nenhuma negociação cancelada encontrada" />
                )}
              </TabsContent>
              
              <TabsContent value="all">
                {negociacoes.length > 0 ? (
                  <DataTable 
                    columns={columns} 
                    data={negociacoes}
                  />
                ) : (
                  <EstadoVazio mensagem="Nenhuma negociação encontrada" />
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Negociação</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja aprovar esta negociação?
            </DialogDescription>
          </DialogHeader>
          
          <Form {...approveForm}>
            <form onSubmit={approveForm.handleSubmit(handleApprove)} className="space-y-4">
              <FormField
                control={approveForm.control}
                name="approval_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Observações sobre a aprovação (opcional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowApproveModal(false)}
                  disabled={isActionLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isActionLoading}>
                  {isActionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Aprovando...
                    </>
                  ) : (
                    'Aprovar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Negociação</DialogTitle>
            <DialogDescription>
              Por favor, informe o motivo da rejeição.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...rejectForm}>
            <form onSubmit={rejectForm.handleSubmit(handleReject)} className="space-y-4">
              <FormField
                control={rejectForm.control}
                name="rejection_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da Rejeição</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Informe o motivo da rejeição"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowRejectModal(false)}
                  disabled={isActionLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Rejeitando...
                    </>
                  ) : (
                    'Rejeitar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Formalize Modal */}
      <Dialog open={showFormalizeModal} onOpenChange={setShowFormalizeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Formalizar Negociação</DialogTitle>
            <DialogDescription>
              Informe os dados do aditivo contratual.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...formalizeForm}>
            <form onSubmit={formalizeForm.handleSubmit(handleFormalize)} className="space-y-4">
              <FormField
                control={formalizeForm.control}
                name="addendum_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Aditivo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ex: 001/2024"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={formalizeForm.control}
                name="formalization_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Observações sobre a formalização (opcional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFormalizeModal(false)}
                  disabled={isActionLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Formalizando...
                    </>
                  ) : (
                    'Formalizar'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Negociação</DialogTitle>
            <DialogDescription>
              Por favor, informe o motivo do cancelamento.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...cancelForm}>
            <form onSubmit={cancelForm.handleSubmit(handleCancel)} className="space-y-4">
              <FormField
                control={cancelForm.control}
                name="cancellation_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo do Cancelamento</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Informe o motivo do cancelamento"
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  disabled={isActionLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    'Cancelar Negociação'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 