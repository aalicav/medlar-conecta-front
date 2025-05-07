'use client';

import { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Drawer, 
  Popconfirm, 
  Input, 
  Select, 
  message 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined, 
  FilterOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { BillingRule } from '../../types/billing';
import { billingService } from '../../services/billingService';
import BillingRuleForm from '../../../components/billing/BillingRuleForm';
import DashboardLayout from '../../../components/layouts/DashboardLayout';

const { Title, Text } = Typography;
const { Option } = Select;

export default function BillingRulesPage() {
  const [rules, setRules] = useState<BillingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<boolean | null>(null);
  
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<number | undefined>(undefined);
  
  const fetchRules = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (entityTypeFilter) {
        params.entity_type = entityTypeFilter;
      }
      
      if (statusFilter !== null) {
        params.is_active = statusFilter;
      }
      
      const response = await billingService.getRules(params);
      if (response.success) {
        setRules(response.data);
      }
    } catch (error) {
      console.error('Error fetching billing rules:', error);
      message.error('Failed to load billing rules');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRules();
  }, [entityTypeFilter, statusFilter]);
  
  const handleSearch = (value: string) => {
    setSearchText(value);
  };
  
  const handleDeleteRule = async (ruleId: number) => {
    try {
      const response = await billingService.deleteRule(ruleId);
      if (response.success) {
        message.success('Billing rule deleted successfully');
        fetchRules(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting billing rule:', error);
      message.error('Failed to delete billing rule');
    }
  };
  
  const handleCreateOrUpdateRule = (rule: BillingRule) => {
    // Reset form state and close drawer
    setEditingRuleId(undefined);
    setDrawerVisible(false);
    
    // Refresh rules list
    fetchRules();
  };
  
  const openDrawer = (ruleId?: number) => {
    setEditingRuleId(ruleId);
    setDrawerVisible(true);
  };
  
  const filteredRules = rules.filter(rule => {
    // Apply text search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      return (
        rule.name.toLowerCase().includes(searchLower) ||
        (rule.description && rule.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });
  
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: BillingRule, b: BillingRule) => a.name.localeCompare(b.name),
    },
    {
      title: 'Entity Type',
      dataIndex: 'entity_type',
      key: 'entity_type',
      render: (text: string) => {
        const colors: Record<string, string> = {
          clinic: 'blue',
          professional: 'green',
          patient: 'purple',
          health_plan: 'orange',
        };
        return <Tag color={colors[text] || 'default'}>{text}</Tag>;
      },
    },
    {
      title: 'Rule Type',
      dataIndex: 'rule_type',
      key: 'rule_type',
      render: (text: string) => {
        const labels: Record<string, string> = {
          one_time: 'One-time',
          recurring: 'Recurring',
          usage_based: 'Usage-based',
        };
        return labels[text] || text;
      },
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'error'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      sorter: (a: BillingRule, b: BillingRule) => a.priority - b.priority,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: BillingRule) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => openDrawer(record.id)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this rule?"
            onConfirm={() => handleDeleteRule(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger size="small">
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  return (<
    >
      <div style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="Search rules"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => handleSearch(e.target.value)}
            style={{ width: 250 }}
          />
          
          <Select
            placeholder="Entity Type"
            allowClear
            style={{ width: 150 }}
            onChange={value => setEntityTypeFilter(value)}
            value={entityTypeFilter}
          >
            <Option value="clinic">Clinic</Option>
            <Option value="professional">Professional</Option>
            <Option value="patient">Patient</Option>
            <Option value="health_plan">Health Plan</Option>
          </Select>
          
          <Select
            placeholder="Status"
            allowClear
            style={{ width: 150 }}
            onChange={value => setStatusFilter(value === null ? null : value === true)}
            value={statusFilter}
          >
            <Option value={true}>Active</Option>
            <Option value={false}>Inactive</Option>
          </Select>
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openDrawer()}
          >
            Create Rule
          </Button>
        </Space>
      </div>
      
      <Table
        columns={columns}
        dataSource={filteredRules}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      
      <Drawer
        title={editingRuleId ? 'Edit Billing Rule' : 'Create Billing Rule'}
        placement="right"
        width={720}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <BillingRuleForm
          ruleId={editingRuleId}
          onSaved={handleCreateOrUpdateRule}
          onCancel={() => setDrawerVisible(false)}
        />
      </Drawer>
    </>
  );
} 