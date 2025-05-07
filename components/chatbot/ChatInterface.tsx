'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Input, 
  Button, 
  List, 
  Avatar, 
  Spin, 
  Typography, 
  Card,
  Tag,
  Divider,
  Space,
  message
} from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, CalendarOutlined } from '@ant-design/icons';
import { chatbotService } from '../../app/services/chatbotService';

const { Text, Paragraph } = Typography;

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  intent?: string;
  recommendations?: any[];
}

interface ChatInterfaceProps {
  patientId?: number;
  onScheduleAppointment?: (data: any) => void;
}

export default function ChatInterface({ patientId, onScheduleAppointment }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialize chatbot with welcome message
    const initialMessage: Message = {
      id: 'welcome',
      content: 'Olá! Sou SURI, sua assistente virtual médica. Como posso ajudar você hoje?',
      role: 'assistant',
      timestamp: new Date().toISOString()
    };
    
    setMessages([initialMessage]);
  }, []);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // Send message to chatbot API
      const response = await chatbotService.sendMessage(input, sessionId);
      
      if (response.success) {
        // Store session ID for future messages
        if (!sessionId && response.data.session_id) {
          setSessionId(response.data.session_id);
        }
        
        // Add bot response to chat
        const botMessage: Message = {
          id: Date.now().toString(),
          content: response.data.response,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          intent: response.data.intent,
          recommendations: response.data.recommendations
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      message.error('Não foi possível conectar ao assistente virtual');
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: 'error',
          content: 'Desculpe, estou com dificuldades para responder no momento. Por favor, tente novamente mais tarde.',
          role: 'assistant',
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleScheduleAppointment = (professional: any) => {
    if (onScheduleAppointment) {
      onScheduleAppointment({
        professional_id: professional.professional_id,
        session_id: sessionId,
        patient_id: patientId
      });
    }
  };
  
  const renderMessageContent = (message: Message) => {
    if (message.role === 'user') {
      return <Paragraph>{message.content}</Paragraph>;
    }
    
    return (
      <>
        <Paragraph>{message.content}</Paragraph>
        
        {message.intent === 'schedule_appointment' && message.recommendations && message.recommendations.length > 0 && (
          <>
            <Divider orientation="left">Profissionais Recomendados</Divider>
            <List
              itemLayout="horizontal"
              dataSource={message.recommendations}
              renderItem={professional => (
                <List.Item
                  actions={[
                    <Button 
                      key="schedule" 
                      type="primary" 
                      icon={<CalendarOutlined />} 
                      onClick={() => handleScheduleAppointment(professional)}
                    >
                      Agendar
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={professional.name}
                    description={
                      <>
                        <Tag color="blue">{professional.specialty}</Tag>
                        <div>Avaliação: {professional.rating} / 5</div>
                        {professional.available_slots && (
                          <div>
                            Próxima disponibilidade: {professional.available_slots[0]?.date} às {professional.available_slots[0]?.time}
                          </div>
                        )}
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </>
    );
  };
  
  return (
    <Card style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px' }}>
        <List
          itemLayout="horizontal"
          dataSource={messages}
          renderItem={message => (
            <List.Item style={{ padding: '12px 0' }}>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                    style={{ 
                      backgroundColor: message.role === 'user' ? '#1890ff' : '#52c41a'
                    }}
                  />
                }
                content={renderMessageContent(message)}
              />
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </div>
      
      <Divider style={{ margin: '0 0 16px 0' }} />
      
      <div style={{ display: 'flex' }}>
        <Input
          placeholder="Digite sua mensagem..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
          style={{ marginRight: '8px' }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendMessage}
          loading={loading}
        />
      </div>
      
      {loading && (
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <Spin size="small" /> <Text type="secondary">SURI está digitando...</Text>
        </div>
      )}
    </Card>
  );
} 