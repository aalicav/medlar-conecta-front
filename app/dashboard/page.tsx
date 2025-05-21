"use client"

import { useState, useEffect } from "react"
import { 
  Row, 
  Col, 
  Card as AntCard, 
  Statistic, 
  Typography, 
  List, 
  Button, 
  Badge, 
  Tag, 
  Space,
  Alert,
  message,
  Empty,
  Tabs
} from 'antd';
import { 
  UserOutlined, 
  DollarOutlined, 
  CalendarOutlined,
  MessageOutlined,
  MedicineBoxOutlined,
  BankOutlined,
  TeamOutlined,
  ArrowRightOutlined,
  DashboardOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AlertOutlined
} from '@ant-design/icons';
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
import { CardContent, CardDescription, CardHeader, CardTitle, Card as UICard } from '@/components/ui/card'
import { TrendingUp, Clock } from 'lucide-react'
import { ConditionalRender } from "@/components/conditional-render";

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

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
        message.error("Erro ao carregar os dados do dashboard")
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
    } else if (user.roles.some((role: any) => role.name === "commercial")) {
      setUserRole("commercial")
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
      icon: <MessageOutlined style={{ fontSize: 24, color: 'hsl(var(--primary))' }} />,
      description: 'Interaja com nosso assistente virtual para agendamentos e atendimento ao paciente',
      link: '/chatbot',
      color: 'hsl(var(--primary) / 0.1)',
      isNew: true
    },
    { 
      title: 'Privacidade (LGPD)', 
      icon: <UserOutlined style={{ fontSize: 24, color: 'hsl(var(--accent))' }} />,
      description: 'Gerencie consentimentos e solicitações de dados conforme a Lei Geral de Proteção de Dados',
      link: '/settings/privacy',
      color: 'hsl(var(--accent) / 0.1)',
      isNew: true
    }
  ];

  // Renderizar dashboard específico baseado no papel do usuário
  const renderRoleDashboard = () => {
    if (!stats) return <Alert type="info" message="Carregando estatísticas..." />;
    
    switch (userRole) {
      case "director":
        return <DirectorDashboard 
          stats={stats} 
          pendingItems={pendingItems} 
          upcomingAppointments={upcomingAppointments}
          loading={loading}
        />;
      case "commercial":
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
            <Row gutter={[24, 24]}>
              {/* Statistics */}
              <Col xs={24} sm={12} md={6}>
                <AntCard loading={loading} className="dark-card">
                  <Statistic 
                    title="Consultas Hoje" 
                    value={todayAppointmentCount} 
                    prefix={<CalendarOutlined />} 
                  />
                </AntCard>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <AntCard loading={loading} className="dark-card">
                  <Statistic 
                    title="Novos Pacientes (Mês)" 
                    value={stats.patients?.active} 
                    prefix={<TeamOutlined />} 
                  />
                </AntCard>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <AntCard loading={loading} className="dark-card">
                  <Statistic 
                    title="Mensagens SURI" 
                    value={suriMessageCount} 
                    prefix={<MessageOutlined />} 
                  />
                </AntCard>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <AntCard loading={loading} className="dark-card">
                  <Statistic 
                    title="Faturamento (Mês)" 
                    value={stats.revenue?.total} 
                    prefix={<DollarOutlined />} 
                    precision={2} 
                    suffix="R$"
                  />
                </AntCard>
              </Col>
              
              {/* Feature Cards */}
              <Col xs={24}>
                <Title level={4} style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Recursos do Sistema</Title>
                <Row gutter={[16, 16]}>
                  {featureCards.map((feature, index) => (
                    <Col xs={24} sm={12} md={8} key={index}>
                      <AntCard 
                        hoverable 
                        style={{ backgroundColor: feature.color }}
                        styles={{
                          body: { 
                            padding: '16px', 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column' 
                          }
                        }}
                        className="dark-card"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {feature.icon}
                            <Text strong style={{ marginLeft: 12, color: 'rgba(255, 255, 255, 0.85)' }}>{feature.title}</Text>
                          </div>
                          {feature.isNew && <Tag color="red">Novo</Tag>}
                        </div>
                        <Paragraph style={{ flex: 1, marginBottom: 12, color: 'rgba(255, 255, 255, 0.65)' }}>
                          {feature.description}
                        </Paragraph>
                        <Link href={feature.link} passHref>
                          <Button type="link" style={{ padding: 0, color: '#1890ff' }}>
                            Acessar <ArrowRightOutlined />
                          </Button>
                        </Link>
                      </AntCard>
                    </Col>
                  ))}
                  
                  <Col xs={24} sm={12} md={8}>
                    <AntCard 
                      hoverable 
                      style={{ backgroundColor: 'hsl(var(--warning) / 0.1)' }}
                      styles={{
                        body: { 
                          padding: '16px', 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column' 
                        }
                      }}
                      className="dark-card"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <MedicineBoxOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                          <Text strong style={{ marginLeft: 12, color: 'rgba(255, 255, 255, 0.85)' }}>Profissionais</Text>
                        </div>
                      </div>
                      <Paragraph style={{ flex: 1, marginBottom: 12, color: 'rgba(255, 255, 255, 0.65)' }}>
                        Gerencie médicos, especialidades e contratos
                      </Paragraph>
                      <Link href="/professionals" passHref>
                        <Button type="link" style={{ padding: 0, color: '#1890ff' }}>
                          Acessar <ArrowRightOutlined />
                        </Button>
                      </Link>
                    </AntCard>
                  </Col>
                  
                  <Col xs={24} sm={12} md={8}>
                    <AntCard 
                      hoverable 
                      style={{ backgroundColor: 'hsl(var(--info) / 0.1)' }}
                      styles={{
                        body: { 
                          padding: '16px', 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column' 
                        }
                      }}
                      className="dark-card"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <BankOutlined style={{ fontSize: 24, color: '#13c2c2' }} />
                          <Text strong style={{ marginLeft: 12, color: 'rgba(255, 255, 255, 0.85)' }}>Clínicas</Text>
                        </div>
                      </div>
                      <Paragraph style={{ flex: 1, marginBottom: 12, color: 'rgba(255, 255, 255, 0.65)' }}>
                        Administre unidades, horários e serviços
                      </Paragraph>
                      <Link href="/clinics" passHref>
                        <Button type="link" style={{ padding: 0, color: '#1890ff' }}>
                          Acessar <ArrowRightOutlined />
                        </Button>
                      </Link>
                    </AntCard>
                  </Col>
                  
                  <Col xs={24} sm={12} md={8}>
                    <AntCard 
                      hoverable 
                      style={{ backgroundColor: 'hsl(var(--accent) / 0.1)' }}
                      styles={{
                        body: { 
                          padding: '16px', 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column' 
                        }
                      }}
                      className="dark-card"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <TeamOutlined style={{ fontSize: 24, color: '#eb2f96' }} />
                          <Text strong style={{ marginLeft: 12, color: 'rgba(255, 255, 255, 0.85)' }}>Pacientes</Text>
                        </div>
                      </div>
                      <Paragraph style={{ flex: 1, marginBottom: 12, color: 'rgba(255, 255, 255, 0.65)' }}>
                        Cadastro e histórico de pacientes
                      </Paragraph>
                      <Link href="/patients" passHref>
                        <Button type="link" style={{ padding: 0, color: '#1890ff' }}>
                          Acessar <ArrowRightOutlined />
                        </Button>
                      </Link>
                    </AntCard>
                  </Col>
                </Row>
              </Col>
              
              {/* Appointments and Messages */}
              <Col xs={24} md={16}>
                <AntCard
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Próximas Consultas</span>
                      <Link href="/appointments" passHref>
                        <Button type="link" size="small" style={{ color: '#1890ff' }}>Ver todas</Button>
                      </Link>
                    </div>
                  }
                  loading={loading}
                  className="dark-card"
                >
                  {upcomingAppointments.length > 0 ? (
                    <List
                      dataSource={upcomingAppointments}
                      renderItem={appointment => (
                        <List.Item
                          actions={[
                            <Space key="actions">
                              <Button size="small" type="primary">Confirmar</Button>
                              <Button size="small">Reagendar</Button>
                            </Space>
                          ]}
                        >
                          <List.Item.Meta
                            avatar={<CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                            title={
                              <div>
                                <Text strong style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{appointment.patient}</Text>
                                <Tag color={appointment.status === 'confirmed' ? 'success' : 'warning'} style={{ marginLeft: 8 }}>
                                  {appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                                </Tag>
                              </div>
                            }
                            description={
                              <>
                                <Text style={{ color: 'rgba(255, 255, 255, 0.65)' }}>{new Date(appointment.date).toLocaleDateString('pt-BR')}</Text>
                                <Text style={{ marginLeft: 8, color: 'rgba(255, 255, 255, 0.65)' }}>{appointment.time}</Text>
                                <Text style={{ marginLeft: 8, color: 'rgba(255, 255, 255, 0.65)' }}>•</Text>
                                <Text style={{ marginLeft: 8, color: 'rgba(255, 255, 255, 0.65)' }}>{appointment.type}</Text>
                              </>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="Não há consultas agendadas" />
                  )}
                </AntCard>
              </Col>
              
              <Col xs={24} md={8}>
                <ConditionalRender hideOnContractData>
                  <AntCard
                    title={<span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Contratos Pendentes</span>}
                    loading={loading}
                    className="dark-card"
                  >
                    <Tabs 
                      defaultActiveKey="1"
                      items={[
                        {
                          key: '1',
                          label: 'Contratos',
                          children: pendingItems.contracts && pendingItems.contracts.length > 0 ? (
                            <List
                              size="small"
                              dataSource={pendingItems.contracts}
                              renderItem={item => (
                                <List.Item>
                                  <List.Item.Meta
                                    avatar={<FileTextOutlined style={{ color: '#1890ff' }} />}
                                    title={<Link href={item.link} style={{ color: 'rgba(255, 255, 255, 0.85)' }}>{item.title}</Link>}
                                    description={<span style={{ color: 'rgba(255, 255, 255, 0.65)' }}>{item.description}</span>}
                                  />
                                  <Tag color={item.priority === 'high' ? 'red' : 'blue'}>
                                    {item.priority === 'high' ? 'Urgente' : 'Normal'}
                                  </Tag>
                                </List.Item>
                              )}
                            />
                          ) : (
                            <Empty description="Nenhum contrato pendente" />
                          )
                        },
                      ]}
                    />
                  </AntCard>
                </ConditionalRender>
              </Col>
            </Row>
          </>
        );
    }
  };

  return (
    <>
      {error && (
        <Alert
          message="Erro"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}
      
      <Alert
        message="Bem-vindo(a) aos novos recursos!"
        description="Implementamos o assistente virtual SURI, recursos de LGPD e um sistema avançado de dupla checagem financeira. Explore as novas funcionalidades."
        type="info"
        showIcon
        closable
        style={{ marginBottom: 24 }}
      />
      
      {renderRoleDashboard()}

      {/* Seção de Negociações */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/negotiations">
          <UICard className="hover:bg-accent transition-colors cursor-pointer h-full">
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
          </UICard>
        </Link>
        
        <Link href="/negotiations/extemporaneous">
          <UICard className="hover:bg-accent transition-colors cursor-pointer h-full">
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
          </UICard>
        </Link>
      </div>
    </>
  )
} 