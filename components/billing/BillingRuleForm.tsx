'use client';

import { useState, useEffect } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Switch, 
  Button, 
  Card, 
  Divider, 
  Typography, 
  Row, 
  Col,
  DatePicker,
  message
} from 'antd';
import { BillingRule } from '../../app/types/billing';
import { billingService } from '../../app/services/billingService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface BillingRuleFormProps {
  ruleId?: number;
  entityType?: string;
  entityId?: number;
  onSaved?: (rule: BillingRule) => void;
  onCancel?: () => void;
}

export default function BillingRuleForm({ 
  ruleId, 
  entityType, 
  entityId, 
  onSaved, 
  onCancel 
}: BillingRuleFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [showCycleFields, setShowCycleFields] = useState(false);

  useEffect(() => {
    // If editing existing rule, load its data
    if (ruleId) {
      const loadRule = async () => {
        try {
          setInitialLoading(true);
          const response = await billingService.getRule(ruleId);
          if (response.success) {
            form.setFieldsValue({
              ...response.data,
              conditions: response.data.conditions ? JSON.stringify(response.data.conditions, null, 2) : '',
              discounts: response.data.discounts ? JSON.stringify(response.data.discounts, null, 2) : '',
              tax_rules: response.data.tax_rules ? JSON.stringify(response.data.tax_rules, null, 2) : '',
            });
            setShowCycleFields(response.data.rule_type === 'recurring');
          }
        } catch (error) {
          console.error('Error loading billing rule:', error);
          message.error('Failed to load billing rule');
        } finally {
          setInitialLoading(false);
        }
      };
      
      loadRule();
    } else if (entityType && entityId) {
      // For new rules with preset entity
      form.setFieldsValue({
        entity_type: entityType,
        entity_id: entityId,
        is_active: true,
        priority: 0
      });
    }
  }, [ruleId, entityType, entityId, form]);

  const handleRuleTypeChange = (value: string) => {
    setShowCycleFields(value === 'recurring');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Parse JSON fields if they contain data
      const formattedValues = {
        ...values,
        conditions: values.conditions ? JSON.parse(values.conditions) : null,
        discounts: values.discounts ? JSON.parse(values.discounts) : null,
        tax_rules: values.tax_rules ? JSON.parse(values.tax_rules) : null,
      };
      
      setLoading(true);
      
      let response;
      if (ruleId) {
        // Update
        response = await billingService.updateRule(ruleId, formattedValues);
      } else {
        // Create
        response = await billingService.createRule(formattedValues);
      }
      
      if (response.success) {
        message.success(`Billing rule ${ruleId ? 'updated' : 'created'} successfully`);
        if (onSaved) onSaved(response.data);
      }
    } catch (error: any) {
      if (error.errorFields) {
        // Form validation error
        message.error('Please check the form for errors');
      } else {
        console.error('Error saving billing rule:', error);
        message.error(`Failed to ${ruleId ? 'update' : 'create'} billing rule`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card loading={initialLoading}>
      <Title level={4}>{ruleId ? 'Edit Billing Rule' : 'Create New Billing Rule'}</Title>
      
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          is_active: true,
          priority: 0,
          rule_type: 'one_time'
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Rule Name"
              rules={[{ required: true, message: 'Please enter a name for this rule' }]}
            >
              <Input placeholder="Enter billing rule name" />
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="rule_type"
              label="Rule Type"
              rules={[{ required: true, message: 'Please select a rule type' }]}
            >
              <Select onChange={handleRuleTypeChange}>
                <Option value="one_time">One-time Billing</Option>
                <Option value="recurring">Recurring Billing</Option>
                <Option value="usage_based">Usage-based Billing</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea rows={3} placeholder="Describe the purpose of this billing rule" />
        </Form.Item>
        
        <Divider />
        
        <Title level={5}>Entity Association</Title>
        
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="entity_type"
              label="Entity Type"
              rules={[{ required: true, message: 'Please select an entity type' }]}
            >
              <Select disabled={!!entityType}>
                <Option value="clinic">Clinic</Option>
                <Option value="professional">Professional</Option>
                <Option value="patient">Patient</Option>
                <Option value="health_plan">Health Plan</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="entity_id"
              label="Entity ID"
              rules={[{ required: true, message: 'Please enter an entity ID' }]}
            >
              <InputNumber disabled={!!entityId} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        
        {showCycleFields && (
          <>
            <Divider />
            <Title level={5}>Recurring Billing Configuration</Title>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="billing_cycle"
                  label="Billing Cycle"
                  rules={[{ required: showCycleFields, message: 'Please select a billing cycle' }]}
                >
                  <Select>
                    <Option value="monthly">Monthly</Option>
                    <Option value="quarterly">Quarterly</Option>
                    <Option value="semiannual">Semi-annual</Option>
                    <Option value="annual">Annual</Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  name="billing_day"
                  label="Billing Day"
                  rules={[{ required: showCycleFields, message: 'Please enter the billing day' }]}
                >
                  <InputNumber min={1} max={31} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="payment_term_days"
                  label="Payment Term (days)"
                  tooltip="Number of days after billing date that payment is due"
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              
              <Col span={12}>
                <Form.Item
                  name="invoice_generation_days_before"
                  label="Generate Invoice (days before)"
                  tooltip="How many days before the billing date to generate invoices"
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
        
        <Divider />
        
        <Title level={5}>Advanced Settings</Title>
        
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="payment_method"
              label="Payment Method"
            >
              <Select allowClear>
                <Option value="credit_card">Credit Card</Option>
                <Option value="bank_transfer">Bank Transfer</Option>
                <Option value="boleto">Boleto</Option>
                <Option value="pix">PIX</Option>
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="priority"
              label="Priority"
              tooltip="Higher priority rules are processed first when multiple rules match"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          
          <Col span={8}>
            <Form.Item
              name="is_active"
              label="Status"
              valuePropName="checked"
            >
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </Col>
        </Row>
        
        <Form.Item
          name="conditions"
          label="Conditions (JSON)"
          tooltip="Define specific conditions for this rule in JSON format"
        >
          <TextArea 
            rows={4} 
            placeholder='e.g. {"min_value": 100, "applicable_services": [1, 2, 3]}'
          />
        </Form.Item>
        
        <Form.Item
          name="discounts"
          label="Discounts (JSON)"
          tooltip="Define discounts to apply in JSON format"
        >
          <TextArea 
            rows={4} 
            placeholder='e.g. {"percentage": 10, "conditions": {"min_items": 5}}'
          />
        </Form.Item>
        
        <Form.Item
          name="tax_rules"
          label="Tax Rules (JSON)"
          tooltip="Define tax rules in JSON format"
        >
          <TextArea 
            rows={4} 
            placeholder='e.g. {"iss": 5, "pis": 0.65, "cofins": 3}'
          />
        </Form.Item>
        
        <Divider />
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          {onCancel && (
            <Button onClick={onCancel}>
              Cancel
            </Button>
          )}
          
          <Button 
            type="primary" 
            onClick={handleSubmit}
            loading={loading}
          >
            {ruleId ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </Form>
    </Card>
  );
} 