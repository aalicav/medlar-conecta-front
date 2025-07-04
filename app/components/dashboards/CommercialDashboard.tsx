import Link from 'next/link';
import { DashboardStats, PendingItem } from '../../services/dashboardService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Handshake, 
  Building2, 
  ArrowRight, 
  Plus
} from 'lucide-react';

interface CommercialDashboardProps {
  stats: DashboardStats;
  pendingItems: Record<string, PendingItem[]>;
  loading: boolean;
}

const CommercialDashboard: React.FC<CommercialDashboardProps> = ({ 
  stats, 
  pendingItems,
  loading 
}) => {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Main Statistics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.contracts?.active || 0}</div>
            <div className="mt-2">
              <Link href="/contracts">
                <Button variant="link" size="sm" className="p-0">Ver todos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negociações Pendentes</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.negotiations?.pending || 0}</div>
            <div className="mt-2">
              <Link href="/negotiations">
                <Button variant="link" size="sm" className="p-0">Ver todas</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Profissionais</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.professionals?.new || 0}</div>
            <div className="mt-2">
              <Link href="/professionals">
                <Button variant="link" size="sm" className="p-0">Ver todos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : `R$ ${(stats.revenue?.month_to_date || 0).toFixed(2)}`}
            </div>
            <div className="mt-2">
              <Link href="/reports/financial">
                <Button variant="link" size="sm" className="p-0">Ver relatório</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Ações Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/contracts/new">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <FileText className="h-6 w-6 text-blue-500" />
                  <CardTitle className="text-lg">Novo Contrato</CardTitle>
                </div>
                <CardDescription>Criar novo contrato com operadora</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Criar</span>
                  <Plus className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/professionals/new">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-green-500" />
                  <CardTitle className="text-lg">Novo Profissional</CardTitle>
                </div>
                <CardDescription>Cadastrar novo profissional</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Cadastrar</span>
                  <Plus className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/negotiations/new">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Handshake className="h-6 w-6 text-orange-500" />
                  <CardTitle className="text-lg">Nova Negociação</CardTitle>
                </div>
                <CardDescription>Iniciar nova negociação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Iniciar</span>
                  <Plus className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/establishments/new">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-6 w-6 text-purple-500" />
                  <CardTitle className="text-lg">Novo Estabelecimento</CardTitle>
                </div>
                <CardDescription>Cadastrar novo estabelecimento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Cadastrar</span>
                  <Plus className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Pending Items */}
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Contratos Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="contracts">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="contracts">Contratos</TabsTrigger>
                <TabsTrigger value="negotiations">Negociações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="contracts">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : pendingItems.contracts && pendingItems.contracts.length > 0 ? (
                  <div className="space-y-4">
                    {pendingItems.contracts.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <div>
                            <Link href={item.link} className="font-medium hover:underline">
                              {item.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                          {item.priority === 'high' ? 'Urgente' : 'Normal'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum contrato pendente
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="negotiations">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : pendingItems.negotiations && pendingItems.negotiations.length > 0 ? (
                  <div className="space-y-4">
                    {pendingItems.negotiations.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Handshake className="h-4 w-4 text-orange-500" />
                          <div>
                            <Link href={item.link} className="font-medium hover:underline">
                              {item.title}
                            </Link>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                          {item.priority === 'high' ? 'Urgente' : 'Normal'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma negociação pendente
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Comerciais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Contratos em Negociação</span>
                <span className="text-sm text-muted-foreground">{stats.contracts?.in_negotiation || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Contratos Aprovados</span>
                <span className="text-sm text-muted-foreground">{stats.contracts?.approved || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Profissionais Ativos</span>
                <span className="text-sm text-muted-foreground">{stats.professionals?.active || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Estabelecimentos</span>
                <span className="text-sm text-muted-foreground">{stats.establishments?.total || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default CommercialDashboard; 