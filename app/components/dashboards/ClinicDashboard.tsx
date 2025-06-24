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
  Tabs,
  Progress
} from 'antd';
import { 
  CalendarOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  DollarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  BankOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { DashboardStats, Appointment } from '../../services/dashboardService';
import type { Dayjs } from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface ClinicDashboardProps {
  stats: DashboardStats;
  upcomingAppointments: Appointment[];
  loading: boolean;
}

const ClinicDashboard: React.FC<ClinicDashboardProps> = ({ 
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
          backgroundColor: count > 10 ? '#f5222d' : count > 5 ? '#faad14' : '#1890ff',
          fontSize: '10px',
          boxShadow: 'none'
        }}
      />
    ) : null;
  };

  // Example data for room occupancy
  const roomOccupancy = 65; // Percentage

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
              title="Receita Total" 
              value={stats.revenue?.total || 0} 
              precision={2}
              suffix="R$"
              prefix={<DollarOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/reports/revenue" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver relatório</Button>
              </Link>
            </div>
          </Card>
        </Col>
        
        {/* Facility Management */}
        <Col xs={24} md={12}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Gerenciamento de Instalações</span>
                <Link href="/facility-management" passHref>
                  <Button type="link" size="small">Gerenciar</Button>
                </Link>
              </div>
            }
            loading={loading}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Ocupação de Salas"
                    value={roomOccupancy}
                    suffix="%"
                    valueStyle={{ color: roomOccupancy > 80 ? '#cf1322' : '#3f8600' }}
                  />
                  <Progress 
                    percent={roomOccupancy} 
                    strokeColor={
                      roomOccupancy > 80 ? '#cf1322' : 
                      roomOccupancy > 50 ? '#faad14' : '#3f8600'
                    }
                    showInfo={false}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Salas Disponíveis"
                    value={8}
                    prefix={<HomeOutlined />}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Link href="/rooms" passHref>
                      <Button type="link" size="small" style={{ paddingLeft: 0 }}>Gerenciar salas</Button>
                    </Link>
                  </div>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Equipamentos"
                    value={42}
                    prefix={<MedicineBoxOutlined />}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Link href="/equipment" passHref>
                      <Button type="link" size="small" style={{ paddingLeft: 0 }}>Gerenciar equipamentos</Button>
                    </Link>
                  </div>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="Profissionais na Estabelecimento"
                    value={12}
                    prefix={<UserOutlined />}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Link href="/professionals" passHref>
                      <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver profissionais</Button>
                    </Link>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Upcoming Appointments Section */}
        <Col xs={24} md={12}>
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
            <Tabs defaultActiveKey="1">
              <TabPane tab="Hoje" key="1">
                {upcomingAppointments.length > 0 ? (
                  <List
                    dataSource={upcomingAppointments.filter(a => a.date === new Date().toISOString().split('T')[0])}
                    renderItem={appointment => (
                      <List.Item>
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
                              <Text>{appointment.time}</Text>
                              <Text style={{ marginLeft: 8 }}>•</Text>
                              <Text style={{ marginLeft: 8 }}>{appointment.type}</Text>
                            </>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="Não há consultas agendadas para hoje" />
                )}
              </TabPane>
              <TabPane tab="Amanhã" key="2">
                <Empty description="Não há consultas agendadas para amanhã ainda" />
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* Calendar View */}
        <Col xs={24}>
          <Card title="Calendário de Agendamentos" loading={loading}>
            <Calendar 
              fullscreen={false} 
              dateCellRender={dateCellRender}
            />
          </Card>
        </Col>

        {/* Clinic Performance */}
        <Col xs={24}>
          <Card 
            title="Desempenho da Estabelecimento" 
            extra={<Link href="/reports/clinic-performance">Ver relatório completo</Link>}
            loading={loading}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic 
                    title="Taxa de Ocupação" 
                    value={74.5} 
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<BarChartOutlined />} 
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Taxa de ocupação da clínica no mês
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic 
                    title="Tempo Médio de Consulta" 
                    value={32} 
                    suffix="min"
                    prefix={<ClockCircleOutlined />} 
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Duração média das consultas
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic 
                    title="Taxa de Fidelização" 
                    value={87.3} 
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<TeamOutlined />} 
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Pacientes que retornam à clínica
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic 
                    title="Satisfação" 
                    value={4.7} 
                    precision={1}
                    suffix="/5"
                    valueStyle={{ color: '#3f8600' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Avaliação média dos pacientes
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Location Map */}
        <Col xs={24}>
          <Card 
            title="Localização e Unidades" 
            extra={<Link href="/locations">Gerenciar Unidades</Link>}
            loading={loading}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={16}>
                <div style={{ 
                  background: '#f0f2f5', 
                  height: 200, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: 8 
                }}>
                  <EnvironmentOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  <Text style={{ marginLeft: 16 }}>Mapa de localização das unidades</Text>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <List
                  size="small"
                  header={<div><BankOutlined /> Unidades Ativas</div>}
                  bordered
                  dataSource={[
                    'Unidade Centro - Rua Principal, 123',
                    'Unidade Norte - Av. das Flores, 456',
                    'Unidade Sul - Praça da República, 789'
                  ]}
                  renderItem={(item) => <List.Item>{item}</List.Item>}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default ClinicDashboard; 