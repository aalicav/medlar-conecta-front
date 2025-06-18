"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getExtemporaneousNegotiations } from "@/services/extemporaneous-negotiations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EyeIcon, FilterIcon, CalendarIcon, PencilIcon, PlusIcon, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { formatDate, formatMoney } from "@/app/utils/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/app/hooks/auth";
import { parseISO } from "date-fns";
import Link from 'next/link';
import { usePermissions } from '@/app/hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/app/components/ui/loading-spinner';
import { Plus } from 'lucide-react';
import { ExceptionForm } from '../components/ExceptionForm';
import { negotiationService } from '@/services/negotiationService';
import { toast } from "@/components/ui/use-toast"
import { Search } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

interface NegociacaoExtemporanea {
  id: number;
  contract_id: number;
  contract: {
    id: number;
    contract_number: string;
  };
  tuss: {
    id: number;
    code: string;
    description: string;
  };
  requested_value: number;
  approved_value: number | null;
  justification: string;
  approval_notes: string | null;
  rejection_reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  urgency_level: 'low' | 'medium' | 'high';
  requested_by: number;
  approved_by: number | null;
  approved_at: string | null;
  is_requiring_addendum: boolean;
  addendum_included: boolean;
  addendum_number: string | null;
  addendum_date: string | null;
  addendum_notes: string | null;
  addendum_updated_by: number | null;
  created_at: string;
  updated_at: string;
  requestedBy: {
    id: number;
    name: string;
  };
  approvedBy: {
    id: number;
    name: string;
  } | null;
  pricingContract: {
    id: number;
    price: number;
    notes: string;
    start_date: string;
    end_date: string | null;
  } | null;
}

interface ExceptionNegotiation {
  id: number;
  patient: {
    id: number;
    name: string;
  };
  tuss: {
    id: number;
    code: string;
    description: string;
  };
  proposed_value: number;
  justification: string;
  status: 'pending_approval' | 'approved' | 'formalized';
  created_at: string;
  updated_at: string;
  creator?: {
    id: number;
    name: string;
  };
  approver?: {
    id: number;
    name: string;
  };
  notes?: string;
}

// Especialidades médicas
const especialidades = [
  'Cardiologia',
  'Dermatologia',
  'Endocrinologia',
  'Gastroenterologia',
  'Neurologia',
  'Obstetrícia',
  'Oftalmologia',
  'Ortopedia',
  'Pediatria',
  'Psiquiatria',
  'Radiologia',
  'Urologia'
];

const formSchema = z.object({
  approved_value: z.number({
    required_error: 'Informe o valor aprovado',
  }).min(0, 'O valor deve ser maior que zero'),
  approval_notes: z.string().optional(),
  is_requiring_addendum: z.boolean().default(false),
});

type FormData = z.infer<typeof formSchema>;

