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
  Tabs
} from 'antd';
import { 
  FileTextOutlined,
  EditOutlined,
  SafetyOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { DashboardStats, PendingItem } from '../../services/dashboardService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface LegalDashboardProps {
  stats: DashboardStats;
  pendingItems: Record<string, PendingItem[]>;
  loading: boolean;
}

const LegalDashboard: React.FC<LegalDashboardProps> = ({ 
  stats, 
  pendingItems,
  loading 
}) => {
  return (
    <>
      <Row gutter={[24, 24]}>
        {/* Main Statistics */}
        <Col xs={24} sm={12} md={8}>
          <Card loading={loading}>
            <Statistic 
              title="Contratos Pendentes de Revisão" 
              value={stats.contracts?.pending_review || 0} 
              prefix={<FileTextOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/contracts?status=awaiting_legal_review" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver todos</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card loading={loading}>
            <Statistic 
              title="Aditivos Pendentes" 
              value={stats.addendums?.pending || 0}
              prefix={<EditOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/extemporaneous-negotiations?requires_addendum=true" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver todos</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card loading={loading}>
            <Statistic 
              title="Modelos de Contrato" 
              value={stats.contracts?.template_count || 0} 
              prefix={<SafetyOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/contracts/templates" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Gerenciar modelos</Button>
              </Link>
            </div>
          </Card>
        </Col>
        
        {/* Pending Items Section */}
        <Col xs={24}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Itens que Requerem Sua Atenção</span>
              </div>
            }
            loading={loading}
          >
            <Tabs defaultActiveKey="1">
              <TabPane tab="Contratos para Revisão" key="1">
                {pendingItems.contracts && pendingItems.contracts.length > 0 ? (
                  <List
                    dataSource={pendingItems.contracts}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <Space key="actions">
                            <Link href={`${item.link}/review`}>
                              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>Revisar</Button>
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
                  <Empty description="Não há contratos pendentes de revisão" />
                )}
              </TabPane>
              <TabPane tab="Aditivos Pendentes" key="2">
                {pendingItems.addendums && pendingItems.addendums.length > 0 ? (
                  <List
                    dataSource={pendingItems.addendums}
                    renderItem={item => (
                      <List.Item
                        actions={[
                          <Space key="actions">
                            <Link href={`${item.link}/review`}>
                              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>Revisar</Button>
                            </Link>
                          </Space>
                        ]}
                      >
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
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="Não há aditivos pendentes de revisão" />
                )}
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col xs={24}>
          <Card title="Ações Recentes" loading={loading}>
            <div style={{ marginBottom: 16 }}>
              <Link href="/activity-log?type=contract">
                <Button type="primary">
                  Ver Registro Completo de Atividades
                  <ArrowRightOutlined />
                </Button>
              </Link>
            </div>

            <Row gutter={[24, 24]}>
              <Col xs={24} md={8}>
                <Card 
                  title="Gerenciamento de Riscos" 
                  size="small"
                  extra={<Link href="/legal/risk-management">Gerenciar</Link>}
                >
                  <p>Acesse a ferramenta de avaliação de riscos para contratos e negociações.</p>
                  <p>Você pode cadastrar novos riscos, gerenciar modelos de cláusulas e criar análises de conformidade.</p>
                </Card>
              </Col>
              
              <Col xs={24} md={8}>
                <Card 
                  title="Biblioteca de Cláusulas" 
                  size="small"
                  extra={<Link href="/legal/clause-library">Acessar</Link>}
                >
                  <p>Acesse a biblioteca de cláusulas padronizadas para diferentes tipos de contratos.</p>
                  <p>Você pode criar, editar e organizar cláusulas por categoria e aplicabilidade.</p>
                </Card>
              </Col>
              
              <Col xs={24} md={8}>
                <Card 
                  title="Conformidade Legal" 
                  size="small"
                  extra={<Link href="/legal/compliance">Verificar</Link>}
                >
                  <p>Acesse a ferramenta de verificação de conformidade legal para contratos.</p>
                  <p>Você pode realizar análises automáticas de contratos e verificar requisitos regulatórios.</p>
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default LegalDashboard; 