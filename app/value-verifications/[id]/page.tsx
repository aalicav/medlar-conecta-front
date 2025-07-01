"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Card, 
  Typography, 
  Descriptions, 
  Button, 
  Space, 
  Tag, 
  Divider, 
  Spin, 
  Alert,
  Input,
  Modal,
  Form,
  notification,
  Row,
  Col,
  Statistic,
  Timeline,
  InputNumber,
  message
} from "antd";
import { 
  ArrowLeftOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckOutlined,
  CloseOutlined
} from "@ant-design/icons";
import Link from "next/link";
import axios from "@/lib/axios";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { useAuth } from "@/contexts/auth-context";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { confirm } = Modal;

// Define interface for verification object
interface Verification {
  id: number;
  entity_type: string;
  entity_id: number;
  value_type: string;
  original_value: number;
  verified_value?: number;
  status: 'pending' | 'verified' | 'rejected' | 'auto_approved';
  notes?: string;
  verification_reason?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  auto_approve_threshold?: number;
  requester?: {
    id: number;
    name: string;
  };
  requester_id?: number;
  verifier?: {
    id: number;
    name: string;
  };
  created_at: string;
  verified_at?: string;
  
  // Billing integration
  billing_batch_id?: number;
  billing_item_id?: number;
  appointment_id?: number;
  billingBatch?: {
    id: number;
    reference_period_start: string;
    reference_period_end: string;
    total_amount: number;
    status: string;
  };
  billingItem?: {
    id: number;
    description: string;
    unit_price: number;
    total_amount: number;
    tuss_code?: string;
    tuss_description?: string;
  };
  appointment?: {
    id: number;
    scheduled_date: string;
    patient_name?: string;
    professional_name?: string;
  };
}

// Define form value interfaces
interface VerifyFormValues {
  verified_value: number;
  notes?: string;
}

interface RejectFormValues {
  notes: string;
}

