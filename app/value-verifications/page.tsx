"use client";

import { useState, useEffect } from "react";
import { 
  Table, 
  Button, 
  Tag, 
  Space, 
  Card, 
  Typography, 
  Tabs, 
  Badge, 
  Tooltip,
  Alert,
  Input,
  Select,
  DatePicker,
  notification,
  Modal,
  Form,
  InputNumber,
  message
} from "antd";
import { 
  PlusOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EyeOutlined, 
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  SyncOutlined,
  DollarOutlined,
  FileTextOutlined,
  CalendarOutlined
} from "@ant-design/icons";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import axios from "@/lib/axios";
import { formatCurrency } from "@/lib/format";
import type { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// Define types for our verification objects
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

export default function ValueVerificationsPage() {
  const { hasRole, user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchText, setSearchText] = useState("");
  const [valueTypeFilter, setValueTypeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [filteredData, setFilteredData] = useState<Verification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
    auto_approved: 0,
    overdue: 0,
    high_priority: 0
  });

  // Modal states
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [verifyForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const isDirector = hasRole(["director", "super_admin"]);
  const canVerify = hasRole(["director", "super_admin", "financial"]);

  // Fetch all verification data
  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/billing/value-verifications');
        if (response.data.data) {
          setVerifications(response.data.data || []);
          setStatistics(response.data.meta?.statistics || {
            total: 0,
            pending: 0,
            verified: 0,
            rejected: 0,
            auto_approved: 0,
            overdue: 0,
            high_priority: 0
          });
        } else {
          notification.error({
            message: 'Erro ao carregar verificações',
            description: response.data.message || 'Ocorreu um erro ao buscar os dados'
          });
        }
      } catch (error) {
        console.error('Error fetching verifications:', error);
        notification.error({
          message: 'Erro ao carregar verificações',
          description: 'Não foi possível conectar ao servidor'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerifications();
  }, []);

  // Filter data based on active tab, search text, value type, priority, and date range
  useEffect(() => {
    setIsLoading(true);
    
    let filtered = verifications;
    
    // Filter by status (tab)
    if (activeTab !== "all") {
      filtered = filtered.filter(item => item.status === activeTab);
    }
    
    // Filter by search text
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter(item => 
        (item.verification_reason?.toLowerCase().includes(lowerSearchText)) ||
        (item.notes?.toLowerCase().includes(lowerSearchText)) ||
        (item.requester?.name?.toLowerCase().includes(lowerSearchText)) ||
        (item.billingItem?.description?.toLowerCase().includes(lowerSearchText)) ||
        (item.appointment?.patient_name?.toLowerCase().includes(lowerSearchText))
      );
    }
    
    // Filter by value type
    if (valueTypeFilter) {
      filtered = filtered.filter(item => item.value_type === valueTypeFilter);
    }

    // Filter by priority
    if (priorityFilter) {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }
    
    // Filter by date range
    if (dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].toDate();
      const endDate = dateRange[1].toDate();
      
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }
    
    setFilteredData(filtered);
    setIsLoading(false);
    
  }, [activeTab, searchText, valueTypeFilter, priorityFilter, dateRange, verifications]);

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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'orange';
      case 'verified':
        return 'green';
      case 'rejected':
        return 'red';
      case 'auto_approved':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'verified':
        return 'Verificado';
      case 'rejected':
        return 'Rejeitado';
      case 'auto_approved':
        return 'Auto-aprovado';
      default:
        return status;
    }
  };

  const handleVerify = (verification: Verification) => {
    setSelectedVerification(verification);
    verifyForm.setFieldsValue({
      verified_value: verification.original_value,
      notes: ''
    });
    setVerifyModalVisible(true);
  };

  const handleReject = (verification: Verification) => {
    setSelectedVerification(verification);
    rejectForm.setFieldsValue({
      notes: ''
    });
    setRejectModalVisible(true);
  };

  const onVerifySubmit = async (values: any) => {
    if (!selectedVerification) return;

    try {
      const response = await axios.post(`/billing/value-verifications/${selectedVerification.id}/verify`, {
        verified_value: values.verified_value,
        notes: values.notes
      });

      if (response.data.message) {
        message.success('Valor verificado com sucesso');
        setVerifyModalVisible(false);
        // Refresh data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error verifying value:', error);
      message.error('Erro ao verificar valor');
    }
  };

  const onRejectSubmit = async (values: any) => {
    if (!selectedVerification) return;

    try {
      const response = await axios.post(`/billing/value-verifications/${selectedVerification.id}/reject`, {
        notes: values.notes
      });

      if (response.data.message) {
        message.success('Valor rejeitado com sucesso');
        setRejectModalVisible(false);
        // Refresh data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error rejecting value:', error);
      message.error('Erro ao rejeitar valor');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <Link href={`/value-verifications/${id}`}>{id}</Link>
    },
    {
      title: 'Tipo',
      dataIndex: 'value_type',
      key: 'value_type',
      width: 150,
      render: (valueType: string) => (
        <Tag color="blue">{getValueTypeDisplay(valueType)}</Tag>
      )
    },
    {
      title: 'Valor Original',
      dataIndex: 'original_value',
      key: 'original_value',
      width: 120,
      render: (value: number) => formatCurrency(value)
    },
    {
      title: 'Valor Verificado',
      dataIndex: 'verified_value',
      key: 'verified_value',
      width: 120,
      render: (value: number) => value ? formatCurrency(value) : '-'
    },
    {
      title: 'Prioridade',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>
          {priority.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: 'Motivo',
      dataIndex: 'verification_reason',
      key: 'verification_reason',
      ellipsis: true,
      render: (reason: string) => (
        <Tooltip title={reason}>
          <Text ellipsis>{reason}</Text>
        </Tooltip>
      )
    },
    {
      title: 'Cobrança',
      key: 'billing',
      width: 120,
      render: (_: any, record: Verification) => (
        <Space direction="vertical" size={0}>
          {record.billingBatch && (
            <Link href={`/billing/batches/${record.billingBatch.id}`}>
              <Tag icon={<FileTextOutlined />} color="green">
                Lote #{record.billingBatch.id}
              </Tag>
            </Link>
          )}
          {record.billingItem && (
            <Link href={`/billing/items/${record.billingItem.id}`}>
              <Tag icon={<DollarOutlined />} color="blue">
                Item #{record.billingItem.id}
              </Tag>
            </Link>
          )}
        </Space>
      )
    },
    {
      title: 'Agendamento',
      key: 'appointment',
      width: 120,
      render: (_: any, record: Verification) => (
        record.appointment ? (
          <Link href={`/appointments/${record.appointment.id}`}>
            <Tag icon={<CalendarOutlined />} color="purple">
              #{record.appointment.id}
            </Tag>
          </Link>
        ) : '-'
      )
    },
    {
      title: 'Solicitante',
      key: 'requester',
      width: 120,
      render: (_: any, record: Verification) => (
        record.requester ? record.requester.name : '-'
      )
    },
    {
      title: 'Data Criação',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR')
    },
    {
      title: 'Ações',
      key: 'actions',
      width: 150,
      render: (_: any, record: Verification) => (
        <Space>
          <Link href={`/value-verifications/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">
              Ver
            </Button>
          </Link>
          {canVerify && record.status === 'pending' && (
            <>
              <Button 
                type="link" 
                icon={<CheckCircleOutlined />} 
                size="small"
                onClick={() => handleVerify(record)}
                style={{ color: 'green' }}
              >
                Verificar
              </Button>
              <Button 
                type="link" 
                icon={<CloseCircleOutlined />} 
                size="small"
                onClick={() => handleReject(record)}
                style={{ color: 'red' }}
              >
                Rejeitar
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>Verificação de Valores</Title>
        <Text type="secondary">
          Gerencie a verificação de valores para cobranças e agendamentos
        </Text>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              {statistics.total}
            </Title>
            <Text type="secondary">Total</Text>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Title level={3} style={{ margin: 0, color: '#faad14' }}>
              {statistics.pending}
            </Title>
            <Text type="secondary">Pendentes</Text>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
              {statistics.verified + statistics.auto_approved}
            </Title>
            <Text type="secondary">Verificados</Text>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <Title level={3} style={{ margin: 0, color: '#ff4d4f' }}>
              {statistics.overdue}
            </Title>
            <Text type="secondary">Vencidos</Text>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <Search
            placeholder="Buscar por motivo, notas, solicitante..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          
          <Select
            placeholder="Tipo de valor"
            value={valueTypeFilter}
            onChange={setValueTypeFilter}
            style={{ width: 200 }}
            allowClear
          >
            <Option value="appointment_price">Preço do Agendamento</Option>
            <Option value="procedure_price">Preço do Procedimento</Option>
            <Option value="specialty_price">Preço da Especialidade</Option>
            <Option value="contract_price">Preço do Contrato</Option>
            <Option value="billing_amount">Valor de Cobrança</Option>
          </Select>

          <Select
            placeholder="Prioridade"
            value={priorityFilter}
            onChange={setPriorityFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="low">Baixa</Option>
            <Option value="medium">Média</Option>
            <Option value="high">Alta</Option>
            <Option value="critical">Crítica</Option>
          </Select>

          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={['Data início', 'Data fim']}
          />

          <Button 
            icon={<SyncOutlined />} 
            onClick={() => window.location.reload()}
          >
            Atualizar
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                Pendentes
                <Badge count={statistics.pending} style={{ marginLeft: 8 }} />
              </span>
            } 
            key="pending" 
          />
          <TabPane 
            tab={
              <span>
                Verificados
                <Badge count={statistics.verified + statistics.auto_approved} style={{ marginLeft: 8 }} />
              </span>
            } 
            key="verified" 
          />
          <TabPane 
            tab={
              <span>
                Rejeitados
                <Badge count={statistics.rejected} style={{ marginLeft: 8 }} />
              </span>
            } 
            key="rejected" 
          />
          <TabPane 
            tab={
              <span>
                Auto-aprovados
                <Badge count={statistics.auto_approved} style={{ marginLeft: 8 }} />
              </span>
            } 
            key="auto_approved" 
          />
          <TabPane 
            tab={
              <span>
                Vencidos
                <Badge count={statistics.overdue} style={{ marginLeft: 8 }} />
              </span>
            } 
            key="overdue" 
          />
          <TabPane tab="Todos" key="all" />
        </Tabs>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading}
          pagination={{
            total: filteredData.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} de ${total} itens`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

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
          onFinish={onVerifySubmit}
        >
          <Form.Item
            label="Valor Verificado"
            name="verified_value"
            rules={[{ required: true, message: 'Por favor, informe o valor verificado' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `R$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
              parser={value => value!.replace(/R\$\s?|(\.*)/g, '').replace(',', '.')}
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
              <Button type="primary" htmlType="submit">
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
          onFinish={onRejectSubmit}
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
              <Button type="primary" danger htmlType="submit">
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