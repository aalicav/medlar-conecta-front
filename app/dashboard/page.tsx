"use client"

import { useState, useEffect } from "react"
import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  List, 
  Button, 
  Badge, 
  Tag, 
  Space,
  Alert,
  message,
  Empty
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
  DashboardOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { dashboardService, DashboardStats, Appointment, Notification } from '../services/dashboardService';
import { redirect } from "next/navigation";

const { Title, Text, Paragraph } = Typography;

export default function DashboardHomepage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    appointments: { total: 0, pending: 0, completed: 0 },
    solicitations: { total: 0, pending: 0, accepted: 0 },
    patients: { total: 0, active: 0 },
    revenue: { total: 0, pending: 0 },
  })
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([])
  const [todayAppointmentCount, setTodayAppointmentCount] = useState(0)
  const [suriMessageCount, setSuriMessageCount] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch all data in parallel
        const [statsResponse, appointmentsResponse, todayAppointmentsResponse, suriStatsResponse] = 
          await Promise.all([
            dashboardService.getStats(),
            dashboardService.getUpcomingAppointments(),
            dashboardService.getTodayAppointments(),
            dashboardService.getSuriStats()
          ])
        
        // Update state with fetched data
        setStats(statsResponse.data)
        setUpcomingAppointments(appointmentsResponse.data)
        setTodayAppointmentCount(todayAppointmentsResponse.data.length)
        setSuriMessageCount(suriStatsResponse.data.message_count)
        
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Não foi possível carregar os dados do dashboard. Tente novamente mais tarde.")
        message.error("Erro ao carregar os dados do dashboard")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])
  
  // Feature cards data
  const featureCards = [
    { 
      title: 'Assistente SURI', 
      icon: <MessageOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      description: 'Interaja com nosso assistente virtual para agendamentos e atendimento ao paciente',
      link: '/chatbot',
      color: '#e6f7ff',
      isNew: true
    },
    { 
      title: 'Regras de Faturamento', 
      icon: <DollarOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      description: 'Configure regras de cobrança personalizadas para diferentes entidades',
      link: '/billing/rules',
      color: '#f6ffed',
      isNew: true
    },
    { 
      title: 'Privacidade (LGPD)', 
      icon: <UserOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      description: 'Gerencie consentimentos e solicitações de dados conforme a Lei Geral de Proteção de Dados',
      link: '/settings/privacy',
      color: '#f9f0ff',
      isNew: true
    },
    { 
      title: 'Profissionais', 
      icon: <MedicineBoxOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
      description: 'Gerencie médicos, especialidades e contratos',
      link: '/professionals',
      color: '#fff7e6'
    },
    { 
      title: 'Clínicas', 
      icon: <BankOutlined style={{ fontSize: 24, color: '#13c2c2' }} />,
      description: 'Administre unidades, horários e serviços',
      link: '/clinics',
      color: '#e6fffb'
    },
    { 
      title: 'Pacientes', 
      icon: <TeamOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
      description: 'Cadastro e histórico de pacientes',
      link: '/patients',
      color: '#fff0f6'
    }
  ];

  const user = JSON.parse(localStorage.getItem("user") || "{}")

  if(user?.roles?.some((role: string) => role === "plan_admin")){
    redirect("/dashboard/health-plans")
  }

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
        description="Acabamos de implementar o assistente virtual SURI, recursos de LGPD e um sistema avançado de regras de faturamento. Explore as novas funcionalidades."
        type="info"
        showIcon
        closable
        style={{ marginBottom: 24 }}
      />
      
      <Row gutter={[24, 24]}>
        {/* Statistics */}
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Consultas Hoje" 
              value={todayAppointmentCount} 
              prefix={<CalendarOutlined />} 
            />
            </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Novos Pacientes (Mês)" 
              value={stats.patients.active} 
              prefix={<TeamOutlined />} 
            />
            </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Mensagens SURI" 
              value={suriMessageCount} 
              prefix={<MessageOutlined />} 
            />
            </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Faturamento (Mês)" 
              value={stats.revenue.total} 
              prefix={<DollarOutlined />} 
              precision={2} 
              suffix="R$"
            />
            </Card>
        </Col>
        
        {/* Feature Cards */}
        <Col xs={24}>
          <Title level={4}>Recursos do Sistema</Title>
          <Row gutter={[16, 16]}>
            {featureCards.map((feature, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <Card 
                  hoverable 
                  style={{ backgroundColor: feature.color }}
                  bodyStyle={{ 
                    padding: '16px', 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {feature.icon}
                      <Text strong style={{ marginLeft: 12 }}>{feature.title}</Text>
                  </div>
                    {feature.isNew && <Tag color="red">Novo</Tag>}
                  </div>
                  <Paragraph style={{ flex: 1, marginBottom: 12 }}>
                    {feature.description}
                  </Paragraph>
                  <Link href={feature.link} passHref>
                    <Button type="link" style={{ padding: 0 }}>
                      Acessar <ArrowRightOutlined />
                    </Button>
                  </Link>
            </Card>
              </Col>
            ))}
          </Row>
        </Col>
        
        {/* Appointments and Messages */}
        <Col xs={24} md={16}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Próximas Consultas</span>
                <Link href="/appointments" passHref>
                  <Button type="link" size="small">Ver todas</Button>
                </Link>
                  </div>
            }
            loading={loading}
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
                          <Text strong>{appointment.patient}</Text>
                          <Tag color={appointment.status === 'confirmed' ? 'success' : 'warning'} style={{ marginLeft: 8 }}>
                            {appointment.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                          </Tag>
                  </div>
                      }
                      description={
                        <>
                          <Text>{new Date(appointment.date).toLocaleDateString('pt-BR')}</Text>
                          <Text style={{ marginLeft: 8 }}>{appointment.time}</Text>
                          <Text style={{ marginLeft: 8 }}>•</Text>
                          <Text style={{ marginLeft: 8 }}>{appointment.type}</Text>
                        </>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Não há consultas agendadas" />
            )}
            </Card>
        </Col>
        
        {/* SURI Chat Quick Access */}
        <Col xs={24}>
          <Card
            title="Assistente Virtual SURI"
            extra={<Link href="/chatbot" passHref><Button type="primary">Abrir Chat</Button></Link>}
            style={{ backgroundColor: '#f0f5ff' }}
          >
            <Row gutter={16} align="middle">
              <Col xs={24} md={4} style={{ textAlign: 'center' }}>
                <MessageOutlined style={{ fontSize: 64, color: '#1890ff' }} />
              </Col>
              <Col xs={24} md={20}>
                <Paragraph>
                  O SURI é nosso assistente virtual, projetado para facilitar agendamentos, 
                  responder dúvidas e auxiliar no atendimento ao paciente. Utilize inteligência artificial 
                  para oferecer uma melhor experiência para seus pacientes.
                </Paragraph>
                <Space>
                  <Button type="primary" icon={<MessageOutlined />}>
                    <Link href="/chatbot">Iniciar Conversa</Link>
                  </Button>
                  <Button icon={<CalendarOutlined />}>
                    Agendar Consulta
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </>
  )
} 