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
  Alert
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
  ClockCircleOutlined,
  AlertOutlined,
  MessageOutlined,
  FileSearchOutlined,
  SolutionOutlined,
  FormOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { DashboardStats, Appointment, PendingItem } from '../../services/dashboardService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface AdminDashboardProps {
  stats: DashboardStats | null;
  pendingItems: Record<string, PendingItem[]>;
  upcomingAppointments: Appointment[];
  todayAppointmentCount: number;
  suriMessageCount: number;
  loading: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  stats, 
  pendingItems,
  upcomingAppointments,
  todayAppointmentCount,
  suriMessageCount,
  loading 
}) => {
  // Features based on Dr. Italo's requirements
  const requiredFeatures = [
    {
      title: 'Gestão de Contratos',
      icon: <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      description: 'Fluxo de aprovação: Comercial → Jurídico → Comitê → Direção',
      link: '/contracts',
      isNew: true
    },
    {
      title: 'Verificação Dupla de Valores',
      icon: <DollarOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      description: 'Validação de dados financeiros por dois colaboradores',
      link: '/value-verifications',
      isNew: true
    },
    {
      title: 'Assinaturas Eletrônicas',
      icon: <FormOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      description: 'Integração com plataformas de assinatura digital',
      link: '/settings/integrations',
      isNew: true
    },
    {
      title: 'Faturamento Flexível',
      icon: <DollarOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
      description: 'Ciclos de faturamento adaptáveis por contrato',
      link: '/billing/rules',
      isNew: true
    },
    {
      title: 'Relatórios Financeiros',
      icon: <FileSearchOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
      description: 'Relatórios detalhados com assinatura e timbre',
      link: '/reports/financial',
      isNew: true
    },
    {
      title: 'Cadastro Unificado',
      icon: <SolutionOutlined style={{ fontSize: 24, color: '#13c2c2' }} />,
      description: 'Cadastro único para profissionais e estabelecimentos',
      link: '/professionals',
      isNew: true
    }
  ];

  return (
    <>
      <Alert
        message="Bem-vindo à nova versão do Sistema Médico"
        description="Implementamos recursos de verificação dupla de valores, gestão de contratos com fluxo de aprovação, e cadastro unificado de prestadores conforme requisitos do Dr. Italo."
        type="info"
        showIcon
        closable
        style={{ marginBottom: 24 }}
      />
      
      <Row gutter={[24, 24]}>
        {/* Main Statistics */}
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Consultas Hoje" 
              value={todayAppointmentCount} 
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
              title="Novos Pacientes (Mês)" 
              value={stats?.patients?.active || 0} 
              prefix={<TeamOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/patients?new=true" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver pacientes</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Mensagens SURI" 
              value={suriMessageCount} 
              prefix={<MessageOutlined />} 
            />
            <div style={{ marginTop: 12 }}>
              <Link href="/chatbot/dashboard" passHref>
                <Button type="link" size="small" style={{ paddingLeft: 0 }}>Ver análise</Button>
              </Link>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card loading={loading}>
            <Statistic 
              title="Faturamento (Mês)" 
              value={stats?.revenue?.month_to_date || 0} 
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
      </Row>

      {/* Required Features Section */}
      <div style={{ marginTop: 24 }}>
        <Title level={4}>Novas Funcionalidades</Title>
        <Row gutter={[16, 16]}>
          {requiredFeatures.map((feature, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card 
                hoverable 
                style={{ height: '100%' }}
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
      </div>

      {/* Workflows Section */}
      <div style={{ marginTop: 24 }}>
        <Title level={4}>Fluxos de Trabalho</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card 
              title="Contratos e Negociações" 
              extra={<Link href="/contracts">Gerenciar</Link>}
              loading={loading}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message="Fluxo de Aprovação de Contratos"
                  description={
                    <ol style={{ marginBottom: 0, paddingLeft: 16 }}>
                      <li>Início pela equipe comercial</li>
                      <li>Análise e parecer do departamento jurídico</li>
                      <li>Revisão por comitê</li>
                      <li>Aprovação final da direção</li>
                      <li>Assinatura eletrônica pelos envolvidos</li>
                    </ol>
                  }
                  type="info"
                  showIcon
                />
                
                <Alert
                  message="Negociações Extemporâneas"
                  description="Procedimentos não contratados urgentes geram alerta para área comercial/jurídica para preparação de aditivo contratual."
                  type="warning"
                  showIcon
                />
              </Space>
              
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Contratos Pendentes</Title>
                {pendingItems.contracts && pendingItems.contracts.length > 0 ? (
                  <List
                    size="small"
                    dataSource={pendingItems.contracts.slice(0, 3)}
                    renderItem={item => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<FileTextOutlined style={{ fontSize: 16, color: '#1890ff' }} />}
                          title={<Link href={item.link}>{item.title}</Link>}
                          description={item.description}
                        />
                        <Tag color={item.priority === 'high' ? 'red' : 'blue'}>
                          {item.priority === 'high' ? 'Urgente' : 'Normal'}
                        </Tag>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="Não há contratos pendentes" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card 
              title="Faturamento e Verificações" 
              extra={<Link href="/financials">Gerenciar</Link>}
              loading={loading}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Alert
                  message="Verificação Dupla de Valores"
                  description="Toda entrada de dados financeiros sensíveis requer uma dupla checagem: uma pessoa insere a informação e outra aprova."
                  type="info"
                  showIcon
                />
                
                <Alert
                  message="Ciclos de Faturamento"
                  description="O sistema suporta diferentes periodicidades de faturamento conforme negociado em contrato com cada operadora."
                  type="success"
                  showIcon
                />
              </Space>
              
              <div style={{ marginTop: 16 }}>
                <Title level={5}>Verificações Pendentes</Title>
                {pendingItems.value_verifications && pendingItems.value_verifications.length > 0 ? (
                  <List
                    size="small"
                    dataSource={pendingItems.value_verifications.slice(0, 3)}
                    renderItem={item => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<DollarOutlined style={{ fontSize: 16, color: '#52c41a' }} />}
                          title={<Link href={item.link}>{item.title}</Link>}
                          description={item.description}
                        />
                        <Tag color={item.priority === 'high' ? 'red' : 'blue'}>
                          {item.priority === 'high' ? 'Urgente' : 'Normal'}
                        </Tag>
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="Não há verificações pendentes" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                )}
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Specialty Registration Flow */}
      <div style={{ marginTop: 24 }}>
        <Card 
          title="Fluxo de Cadastro de Especialidades" 
          loading={loading}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={8}>
              <Card
                className="inner-card"
                title="1. Cadastro Unificado"
                size="small"
                bordered={false}
                style={{ background: '#f9f9f9' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Paragraph>
                    <strong>Cadastro único</strong> para profissional ou estabelecimento de saúde.
                  </Paragraph>
                  <Paragraph>
                    Campo único que aceita tanto CPF quanto CNPJ.
                  </Paragraph>
                  <Paragraph>
                    Inclui dados básicos como nome, documento, endereço, contatos e documentos comprobatórios.
                  </Paragraph>
                </Space>
                <Link href="/professionals/new">
                  <Button type="primary" size="small">Iniciar Cadastro</Button>
                </Link>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card
                className="inner-card"
                title="2. Vincular ao Plano"
                size="small"
                bordered={false}
                style={{ background: '#f9f9f9' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Paragraph>
                    Após o cadastro básico, vincular o prestador a um ou mais planos de saúde.
                  </Paragraph>
                  <Paragraph>
                    Seleção das especialidades oferecidas pelo prestador.
                  </Paragraph>
                  <Paragraph>
                    Esta etapa é realizada pela equipe comercial.
                  </Paragraph>
                </Space>
                <Link href="/professionals/specialties">
                  <Button type="primary" size="small">Gerenciar Especialidades</Button>
                </Link>
              </Card>
            </Col>
            
            <Col xs={24} md={8}>
              <Card
                className="inner-card"
                title="3. Negociação e Contrato"
                size="small"
                bordered={false}
                style={{ background: '#f9f9f9' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Paragraph>
                    Negociação de valores para especialidades e procedimentos.
                  </Paragraph>
                  <Paragraph>
                    Geração do contrato com base no modelo adequado.
                  </Paragraph>
                  <Paragraph>
                    Fluxo de aprovações e assinatura eletrônica.
                  </Paragraph>
                </Space>
                <Link href="/contracts/new">
                  <Button type="primary" size="small">Criar Contrato</Button>
                </Link>
              </Card>
            </Col>
          </Row>
          
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link href="/settings/workflows">
              <Button type="default">
                Configurar Fluxos de Trabalho <ArrowRightOutlined />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </>
  );
};

export default AdminDashboard; 