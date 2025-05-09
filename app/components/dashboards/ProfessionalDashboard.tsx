import { 
  Row, 
  Col, 
  Card, 
  Statistic, 
  Typography, 
  List, 
  Button, 
  Tag, 
  Space,
  Empty,
  Calendar,
  Badge,
  Avatar
} from 'antd';
import { 
  CalendarOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  UserOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  FileOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { DashboardStats, Appointment } from '../../services/dashboardService';
import type { Dayjs } from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface ProfessionalDashboardProps {
  stats: DashboardStats;
  upcomingAppointments: Appointment[];
  loading: boolean;
}

const ProfessionalDashboard: React.FC<ProfessionalDashboardProps> = ({ 
  stats, 
  upcomingAppointments,
  loading 
}) => {
  // For calendar data (simplified example)
  const getAppointmentCountByDate = (date: Dayjs) => {
    // This would ideally pull from a more comprehensive dataset
    const dateString = date.format('YYYY-MM-DD');
    return upcomingAppointments.filter(appointment => 
      appointment.date === dateString
    ).length;
  };

  const dateCellRender = (date: Dayjs) => {
    const count = getAppointmentCountByDate(date);
    return count ? (
      <Badge 
        count={count} 
        style={{ 
          backgroundColor: count > 3 ? '#f5222d' : '#1890ff',
          fontSize: '10px',
          boxShadow: 'none'
        }}
      />
    ) : null;
  };

  return (
    <>
      <Row gutter={[24, 24]}>
        {/* Main Statistics */}
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Consultas Hoje" 
              value={stats.appointments?.today || 0} 
              prefix={<CalendarOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/appointments/today" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver detalhes</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Consultas Pendentes" 
              value={stats.appointments?.pending || 0}
              prefix={<ClockCircleOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/appointments?status=pending" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver todas</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Total de Pacientes" 
              value={stats.patients?.total || 0} 
              prefix={<TeamOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/patients" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver pacientes</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Receita do Mês" 
              value={stats.revenue?.month_to_date || 0} 
              precision={2}
              suffix="R$"
              prefix={<DollarOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/reports/my-earnings" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver relatório</Button>
              </Link>
            </div>
          </Card>
        </Col>
        
        {/* Upcoming Appointments Section */}
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
                        <Link href={`/appointments/${appointment.id}/details`}>
                          <Button size="small" type="primary">Ver detalhes</Button>
                        </Link>
                        <Link href={`/patients/${appointment.patient_id}`}>
                          <Button size="small">Ficha do paciente</Button>
                        </Link>
                      </Space>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />}
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
              <Empty description="Não há consultas agendadas para você" />
            )}
          </Card>
        </Col>

        {/* Quick Actions Section */}
        <Col xs={24} md={8}>
          <Card
            title="Ações Rápidas"
            loading={loading}
          >
            <List
              itemLayout="horizontal"
              dataSource={[
                {
                  title: 'Iniciar Teleconsulta',
                  icon: <MessageOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
                  link: '/teleconsulta',
                  description: 'Inicie uma consulta online com seus pacientes'
                },
                {
                  title: 'Prescrever Medicamentos',
                  icon: <MedicineBoxOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
                  link: '/prescriptions/new',
                  description: 'Crie uma nova prescrição para um paciente'
                },
                {
                  title: 'Atualizar Agenda',
                  icon: <CalendarOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
                  link: '/schedule/edit',
                  description: 'Gerencie sua disponibilidade para consultas'
                },
                {
                  title: 'Solicitar Exames',
                  icon: <FileOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
                  link: '/exams/request',
                  description: 'Solicite exames para seus pacientes'
                }
              ]}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={item.icon}
                    title={<Link href={item.link}>{item.title}</Link>}
                    description={item.description}
                  />
                  <Link href={item.link}>
                    <Button type="primary" size="small">Acessar</Button>
                  </Link>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Calendar Section */}
        <Col xs={24}>
          <Card 
            title="Minha Agenda"
            extra={<Link href="/schedule">Ver agenda completa</Link>}
            loading={loading}
          >
            <Calendar 
              fullscreen={false} 
              dateCellRender={dateCellRender}
            />
          </Card>
        </Col>

        {/* Performance Statistics */}
        <Col xs={24}>
          <Card title="Estatísticas de Desempenho" loading={loading}>
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic 
                    title="Consultas Realizadas" 
                    value={stats.appointments?.completed || 0} 
                    prefix={<CheckCircleOutlined />} 
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Total de consultas realizadas no mês
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic 
                    title="Taxa de Retorno" 
                    value={78} 
                    suffix="%" 
                    valueStyle={{ color: '#3f8600' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Pacientes que retornam para consultas
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic 
                    title="Satisfação dos Pacientes" 
                    value={4.8} 
                    precision={1}
                    suffix="/5"
                    valueStyle={{ color: '#3f8600' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Avaliação média de satisfação dos pacientes
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic 
                    title="Taxa de Conversão" 
                    value={92.5} 
                    precision={1} 
                    suffix="%" 
                    valueStyle={{ color: '#3f8600' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Agendamentos confirmados vs. cancelados
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ProfessionalDashboard; 