export default function ValueVerificationDetail() {
  const params = useParams();
  const router = useRouter();
  const { hasRole, user } = useAuth();
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [verifyForm] = Form.useForm<VerifyFormValues>();
  const [rejectForm] = Form.useForm<RejectFormValues>();
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const id = params?.id as string;
  const isDirector = hasRole(["director", "super_admin"]);
  const canVerify = hasRole(["director", "super_admin", "financial"]);
  
  // Fetch verification details
  useEffect(() => {
    const fetchVerification = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/value-verifications/${id}`);
        
        if (response.data.data) {
          setVerification(response.data.data);
        } else {
          setError('Failed to load verification details');
        }
      } catch (error) {
        console.error('Error fetching verification:', error);
        setError('Failed to load verification details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchVerification();
    }
  }, [id]);
  
  // Check if current user can verify
  const canPerformAction = canVerify && 
                          verification?.status === 'pending' && 
                          verification?.requester?.id !== user?.id;
  
  // Format value type for display
  const getValueTypeDisplay = (valueType: string): string => {
    switch (valueType) {
      case 'appointment_price':
        return 'Preço do Agendamento';
      case 'procedure_price':
        return 'Preço do Procedimento';
      case 'specialty_price':
        return 'Preço da Especialidade';
      case 'contract_price':
        return 'Preço do Contrato';
      case 'billing_amount':
        return 'Valor de Cobrança';
      default:
        return valueType;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'low':
        return 'blue';
      case 'medium':
        return 'orange';
      case 'high':
        return 'red';
      case 'critical':
        return 'purple';
      default:
        return 'default';
    }
  };
  
  // Status display with tag
  const renderStatus = (status: string) => {
    let color = 'default';
    let text = 'Desconhecido';
    let icon = null;
    
    switch (status) {
      case 'pending':
        color = 'warning';
        text = 'Pendente';
        icon = <ClockCircleOutlined />;
        break;
      case 'verified':
        color = 'success';
        text = 'Verificado';
        icon = <CheckCircleOutlined />;
        break;
      case 'rejected':
        color = 'error';
        text = 'Rejeitado';
        icon = <CloseCircleOutlined />;
        break;
      case 'auto_approved':
        color = 'processing';
        text = 'Auto-aprovado';
        icon = <CheckOutlined />;
        break;
    }
    
    return (
      <Tag icon={icon} color={color} style={{ fontSize: '14px', padding: '4px 8px' }}>
        {text}
      </Tag>
    );
  };

  const getDifferencePercentage = (): number => {
    if (!verification || !verification.verified_value) return 0;
    const difference = Math.abs(verification.original_value - verification.verified_value);
    return (difference / verification.original_value) * 100;
  };
  
  // Handle verification submission
  const handleVerify = async (values: VerifyFormValues) => {
    try {
      setSubmitting(true);
      
      const response = await axios.post(`/billing/value-verifications/${id}/verify`, {
        verified_value: values.verified_value,
        notes: values.notes
      });
      
      if (response.data.message) {
        message.success('Valor verificado com sucesso');
        
        // Update the verification in state
        setVerification(response.data.data);
        setVerifyModalVisible(false);
        
        // Reset form
        verifyForm.resetFields();
      } else {
        message.error('Erro ao verificar valor');
      }
    } catch (error: any) {
      console.error('Error verifying value:', error);
      message.error('Erro ao verificar valor');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle rejection submission
  const handleReject = async (values: RejectFormValues) => {
    try {
      setSubmitting(true);
      
      const response = await axios.post(`/billing/value-verifications/${id}/reject`, {
        notes: values.notes
      });
      
      if (response.data.message) {
        message.success('Valor rejeitado com sucesso');
        
        // Update the verification in state
        setVerification(response.data.data);
        setRejectModalVisible(false);
        
        // Reset form
        rejectForm.resetFields();
      } else {
        message.error('Erro ao rejeitar valor');
      }
    } catch (error: any) {
      console.error('Error rejecting value:', error);
      message.error('Erro ao rejeitar valor');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="p-6">
        <Alert
          message="Erro"
          description={error || 'Verificação não encontrada'}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => router.back()}>
              Voltar
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => router.back()}
          className="mb-4"
        >
          Voltar
        </Button>
        
        <div className="flex justify-between items-start">
          <div>
            <Title level={2}>Verificação #{verification.id}</Title>
            <Text type="secondary">
              {getValueTypeDisplay(verification.value_type)}
            </Text>
          </div>
          
          <Space>
            {canPerformAction && (
              <>
                <Button 
                  type="primary" 
                  icon={<CheckCircleOutlined />}
                  onClick={() => {
                    verifyForm.setFieldsValue({
                      verified_value: verification.original_value,
                      notes: ''
                    });
                    setVerifyModalVisible(true);
                  }}
                >
                  Verificar
                </Button>
                <Button 
                  danger 
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    rejectForm.setFieldsValue({ notes: '' });
                    setRejectModalVisible(true);
                  }}
                >
                  Rejeitar
                </Button>
              </>
            )}
          </Space>
        </div>
      </div>

      {/* Statistics Row */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Valor Original"
              value={verification.original_value}
              precision={2}
              prefix="R$"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Valor Verificado"
              value={verification.verified_value || 0}
              precision={2}
              prefix="R$"
              valueStyle={{ color: verification.verified_value ? '#52c41a' : '#d9d9d9' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Diferença"
              value={verification.verified_value ? 
                Math.abs(verification.original_value - verification.verified_value) : 0}
              precision={2}
              prefix="R$"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Variação"
              value={getDifferencePercentage()}
              precision={2}
              suffix="%"
              valueStyle={{ color: getDifferencePercentage() > 10 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        {/* Main Details */}
        <Col span={16}>
          <Card title="Detalhes da Verificação" className="mb-6">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Status" span={2}>
                {renderStatus(verification.status)}
              </Descriptions.Item>
              
              <Descriptions.Item label="Tipo de Valor">
                <Tag color="blue">{getValueTypeDisplay(verification.value_type)}</Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Prioridade">
                <Tag color={getPriorityColor(verification.priority)}>
                  {verification.priority?.toUpperCase() || 'NÃO DEFINIDA'}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Motivo da Verificação" span={2}>
                {verification.verification_reason || '-'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Data de Vencimento">
                {verification.due_date ? 
                  formatDateTime(verification.due_date) : 'Não definida'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Limite Auto-aprovação">
                {verification.auto_approve_threshold ? 
                  `${verification.auto_approve_threshold}%` : 'Não definido'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Solicitante">
                {verification.requester ? (
                  <Space>
                    <UserOutlined />
                    {verification.requester.name}
                  </Space>
                ) : '-'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Verificador">
                {verification.verifier ? (
                  <Space>
                    <UserOutlined />
                    {verification.verifier.name}
                  </Space>
                ) : '-'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Data de Criação">
                {formatDateTime(verification.created_at)}
              </Descriptions.Item>
              
              <Descriptions.Item label="Data de Verificação">
                {verification.verified_at ? 
                  formatDateTime(verification.verified_at) : '-'}
              </Descriptions.Item>
              
              {verification.notes && (
                <Descriptions.Item label="Observações" span={2}>
                  <Paragraph>{verification.notes}</Paragraph>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Billing Information */}
          {(verification.billingBatch || verification.billingItem || verification.appointment) && (
            <Card title="Informações de Cobrança" className="mb-6">
              <Row gutter={16}>
                {verification.billingBatch && (
                  <Col span={8}>
                    <Card size="small" title="Lote de Cobrança">
                      <Space direction="vertical">
                        <Link href={`/billing/batches/${verification.billingBatch.id}`}>
                          <Tag icon={<FileTextOutlined />} color="green">
                            Lote #{verification.billingBatch.id}
                          </Tag>
                        </Link>
                        <Text>Período: {verification.billingBatch.reference_period_start} a {verification.billingBatch.reference_period_end}</Text>
                        <Text>Total: {formatCurrency(verification.billingBatch.total_amount)}</Text>
                        <Text>Status: {verification.billingBatch.status}</Text>
                      </Space>
                    </Card>
                  </Col>
                )}
                
                {verification.billingItem && (
                  <Col span={8}>
                    <Card size="small" title="Item de Cobrança">
                      <Space direction="vertical">
                        <Link href={`/billing/items/${verification.billingItem.id}`}>
                          <Tag icon={<DollarOutlined />} color="blue">
                            Item #{verification.billingItem.id}
                          </Tag>
                        </Link>
                        <Text>{verification.billingItem.description}</Text>
                        <Text>Preço Unitário: {formatCurrency(verification.billingItem.unit_price)}</Text>
                        <Text>Total: {formatCurrency(verification.billingItem.total_amount)}</Text>
                        {verification.billingItem.tuss_code && (
                          <Text>Código TUSS: {verification.billingItem.tuss_code}</Text>
                        )}
                      </Space>
                    </Card>
                  </Col>
                )}
                
                {verification.appointment && (
                  <Col span={8}>
                    <Card size="small" title="Agendamento">
                      <Space direction="vertical">
                        <Link href={`/appointments/${verification.appointment.id}`}>
                          <Tag icon={<CalendarOutlined />} color="purple">
                            #{verification.appointment.id}
                          </Tag>
                        </Link>
                        <Text>Data: {formatDateTime(verification.appointment.scheduled_date)}</Text>
                        {verification.appointment.patient_name && (
                          <Text>Paciente: {verification.appointment.patient_name}</Text>
                        )}
                        {verification.appointment.professional_name && (
                          <Text>Profissional: {verification.appointment.professional_name}</Text>
                        )}
                      </Space>
                    </Card>
                  </Col>
                )}
              </Row>
            </Card>
          )}
        </Col>

        {/* Timeline */}
        <Col span={8}>
          <Card title="Histórico">
            <Timeline>
              <Timeline.Item 
                dot={<UserOutlined style={{ fontSize: '16px' }} />}
                color="blue"
              >
                <div>
                  <Text strong>Criação da Verificação</Text>
                  <br />
                  <Text type="secondary">
                    {formatDateTime(verification.created_at)}
                  </Text>
                  <br />
                  <Text type="secondary">
                    Por: {verification.requester?.name || 'Sistema'}
                  </Text>
                </div>
              </Timeline.Item>
              
              {verification.verified_at && (
                <Timeline.Item 
                  dot={
                    verification.status === 'verified' ? 
                      <CheckCircleOutlined style={{ fontSize: '16px' }} /> :
                      <CloseCircleOutlined style={{ fontSize: '16px' }} />
                  }
                  color={verification.status === 'verified' ? 'green' : 'red'}
                >
                  <div>
                    <Text strong>
                      {verification.status === 'verified' ? 'Verificação Aprovada' : 'Verificação Rejeitada'}
                    </Text>
                    <br />
                    <Text type="secondary">
                      {formatDateTime(verification.verified_at)}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Por: {verification.verifier?.name || 'Sistema'}
                    </Text>
                  </div>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* Verify Modal */}
      <Modal
        title="Verificar Valor"
        open={verifyModalVisible}
        onCancel={() => setVerifyModalVisible(false)}
        footer={null}
      >
        <Form
          form={verifyForm}
          layout="vertical"
          onFinish={handleVerify}
        >
          <Form.Item
            label="Valor Verificado"
            name="verified_value"
            rules={[{ required: true, message: 'Por favor, informe o valor verificado' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              min={0}
              step={0.01}
            />
          </Form.Item>

          <Form.Item
            label="Observações"
            name="notes"
          >
            <TextArea rows={4} placeholder="Observações sobre a verificação..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Verificar
              </Button>
              <Button onClick={() => setVerifyModalVisible(false)}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Rejeitar Valor"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
      >
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={handleReject}
        >
          <Form.Item
            label="Motivo da Rejeição"
            name="notes"
            rules={[{ required: true, message: 'Por favor, informe o motivo da rejeição' }]}
          >
            <TextArea rows={4} placeholder="Motivo da rejeição..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit" loading={submitting}>
                Rejeitar
              </Button>
              <Button onClick={() => setRejectModalVisible(false)}>
                Cancelar
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 