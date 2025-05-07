'use client';

import { useState } from 'react';
import { Card, Tabs, Typography, Spin, Modal, Form, DatePicker, TimePicker, Input, Button, message } from 'antd';
import { MessageOutlined, CalendarOutlined, HistoryOutlined } from '@ant-design/icons';
import ChatInterface from '../../components/chatbot/ChatInterface';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { chatbotService } from '../services/chatbotService';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

export default function ChatbotPage() {
  const [activeKey, setActiveKey] = useState('chat');
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [schedulingData, setSchedulingData] = useState<any>(null);
  const [form] = Form.useForm();
  
  const handleTabChange = (key: string) => {
    setActiveKey(key);
  };
  
  const handleScheduleAppointment = (data: any) => {
    setSchedulingData(data);
    setScheduleModalVisible(true);
  };
  
  const handleConfirmSchedule = async () => {
    try {
      const values = await form.validateFields();
      setScheduleLoading(true);
      
      // Combine date and time
      const date = values.date.format('YYYY-MM-DD');
      const time = values.time.format('HH:mm');
      
      const appointmentData = {
        professional_id: schedulingData.professional_id,
        patient_id: schedulingData.patient_id || undefined,
        session_id: schedulingData.session_id,
        date,
        time,
        notes: values.notes
      };
      
      const response = await chatbotService.scheduleAppointment(appointmentData);
      
      if (response.success) {
        message.success('Agendamento realizado com sucesso!');
        setScheduleModalVisible(false);
        form.resetFields();
      } else {
        throw new Error('Falha ao agendar consulta');
      }
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      message.error('Não foi possível realizar o agendamento. Por favor, tente novamente.');
    } finally {
      setScheduleLoading(false);
    }
  };
  
  return (
    <
    >
      <Paragraph>
        Use nosso assistente virtual para tirar dúvidas, agendar consultas ou obter recomendações médicas. 
        O SURI utiliza inteligência artificial para entender suas necessidades e oferecer as melhores soluções.
      </Paragraph>
      
      <Tabs activeKey={activeKey} onChange={handleTabChange}>
        <TabPane 
          tab={
            <span>
              <MessageOutlined />
              Chat
            </span>
          } 
          key="chat"
        >
          <ChatInterface onScheduleAppointment={handleScheduleAppointment} />
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <CalendarOutlined />
              Agendamentos
            </span>
          } 
          key="appointments"
        >
          <Card>
            <Title level={4}>Agendamentos via SURI</Title>
            <Paragraph>
              Aqui você encontrará todos os agendamentos feitos através do assistente virtual.
              (Esta funcionalidade será implementada em breve)
            </Paragraph>
          </Card>
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <HistoryOutlined />
              Histórico de Conversas
            </span>
          } 
          key="history"
        >
          <Card>
            <Title level={4}>Histórico de Conversas</Title>
            <Paragraph>
              Visualize seu histórico de interações com o assistente virtual SURI.
              (Esta funcionalidade será implementada em breve)
            </Paragraph>
          </Card>
        </TabPane>
      </Tabs>
      
      <Modal
        title="Agendar Consulta"
        open={scheduleModalVisible}
        onCancel={() => setScheduleModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setScheduleModalVisible(false)}>
            Cancelar
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            loading={scheduleLoading} 
            onClick={handleConfirmSchedule}
          >
            Confirmar Agendamento
          </Button>
        ]}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="date"
            label="Data da Consulta"
            rules={[{ required: true, message: 'Por favor, selecione uma data' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="time"
            label="Horário"
            rules={[{ required: true, message: 'Por favor, selecione um horário' }]}
          >
            <TimePicker format="HH:mm" minuteStep={15} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Observações"
          >
            <Input.TextArea rows={4} placeholder="Adicione informações relevantes sobre a consulta" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
} 