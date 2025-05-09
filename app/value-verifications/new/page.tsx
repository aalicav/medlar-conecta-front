"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Select, 
  Space, 
  Divider, 
  InputNumber,
  notification,
  Alert
} from "antd";
import { 
  ArrowLeftOutlined,
  InfoCircleOutlined
} from "@ant-design/icons";
import Link from "next/link";
import axios from "@/lib/axios";
import { formatCurrency } from "@/lib/format";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Define the form values interface
interface VerificationFormValues {
  entity_type: string;
  entity_id: number;
  original_value: number;
  notes: string;
}

// Define entity interfaces
interface Entity {
  id: number;
  [key: string]: any;
}

interface Contract extends Entity {
  contract_number: string;
  entity?: {
    name: string;
  };
}

interface ExtemporaneousNegotiation extends Entity {
  requested_value: number;
}

interface Negotiation extends Entity {
  title: string;
}

export default function NewValueVerificationPage() {
  const router = useRouter();
  const [form] = Form.useForm<VerificationFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [entityType, setEntityType] = useState<string | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  
  // When entity type changes, fetch entities of that type
  useEffect(() => {
    if (!entityType) return;
    
    const fetchEntities = async () => {
      try {
        setLoadingEntities(true);
        let endpoint = '';
        
        switch (entityType) {
          case 'contract':
            endpoint = '/contracts?status=active';
            break;
          case 'extemporaneous_negotiation':
            endpoint = '/extemporaneous-negotiations?status=pending';
            break;
          case 'negotiation':
            endpoint = '/negotiations?status=draft,submitted';
            break;
          default:
            return;
        }
        
        const response = await axios.get(endpoint);
        
        if (response.data.status === 'success' || (response.data.data && Array.isArray(response.data.data))) {
          const data = response.data.data?.data || response.data.data || [];
          setEntities(data);
        } else {
          notification.error({
            message: 'Erro ao carregar entidades',
            description: 'Não foi possível carregar a lista de entidades'
          });
        }
      } catch (error) {
        console.error(`Error fetching ${entityType}:`, error);
        notification.error({
          message: 'Erro ao carregar entidades',
          description: 'Ocorreu um erro ao buscar as entidades'
        });
      } finally {
        setLoadingEntities(false);
      }
    };
    
    fetchEntities();
  }, [entityType]);
  
  const handleSubmit = async (values: VerificationFormValues) => {
    try {
      setSubmitting(true);
      
      const response = await axios.post('/value-verifications', {
        entity_type: values.entity_type,
        entity_id: values.entity_id,
        original_value: values.original_value,
        notes: values.notes
      });
      
      if (response.data.status === 'success') {
        notification.success({
          message: 'Verificação criada com sucesso',
          description: 'A verificação de valor foi enviada para aprovação'
        });
        
        // Redirect to verification details page
        router.push(`/value-verifications/${response.data.data.id}`);
      } else {
        notification.error({
          message: 'Erro ao criar verificação',
          description: response.data.message || 'Ocorreu um erro ao criar a verificação'
        });
      }
    } catch (error: any) {
      console.error('Error creating verification:', error);
      notification.error({
        message: 'Erro ao criar verificação',
        description: error.response?.data?.message || 'Ocorreu um erro ao processar a requisição'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Generate options for entity select
  const renderEntityOptions = () => {
    if (!entityType) return [];
    
    return entities.map(entity => {
      let label = '';
      let value = entity.id;
      
      switch (entityType) {
        case 'contract':
          const contract = entity as Contract;
          label = `Contrato #${contract.contract_number} - ${contract.entity?.name || 'Sem nome'}`;
          break;
        case 'extemporaneous_negotiation':
          const extemp = entity as ExtemporaneousNegotiation;
          label = `Neg. Extemporânea #${entity.id} - ${formatCurrency(extemp.requested_value)}`;
          break;
        case 'negotiation':
          const negotiation = entity as Negotiation;
          label = `Negociação #${entity.id} - ${negotiation.title}`;
          break;
      }
      
      return (
        <Option key={entity.id} value={entity.id}>
          {label}
        </Option>
      );
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <Link href="/value-verifications">
          <Button icon={<ArrowLeftOutlined />} style={{ marginRight: '16px' }}>
            Voltar
          </Button>
        </Link>
        <Title level={3} style={{ margin: 0 }}>
          Nova Verificação de Valor
        </Title>
      </div>
      
      <Alert
        message="Segurança de Dados Financeiros"
        description="Esta verificação será enviada para validação por um diretor, de acordo com o princípio de dupla checagem de valores financeiros."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark="optional"
        >
          <Form.Item
            name="entity_type"
            label="Tipo de Entidade"
            rules={[{ required: true, message: 'Selecione o tipo de entidade' }]}
          >
            <Select 
              placeholder="Selecione o tipo de entidade" 
              onChange={(value: string) => setEntityType(value)}
            >
              <Option value="contract">Contrato</Option>
              <Option value="extemporaneous_negotiation">Negociação Extemporânea</Option>
              <Option value="negotiation">Negociação de Especialidades</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="entity_id"
            label="Entidade"
            rules={[{ required: true, message: 'Selecione a entidade' }]}
          >
            <Select
              placeholder="Selecione a entidade"
              loading={loadingEntities}
              disabled={!entityType || loadingEntities}
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  .toLowerCase()
                  .indexOf(input.toLowerCase()) >= 0
              }
            >
              {renderEntityOptions()}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="original_value"
            label="Valor a Verificar"
            rules={[
              { required: true, message: 'Informe o valor' },
              { type: 'number', min: 0, message: 'O valor deve ser maior ou igual a zero' }
            ]}
          >
            <InputNumber
              placeholder="0.00"
              style={{ width: '100%' }}
              prefix="R$"
              precision={2}
              step={0.01}
              min={0}
            />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Observações"
            rules={[{ required: true, message: 'Informe as observações sobre este valor' }]}
          >
            <TextArea
              rows={4}
              placeholder="Descreva o contexto deste valor, justificativa e quaisquer outras informações relevantes para a verificação"
            />
          </Form.Item>
          
          <Divider />
          
          <div className="flex justify-end">
            <Space>
              <Link href="/value-verifications">
                <Button>Cancelar</Button>
              </Link>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Enviar para Verificação
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </div>
  );
} 