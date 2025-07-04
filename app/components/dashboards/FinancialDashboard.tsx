import Link from 'next/link';
import { DashboardStats, PendingItem } from '../../services/dashboardService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  Eye
} from 'lucide-react';

interface FinancialDashboardProps {
  stats: DashboardStats;
  pendingItems: Record<string, PendingItem[]>;
  loading: boolean;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ 
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
            <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
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
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Pendente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : `R$ ${(stats.revenue?.pending || 0).toFixed(2)}`}
            </div>
            <div className="mt-2">
              <Link href="/billing/pending">
                <Button variant="link" size="sm" className="p-0">Ver pendências</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificações Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.value_verifications?.pending || 0}</div>
            <div className="mt-2">
              <Link href="/value-verifications">
                <Button variant="link" size="sm" className="p-0">Ver todas</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Aprovado</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : `R$ ${(stats.revenue?.approved || 0).toFixed(2)}`}
            </div>
            <div className="mt-2">
              <Link href="/billing/approved">
                <Button variant="link" size="sm" className="p-0">Ver aprovados</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Verificações de Valores Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : pendingItems.value_verifications && pendingItems.value_verifications.length > 0 ? (
              <div className="space-y-4">
                {pendingItems.value_verifications.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <div>
                        <Link href={item.link} className="font-medium hover:underline">
                          {item.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                        {item.priority === 'high' ? 'Urgente' : 'Normal'}
                      </Badge>
                      <Link href={`${item.link}/review`}>
                        <Button size="sm" variant="outline" className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>Revisar</span>
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Não há verificações de valores pendentes
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Financeiras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Receita Total (Mês)</span>
                <span className="text-sm text-muted-foreground">R$ {(stats.revenue?.total || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Receita Realizada</span>
                <span className="text-sm text-muted-foreground">R$ {(stats.revenue?.realized || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Verificações Aprovadas</span>
                <span className="text-sm text-muted-foreground">{stats.value_verifications?.approved || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Verificações Rejeitadas</span>
                <span className="text-sm text-muted-foreground">{stats.value_verifications?.rejected || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Workflow */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Fluxo de Verificação Financeira</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <CardTitle className="text-lg">Entrada</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Dados financeiros inseridos no sistema
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <CardTitle className="text-lg">Verificação</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Segunda pessoa verifica os dados inseridos
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <CardTitle className="text-lg">Aprovação</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Dados aprovados e liberados para processamento
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <CardTitle className="text-lg">Faturamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Geração de fatura e envio para operadora
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default FinancialDashboard; 