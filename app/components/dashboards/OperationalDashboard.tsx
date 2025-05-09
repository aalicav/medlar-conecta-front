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
  Tabs,
  Calendar,
  Badge
} from 'antd';
import { 
  CalendarOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  UserOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { DashboardStats, Appointment, PendingItem } from '../../services/dashboardService';
import { useState } from 'react';
import type { Dayjs } from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

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
  // For calendar data (simplified example)
  const getAppointmentCountByDate = (date: Dayjs) => {
    // This would ideally pull from a more comprehensive dataset
    // For demo purposes, we'll just count appointments on the same day
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
          backgroundColor: count > 5 ? '#f5222d' : '#1890ff',
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
              title="Solicitações Pendentes" 
              value={stats.solicitations?.pending || 0} 
              prefix={<MedicineBoxOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/solicitations?status=pending" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver todas</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Novos Pacientes (Mês)" 
              value={stats.patients?.active || 0} 
              prefix={<UserOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/patients?new=true" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver pacientes</Button>
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
                        <Link href={`/appointments/${appointment.id}/confirm`}>
                          <Button size="small" type="primary" icon={<CheckCircleOutlined />}>Confirmar</Button>
                        </Link>
                        <Link href={`/appointments/${appointment.id}/reschedule`}>
                          <Button size="small" icon={<CalendarOutlined />}>Reagendar</Button>
                        </Link>
                        <Link href={`tel:${appointment.patient_id}`}>
                          <Button size="small" icon={<PhoneOutlined />}>Ligar</Button>
                        </Link>
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

        {/* Pending Items Section */}
        <Col xs={24} md={8}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Itens Pendentes</span>
              </div>
            }
            loading={loading}
          >
            <Tabs defaultActiveKey="1">
              <TabPane tab="Solicitações" key="1">
                {pendingItems.solicitations && pendingItems.solicitations.length > 0 ? (
                  <List
                    size="small"
                    dataSource={pendingItems.solicitations}
                    renderItem={item => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<MedicineBoxOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
                          title={
                            <div>
                              <Link href={item.link}>{item.title}</Link>
                              <Tag color={item.priority === 'high' ? 'red' : 'blue'} style={{ marginLeft: 8 }}>
                                {item.priority === 'high' ? 'Urgente' : 'Normal'}
                              </Tag>
                            </div>
                          }
                          description={item.description}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="Não há solicitações pendentes" />
                )}
              </TabPane>
              <TabPane tab="Agendamentos" key="2">
                {pendingItems.appointments && pendingItems.appointments.length > 0 ? (
                  <List
                    size="small"
                    dataSource={pendingItems.appointments}
                    renderItem={item => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<CalendarOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                          title={
                            <div>
                              <Link href={item.link}>{item.title}</Link>
                              <Tag color={item.priority === 'high' ? 'red' : 'blue'} style={{ marginLeft: 8 }}>
                                {item.priority === 'high' ? 'Urgente' : 'Normal'}
                              </Tag>
                            </div>
                          }
                          description={item.description}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="Não há agendamentos pendentes" />
                )}
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

        {/* Overall Statistics */}
        <Col xs={24}>
          <Card title="Estatísticas Gerais" loading={loading}>
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic 
                  title="Total de Pacientes" 
                  value={stats.patients?.total || 0} 
                  prefix={<TeamOutlined />} 
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic 
                  title="Total de Consultas" 
                  value={stats.appointments?.total || 0} 
                  prefix={<CalendarOutlined />} 
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic 
                  title="Consultas Concluídas" 
                  value={stats.appointments?.completed || 0} 
                  prefix={<CheckCircleOutlined />} 
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic 
                  title="Total de Solicitações" 
                  value={stats.solicitations?.total || 0} 
                  prefix={<MedicineBoxOutlined />} 
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default OperationalDashboard; 