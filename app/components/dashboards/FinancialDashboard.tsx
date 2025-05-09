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
  Progress
} from 'antd';
import { 
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  FileTextOutlined,
  BankOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { DashboardStats, PendingItem } from '../../services/dashboardService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface FinancialDashboardProps {
  stats: DashboardStats;
  pendingItems: Record<string, PendingItem[]>;
  loading: boolean;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({ 
  stats, 
  pendingItems,
  loading 
}) => {
  // Calculate percentage for revenue progress
  const calculatePercentage = (current: number, target: number) => {
    if (!target) return 0;
    const percentage = (current / target) * 100;
    return percentage > 100 ? 100 : percentage;
  };

  // Example monthly target (this would typically come from the backend)
  const monthlyRevenueTarget = 100000;
  const revenueProgress = calculatePercentage(
    stats.revenue?.month_to_date || 0,
    monthlyRevenueTarget
  );

  return (
    <>
      <Row gutter={[24, 24]}>
        {/* Main Statistics */}
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
              <Link href="/reports/financial" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver relatório</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Receita (Mês Atual)" 
              value={stats.revenue?.month_to_date || 0}
              precision={2}
              suffix="R$"
              prefix={<DollarOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Progress percent={Math.round(revenueProgress)} status="active" />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Pagamentos Pendentes" 
              value={stats.revenue?.pending || 0} 
              precision={2}
              suffix="R$"
              prefix={<ClockCircleOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/payments?status=pending" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver todos</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Profissionais p/ Pagar" 
              value={stats.professionals?.pending_payment || 0} 
              prefix={<TeamOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/professionals?payment_status=pending" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver todos</Button>
              </Link>
            </div>
          </Card>
        </Col>
        
        {/* Revenue Growth Card */}
        <Col xs={24} md={12}>
          <Card 
            title="Crescimento de Receita" 
            loading={loading}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Últimos 30 dias"
                    value={stats.revenue?.last_30_days || 0}
                    precision={2}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<ArrowUpOutlined />}
                    suffix="R$"
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Crescimento (vs mês anterior)"
                    value={15.3} // Example value
                    precision={1}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<ArrowUpOutlined />}
                    suffix="%"
                  />
                </Card>
              </Col>
              <Col span={24}>
                <div style={{ marginTop: 16 }}>
                  <Link href="/reports/financial-growth">
                    <Button type="primary" block>
                      Ver relatório completo de crescimento
                    </Button>
                  </Link>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Pending Items Section */}
        <Col xs={24} md={12}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Itens Pendentes</span>
              </div>
            }
            loading={loading}
          >
            <Tabs defaultActiveKey="1">
              <TabPane tab="Pagamentos" key="1">
                {pendingItems.payments && pendingItems.payments.length > 0 ? (
                  <List
                    size="small"
                    dataSource={pendingItems.payments}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <Link key="approve" href={`${item.link}/process`}>
                            <Button size="small" type="primary" icon={<CheckCircleOutlined />}>Processar</Button>
                          </Link>
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
                  <Empty description="Não há pagamentos pendentes" />
                )}
              </TabPane>
              <TabPane tab="Verificações de Valores" key="2">
                {pendingItems.value_verifications && pendingItems.value_verifications.length > 0 ? (
                  <List
                    size="small"
                    dataSource={pendingItems.value_verifications}
                    renderItem={item => (
                      <List.Item>
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
                  <Empty description="Não há verificações de valores pendentes" />
                )}
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* Financial Health */}
        <Col xs={24}>
          <Card 
            title="Saúde Financeira" 
            loading={loading}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={6}>
                <Card>
                  <Statistic
                    title="Taxa de Conversão"
                    value={86.7} // Example value
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#3f8600' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Consultas confirmadas vs agendadas
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card>
                  <Statistic
                    title="Valor Médio"
                    value={250.0} // Example value
                    precision={2}
                    suffix="R$"
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Valor médio por consulta
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card>
                  <Statistic
                    title="Inadimplência"
                    value={2.3} // Example value
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#cf1322' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Taxa de pagamentos em atraso
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} md={6}>
                <Card>
                  <Statistic
                    title="ROI Marketing"
                    value={421} // Example value
                    precision={0}
                    suffix="%"
                    valueStyle={{ color: '#3f8600' }}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      Retorno sobre investimento em marketing
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Recent Transactions */}
        <Col xs={24}>
          <Card 
            title="Transações Recentes" 
            extra={<Link href="/transactions">Ver todas</Link>}
            loading={loading}
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <Card
                  className="inner-card"
                  title="Últimos Recebimentos"
                  size="small"
                >
                  <List
                    size="small"
                    dataSource={[
                      { title: 'Plano de Saúde XYZ', amount: 12500.00, date: '2023-03-10' },
                      { title: 'Convênio ABC', amount: 8720.50, date: '2023-03-08' },
                      { title: 'Pagamentos Particulares', amount: 3450.00, date: '2023-03-07' }
                    ]}
                    renderItem={item => (
                      <List.Item>
                        <div>
                          <div>{item.title}</div>
                          <Text type="secondary">{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
                        </div>
                        <div>
                          <Text strong style={{ color: '#52c41a' }}>
                            + R$ {item.amount.toFixed(2)}
                          </Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              
              <Col xs={24} md={8}>
                <Card
                  className="inner-card"
                  title="Últimos Pagamentos"
                  size="small"
                >
                  <List
                    size="small"
                    dataSource={[
                      { title: 'Folha de Profissionais', amount: 28700.00, date: '2023-03-05' },
                      { title: 'Fornecedores', amount: 5430.20, date: '2023-03-04' },
                      { title: 'Infraestrutura', amount: 2300.00, date: '2023-03-03' }
                    ]}
                    renderItem={item => (
                      <List.Item>
                        <div>
                          <div>{item.title}</div>
                          <Text type="secondary">{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
                        </div>
                        <div>
                          <Text strong style={{ color: '#f5222d' }}>
                            - R$ {item.amount.toFixed(2)}
                          </Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              
              <Col xs={24} md={8}>
                <Card
                  className="inner-card"
                  title="Aprovações Pendentes"
                  size="small"
                  extra={<Link href="/approvals">Ver todas</Link>}
                >
                  <List
                    size="small"
                    dataSource={[
                      { title: 'Reembolso #1234', amount: 850.00, date: '2023-03-11' },
                      { title: 'Adiantamento #567', amount: 2000.00, date: '2023-03-10' },
                      { title: 'Despesa #890', amount: 320.75, date: '2023-03-09' }
                    ]}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <Button key="approve" size="small" type="link">
                            Aprovar
                          </Button>
                        ]}
                      >
                        <div>
                          <div>{item.title}</div>
                          <Text type="secondary">{new Date(item.date).toLocaleDateString('pt-BR')}</Text>
                        </div>
                        <div>
                          <Text strong>
                            R$ {item.amount.toFixed(2)}
                          </Text>
                        </div>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default FinancialDashboard; 