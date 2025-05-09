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
  notification
} from "antd";
import { 
  ArrowLeftOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
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
  original_value: number;
  verified_value?: number;
  status: 'pending' | 'verified' | 'rejected';
  notes?: string;
  rejection_reason?: string;
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
}

// Define form value interfaces
interface VerifyFormValues {
  verified_value: number;
  notes?: string;
}

interface RejectFormValues {
  rejection_reason: string;
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
  
  const id = params.id as string;
  const isDirector = hasRole(["director", "super_admin"]);
  
  // Fetch verification details
  useEffect(() => {
    const fetchVerification = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/value-verifications/${id}`);
        
        if (response.data.status === 'success') {
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
  const canVerify = isDirector && 
                    verification?.status === 'pending' && 
                    verification?.requester?.id !== user?.id;
  
  // Format entity type for display
  const getEntityTypeDisplay = (entityType: string): string => {
    switch (entityType) {
      case 'extemporaneous_negotiation':
        return 'Negociação Extemporânea';
      case 'contract':
        return 'Contrato';
      case 'negotiation':
        return 'Negociação de Especialidades';
      default:
        return entityType;
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
    }
    
    return (
      <Tag icon={icon} color={color} style={{ fontSize: '14px', padding: '4px 8px' }}>
        {text}
      </Tag>
    );
  };
  
  // Handle verification submission
  const handleVerify = async (values: VerifyFormValues) => {
    try {
      setSubmitting(true);
      
      const response = await axios.post(`/value-verifications/${id}/verify`, {
        verified_value: values.verified_value,
        notes: values.notes
      });
      
      if (response.data.status === 'success') {
        notification.success({
          message: 'Verificação realizada com sucesso',
          description: 'O valor foi verificado e aprovado.'
        });
        
        // Update the verification in state
        setVerification(response.data.data);
        setVerifyModalVisible(false);
        
        // Reset form
        verifyForm.resetFields();
      } else {
        notification.error({
          message: 'Erro ao verificar valor',
          description: response.data.message || 'Ocorreu um erro ao verificar o valor'
        });
      }
    } catch (error: any) {
      console.error('Error verifying value:', error);
      notification.error({
        message: 'Erro ao verificar valor',
        description: error.response?.data?.message || 'Ocorreu um erro ao processar a requisição'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle rejection submission
  const handleReject = async (values: RejectFormValues) => {
    try {
      setSubmitting(true);
      
      const response = await axios.post(`/value-verifications/${id}/reject`, {
        rejection_reason: values.rejection_reason
      });
      
      if (response.data.status === 'success') {
        notification.success({
          message: 'Verificação rejeitada',
          description: 'O valor foi rejeitado com sucesso.'
        });
        
        // Update the verification in state
        setVerification(response.data.data);
        setRejectModalVisible(false);
        
        // Reset form
        rejectForm.resetFields();
      } else {
        notification.error({
          message: 'Erro ao rejeitar valor',
          description: response.data.message || 'Ocorreu um erro ao rejeitar o valor'
        });
      }
    } catch (error: any) {
      console.error('Error rejecting value:', error);
      notification.error({
        message: 'Erro ao rejeitar valor',
        description: error.response?.data?.message || 'Ocorreu um erro ao processar a requisição'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" tip="Carregando verificação..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert 
        message="Erro" 
        description={error} 
        type="error" 
        showIcon 
        action={
          <Link href="/value-verifications">
            <Button>Voltar para lista</Button>
          </Link>
        }
      />
    );
  }
  
  if (!verification) {
    return (
      <Alert 
        message="Verificação não encontrada" 
        description="A verificação solicitada não foi encontrada" 
        type="warning" 
        showIcon 
        action={
          <Link href="/value-verifications">
            <Button>Voltar para lista</Button>
          </Link>
        }
      />
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <Space>
          <Link href="/value-verifications">
            <Button icon={<ArrowLeftOutlined />}>Voltar</Button>
          </Link>
          <Title level={3} style={{ margin: 0 }}>Verificação de Valor #{verification.id}</Title>
          {renderStatus(verification.status)}
        </Space>
        
        {/* Approve/Reject buttons */}
        {canVerify && (
          <Space>
            <Button 
              type="primary" 
              icon={<CheckCircleOutlined />} 
              style={{ backgroundColor: '#52c41a' }}
              onClick={() => setVerifyModalVisible(true)}
            >
              Aprovar
            </Button>
            <Button 
              danger 
              icon={<CloseCircleOutlined />} 
              onClick={() => setRejectModalVisible(true)}
            >
              Rejeitar
            </Button>
          </Space>
        )}
      </div>
      
      <Card>
        <Descriptions title="Detalhes da Verificação" bordered layout="vertical">
          <Descriptions.Item label="Status" span={1}>
            {renderStatus(verification.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Tipo de Entidade" span={1}>
            {getEntityTypeDisplay(verification.entity_type)}
          </Descriptions.Item>
          <Descriptions.Item label="ID da Entidade" span={1}>
            <Link 
              href={
                verification.entity_type === 'contract' 
                  ? `/contracts/${verification.entity_id}` 
                  : verification.entity_type === 'extemporaneous_negotiation'
                  ? `/extemporaneous-negotiations/${verification.entity_id}`
                  : `/negotiations/${verification.entity_id}`
              }
            >
              {verification.entity_id}
            </Link>
          </Descriptions.Item>
          <Descriptions.Item label="Valor Original" span={1}>
            <Text strong>{formatCurrency(verification.original_value)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Valor Verificado" span={1}>
            {verification.verified_value ? formatCurrency(verification.verified_value) : 'Não verificado'}
          </Descriptions.Item>
          <Descriptions.Item label="Solicitante" span={1}>
            {verification.requester?.name || 'Desconhecido'}
          </Descriptions.Item>
          <Descriptions.Item label="Verificador" span={1}>
            {verification.verifier?.name || 'Não verificado'}
          </Descriptions.Item>
          <Descriptions.Item label="Data de Criação" span={1}>
            {formatDateTime(verification.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label="Data de Verificação" span={1}>
            {verification.verified_at ? formatDateTime(verification.verified_at) : 'Não verificado'}
          </Descriptions.Item>
          <Descriptions.Item label="Observações" span={3}>
            <Paragraph style={{ whiteSpace: 'pre-line' }}>
              {verification.notes || 'Nenhuma observação'}
            </Paragraph>
          </Descriptions.Item>
          {verification.status === 'rejected' && (
            <Descriptions.Item label="Motivo da Rejeição" span={3}>
              <Paragraph style={{ whiteSpace: 'pre-line' }} type="danger">
                {verification.rejection_reason || 'Nenhum motivo fornecido'}
              </Paragraph>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Verify Modal */}
      <Modal
        title="Aprovar Verificação"
        open={verifyModalVisible}
        onCancel={() => setVerifyModalVisible(false)}
        footer={null}
      >
        <Form
          form={verifyForm}
          layout="vertical"
          onFinish={handleVerify}
          initialValues={{ verified_value: verification?.original_value }}
        >
          <Form.Item
            name="verified_value"
            label="Valor Verificado"
            rules={[{ required: true, message: 'Informe o valor verificado' }]}
          >
            <Input
              type="number"
              step="0.01"
              prefix="R$"
              placeholder="0.00"
            />
          </Form.Item>
          <Form.Item
            name="notes"
            label="Observações (opcional)"
          >
            <TextArea
              rows={4}
              placeholder="Observações adicionais sobre a verificação"
            />
          </Form.Item>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button onClick={() => setVerifyModalVisible(false)}>
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Confirmar Aprovação
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Rejeitar Verificação"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
      >
        <Alert
          message="Atenção"
          description="A rejeição desta verificação exigirá que o solicitante inicie uma nova verificação com valores corrigidos."
          type="warning"
          showIcon
          className="mb-4"
        />
        
        <Form
          form={rejectForm}
          layout="vertical"
          onFinish={handleReject}
        >
          <Form.Item
            name="rejection_reason"
            label="Motivo da Rejeição"
            rules={[{ required: true, message: 'Informe o motivo da rejeição' }]}
          >
            <TextArea
              rows={4}
              placeholder="Explique o motivo da rejeição"
            />
          </Form.Item>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Button onClick={() => setRejectModalVisible(false)}>
              Cancelar
            </Button>
            <Button danger htmlType="submit" loading={submitting}>
              Confirmar Rejeição
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
} 