"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getExtemporaneousNegotiations, ExtemporaneousNegotiation } from "@/services/extemporaneous-negotiations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EyeIcon, PlusIcon } from "lucide-react";
import { formatDate } from "@/app/utils/format";
import { useAuth } from "@/app/hooks/auth";
import { parseISO } from "date-fns";
import Link from 'next/link';
import { usePermissions } from '@/app/hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/app/components/ui/loading-spinner';
import { useQuery } from '@tanstack/react-query';

export default function PaginaNegociacoesExtemporaneas() {
  const router = useRouter();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [paginacao, setPaginacao] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading: queryLoading, refetch } = useQuery({
    queryKey: ['extemporaneous-negotiations', paginacao.pageIndex + 1, paginacao.pageSize, filtroStatus],
    queryFn: () => getExtemporaneousNegotiations({
      page: paginacao.pageIndex + 1,
      per_page: paginacao.pageSize,
      status: filtroStatus || undefined,
    }),
  });

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
            {row.original.negotiable_type === 'App\\Models\\Clinic' ? 'Clínica' : 'Plano de Saúde'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tussProcedure",
      header: "Procedimento",
      cell: ({ row }) => (
        <div className="max-w-[300px]">
          <div className="font-medium">{row.original.tussProcedure.description}</div>
          <div className="text-sm text-muted-foreground">
            Código TUSS: {row.original.tussProcedure.code}
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
          </div>
        );
      },
    },
  ];
  
  // Verifica se o usuário tem permissão para criar negociações
  const podeCriarNegociacao = hasPermission('create extemporaneous negotiations');
  
  // Filtra negociações por status
  const negociacoes = data?.data?.data || [];
  const negociacoesPendentes = negociacoes.filter(n => n.status === 'pending_approval');
  const negociacoesAprovadas = negociacoes.filter(n => n.status === 'approved');
  const negociacoesRejeitadas = negociacoes.filter(n => n.status === 'rejected');
  const negociacoesFormalizadas = negociacoes.filter(n => n.status === 'formalized');
  const negociacoesCanceladas = negociacoes.filter(n => n.status === 'cancelled');

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
    </div>
  );
} 