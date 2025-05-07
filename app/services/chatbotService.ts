import { apiClient } from './apiClient';

const API_BASE_PATH = '/chatbot';

export const chatbotService = {
  /**
   * Send a message to the chatbot
   */
  sendMessage: async (message: string, sessionId?: string) => {
    const response = await apiClient.post<{ 
      success: boolean; 
      data: { 
        response: string; 
        session_id: string;
        intent?: string;
        recommendations?: any[];
      } 
    }>(`${API_BASE_PATH}/message`, { message, session_id });
    return response.data;
  },

  /**
   * Get conversation history
   */
  getConversationHistory: async (sessionId: string) => {
    const response = await apiClient.get<{ 
      success: boolean; 
      data: { 
        messages: Array<{
          id: string;
          role: 'user' | 'assistant';
          content: string;
          timestamp: string;
        }> 
      } 
    }>(`${API_BASE_PATH}/history/${sessionId}`);
    return response.data;
  },

  /**
   * Schedule an appointment via chatbot
   */
  scheduleAppointment: async (appointmentData: {
    session_id: string;
    professional_id: number;
    date: string;
    time: string;
    patient_id?: number;
    service_id?: number;
    notes?: string;
  }) => {
    const response = await apiClient.post<{ 
      success: boolean; 
      data: { 
        appointment_id: number;
        confirmed: boolean;
      } 
    }>(`${API_BASE_PATH}/schedule-appointment`, appointmentData);
    return response.data;
  },

  /**
   * Request appointment recommendations based on patient needs
   */
  getRecommendations: async (params: {
    session_id: string;
    specialty?: string;
    symptoms?: string[];
    preferred_date?: string;
    location?: string;
    gender_preference?: string;
  }) => {
    const response = await apiClient.post<{ 
      success: boolean; 
      data: { 
        recommendations: Array<{
          professional_id: number;
          name: string;
          specialty: string;
          available_slots: Array<{
            date: string;
            time: string;
          }>;
          rating: number;
          distance?: number;
        }> 
      } 
    }>(`${API_BASE_PATH}/get-recommendations`, params);
    return response.data;
  }
}; 