import Link from 'next/link';
import { DashboardStats, Appointment, PendingItem } from '../../services/dashboardService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  Users, 
  Building2, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  Plus
} from 'lucide-react';

interface OperationalDashboardProps {
  stats: DashboardStats;
  pendingItems: Record<string, PendingItem[]>;
  upcomingAppointments: Appointment[];
  loading: boolean;
}

const OperationalDashboard: React.FC<OperationalDashboardProps> = ({ 
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
            <CardTitle className="text-sm font-medium">Consultas Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.appointments?.today || 0}</div>
            <div className="mt-2">
              <Link href="/appointments/today">
                <Button variant="link" size="sm" className="p-0">Ver todas</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacientes Atendidos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.patients?.attended_today || 0}</div>
            <div className="mt-2">
              <Link href="/patients">
                <Button variant="link" size="sm" className="p-0">Ver todos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estabelecimentos Ativos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.establishments?.active || 0}</div>
            <div className="mt-2">
              <Link href="/establishments">
                <Button variant="link" size="sm" className="p-0">Ver todos</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consultas Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.appointments?.pending || 0}</div>
            <div className="mt-2">
              <Link href="/appointments?status=pending">
                <Button variant="link" size="sm" className="p-0">Ver todas</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Ações Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/appointments/new">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-6 w-6 text-blue-500" />
                  <CardTitle className="text-lg">Nova Consulta</CardTitle>
                </div>
                <CardDescription>Agendar nova consulta</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Agendar</span>
                  <Plus className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/patients/new">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-green-500" />
                  <CardTitle className="text-lg">Novo Paciente</CardTitle>
                </div>
                <CardDescription>Cadastrar novo paciente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Cadastrar</span>
                  <Plus className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/establishments/new">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Building2 className="h-6 w-6 text-orange-500" />
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
          
          <Link href="/scheduling-exceptions">
            <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <CardTitle className="text-lg">Exceções</CardTitle>
                </div>
                <CardDescription>Gerenciar exceções de agenda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>Gerenciar</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
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
                      <TableHead>Data/Hora</TableHead>
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
              <Tabs defaultValue="appointments">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="appointments">Consultas</TabsTrigger>
                  <TabsTrigger value="patients">Pacientes</TabsTrigger>
                </TabsList>
                
                <TabsContent value="appointments">
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : pendingItems.appointments && pendingItems.appointments.length > 0 ? (
                    <div className="space-y-4">
                      {pendingItems.appointments.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-4 w-4 text-blue-500" />
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
                      Nenhuma consulta pendente
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="patients">
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : pendingItems.patients && pendingItems.patients.length > 0 ? (
                    <div className="space-y-4">
                      {pendingItems.patients.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Users className="h-4 w-4 text-green-500" />
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
                      Nenhum paciente pendente
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

export default OperationalDashboard; 