"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getExtemporaneousNegotiations } from "@/services/extemporaneous-negotiations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EyeIcon, FilterIcon, CalendarIcon, PencilIcon, PlusIcon } from "lucide-react";
import { formatDate, formatMoney } from "@/app/utils/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuth } from "@/app/hooks/auth";
import { parseISO } from "date-fns";
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { usePermissions } from '@/app/hooks/usePermissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/app/components/ui/loading-spinner';

interface NegociacaoExtemporanea {
  id: number;
  contract_id: number;
  contract: {
    contract_number: string;
  };
  tuss: {
    code: string;
    description: string;
  };
  requester_name: string;
  requested_value: number;
  approved_value: number | null;
  status: 'pending' | 'approved' | 'rejected';
  urgency_level: 'low' | 'medium' | 'high';
  created_at: string;
  approved_at: string | null;
  addendum_included: boolean;
  specialty?: string;
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

export default function PaginaNegociacoesExtemporaneas() {
  const router = useRouter();
  const { user } = useAuth();
  const [negociacoes, setNegociacoes] = useState<NegociacaoExtemporanea[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [dataInicial, setDataInicial] = useState<Date | null>(null);
  const [dataFinal, setDataFinal] = useState<Date | null>(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [paginacao, setPaginacao] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const { toast } = useToast();
  const { hasPermission, hasRole } = usePermissions();
  const [filtroEspecialidade, setFiltroEspecialidade] = useState<string>("");
  
  const buscarNegociacoes = async () => {
    setCarregando(true);
    try {
      const params: Record<string, any> = {
        page: paginacao.pageIndex + 1,
        per_page: paginacao.pageSize,
      };
      
      if (filtroStatus) {
        params.status = filtroStatus;
      }
      
      if (dataInicial) {
        params.from_date = formatDate(dataInicial, "yyyy-MM-dd");
      }
      
      if (dataFinal) {
        params.to_date = formatDate(dataFinal, "yyyy-MM-dd");
      }
      
      if (termoBusca) {
        params.search = termoBusca;
      }
      
      if (filtroEspecialidade) {
        params.specialty = filtroEspecialidade;
      }
      
      const response = await getExtemporaneousNegotiations(params);
      
      if (response?.data?.data) {
        // Adicionar especialidades aleatórias para fins de demonstração
        const dadosAprimorados = response.data.data.map((item: NegociacaoExtemporanea) => ({
          ...item,
          specialty: especialidades[Math.floor(Math.random() * especialidades.length)]
        }));
        setNegociacoes(dadosAprimorados);
      }
    } catch (error) {
      console.error("Erro ao buscar negociações extemporâneas:", error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar negociações extemporâneas',
        variant: 'destructive',
      });
    } finally {
      setCarregando(false);
    }
  };
  
  useEffect(() => {
    buscarNegociacoes();
  }, [paginacao.pageIndex, paginacao.pageSize, filtroStatus, dataInicial, dataFinal, termoBusca, filtroEspecialidade, toast]);
  
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
  
  const colunas: ColumnDef<NegociacaoExtemporanea>[] = [
    {
      accessorKey: "contract.contract_number",
      header: "Contrato",
      cell: ({ row }) => <span>#{row.original.contract.contract_number}</span>,
    },
    {
      accessorKey: "tuss.code",
      header: "Procedimento",
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <div>{row.original.tuss.code}</div>
          <div className="text-xs text-muted-foreground truncate">{row.original.tuss.description}</div>
        </div>
      ),
    },
    {
      accessorKey: "specialty",
      header: "Especialidade",
      cell: ({ row }) => <span className="whitespace-nowrap">{row.original.specialty || 'Geral'}</span>,
    },
    {
      accessorKey: "requested_value",
      header: "Valor Solicitado",
      cell: ({ row }) => <span>{formatMoney(row.getValue("requested_value"))}</span>,
    },
    {
      accessorKey: "approved_value",
      header: "Valor Aprovado",
      cell: ({ row }) => {
        const value = row.getValue("approved_value");
        return value ? <span>{formatMoney(value as number)}</span> : "-";
      },
    },
    {
      accessorKey: "requester_name",
      header: "Solicitado por",
      cell: ({ row }) => <span className="whitespace-nowrap">{row.getValue("requester_name")}</span>,
    },
    {
      accessorKey: "urgency_level",
      header: "Urgência",
      cell: ({ row }) => {
        const level = row.getValue("urgency_level") as string;
        return (
          <Badge variant={varianteBadgeUrgencia(level)}>
            {level === 'high' ? 'Alta' : level === 'medium' ? 'Média' : 'Baixa'}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => <span>{formatDate(parseISO(row.getValue("created_at")), "dd/MM/yyyy")}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const addendumIncluded = row.original.addendum_included;
        
        return (
          <div className="space-y-1">
            <Badge variant={varianteBadgeStatus(status)}>
              {status === 'pending' ? 'Pendente' : status === 'approved' ? 'Aprovada' : 'Rejeitada'}
            </Badge>
            
            {status === 'approved' && !addendumIncluded && (
              <Badge variant="outline" className="whitespace-nowrap w-full text-center">
                Aguardando Aditivo
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const negotiation = row.original;
        
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/negotiations/extemporaneous/${negotiation.id}`)}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            {negotiation.status === 'pending' && hasPermission('edit extemporaneous negotiations') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/negotiations/extemporaneous/${negotiation.id}/edit`)}
              >
                <PencilIcon className="h-4 w-4" />
                Editar
              </Button>
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
        
        {podeCriarNegociacao && (
          <Link href="/negotiations/extemporaneous/new">
            <Button>Criar Nova Solicitação</Button>
          </Link>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Negociações</CardTitle>
          <CardDescription>
            Todas as negociações extemporâneas que necessitam de aprovação fora dos termos contratuais padrão
          </CardDescription>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="w-full sm:w-auto">
              <Input
                placeholder="Pesquisar..."
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="w-full sm:w-auto">
              <Select
                value={filtroEspecialidade}
                onValueChange={setFiltroEspecialidade}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por especialidade" />
                </SelectTrigger>
                <SelectContent>
                  {especialidades.map((especialidade) => (
                    <SelectItem key={especialidade} value={especialidade}>{especialidade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {carregando ? (
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
                    columns={colunas} 
                    data={negociacoesPendentes}
                  />
                ) : (
                  <EstadoVazio mensagem="Nenhuma negociação pendente encontrada" />
                )}
              </TabsContent>
              
              <TabsContent value="approved">
                {negociacoesAprovadas.length > 0 ? (
                  <DataTable 
                    columns={colunas} 
                    data={negociacoesAprovadas}
                  />
                ) : (
                  <EstadoVazio mensagem="Nenhuma negociação aprovada encontrada" />
                )}
              </TabsContent>
              
              <TabsContent value="rejected">
                {negociacoesRejeitadas.length > 0 ? (
                  <DataTable 
                    columns={colunas} 
                    data={negociacoesRejeitadas}
                  />
                ) : (
                  <EstadoVazio mensagem="Nenhuma negociação rejeitada encontrada" />
                )}
              </TabsContent>
              
              <TabsContent value="all">
                {negociacoes.length > 0 ? (
                  <DataTable 
                    columns={colunas} 
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