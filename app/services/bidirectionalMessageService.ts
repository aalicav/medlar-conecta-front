import api from '@/services/api-client';

export interface BidirectionalMessage {
  id: number;
  sender_phone: string | null;
  recipient_phone: string | null;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  direction: 'inbound' | 'outbound';
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
  message_type: 'text' | 'media' | 'template';
  template_name: string | null;
  metadata: any;
  conversation_partner: string;
  sender_entity?: any;
  recipient_entity?: any;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  conversation_partner: string;
  content: string | null;
  direction: 'inbound' | 'outbound';
  status: string;
  created_at: string;
  sender_entity?: any;
  recipient_entity?: any;
}

export interface MessageStatistics {
  total_messages: number;
  inbound_messages: number;
  outbound_messages: number;
  failed_messages: number;
  delivered_messages: number;
  read_messages: number;
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

export interface MessageFilters {
  direction?: 'inbound' | 'outbound';
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  phone?: string;
  start_date?: string;
  end_date?: string;
  per_page?: number;
  page?: number;
}

const BidirectionalMessageService = {
  /**
   * Get all conversations
   */
  getConversations: async (limit: number = 20): Promise<Conversation[]> => {
    const response = await api.get('/messages/conversations', { params: { limit } });
    return response.data.data;
  },

  /**
   * Get conversation history for a specific phone number
   */
  getConversationHistory: async (phone: string, limit: number = 50): Promise<BidirectionalMessage[]> => {
    const response = await api.get(`/messages/conversations/${phone}/history`, { params: { limit } });
    return response.data.data;
  },

  /**
   * Send a manual message
   */
  sendMessage: async (
    recipientPhone: string,
    content: string,
    relatedModelType?: string,
    relatedModelId?: number
  ): Promise<BidirectionalMessage> => {
    const response = await api.post('/messages/send', {
      recipient_phone: recipientPhone,
      content,
      related_model_type: relatedModelType,
      related_model_id: relatedModelId,
    });
    return response.data.data;
  },

  /**
   * Get messages by entity type and ID
   */
  getMessagesByEntity: async (
    type: string,
    id: number,
    perPage: number = 50
  ): Promise<PaginatedResponse<BidirectionalMessage>> => {
    const response = await api.get(`/messages/entity/${type}/${id}`, { params: { per_page: perPage } });
    return response.data;
  },

  /**
   * Get message statistics
   */
  getStatistics: async (): Promise<MessageStatistics> => {
    const response = await api.get('/messages/statistics');
    return response.data.data;
  },

  /**
   * Get messages with filters
   */
  getMessages: async (filters: MessageFilters = {}): Promise<PaginatedResponse<BidirectionalMessage>> => {
    const response = await api.get('/messages', { params: filters });
    return response.data;
  },

  /**
   * Get a specific message by ID
   */
  getMessage: async (id: number): Promise<BidirectionalMessage> => {
    const response = await api.get(`/messages/${id}`);
    return response.data.data;
  },
};

export default BidirectionalMessageService; 