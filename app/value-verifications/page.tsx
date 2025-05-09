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
  notification
} from "antd";
import { 
  PlusOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  EyeOutlined, 
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  SyncOutlined
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

// Define types for our verification objects
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

export default function ValueVerificationsPage() {
  const { hasRole, user } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [searchText, setSearchText] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [filteredData, setFilteredData] = useState<Verification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  const isDirector = hasRole(["director", "super_admin"]);

  // Fetch all verification data
  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/value-verifications');
        if (response.data.status === 'success') {
          setVerifications(response.data.data.data || []);
          
          // Count different statuses
          const data = response.data.data.data || [];
          setPendingCount(data.filter((item: Verification) => item.status === 'pending').length);
          setVerifiedCount(data.filter((item: Verification) => item.status === 'verified').length);
          setRejectedCount(data.filter((item: Verification) => item.status === 'rejected').length);
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

  // Filter data based on active tab, search text, entity type, and date range
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
        (item.entity_type?.toLowerCase().includes(lowerSearchText)) ||
        (item.notes?.toLowerCase().includes(lowerSearchText)) ||
        (item.requester?.name?.toLowerCase().includes(lowerSearchText))
      );
    }
    
    // Filter by entity type
    if (entityTypeFilter) {
      filtered = filtered.filter(item => item.entity_type === entityTypeFilter);
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
    
  }, [activeTab, searchText, entityTypeFilter, dateRange, verifications]);

  // Get pending count separately
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await axios.get('/value-verifications/pending/count');
        if (response.data.status === 'success') {
          setPendingCount(response.data.data.pending_count || 0);
        }
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    };

    fetchPendingCount();
  }, []);

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

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => <Link href={`/value-verifications/${id}`}>{id}</Link>
    },
    {
      title: 'Entidade',
      key: 'entity',
      render: (_: any, record: Verification) => (
        <Space direction="vertical" size={0}>
          <Text strong>
            {record.entity_type === 'extemporaneous_negotiation' && `Neg. Extemporânea #${record.entity_id}`}
            {record.entity_type === 'contract' && `Contrato #${record.entity_id}`}
            {record.entity_type === 'negotiation' && `Negociação de Especialidades #${record.entity_id}`}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {getEntityTypeDisplay(record.entity_type)}
          </Text>
        </Space>
      )
    },
    {
      title: 'Valor',
      dataIndex: 'original_value',
      key: 'original_value',
      render: (value: number) => formatCurrency(value)
    },
    {
      title: 'Solicitante',
      key: 'requester',
      render: (_: any, record: Verification) => record.requester?.name || '-'
    },
    {
      title: 'Verificador',
      key: 'verifier',
      render: (_: any, record: Verification) => record.verifier?.name || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
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
          <Tag icon={icon} color={color}>
            {text}
          </Tag>
        );
      }
    },
    {
      title: 'Data de Criação',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('pt-BR', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: any, record: Verification) => {
        const canVerify = isDirector && 
                         record.status === 'pending' && 
                         record.requester_id !== user?.id;
        
        return (
          <Space>
            <Tooltip title="Ver detalhes">
              <Link href={`/value-verifications/${record.id}`}>
                <Button icon={<EyeOutlined />} size="small" />
              </Link>
            </Tooltip>
            
            {canVerify && (
              <>
                <Tooltip title="Aprovar">
                  <Link href={`/value-verifications/${record.id}/approve`}>
                    <Button 
                      type="primary" 
                      icon={<CheckCircleOutlined />} 
                      size="small"
                      style={{ backgroundColor: '#52c41a' }}
                    />
                  </Link>
                </Tooltip>
                
                <Tooltip title="Rejeitar">
                  <Link href={`/value-verifications/${record.id}/reject`}>
                    <Button 
                      danger 
                      icon={<CloseCircleOutlined />} 
                      size="small" 
                    />
                  </Link>
                </Tooltip>
              </>
            )}
          </Space>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={3}>Verificações de Valores</Title>
        <Link href="/value-verifications/new">
          <Button type="primary" icon={<PlusOutlined />}>
            Nova Verificação
          </Button>
        </Link>
      </div>
      
      <Alert
        message="Segurança de Dados Financeiros"
        description="Todas as entradas de dados financeiros sensíveis exigem dupla checagem: uma pessoa insere a informação e outra aprova. Isto garante a validação antes da efetivação no sistema."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <div style={{ flex: 1, minWidth: '200px' }}>
            <Search
              placeholder="Buscar por descrição, solicitante..."
              onSearch={value => setSearchText(value)}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: '100%' }}
              allowClear
            />
          </div>
          
          <Select
            placeholder="Tipo de Entidade"
            style={{ width: 200 }}
            onChange={value => setEntityTypeFilter(value)}
            allowClear
          >
            <Option value="extemporaneous_negotiation">Negociação Extemporânea</Option>
            <Option value="contract">Contrato</Option>
            <Option value="negotiation">Negociação de Especialidades</Option>
          </Select>
          
          <RangePicker
            onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null])}
            style={{ width: 'auto' }}
          />
          
          <Button 
            icon={<SyncOutlined />} 
            onClick={() => {
              setSearchText("");
              setEntityTypeFilter("");
              setDateRange([null, null]);
            }}
          >
            Limpar Filtros
          </Button>
        </div>
        
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <Badge count={pendingCount} offset={[10, 0]}>
                Pendentes
              </Badge>
            } 
            key="pending"
          />
          <TabPane 
            tab={
              <Badge count={verifiedCount} offset={[10, 0]}>
                Verificados
              </Badge>
            } 
            key="verified"
          />
          <TabPane 
            tab={
              <Badge count={rejectedCount} offset={[10, 0]}>
                Rejeitados
              </Badge>
            } 
            key="rejected"
          />
          <TabPane tab="Todos" key="all" />
        </Tabs>
        
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} itens`
          }}
        />
      </Card>
    </div>
  );
} 