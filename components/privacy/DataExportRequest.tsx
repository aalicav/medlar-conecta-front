'use client';

import { useState } from 'react';
import { Card, Button, Typography, Alert, Modal, Steps, Space, message } from 'antd';
import { DownloadOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { privacyService } from '../../app/services/privacyService';

const { Title, Paragraph, Text } = Typography;
const { confirm } = Modal;

interface DataExportRequestProps {
  onComplete?: () => void;
}

export default function DataExportRequest({ onComplete }: DataExportRequestProps) {
  const [loading, setLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState<'idle' | 'requested' | 'completed' | 'error'>('idle');
  const [requestInfo, setRequestInfo] = useState<{ request_id?: number; requested_at?: string }>({});

  const handleRequestExport = () => {
    confirm({
      title: 'Request Personal Data Export',
      icon: <ExclamationCircleOutlined />,
      content: (
        <>
          <Paragraph>
            You are about to request an export of all your personal data stored in our system.
          </Paragraph>
          <Paragraph>
            This process may take up to 48 hours to complete. You will be notified when your data is ready for download.
          </Paragraph>
          <Paragraph>
            Do you want to proceed with this request?
          </Paragraph>
        </>
      ),
      onOk: async () => {
        try {
          setLoading(true);
          const response = await privacyService.requestDataExport();
          
          if (response.success) {
            setRequestStatus('requested');
            setRequestInfo({
              request_id: response.data.request_id,
              requested_at: response.data.requested_at
            });
            message.success('Data export request submitted successfully');
          } else {
            throw new Error('Failed to submit request');
          }
        } catch (error) {
          console.error('Error requesting data export:', error);
          message.error('Failed to submit data export request');
          setRequestStatus('error');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const getStepStatus = (step: number) => {
    if (requestStatus === 'idle') return 'wait';
    if (requestStatus === 'error') return step === 0 ? 'error' : 'wait';
    if (requestStatus === 'requested') return step === 0 ? 'finish' : 'process';
    if (requestStatus === 'completed') return 'finish';
    return 'wait';
  };

  return (
    <Card>
      <Title level={4}>Request Your Personal Data</Title>
      <Paragraph>
        Under data protection laws, you have the right to request a copy of your personal data that we store.
        This allows you to verify what information we have about you and how it's being used.
      </Paragraph>

      {requestStatus === 'idle' && (
        <Alert
          message="Before you request your data"
          description="Generating your data export package may take up to 48 hours to complete. You will receive an email notification when your data is ready for download."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {requestStatus === 'requested' && (
        <Alert
          message="Data export in progress"
          description={`Your request (ID: ${requestInfo.request_id}) has been submitted on ${new Date(requestInfo.requested_at || '').toLocaleString()}. We'll notify you when it's ready.`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {requestStatus === 'error' && (
        <Alert
          message="Request failed"
          description="We encountered an error while processing your data export request. Please try again later."
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Steps 
        direction="vertical"
        current={requestStatus === 'idle' ? -1 : requestStatus === 'requested' ? 0 : 1}
        items={[
          {
            title: 'Request Submitted',
            description: 'Your request has been received and is being processed',
            status: getStepStatus(0)
          },
          {
            title: 'Data Package Ready',
            description: 'Your data is packaged and ready for download',
            status: getStepStatus(1)
          }
        ]}
        style={{ marginBottom: 24 }}
      />

      <Space direction="vertical" style={{ width: '100%' }}>
        <Button 
          type="primary"
          icon={<DownloadOutlined />}
          loading={loading}
          onClick={handleRequestExport}
          disabled={requestStatus === 'requested'}
          block
        >
          Request Data Export
        </Button>
        
        {onComplete && (
          <Button onClick={onComplete} block>
            Cancel
          </Button>
        )}
      </Space>
    </Card>
  );
} 