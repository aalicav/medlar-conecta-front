import { Descriptions, Tag, Card, Row, Col, Timeline, Typography } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  UserOutlined,
  BankOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface TransactionDetailsProps {
  transaction: any;
  isAdmin: boolean;
  isPlanAdmin: boolean;
}

export default function TransactionDetails({
  transaction,
  isAdmin,
  isPlanAdmin,
}: TransactionDetailsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: '#52c41a',
      pending: '#faad14',
      failed: '#f5222d',
    };
    return colors[status] || '#d9d9d9';
  };

  const renderTimeline = () => {
    const events = transaction.events || [];
    return (
      <Timeline>
        {events.map((event: any, index: number) => (
          <Timeline.Item
            key={index}
            color={getStatusColor(event.status)}
            dot={event.status === 'completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          >
            <Text strong>{event.description}</Text>
            <br />
            <Text type="secondary">{formatDate(event.created_at)}</Text>
          </Timeline.Item>
        ))}
      </Timeline>
    );
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="Transaction Information">
            <Descriptions column={2}>
              <Descriptions.Item label="Transaction ID">
                {transaction.id}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(transaction.status)}>
                  {transaction.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {formatDate(transaction.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
                {formatDate(transaction.updated_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Amount" span={2}>
                <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                  {formatCurrency(transaction.amount)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {transaction.description}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {(isAdmin || isPlanAdmin) && (
            <Card title="Related Information" style={{ marginTop: '16px' }}>
              <Descriptions column={2}>
                {isAdmin && (
                  <>
                    <Descriptions.Item label="Entity Type">
                      {transaction.entity_type}
                    </Descriptions.Item>
                    <Descriptions.Item label="Entity Name">
                      {transaction.entity_name}
                    </Descriptions.Item>
                  </>
                )}
                <Descriptions.Item label="Payment Method">
                  {transaction.payment_method}
                </Descriptions.Item>
                <Descriptions.Item label="Reference">
                  {transaction.reference_id}
                </Descriptions.Item>
                {transaction.health_plan && (
                  <Descriptions.Item label="Health Plan" span={2}>
                    {transaction.health_plan.name}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}
        </Col>

        <Col span={8}>
          <Card title="Transaction Timeline">
            {renderTimeline()}
          </Card>

          {isAdmin && transaction.breakdown && (
            <Card title="Amount Breakdown" style={{ marginTop: '16px' }}>
              <Descriptions column={1}>
                {Object.entries(transaction.breakdown).map(([key, value]: [string, any]) => (
                  <Descriptions.Item key={key} label={key}>
                    {formatCurrency(value)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
} 