import Link from 'next/link';
import { DashboardStats, Appointment, PendingItem } from '../../services/dashboardService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  FileText, 
  DollarSign, 
  AlertTriangle, 
  Users, 
  ArrowRight, 
  CheckCircle, 
  XCircle, 
  Calendar
} from 'lucide-react';

interface DirectorDashboardProps {
  stats: DashboardStats;
  pendingItems: Record<string, PendingItem[]>;
  upcomingAppointments: Appointment[];
  loading: boolean;
}

const DirectorDashboard: React.FC<DirectorDashboardProps> = ({ 
  stats, 
  pendingItems, 
  upcomingAppointments,
  loading 
}) => {
  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Main Statistics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.pending_approvals?.contracts || 0}</div>
            <div className="mt-2">
              <Link href="/contracts?status=awaiting_approval">
                <Button variant="link" size="sm" className="p-0">Ver todos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negociações Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.pending_approvals?.negotiations || 0}</div>
            <div className="mt-2">
              <Link href="/extemporaneous-negotiations?status=pending">
                <Button variant="link" size="sm" className="p-0">Ver todas</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verificações de Valores</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.pending_approvals?.value_verifications || 0}</div>
            <div className="mt-2">
              <Link href="/value-verifications?status=pending">
                <Button variant="link" size="sm" className="p-0">Ver todas</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-16" /> : `R$ ${(stats.revenue?.total || 0).toFixed(2)}`}
            </div>
            <div className="mt-2">
              <Link href="/reports/financial">
                <Button variant="link" size="sm" className="p-0">Ver relatório</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
        
      {/* Pending Items Section */}
      <div className="grid gap-6 md:grid-cols-3 mt-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Itens que requerem sua aprovação</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="verifications">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="verifications">Verificações de Valores</TabsTrigger>
                  <TabsTrigger value="contracts">Contratos</TabsTrigger>
                  <TabsTrigger value="negotiations">Negociações</TabsTrigger>
                </TabsList>
                
                <TabsContent value="verifications">
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : pendingItems.value_verifications && pendingItems.value_verifications.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Prioridade</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingItems.value_verifications.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <DollarSign className="h-4 w-4 text-green-500" />
                                <div>
                                  <Link href={item.link} className="font-medium hover:underline">
                                    {item.title}
                                  </Link>
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                                {item.priority === 'high' ? 'Urgente' : 'Normal'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Link href={`${item.link}/approve`}>
                                  <Button size="sm" className="flex items-center space-x-1">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Aprovar</span>
                                  </Button>
                                </Link>
                                <Link href={`${item.link}/reject`}>
                                  <Button size="sm" variant="destructive" className="flex items-center space-x-1">
                                    <XCircle className="h-4 w-4" />
                                    <span>Rejeitar</span>
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Não há verificações de valores pendentes
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="contracts">
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : pendingItems.contracts && pendingItems.contracts.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contrato</TableHead>
                          <TableHead>Prioridade</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingItems.contracts.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <FileText className="h-4 w-4 text-blue-500" />
                                <div>
                                  <Link href={item.link} className="font-medium hover:underline">
                                    {item.title}
                                  </Link>
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                                {item.priority === 'high' ? 'Urgente' : 'Normal'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Link href={`${item.link}/approve`}>
                                  <Button size="sm" className="flex items-center space-x-1">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Aprovar</span>
                                  </Button>
                                </Link>
                                <Link href={`${item.link}/reject`}>
                                  <Button size="sm" variant="destructive" className="flex items-center space-x-1">
                                    <XCircle className="h-4 w-4" />
                                    <span>Rejeitar</span>
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Não há contratos pendentes de aprovação
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="negotiations">
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  ) : pendingItems.negotiations && pendingItems.negotiations.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Negociação</TableHead>
                          <TableHead>Prioridade</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingItems.negotiations.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                <div>
                                  <Link href={item.link} className="font-medium hover:underline">
                                    {item.title}
                                  </Link>
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.priority === 'high' ? 'destructive' : 'secondary'}>
                                {item.priority === 'high' ? 'Urgente' : 'Normal'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Link href={`${item.link}/approve`}>
                                  <Button size="sm" className="flex items-center space-x-1">
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Aprovar</span>
                                  </Button>
                                </Link>
                                <Link href={`${item.link}/reject`}>
                                  <Button size="sm" variant="destructive" className="flex items-center space-x-1">
                                    <XCircle className="h-4 w-4" />
                                    <span>Rejeitar</span>
                                  </Button>
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Não há negociações pendentes de aprovação
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Próximas Consultas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {upcomingAppointments.slice(0, 5).map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        <div>
                          <p className="font-medium">{appointment.patient}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(appointment.date).toLocaleDateString('pt-BR')} às {appointment.time}
                          </p>
                        </div>
                      </div>
                      <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                        {appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Não há consultas agendadas
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default DirectorDashboard; 