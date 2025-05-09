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
  Alert,
  Tabs,
  Empty
} from 'antd';
import { 
  UserOutlined, 
  DollarOutlined, 
  CalendarOutlined,
  FileTextOutlined,
  BankOutlined,
  TeamOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AlertOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { DashboardStats, Appointment, PendingItem } from '../../services/dashboardService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

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
      <Row gutter={[24, 24]}>
        {/* Main Statistics */}
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Contratos Pendentes" 
              value={stats.pending_approvals?.contracts || 0} 
              prefix={<FileTextOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/contracts?status=awaiting_approval" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver todos</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Negociações Pendentes" 
              value={stats.pending_approvals?.negotiations || 0}
              prefix={<AlertOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/extemporaneous-negotiations?status=pending" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver todas</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Verificações de Valores" 
              value={stats.pending_approvals?.value_verifications || 0} 
              prefix={<DollarOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/value-verifications?status=pending" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver todas</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Total de Receitas" 
              value={stats.revenue?.total || 0} 
              prefix={<DollarOutlined />} 
              precision={2} 
              suffix="R$"
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/reports/financial" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver relatório</Button>
              </Link>
            </div>
          </Card>
        </Col>
        
        {/* Pending Items Section */}
        <Col xs={24} md={16}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Itens que requerem sua aprovação</span>
              </div>
            }
            loading={loading}
          >
            <Tabs defaultActiveKey="1">
              <TabPane tab="Verificações de Valores" key="1">
                {pendingItems.value_verifications && pendingItems.value_verifications.length > 0 ? (
                  <List
                    dataSource={pendingItems.value_verifications}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <Space key="actions">
                            <Link href={`${item.link}/approve`} passHref>
                              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>Aprovar</Button>
                            </Link>
                            <Link href={`${item.link}/reject`} passHref>
                              <Button size="small" danger icon={<CloseCircleOutlined />}>Rejeitar</Button>
                            </Link>
                          </Space>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<DollarOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
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
                  <Empty description="Não há verificações de valores pendentes" />
                )}
              </TabPane>
              <TabPane tab="Contratos" key="2">
                {pendingItems.contracts && pendingItems.contracts.length > 0 ? (
                  <List
                    dataSource={pendingItems.contracts}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <Space key="actions">
                            <Link href={`${item.link}/approve`} passHref>
                              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>Aprovar</Button>
                            </Link>
                            <Link href={`${item.link}/reject`} passHref>
                              <Button size="small" danger icon={<CloseCircleOutlined />}>Rejeitar</Button>
                            </Link>
                          </Space>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
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
                  <Empty description="Não há contratos pendentes de aprovação" />
                )}
              </TabPane>
              <TabPane tab="Negociações" key="3">
                {pendingItems.negotiations && pendingItems.negotiations.length > 0 ? (
                  <List
                    dataSource={pendingItems.negotiations}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <Space key="actions">
                            <Link href={`${item.link}/approve`} passHref>
                              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>Aprovar</Button>
                            </Link>
                            <Link href={`${item.link}/reject`} passHref>
                              <Button size="small" danger icon={<CloseCircleOutlined />}>Rejeitar</Button>
                            </Link>
                          </Space>
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<AlertOutlined style={{ fontSize: 24, color: '#faad14' }} />}
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
                  <Empty description="Não há negociações extemporâneas pendentes" />
                )}
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* Appointments Section */}
        <Col xs={24} md={8}>
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
                  title="Consultas Pendentes" 
                  value={stats.appointments?.pending || 0} 
                  prefix={<CalendarOutlined />} 
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic 
                  title="Receitas Pendentes" 
                  value={stats.revenue?.pending || 0} 
                  prefix={<DollarOutlined />} 
                  precision={2}
                  suffix="R$"
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default DirectorDashboard; 