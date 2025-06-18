import api from '@/services/api-client';

export interface WhatsappMessage {
  id: number;
  recipient: string;
  content: string | null;
  media_url: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  external_id: string | null;
  related_model: {
    type: string;
    id: number;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsappStatistics {
  total: number;
  pending: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
}

export interface WhatsappFilter {
  status?: string;
  recipient?: string;
  start_date?: string;
  end_date?: string;
  sort_field?: string;
  sort_order?: string;
  per_page?: number;
  page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  from: number;
  last_page: number;
  per_page: number;
  to: number;
  total: number;
}

export interface TemplateTestResponse {
  success: boolean;
  message: string;
  data: any;
  template_key?: string;
  values_used?: Record<string, string>;
}

export interface TemplateOption {
  key: string;
  name: string;
  description: string;
  paramCount: number;
  placeholders?: string[];
}

const AVAILABLE_TEMPLATES: TemplateOption[] = [
  {
    key: 'agendamento_cliente',
    name: 'Agendamento para Cliente',
    description: 'Notifica o cliente sobre um novo agendamento',
    paramCount: 7,
    placeholders: ['Nome do Cliente', 'Nome do Especialista', 'Especialidade', 'Data', 'Hora', 'Endereço', 'Link de Confirmação']
  },
  {
    key: 'agendamento_cancelado',
    name: 'Agendamento Cancelado',
    description: 'Notifica o cliente sobre cancelamento',
    paramCount: 3,
    placeholders: ['Nome do Cliente', 'Data da Consulta', 'Link de Reagendamento']
  },
  {
    key: 'agendamento_confirmado',
    name: 'Agendamento Confirmado',
    description: 'Confirma agendamento para o cliente',
    paramCount: 4,
    placeholders: ['Nome do Cliente', 'Data da Consulta', 'Hora da Consulta', 'Link de Detalhes']
  },
  {
    key: 'nps_survey',
    name: 'Pesquisa NPS',
    description: 'Envia pesquisa de satisfação',
    paramCount: 5,
    placeholders: ['Nome do Cliente', 'Data da Consulta', 'Nome do Especialista', 'Especialidade', 'ID do Agendamento']
  },
  {
    key: 'nps_survey_prestador',
    name: 'Pesquisa NPS para Prestador',
    description: 'Envia pesquisa sobre o prestador de serviço',
    paramCount: 4,
    placeholders: ['Nome do Cliente', 'Nome do Especialista', 'Data da Consulta', 'ID do Agendamento']
  },
  {
    key: 'nps_pergunta',
    name: 'Pergunta NPS',
    description: 'Envia apenas a pergunta de NPS',
    paramCount: 1,
    placeholders: ['ID do Agendamento']
  },
  {
    key: 'copy_menssagem_operadora',
    name: 'Mensagem para Operadora',
    description: 'Cópia da mensagem para operadora',
    paramCount: 7,
    placeholders: ['Nome do Operador', 'Nome do Cliente', 'Nome do Especialista', 'Especialidade', 'Data da Consulta', 'Hora da Consulta', 'Endereço']
  }
];

const WhatsappService = {
  getMessages: async (filters: WhatsappFilter = {}): Promise<PaginatedResponse<WhatsappMessage>> => {
    const response = await api.get('/whatsapp/messages', { params: filters });
    return response.data;
  },

  getMessage: async (id: number): Promise<WhatsappMessage> => {
    const response = await api.get(`/whatsapp/messages/${id}`);
    return response.data;
  },

  sendTextMessage: async (
    recipient: string,
    message: string,
    relatedModelType?: string,
    relatedModelId?: number
  ): Promise<WhatsappMessage> => {
    const response = await api.post('/whatsapp/send/text', {
      recipient,
      message,
      related_model_type: relatedModelType,
      related_model_id: relatedModelId,
    });
    return response.data;
  },

  sendMediaMessage: async (
    recipient: string,
    mediaUrl: string,
    mediaType: 'image' | 'document' | 'video' | 'audio',
    caption?: string,
    relatedModelType?: string,
    relatedModelId?: number
  ): Promise<WhatsappMessage> => {
    const response = await api.post('/whatsapp/send/media', {
      recipient,
      media_url: mediaUrl,
      media_type: mediaType,
      caption,
      related_model_type: relatedModelType,
      related_model_id: relatedModelId,
    });
    return response.data;
  },

  resendMessage: async (id: number): Promise<WhatsappMessage> => {
    const response = await api.post(`/whatsapp/resend/${id}`);
    return response.data;
  },

  getStatistics: async (): Promise<WhatsappStatistics> => {
    const response = await api.get('/whatsapp/statistics');
    return response.data;
  },

  // New methods for template testing
  
  /**
   * Send a simple test message using a template
   * 
   * @param recipient The phone number to send the message to
   * @param templateKey The template key (agendamento_cliente, nps_survey, etc)
   * @param values Optional array of values to use in the template
   * @returns Response with success status and message details
   */
  sendSimpleTest: async (
    recipient: string,
    templateKey: string,
    values?: string[]
  ): Promise<TemplateTestResponse> => {
    const response = await api.post('/whatsapp/test/simple', {
      recipient,
      template_key: templateKey,
      values
    });
    return response.data;
  },
  
  /**
   * Send a template test with custom data
   * 
   * @param recipient The phone number to send the message to
   * @param templateKey The template key (agendamento_cliente, nps_survey, etc)
   * @param customData Custom data object with keys as indexes (e.g., {'1': 'value1', '2': 'value2'})
   * @returns Response with success status and message details
   */
  sendTemplateTest: async (
    recipient: string,
    templateKey: string,
    customData?: Record<string, string>
  ): Promise<TemplateTestResponse> => {
    const response = await api.post('/whatsapp/test/conecta-template', {
      recipient,
      template_key: templateKey,
      custom_data: customData
    });
    return response.data;
  },
  
  /**
   * Get list of available templates
   * 
   * @returns Array of available template options
   */
  getAvailableTemplates: (): TemplateOption[] => {
    return AVAILABLE_TEMPLATES;
  },
  
  /**
   * Get a specific template by key
   * 
   * @param key Template key
   * @returns Template option or undefined if not found
   */
  getTemplateByKey: (key: string): TemplateOption | undefined => {
    return AVAILABLE_TEMPLATES.find(template => template.key === key);
  }
};

export default WhatsappService; 