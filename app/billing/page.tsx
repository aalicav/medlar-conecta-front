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
  Row,
  Col,
  Statistic
} from "antd";
import { 
  PlusOutlined, 
  EyeOutlined, 
  SearchOutlined,
  FilterOutlined,
  SyncOutlined,
  DollarOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
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

interface BillingBatch {
  id: number;
  reference_period_start: string;
  reference_period_end: string;
  total_amount: number;
  status: string;
  created_at: string;
  items: BillingItem[];
  payment_proof?: string;
  invoice?: string;
}

interface BillingItem {
  id: number;
  patient: {
    name: string;
    cpf: string;
  };
  provider: {
    name: string;
    type: string;
    specialty: string;
  };
  procedure: {
    code: string;
    description: string;
  };
  appointment: {
    scheduled_date: string;
    booking_date: string;
    confirmation_date: string;
    attendance_confirmation: string;
    guide_status: string;
  };
  amount: number;
  status: string;
  gloss_reason?: string;
}

interface ValueVerification {
  id: number;
  value_type: string;
  original_value: number;
  verified_value?: number;
  status: 'pending' | 'verified' | 'rejected' | 'auto_approved';
  verification_reason?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  billing_batch_id?: number;
  billing_item_id?: number;
  appointment_id?: number;
  created_at: string;
}

export default function BillingPage() {
  const { hasRole, user } = useAuth();
  const [activeTab, setActiveTab] = useState("batches");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [batches, setBatches] = useState<BillingBatch[]>([]);
  const [verifications, setVerifications] = useState<ValueVerification[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<BillingBatch[]>([]);
  const [filteredVerifications, setFilteredVerifications] = useState<ValueVerification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingVerifications, setIsLoadingVerifications] = useState(true);
  const [statistics, setStatistics] = useState({
    total_batches: 0,
    pending_batches: 0,
    total_amount: 0,
    pending_verifications: 0,
    high_priority_verifications: 0,
    overdue_verifications: 0
  });

  const isDirector = hasRole(["director", "super_admin"]);
  const canVerify = hasRole(["director", "super_admin", "financial"]);

  // Fetch billing batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/billing');
        if (response.data.data) {
          setBatches(response.data.data);
        } else {
          notification.error({
            message: 'Erro ao carregar lotes de cobrança',
            description: response.data.message || 'Ocorreu um erro ao buscar os dados'
          });
        }
      } catch (error) {
        console.error('Error fetching batches:', error);
        notification.error({
          message: 'Erro ao carregar lotes de cobrança',
          description: 'Não foi possível conectar ao servidor'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBatches();
  }, []);

  // Fetch value verifications
  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        setIsLoadingVerifications(true);
        const response = await axios.get('/billing/value-verifications');
        if (response.data.data) {
          setVerifications(response.data.data);
          setStatistics(prev => ({
            ...prev,
            pending_verifications: response.data.meta?.statistics?.pending || 0,
            high_priority_verifications: response.data.meta?.statistics?.high_priority || 0,
            overdue_verifications: response.data.meta?.statistics?.overdue || 0
          }));
        }
      } catch (error) {
        console.error('Error fetching verifications:', error);
      } finally {
        setIsLoadingVerifications(false);
      }
    };

    fetchVerifications();
  }, []);

  // Filter batches
  useEffect(() => {
    let filtered = batches;
    
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter(batch => 
        batch.items.some(item => 
          item.patient.name.toLowerCase().includes(lowerSearchText) ||
          item.provider.name.toLowerCase().includes(lowerSearchText) ||
          item.procedure.description.toLowerCase().includes(lowerSearchText)
        )
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(batch => batch.status === statusFilter);
    }
    
    if (dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].toDate();
      const endDate = dateRange[1].toDate();
      
      filtered = filtered.filter(batch => {
        const batchDate = new Date(batch.created_at);
        return batchDate >= startDate && batchDate <= endDate;
      });
    }
    
    setFilteredBatches(filtered);
  }, [searchText, statusFilter, dateRange, batches]);

  // Filter verifications
  useEffect(() => {
    let filtered = verifications;
    
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase();
      filtered = filtered.filter(verification => 
        verification.verification_reason?.toLowerCase().includes(lowerSearchText)
      );
    }
    
    setFilteredVerifications(filtered);
  }, [searchText, verifications]);

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

  const batchColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <Link href={`/billing/batches/${id}`}>{id}</Link>
    },
    {
      title: 'Período',
      key: 'period',
      width: 150,
      render: (_: any, record: BillingBatch) => (
        <div>
          <div>{record.reference_period_start}</div>
          <div>{record.reference_period_end}</div>
        </div>
      )
    },
    {
      title: 'Valor Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      width: 120,
      render: (amount: number) => formatCurrency(amount)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'pending' ? 'orange' : status === 'completed' ? 'green' : 'default'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Itens',
      key: 'items',
      width: 100,
      render: (_: any, record: BillingBatch) => record.items.length
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
      render: (_: any, record: BillingBatch) => (
        <Space>
          <Link href={`/billing/batches/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">
              Ver
            </Button>
          </Link>
        </Space>
      )
    }
  ];

  const verificationColumns = [
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
      title: 'Lote',
      key: 'billing_batch',
      width: 100,
      render: (_: any, record: ValueVerification) => (
        record.billing_batch_id ? (
          <Link href={`/billing/batches/${record.billing_batch_id}`}>
            <Tag icon={<FileTextOutlined />} color="green">
              #{record.billing_batch_id}
            </Tag>
          </Link>
        ) : '-'
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
      render: (_: any, record: ValueVerification) => (
        <Space>
          <Link href={`/value-verifications/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">
              Ver
            </Button>
          </Link>
          {canVerify && record.status === 'pending' && (
            <Link href={`/value-verifications/${record.id}`}>
              <Button type="link" icon={<CheckCircleOutlined />} size="small" style={{ color: 'green' }}>
                Verificar
              </Button>
            </Link>
          )}
        </Space>
      )
    }
  ];

  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    setDateRange(dates);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>Cobranças</Title>
        <Text type="secondary">
          Gerencie lotes de cobrança e verificação de valores
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total de Lotes"
              value={statistics.total_batches}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Valor Total"
              value={statistics.total_amount}
              precision={2}
              prefix="R$"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Verificações Pendentes"
              value={statistics.pending_verifications}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Alta Prioridade"
              value={statistics.high_priority_verifications}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <Search
            placeholder="Buscar por paciente, profissional, procedimento..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          
          <Select
            placeholder="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="pending">Pendente</Option>
            <Option value="completed">Concluído</Option>
            <Option value="failed">Falhou</Option>
          </Select>

          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
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
                Lotes de Cobrança
                <Badge count={filteredBatches.length} style={{ marginLeft: 8 }} />
              </span>
            } 
            key="batches" 
          />
          <TabPane 
            tab={
              <span>
                Verificações de Valores
                <Badge count={statistics.pending_verifications} style={{ marginLeft: 8 }} />
              </span>
            } 
            key="verifications" 
          />
        </Tabs>

        {activeTab === 'batches' && (
          <Table
            columns={batchColumns}
            dataSource={filteredBatches}
            rowKey="id"
            loading={isLoading}
            pagination={{
              total: filteredBatches.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} itens`
            }}
            scroll={{ x: 800 }}
          />
        )}

        {activeTab === 'verifications' && (
          <>
            {statistics.pending_verifications > 0 && (
              <Alert
                message="Verificações Pendentes"
                description={`Existem ${statistics.pending_verifications} verificações de valores pendentes que requerem atenção.`}
                type="warning"
                showIcon
                className="mb-4"
                action={
                  <Link href="/value-verifications">
                    <Button size="small" type="primary">
                      Ver Todas
                    </Button>
                  </Link>
                }
              />
            )}
            
            <Table
              columns={verificationColumns}
              dataSource={filteredVerifications}
              rowKey="id"
              loading={isLoadingVerifications}
              pagination={{
                total: filteredVerifications.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} de ${total} itens`
              }}
              scroll={{ x: 1000 }}
            />
          </>
        )}
      </Card>
    </div>
  );
} 