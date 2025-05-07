'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import api from '@/app/services/api-client';

// Tipos de dados
interface DashboardStats {
  total_plans: number;
  approved_plans: number;
  pending_plans: number;
  rejected_plans: number;
  has_contract: number;
  missing_contract: number;
  total_procedures: number;
  total_solicitations: number;
  total_appointments: number;
  total_revenue: number;
}

interface ProcedureStats {
  procedure_id: number;
  procedure_name: string;
  procedure_code: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  plans_count: number;
}

interface FinancialData {
  month: string;
  revenue: number;
  payments: number;
}

interface RecentPlan {
  id: number;
  name: string;
  created_at: string;
  status: string;
  procedures_count: number;
}

interface Solicitation {
  id: number;
  health_plan_name: string;
  patient_name: string;
  procedure_name: string;
  status: string;
  created_at: string;
}

export default function HealthPlansDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<DashboardStats | null>(null);
  const [procedureStats, setProcedureStats] = useState<ProcedureStats[]>([]);
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [recentPlans, setRecentPlans] = useState<RecentPlan[]>([]);
  const [recentSolicitations, setRecentSolicitations] = useState<Solicitation[]>([]);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Buscar estatísticas gerais
        const statsResponse = await api.get('/api/health-plans/dashboard/stats');
        if (statsResponse.data.success) {
          setStatsData(statsResponse.data.data);
        }

        // Buscar estatísticas de procedimentos
        const proceduresResponse = await api.get('/api/health-plans/dashboard/procedures');
        if (proceduresResponse.data.success) {
          setProcedureStats(proceduresResponse.data.data);
        }

        // Buscar dados financeiros
        const financialResponse = await api.get(`/api/health-plans/dashboard/financial?range=${timeRange}`);
        if (financialResponse.data.success) {
          setFinancialData(financialResponse.data.data);
        }

        // Buscar planos recentes
        const recentPlansResponse = await api.get('/api/health-plans/dashboard/recent');
        if (recentPlansResponse.data.success) {
          setRecentPlans(recentPlansResponse.data.data);
        }

        // Buscar solicitações recentes
        const solicitationsResponse = await api.get('/api/health-plans/dashboard/solicitations');
        if (solicitationsResponse.data.success) {
          setRecentSolicitations(solicitationsResponse.data.data);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar dados do dashboard',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [timeRange]);

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[400px]">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">Dashboard de Planos de Saúde</h1>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última Semana</SelectItem>
              <SelectItem value="month">Último Mês</SelectItem>
              <SelectItem value="quarter">Último Trimestre</SelectItem>
              <SelectItem value="year">Último Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => router.push('/dashboard/health-plans')}>
            Ver Todos os Planos
          </Button>
        </div>
      </div>

      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de Planos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.total_plans}</div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Aprovados: {statsData.approved_plans}</span>
                <span>Pendentes: {statsData.pending_plans}</span>
                <span>Rejeitados: {statsData.rejected_plans}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Procedimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.total_procedures}</div>
              <div className="text-xs text-muted-foreground mt-2">
                Média de {Math.round(statsData.total_procedures / (statsData.total_plans || 1))} procedimentos por plano
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Solicitações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.total_solicitations}</div>
              <div className="text-xs text-muted-foreground mt-2">
                {statsData.total_appointments} consultas realizadas
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(statsData.total_revenue)}</div>
              <div className="text-xs text-muted-foreground mt-2">
                No período selecionado
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Receita por Período</CardTitle>
            <CardDescription>
              Receita e pagamentos ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {/* Aqui iria um componente de gráfico de linha */}
              {/* Usando placeholder para manter o código limpo */}
              <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Gráfico de Receita por Período</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Procedimentos Mais Comuns</CardTitle>
            <CardDescription>
              Por número de planos que os oferecem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {/* Aqui iria um componente de gráfico de barras */}
              {/* Usando placeholder para manter o código limpo */}
              <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Gráfico de Procedimentos Mais Comuns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="procedures" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="procedures">Procedimentos</TabsTrigger>
          <TabsTrigger value="plans">Planos Recentes</TabsTrigger>
          <TabsTrigger value="solicitations">Solicitações Recentes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="procedures">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Procedimentos</CardTitle>
              <CardDescription>
                Comparativo de preços entre planos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead className="text-right">Preço Médio</TableHead>
                      <TableHead className="text-right">Preço Mínimo</TableHead>
                      <TableHead className="text-right">Preço Máximo</TableHead>
                      <TableHead className="text-right">Planos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {procedureStats.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Nenhum procedimento encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      procedureStats.map((procedure) => (
                        <TableRow key={procedure.procedure_id}>
                          <TableCell className="font-medium">{procedure.procedure_name}</TableCell>
                          <TableCell>{procedure.procedure_code}</TableCell>
                          <TableCell className="text-right">{formatCurrency(procedure.avg_price)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(procedure.min_price)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(procedure.max_price)}</TableCell>
                          <TableCell className="text-right">{procedure.plans_count}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Planos Recentes</CardTitle>
              <CardDescription>
                Últimos planos cadastrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Data de Criação</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Procedimentos</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPlans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          Nenhum plano recente encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentPlans.map((plan) => (
                        <TableRow key={plan.id}>
                          <TableCell className="font-medium">{plan.name}</TableCell>
                          <TableCell>{formatDate(plan.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(plan.status)}>
                              {plan.status === 'approved' ? 'Aprovado' :
                               plan.status === 'pending' ? 'Pendente' :
                               plan.status === 'rejected' ? 'Rejeitado' : plan.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{plan.procedures_count}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push(`/dashboard/health-plans/${plan.id}`)}
                            >
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="solicitations">
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Recentes</CardTitle>
              <CardDescription>
                Últimas solicitações de procedimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plano</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentSolicitations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Nenhuma solicitação recente encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      recentSolicitations.map((solicitation) => (
                        <TableRow key={solicitation.id}>
                          <TableCell className="font-medium">{solicitation.health_plan_name}</TableCell>
                          <TableCell>{solicitation.patient_name}</TableCell>
                          <TableCell>{solicitation.procedure_name}</TableCell>
                          <TableCell>
                            <Badge variant={
                              solicitation.status === 'approved' ? 'default' :
                              solicitation.status === 'pending' ? 'secondary' :
                              solicitation.status === 'rejected' ? 'destructive' : 'outline'
                            }>
                              {solicitation.status === 'approved' ? 'Aprovado' :
                               solicitation.status === 'pending' ? 'Pendente' :
                               solicitation.status === 'rejected' ? 'Rejeitado' : solicitation.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(solicitation.created_at)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => router.push(`/dashboard/solicitations/${solicitation.id}`)}
                            >
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>
              Proporção de planos por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              {/* Aqui iria um componente de gráfico de pizza */}
              {/* Usando placeholder para manter o código limpo */}
              <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Gráfico de Distribuição de Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contratos</CardTitle>
            <CardDescription>
              Status de contratos dos planos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-60">
              {/* Aqui iria um componente de gráfico de pizza */}
              {/* Usando placeholder para manter o código limpo */}
              <div className="w-full h-full bg-muted rounded-md flex items-center justify-center">
                <p className="text-muted-foreground">Gráfico de Status de Contratos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 