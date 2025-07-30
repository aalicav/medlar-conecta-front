import api from './api-client';

export interface TwilioMessage {
  id: string;
  content: string;
  direction: 'inbound' | 'outbound';
  status: string;
  timestamp: string;
  sender: string;
  conversation_sid: string;
}

export interface TwilioConversation {
  conversation_sid: string;
  phone: string;
  latest_message: TwilioMessage;
  contact_info: {
    type: string;
    id: number;
    name: string;
    entity: any;
  } | null;
  created_at: string;
}

export interface MessageStatistics {
  total_conversations: number;
  total_messages: number;
  unread_messages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  message?: string;
}

const BidirectionalMessageService = {
  // Get all conversations
  getConversations: async (limit: number = 20): Promise<TwilioConversation[]> => {
    try {
      const response = await api.get(`/messages/conversations?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get conversation history for a specific phone
  getConversationHistory: async (phone: string, limit: number = 50): Promise<TwilioMessage[]> => {
    try {
      const response = await api.get(`/messages/conversations/${phone}/history?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  },

  // Send a message
  sendMessage: async (phone: string, content: string): Promise<any> => {
    try {
      const response = await api.post('/messages/send', {
        recipient_phone: phone,
        content: content,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Get messages by entity
  getMessagesByEntity: async (type: string, id: number): Promise<TwilioMessage[]> => {
    try {
      const response = await api.get(`/messages/entity/${type}/${id}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching messages by entity:', error);
      throw error;
    }
  },

  // Get statistics
  getStatistics: async (): Promise<MessageStatistics> => {
    try {
      const response = await api.get('/messages/statistics');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw error;
    }
  },

  // Get all messages with filters
  getMessages: async (filters: any = {}): Promise<TwilioMessage[]> => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/messages?${params.toString()}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Get messages directly from Twilio
  getTwilioMessages: async (phone: string, limit: number = 50): Promise<TwilioMessage[]> => {
    try {
      const response = await api.get(`/messages/twilio/${phone}/messages?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching Twilio messages:', error);
      throw error;
    }
  },

  // Setup webhook for a conversation
  setupWebhook: async (phone: string, webhookUrl?: string): Promise<any> => {
    try {
      const response = await api.post(`/messages/twilio/${phone}/webhook`, {
        webhook_url: webhookUrl,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error setting up webhook:', error);
      throw error;
    }
  },

  // Mark conversation as read
  markAsRead: async (phone: string): Promise<any> => {
    try {
      const response = await api.post(`/messages/conversations/${phone}/read`);
      return response.data.data;
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  },

  // Real-time notifications (polling)
  listenForNewMessages: (callback: (data: any) => void) => {
    // For now, we'll use polling. In production, you can use WebSockets
    const interval = setInterval(async () => {
      try {
        const response = await api.get('/messages/conversations?limit=1');
        if (response.data.data && response.data.data.length > 0) {
          const latestConversation = response.data.data[0];
          callback(latestConversation);
        }
      } catch (error) {
        console.error('Error polling for new messages:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await api.get('/messages/statistics');
      return response.data.data.unread_messages || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },

  // Get complete history (alias for getConversationHistory)
  getCompleteHistory: async (phone: string, limit: number = 50): Promise<TwilioMessage[]> => {
    return BidirectionalMessageService.getConversationHistory(phone, limit);
  },
};

export default BidirectionalMessageService; 