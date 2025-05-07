'use client';

import { useState } from 'react';
import { Tabs, Card, Typography, Button, Divider } from 'antd';
import { SafetyOutlined, ExportOutlined, DeleteOutlined } from '@ant-design/icons';
import ConsentForm from '../../../components/privacy/ConsentForm';
import DataExportRequest from '../../../components/privacy/DataExportRequest';
import DashboardLayout from '../../../components/layouts/DashboardLayout';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

export default function PrivacySettingsPage() {
  const [activeKey, setActiveKey] = useState('consents');
  
  const handleTabChange = (key: string) => {
    setActiveKey(key);
  };
  
  return (
    <DashboardLayout 
      title="Configurações de Privacidade" 
      icon={<SafetyOutlined />}
      breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Configurações', href: '/settings' },
        { title: 'Privacidade', href: '/settings/privacy' }
      ]}
    >
      <Paragraph>
        Gerencie suas preferências de privacidade, solicite exportação de dados ou exclusão de conta conforme 
        previsto na Lei Geral de Proteção de Dados (LGPD).
      </Paragraph>
      
      <Divider />
      
      <Tabs activeKey={activeKey} onChange={handleTabChange}>
        <TabPane 
          tab={
            <span>
              <SafetyOutlined />
              Consentimentos
            </span>
          } 
          key="consents"
        >
          <ConsentForm />
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <ExportOutlined />
              Exportar Dados
            </span>
          } 
          key="export"
        >
          <DataExportRequest />
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <DeleteOutlined />
              Exclusão de Conta
            </span>
          } 
          key="delete"
        >
          <Card>
            <Title level={4}>Solicitar Exclusão de Conta</Title>
            <Paragraph>
              Ao solicitar a exclusão da sua conta, todos os seus dados pessoais serão removidos dos nossos sistemas 
              após o período legal de retenção necessário para cumprimento de obrigações legais. 
            </Paragraph>
            <Paragraph>
              Esta ação não pode ser desfeita. Por favor, considere exportar seus dados antes de prosseguir com a exclusão.
            </Paragraph>
            <Paragraph type="danger">
              Atenção: O processo de exclusão de conta é irreversível. Seus dados médicos, histórico de consultas, 
              agendamentos e outros registros serão completamente apagados.
            </Paragraph>
            
            <Button 
              danger 
              type="primary" 
              icon={<DeleteOutlined />}
              onClick={() => {
                // Implement account deletion request flow
                // Could show a confirmation modal here
              }}
            >
              Solicitar Exclusão de Conta
            </Button>
          </Card>
        </TabPane>
      </Tabs>
    </DashboardLayout>
  );
} 