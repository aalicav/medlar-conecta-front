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
  Empty,
  Table
} from 'antd';
import { 
  FileTextOutlined,
  DollarOutlined, 
  TeamOutlined,
  ArrowRightOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  EditOutlined,
  FieldTimeOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { DashboardStats, PendingItem } from '../../services/dashboardService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface CommercialDashboardProps {
  stats: DashboardStats;
  pendingItems: Record<string, PendingItem[]>;
  loading: boolean;
}

const CommercialDashboard: React.FC<CommercialDashboardProps> = ({ 
  stats, 
  pendingItems,
  loading 
}) => {
  // Check if this user is Adla (special view for addendums)
  const isAdla = () => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user && user.name && user.name.toLowerCase().includes("adla");
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => <Link href={`/extemporaneous-negotiations/${id}`}>{id}</Link>
    },
    {
      title: 'Contrato',
      dataIndex: 'contract_id',
      key: 'contract_id',
      render: (contractId: number) => <Link href={`/contracts/${contractId}`}>{contractId}</Link>
    },
    {
      title: 'Código TUSS',
      dataIndex: 'tuss_id',
      key: 'tuss_id',
    },
    {
      title: 'Valor Aprovado',
      dataIndex: 'approved_value',
      key: 'approved_value',
      render: (value: number) => `R$ ${value.toFixed(2)}`
    },
    {
      title: 'Aprovado em',
      dataIndex: 'approved_at',
      key: 'approved_at',
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR')
    },
    {
      title: 'Ações',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Link href={`/extemporaneous-negotiations/${record.id}/addendum`}>
            <Button type="primary" size="small" icon={<EditOutlined />}>
              Criar Aditivo
            </Button>
          </Link>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Row gutter={[24, 24]}>
        {/* Main Statistics */}
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Contratos Ativos" 
              value={stats.contracts?.active || 0} 
              prefix={<FileTextOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/contracts?status=active" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver todos</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Contratos Expirando" 
              value={stats.contracts?.expiring_soon || 0}
              prefix={<FieldTimeOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/contracts?expiring=true" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver todos</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Negociações Pendentes" 
              value={stats.negotiations?.pending || 0} 
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
              title="Aditivos Pendentes" 
              value={stats.negotiations?.pending_addendum || 0} 
              prefix={<EditOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/extemporaneous-negotiations?requires_addendum=true" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver todos</Button>
              </Link>
            </div>
          </Card>
        </Col>
        
        {/* Pending Items Section */}
        <Col xs={24}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Itens Pendentes</span>
              </div>
            }
            loading={loading}
          >
            <Tabs defaultActiveKey="1">
              <TabPane tab="Contratos" key="1">
                {pendingItems.contracts && pendingItems.contracts.length > 0 ? (
                  <List
                    dataSource={pendingItems.contracts}
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
                        <Space>
                          <Link href={`${item.link}/edit`}>
                            <Button size="small" icon={<EditOutlined />}>Editar</Button>
                          </Link>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="Não há contratos pendentes" />
                )}
              </TabPane>
              <TabPane tab="Negociações" key="2">
                {pendingItems.negotiations && pendingItems.negotiations.length > 0 ? (
                  <List
                    dataSource={pendingItems.negotiations}
                    renderItem={item => (
                      <List.Item>
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
                        <Space>
                          <Link href={`${item.link}/edit`}>
                            <Button size="small" icon={<EditOutlined />}>Editar</Button>
                          </Link>
                        </Space>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="Não há negociações extemporâneas pendentes" />
                )}
              </TabPane>
              {isAdla() && (
                <TabPane tab="Aditivos Pendentes" key="3">
                  {pendingItems.addendums && pendingItems.addendums.length > 0 ? (
                    <List
                      dataSource={pendingItems.addendums}
                      renderItem={item => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<EditOutlined style={{ fontSize: 24, color: '#722ed1' }} />}
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
                          <Space>
                            <Link href={`${item.link}/addendum`}>
                              <Button size="small" type="primary" icon={<EditOutlined />}>Criar Aditivo</Button>
                            </Link>
                          </Space>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Empty description="Não há aditivos pendentes" />
                  )}
                </TabPane>
              )}
            </Tabs>
          </Card>
        </Col>

        {/* Addendum Details Section (Adla only) */}
        {isAdla() && stats.negotiations?.pending_addendum_details && stats.negotiations.pending_addendum_details.length > 0 && (
          <Col xs={24}>
            <Card 
              title="Detalhes dos Aditivos Pendentes" 
              loading={loading}
            >
              <Table 
                dataSource={stats.negotiations.pending_addendum_details} 
                columns={columns} 
                rowKey="id" 
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        )}

        {/* Overall Statistics */}
        <Col xs={24}>
          <Card title="Estatísticas Gerais" loading={loading}>
            <Row gutter={[24, 24]}>
              <Col xs={24} sm={8} md={4}>
                <Statistic 
                  title="Total de Contratos" 
                  value={stats.contracts?.total || 0} 
                  prefix={<FileTextOutlined />} 
                />
              </Col>
              <Col xs={24} sm={8} md={4}>
                <Statistic 
                  title="Contratos Expirados" 
                  value={stats.contracts?.expired || 0} 
                  prefix={<FileTextOutlined />} 
                />
              </Col>
              <Col xs={24} sm={8} md={4}>
                <Statistic 
                  title="Total de Negociações" 
                  value={stats.negotiations?.total || 0} 
                  prefix={<AlertOutlined />} 
                />
              </Col>
              <Col xs={24} sm={8} md={4}>
                <Statistic 
                  title="Negociações Aprovadas" 
                  value={stats.negotiations?.approved || 0} 
                  prefix={<CheckCircleOutlined />} 
                />
              </Col>
              <Col xs={24} sm={8} md={4}>
                <Statistic 
                  title="Total de Pacientes" 
                  value={stats.patients?.total || 0} 
                  prefix={<TeamOutlined />} 
                />
              </Col>
              <Col xs={24} sm={8} md={4}>
                <Statistic 
                  title="Receita Total" 
                  value={stats.revenue?.total || 0} 
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

export default CommercialDashboard; 