export default function PaginaNegociacoesExtemporaneas() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  
  // States
  const [negociacoes, setNegociacoes] = useState<NegociacaoExtemporanea[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [dataInicial, setDataInicial] = useState<Date | null>(null);
  const [dataFinal, setDataFinal] = useState<Date | null>(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroEspecialidade, setFiltroEspecialidade] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [exceptions, setExceptions] = useState<ExceptionNegotiation[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [paginacao, setPaginacao] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedNegotiation, setSelectedNegotiation] = useState<NegociacaoExtemporanea | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isMarkingAddendum, setIsMarkingAddendum] = useState(false);

  const { data, isLoading: queryLoading, refetch } = useQuery({
    queryKey: ['extemporaneous-negotiations', paginacao.pageIndex + 1, paginacao.pageSize, {
      status: filtroStatus || undefined,
      from_date: dataInicial ? formatDate(dataInicial, "yyyy-MM-dd") : undefined,
      to_date: dataFinal ? formatDate(dataFinal, "yyyy-MM-dd") : undefined,
      search: termoBusca || undefined,
    }],
    queryFn: () => getExtemporaneousNegotiations({
      page: paginacao.pageIndex + 1,
      per_page: paginacao.pageSize,
      ...{
        status: filtroStatus || undefined,
        from_date: dataInicial ? formatDate(dataInicial, "yyyy-MM-dd") : undefined,
        to_date: dataFinal ? formatDate(dataFinal, "yyyy-MM-dd") : undefined,
        search: termoBusca || undefined,
      },
    }),
  });

  const approveForm = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      is_requiring_addendum: false,
    },
  });

  const rejectForm = useForm<{ rejection_reason: string }>({
    resolver: zodResolver(z.object({
      rejection_reason: z.string({
        required_error: 'Informe o motivo da rejeição',
      }).min(10, 'O motivo deve ter pelo menos 10 caracteres'),
    })),
  });

  const addendumForm = useForm<{
    addendum_number: string;
    addendum_date: string;
    notes?: string;
  }>({
    resolver: zodResolver(z.object({
      addendum_number: z.string({
        required_error: 'Informe o número do aditivo',
      }),
      addendum_date: z.string({
        required_error: 'Informe a data do aditivo',
      }),
      notes: z.string().optional(),
    })),
  });

  const handleSubmit = useCallback(async (data: {
    patient_id: number;
    tuss_id: number;
    proposed_value: number;
    justification: string;
  }) => {
    try {
      await negotiationService.createException(data);
      setIsFormOpen(false);
      await refetch();
      toast({
        title: "Exceção criada com sucesso",
        description: "A solicitação de exceção foi enviada com sucesso",
        variant: "success"
      });
    } catch (error) {
      console.error('Error creating exception:', error);
      toast({
        title: "Erro ao criar exceção",
        description: "Não foi possível criar a solicitação de exceção",
        variant: "destructive"
      });
    }
  }, [refetch]);

  const handleApprove = async (data: FormData) => {
    if (!selectedNegotiation) return;

    try {
      setIsApproving(true);
      await negotiationService.approveExtemporaneousNegotiation(selectedNegotiation.id, data);
      toast({
        title: 'Sucesso',
        description: 'Negociação aprovada com sucesso',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao aprovar negociação',
        variant: 'destructive',
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (data: { rejection_reason: string }) => {
    if (!selectedNegotiation) return;

    try {
      setIsRejecting(true);
      await negotiationService.rejectExtemporaneousNegotiation(selectedNegotiation.id, data);
      toast({
        title: 'Sucesso',
        description: 'Negociação rejeitada com sucesso',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao rejeitar negociação',
        variant: 'destructive',
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleMarkAsAddendumIncluded = async (data: {
    addendum_number: string;
    addendum_date: string;
    notes?: string;
  }) => {
    if (!selectedNegotiation) return;

    try {
      setIsMarkingAddendum(true);
      await negotiationService.markExtemporaneousNegotiationAsAddendumIncluded(selectedNegotiation.id, data);
      toast({
        title: 'Sucesso',
        description: 'Negociação marcada como incluída em aditivo com sucesso',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao marcar negociação como incluída em aditivo',
        variant: 'destructive',
      });
    } finally {
      setIsMarkingAddendum(false);
    }
  };

  const varianteBadgeStatus = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'destructive';
      default:
        return 'default';
    }
  };
  
  const varianteBadgeUrgencia = (level: string) => {
    switch (level) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };
  
  const columns: ColumnDef<NegociacaoExtemporanea>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
    },
    {
      accessorKey: "contract.contract_number",
      header: "Contrato",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          #{row.original.contract.contract_number}
        </div>
      ),
    },
    {
      accessorKey: "tuss",
      header: "Procedimento",
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <div className="font-medium">{row.original.tuss.description}</div>
          <div className="text-sm text-muted-foreground">
            Código TUSS: {row.original.tuss.code}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "requested_value",
      header: "Valor Solicitado",
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          R$ {Number(row.getValue("requested_value")).toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "approved_value",
      header: "Valor Aprovado",
      cell: ({ row }) => {
        const value = row.getValue("approved_value");
        return (
          <div className="whitespace-nowrap">
            {value ? `R$ ${Number(value).toFixed(2)}` : "-"}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={varianteBadgeStatus(status)}>
            {status === 'pending' ? 'Pendente' :
             status === 'approved' ? 'Aprovado' :
             status === 'rejected' ? 'Rejeitado' : status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "urgency_level",
      header: "Urgência",
      cell: ({ row }) => {
        const level = row.getValue("urgency_level") as string;
        return (
          <Badge variant={varianteBadgeUrgencia(level)}>
            {level === 'low' ? 'Baixa' :
             level === 'medium' ? 'Média' :
             level === 'high' ? 'Alta' : level}
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
            
            {negotiation.status === 'pending' && hasPermission('approve negotiations') && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedNegotiation(negotiation)}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="sr-only">Aprovar</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Aprovar Negociação</DialogTitle>
                    </DialogHeader>
                    <Form {...approveForm}>
                      <form onSubmit={approveForm.handleSubmit(handleApprove)} className="space-y-4">
                        <FormField
                          control={approveForm.control}
                          name="approved_value"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Valor Aprovado</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={approveForm.control}
                          name="approval_notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observações</FormLabel>
                              <FormControl>
                                <Textarea {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={approveForm.control}
                          name="is_requiring_addendum"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(e) => field.onChange(e.target.checked)}
                                  />
                                  <Label>Requer aditivo contratual</Label>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setSelectedNegotiation(null)}
                            disabled={isApproving}
                          >
                            Cancelar
                          </Button>
                          <Button type="submit" disabled={isApproving}>
                            {isApproving ? 'Aprovando...' : 'Aprovar'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedNegotiation(negotiation)}
                >
                  <AlertCircle className="h-4 w-4" />
                  <span className="sr-only">Rejeitar</span>
                </Button>
              </>
            )}
            
            {negotiation.status === 'approved' && 
             negotiation.is_requiring_addendum && 
             !negotiation.addendum_included && 
             hasPermission('manage addendums') && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedNegotiation(negotiation)}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="sr-only">Registrar Aditivo</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Marcar como Incluída em Aditivo</DialogTitle>
                  </DialogHeader>
                  <Form {...addendumForm}>
                    <form onSubmit={addendumForm.handleSubmit(handleMarkAsAddendumIncluded)} className="space-y-4">
                      <FormField
                        control={addendumForm.control}
                        name="addendum_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do Aditivo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addendumForm.control}
                        name="addendum_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data do Aditivo</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={addendumForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Textarea {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSelectedNegotiation(null)}
                          disabled={isMarkingAddendum}
                        >
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={isMarkingAddendum}>
                          {isMarkingAddendum ? 'Marcando...' : 'Marcar'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        );
      },
    },
  ];
  
  // Verifica se o usuário tem papel na equipe comercial
  const isComercialTeam = user?.role === 'commercial_manager' || user?.role === 'director' || 
                           user?.role === 'admin' || user?.role === 'super_admin';
  
  // Verifica se o usuário tem permissão para criar negociações
  const podeCriarNegociacao = hasPermission('manage extemporaneous negotiations');
  
  // Filtra negociações por status
  const negociacoesPendentes = negociacoes.filter(n => n.status === 'pending');
  const negociacoesAprovadas = negociacoes.filter(n => n.status === 'approved');
  const negociacoesRejeitadas = negociacoes.filter(n => n.status === 'rejected');

  // Cria um componente de estado vazio para usar em vez da propriedade emptyMessage
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
        <Link href="/negotiations/extemporaneous/new">
          <Button variant="default" size="lg" className="gap-2">
            <PlusIcon className="w-4 h-4" /> Nova Negociação
          </Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Negociações</CardTitle>
            <CardDescription>
              Todas as negociações extemporâneas que necessitam de aprovação fora dos termos contratuais padrão
            </CardDescription>
          </div>
          <Link href="/negotiations/extemporaneous/new">
            <Button variant="outline" size="sm" className="gap-2">
              <PlusIcon className="w-4 h-4" /> Nova
            </Button>
          </Link>
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

      <ExceptionForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSubmit}
      />
    </div>
  );
} 