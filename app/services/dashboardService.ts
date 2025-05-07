import { apiClient } from './apiClient';

const API_BASE_PATH = '/dashboard';

export type DashboardStats = {
  appointments: { total: number; pending: number; completed: number };
  solicitations: { total: number; pending: number; accepted: number };
  patients: { total: number; active: number };
  revenue: { total: number; pending: number };
};

export type Appointment = {
  id: number;
  patient: string;
  patient_id: number;
  time: string;
  date: string;
  type: string;
  status: string;
};

export type Notification = {
  id: number;
  sender: string;
  content: string;
  time: string;
  unread: boolean;
};

export const dashboardService = {
  /**
   * Get dashboard statistics
   */
  getStats: async () => {
    const response = await apiClient.get<{ success: boolean; data: DashboardStats }>(`${API_BASE_PATH}/stats`);
    return response.data;
  },

  /**
   * Get upcoming appointments
   */
  getUpcomingAppointments: async (limit: number = 5) => {
    const response = await apiClient.get<{ success: boolean; data: Appointment[] }>(
      `${API_BASE_PATH}/appointments/upcoming`, 
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Get today's appointments
   */
  getTodayAppointments: async () => {
    const response = await apiClient.get<{ success: boolean; data: Appointment[] }>(`${API_BASE_PATH}/appointments/today`);
    return response.data;
  },

  /**
   * Get recent notifications
   */
  getRecentNotifications: async (limit: number = 5) => {
    const response = await apiClient.get<{ success: boolean; data: Notification[] }>(
      `${API_BASE_PATH}/notifications`, 
      { params: { limit } }
    );
    return response.data;
  },

  /**
   * Mark notification as read
   */
  markNotificationAsRead: async (notificationId: number) => {
    const response = await apiClient.put<{ success: boolean }>(
      `${API_BASE_PATH}/notifications/${notificationId}/mark-read`
    );
    return response.data;
  },

  /**
   * Get SURI stats
   */
  getSuriStats: async () => {
    const response = await apiClient.get<{ success: boolean; data: { message_count: number } }>(
      `${API_BASE_PATH}/suri/stats`
    );
    return response.data;
  }
}; 