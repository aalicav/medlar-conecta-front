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
  Scale, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Eye
} from 'lucide-react';

interface LegalDashboardProps {
  stats: DashboardStats;
  pendingItems: Record<string, PendingItem[]>;
  loading: boolean;
}

const LegalDashboard: React.FC<LegalDashboardProps> = ({ 
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
            <CardTitle className="text-sm font-medium">Contratos para Análise</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.contracts?.pending_legal || 0}</div>
            <div className="mt-2">
              <Link href="/contracts?status=pending_legal">
                <Button variant="link" size="sm" className="p-0">Ver todos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pareceres Pendentes</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.legal?.pending_opinions || 0}</div>
            <div className="mt-2">
              <Link href="/legal/opinions">
                <Button variant="link" size="sm" className="p-0">Ver todos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.contracts?.legal_approved || 0}</div>
            <div className="mt-2">
              <Link href="/contracts?status=legal_approved">
                <Button variant="link" size="sm" className="p-0">Ver todos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Expirados</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.contracts?.expired || 0}</div>
            <div className="mt-2">
              <Link href="/contracts?status=expired">
                <Button variant="link" size="sm" className="p-0">Ver todos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Items */}
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Contratos para Análise Jurídica</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
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
                Não há contratos pendentes de análise jurídica
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Jurídicas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Contratos em Análise</span>
                <span className="text-sm text-muted-foreground">{stats.contracts?.in_legal_review || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pareceres Emitidos</span>
                <span className="text-sm text-muted-foreground">{stats.legal?.opinions_issued || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Contratos com Pendências</span>
                <span className="text-sm text-muted-foreground">{stats.contracts?.with_legal_issues || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Renovações Pendentes</span>
                <span className="text-sm text-muted-foreground">{stats.contracts?.renewals_pending || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legal Workflow */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Fluxo de Trabalho Jurídico</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <CardTitle className="text-lg">Recebimento</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Contrato recebido da área comercial para análise jurídica
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <CardTitle className="text-lg">Análise</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Revisão de cláusulas, termos e condições legais
              </CardDescription>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <CardTitle className="text-lg">Parecer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Emissão de parecer jurídico e encaminhamento para aprovação
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default LegalDashboard; 