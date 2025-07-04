"use client"

import { useState, useEffect } from "react"
import Link from 'next/link';
import { dashboardService, DashboardStats, Appointment, PendingItem } from '../services/dashboardService';
import { redirect } from "next/navigation";
import DirectorDashboard from '@/app/components/dashboards/DirectorDashboard';
import CommercialDashboard from '@/app/components/dashboards/CommercialDashboard';
import LegalDashboard from '@/app/components/dashboards/LegalDashboard';
import OperationalDashboard from '@/app/components/dashboards/OperationalDashboard';
import FinancialDashboard from '@/app/components/dashboards/FinancialDashboard';
import ProfessionalDashboard from '@/app/components/dashboards/ProfessionalDashboard';
import ClinicDashboard from '@/app/components/dashboards/ClinicDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ConditionalRender } from "@/components/conditional-render";
import { 
  TrendingUp, 
  Clock, 
  Calendar, 
  Users, 
  MessageSquare, 
  DollarSign, 
  Stethoscope, 
  Building2, 
  User,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Plus
} from 'lucide-react'

export default function DashboardHomepage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [todayAppointmentCount, setTodayAppointmentCount] = useState(0)
  const [suriMessageCount, setSuriMessageCount] = useState(0)
  const [pendingItems, setPendingItems] = useState<Record<string, PendingItem[]>>({})
  const [error, setError] = useState("")
  const [userRole, setUserRole] = useState<string | null>(null)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [redirectPath, setRedirectPath] = useState("")

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch all data in parallel
        const [statsResponse, appointmentsResponse, todayAppointmentsResponse, suriStatsResponse, pendingItemsResponse] = 
          await Promise.all([
            dashboardService.getStats(),
            dashboardService.getUpcomingAppointments(),
            dashboardService.getTodayAppointments(),
            dashboardService.getSuriStats(),
            dashboardService.getPendingItems()
          ])
        
        // Update state with fetched data
        setStats(statsResponse.data)
        setUpcomingAppointments(appointmentsResponse.data)
        setTodayAppointmentCount(todayAppointmentsResponse.data.length)
        setSuriMessageCount(suriStatsResponse.data.message_count)
        setPendingItems(pendingItemsResponse.data)
        
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Não foi possível carregar os dados do dashboard. Tente novamente mais tarde.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
    
    // Recuperar o papel do usuário
    const user = JSON.parse(localStorage.getItem("user") || "{}")
    if (!user || !user.roles || user.roles.length === 0) {
      setShouldRedirect(true)
      setRedirectPath("/login")
      return
    }

    if (user.roles.some((role: any) => role.name === "plan_admin")) {
      setShouldRedirect(true)
      setRedirectPath("/dashboard/health-plans")
      return
    }

    // Identificar o papel principal do usuário para o dashboard
    if (user.roles.some((role: any) => role.name === "super_admin" || role.name === "admin")) {
      setUserRole("admin")
    } else if (user.roles.some((role: any) => role.name === "director")) {
      setUserRole("director")
    } else if (user.roles.some((role: any) => role.name === "commercial_manager")) {
      setUserRole("commercial_manager")
    } else if (user.roles.some((role: any) => role.name === "legal")) {
      setUserRole("legal")
    } else if (user.roles.some((role: any) => role.name === "operational")) {
      setUserRole("operational")
    } else if (user.roles.some((role: any) => role.name === "financial")) {
      setUserRole("financial")
    } else if (user.roles.some((role: any) => role.name === "professional")) {
      setUserRole("professional")
    } else if (user.roles.some((role: any) => role.name === "clinic")) {
      setUserRole("clinic")
    }
  }, [])

  // Redirecionar se necessário
  useEffect(() => {
    if (shouldRedirect && redirectPath) {
      redirect(redirectPath)
    }
  }, [shouldRedirect, redirectPath])
  
  // Feature cards data - componentes comuns para todos os dashboards
  const featureCards = [
    { 
      title: 'Assistente SURI', 
      icon: <MessageSquare className="h-6 w-6 text-primary" />,
      description: 'Interaja com nosso assistente virtual para agendamentos e atendimento ao paciente',
      link: '/chatbot',
      color: 'bg-primary/10',
      isNew: true
    },
    { 
      title: 'Privacidade (LGPD)', 
      icon: <User className="h-6 w-6 text-accent-foreground" />,
      description: 'Gerencie consentimentos e solicitações de dados conforme a Lei Geral de Proteção de Dados',
      link: '/settings/privacy',
      color: 'bg-accent/10',
      isNew: true
    },
    { 
      title: 'Profissionais', 
      icon: <Stethoscope className="h-6 w-6 text-orange-500" />,
      description: 'Gerencie médicos, especialidades e contratos',
      link: '/professionals',
      color: 'bg-orange-500/10',
      isNew: false
    },
    { 
      title: 'Estabelecimentos', 
      icon: <Building2 className="h-6 w-6 text-cyan-500" />,
      description: 'Administre unidades, horários e serviços',
      link: '/clinics',
      color: 'bg-cyan-500/10',
      isNew: false
    },
    { 
      title: 'Pacientes', 
      icon: <Users className="h-6 w-6 text-pink-500" />,
      description: 'Cadastro e histórico de pacientes',
      link: '/patients',
      color: 'bg-pink-500/10',
      isNew: false
    }
  ];

  // Renderizar dashboard específico baseado no papel do usuário
  const renderRoleDashboard = () => {
    if (!stats) return <Alert><AlertDescription>Carregando estatísticas...</AlertDescription></Alert>;
    
    switch (userRole) {
      case "director":
        return <DirectorDashboard 
          stats={stats} 
          pendingItems={pendingItems} 
          upcomingAppointments={upcomingAppointments}
          loading={loading}
        />;
      case "commercial_manager":
        return <CommercialDashboard 
          stats={stats} 
          pendingItems={pendingItems}
          loading={loading}
        />;
      case "legal":
        return <LegalDashboard 
          stats={stats} 
          pendingItems={pendingItems}
          loading={loading}
        />;
      case "operational":
        return <OperationalDashboard 
          stats={stats} 
          pendingItems={pendingItems}
          upcomingAppointments={upcomingAppointments}
          loading={loading}
        />;
      case "financial":
        return <FinancialDashboard 
          stats={stats} 
          pendingItems={pendingItems}
          loading={loading}
        />;
      case "professional":
        return <ProfessionalDashboard 
          stats={stats} 
          upcomingAppointments={upcomingAppointments}
          loading={loading}
        />;
      case "clinic":
        return <ClinicDashboard 
          stats={stats} 
          upcomingAppointments={upcomingAppointments}
          loading={loading}
        />;
      case "admin":
      default:
        // Dashboard Admin (versão completa)
        return (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Statistics */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Consultas Hoje</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : todayAppointmentCount}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Novos Pacientes (Mês)</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : stats.patients?.active || 0}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mensagens SURI</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : suriMessageCount}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento (Mês)</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? <Skeleton className="h-8 w-16" /> : `R$ ${(stats.revenue?.total || 0).toFixed(2)}`}
                  </div>
                </CardContent>
              </Card>
            </div>
              
              {/* Feature Cards */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold tracking-tight mb-4">Recursos do Sistema</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {featureCards.map((feature, index) => (
                  <Link href={feature.link} key={index}>
                    <Card className={`hover:bg-accent transition-colors cursor-pointer h-full ${feature.color}`}>
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
              
              {/* Appointments and Messages */}
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
                <ConditionalRender hideOnContractData>
                  <Card>
                    <CardHeader>
                      <CardTitle>Contratos Pendentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="contracts">
                        <TabsList className="grid w-full grid-cols-1">
                          <TabsTrigger value="contracts">Contratos</TabsTrigger>
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
                      </Tabs>
                    </CardContent>
                  </Card>
                </ConditionalRender>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <>
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Alert className="mb-6">
        <AlertDescription>
          Bem-vindo(a) aos novos recursos! Implementamos o assistente virtual SURI, recursos de LGPD e um sistema avançado de dupla checagem financeira. Explore as novas funcionalidades.
        </AlertDescription>
      </Alert>
      
      {renderRoleDashboard()}

      {/* Seção de Negociações */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
        <Link href="/negotiations">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Negociações</CardTitle>
              <CardDescription>
                Gerencie negociações com planos, profissionais e clínicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Contratos e valores</span>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/negotiations/extemporaneous">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Negociações Extemporâneas</CardTitle>
              <CardDescription>
                Procedimentos fora dos contratos padrão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-primary" />
                <span>Solicitações especiais</span>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </>
  )
} 