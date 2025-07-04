import Link from 'next/link';
import { DashboardStats, Appointment, PendingItem } from '../../services/dashboardService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  DollarSign, 
  Calendar, 
  Users, 
  MessageSquare, 
  Building2, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  UserCheck, 
  FileSignature,
  TrendingUp
} from 'lucide-react';

interface AdminDashboardProps {
  stats: DashboardStats | null;
  pendingItems: Record<string, PendingItem[]>;
  upcomingAppointments: Appointment[];
  todayAppointmentCount: number;
  suriMessageCount: number;
  loading: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  stats, 
  pendingItems,
  upcomingAppointments,
  todayAppointmentCount,
  suriMessageCount,
  loading 
}) => {
  // Features based on Dr. Italo's requirements
  const requiredFeatures = [
    {
      title: 'Gestão de Contratos',
      icon: <FileText className="h-6 w-6 text-blue-500" />,
      description: 'Fluxo de aprovação: Comercial → Jurídico → Comitê → Direção',
      link: '/contracts',
      isNew: true
    },
    {
      title: 'Verificação Dupla de Valores',
      icon: <DollarSign className="h-6 w-6 text-green-500" />,
      description: 'Validação de dados financeiros por dois colaboradores',
      link: '/value-verifications',
      isNew: true
    },
    {
      title: 'Assinaturas Eletrônicas',
      icon: <FileSignature className="h-6 w-6 text-purple-500" />,
      description: 'Integração com plataformas de assinatura digital',
      link: '/settings/integrations',
      isNew: true
    },
    {
      title: 'Faturamento Flexível',
      icon: <DollarSign className="h-6 w-6 text-orange-500" />,
      description: 'Ciclos de faturamento adaptáveis por contrato',
      link: '/billing/rules',
      isNew: true
    },
    {
      title: 'Relatórios Financeiros',
      icon: <Search className="h-6 w-6 text-pink-500" />,
      description: 'Relatórios detalhados com assinatura e timbre',
      link: '/reports/financial',
      isNew: true
    },
    {
      title: 'Cadastro Unificado',
      icon: <UserCheck className="h-6 w-6 text-cyan-500" />,
      description: 'Cadastro único para profissionais e estabelecimentos',
      link: '/professionals',
      isNew: true
    }
  ];

  return (
    <>
      <Alert className="mb-6">
        <AlertDescription>
          Bem-vindo à nova versão do Sistema Médico. Implementamos recursos de verificação dupla de valores, gestão de contratos com fluxo de aprovação, e cadastro unificado de prestadores conforme requisitos do Dr. Italo.
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Main Statistics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : todayAppointmentCount}</div>
            <div className="mt-2">
              <Link href="/appointments/today">
                <Button variant="link" size="sm" className="p-0">Ver detalhes</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Novos Pacientes (Mês)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats?.patients?.active || 0}</div>
            <div className="mt-2">
              <Link href="/patients?new=true">
                <Button variant="link" size="sm" className="p-0">Ver pacientes</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens SURI</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : suriMessageCount}</div>
            <div className="mt-2">
              <Link href="/chatbot/dashboard">
                <Button variant="link" size="sm" className="p-0">Ver análise</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : `R$ ${(stats?.revenue?.month_to_date || 0).toFixed(2)}`}
            </div>
            <div className="mt-2">
              <Link href="/reports/financial">
                <Button variant="link" size="sm" className="p-0">Ver relatório</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Required Features Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Novas Funcionalidades</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {requiredFeatures.map((feature, index) => (
            <Link href={feature.link} key={index}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {feature.icon}
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                    {feature.isNew && <Badge variant="destructive">Novo</Badge>}
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <span>Acessar</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Appointments and Pending Items */}
      <div className="grid gap-6 md:grid-cols-3 mt-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Próximas Consultas</CardTitle>
                <Link href="/appointments">
                  <Button variant="link" size="sm">Ver todas</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : upcomingAppointments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingAppointments.map((appointment, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{appointment.patient}</TableCell>
                        <TableCell>
                          {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
                        </TableCell>
                        <TableCell>
                          <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                            {appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm">Confirmar</Button>
                            <Button size="sm" variant="outline">Reagendar</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Não há consultas agendadas
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Itens Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="contracts">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="contracts">Contratos</TabsTrigger>
                  <TabsTrigger value="financial">Financeiro</TabsTrigger>
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
                            <FileText className="h-4 w-4 text-primary" />
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
                <TabsContent value="financial">
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : pendingItems.financial && pendingItems.financial.length > 0 ? (
                    <div className="space-y-4">
                      {pendingItems.financial.map((item, index) => (
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
                          <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                            {item.priority === 'high' ? 'Urgente' : 'Normal'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum item financeiro pendente
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard; 