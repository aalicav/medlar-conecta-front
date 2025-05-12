import {apiClient}  from './api-client';

export interface DashboardStats {
  appointments?: {
    total: number;
    pending: number;
    completed: number;
    today?: number;
  };
  solicitations?: {
    total: number;
    pending: number;
    accepted: number;
  };
  patients?: {
    total: number;
    active: number;
  };
  revenue?: {
    total: number;
    pending: number;
    month_to_date?: number;
    last_30_days?: number;
  };
  contracts?: {
    total: number;
    active: number;
    pending_approval?: number;
    expired?: number;
    expiring_soon?: number;
    pending_review?: number;
    template_count?: number;
  };
  negotiations?: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    pending_addendum?: number;
    pending_addendum_details?: any[];
  };
  professionals?: {
    total: number;
    pending_payment?: number;
  };
  pending_approvals?: {
    contracts: number;
    negotiations: number;
    value_verifications: number;
  };
  addendums?: {
    pending: number;
  };
}

export interface Appointment {
  id: number;
  patient: string;
  patient_id: number;
  time: string;
  date: string;
  type: string;
  status: string;
}

export interface PendingItem {
  id: number;
  type: string;
  title: string;
  description: string;
  link: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
}

const dashboardService = {
  /**
   * Get dashboard statistics
   */
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data;
  },

  /**
   * Get upcoming appointments
   */
  getUpcomingAppointments: async (limit = 5) => {
    const response = await apiClient.get(`/dashboard/appointments/upcoming?limit=${limit}`);
    return response.data;
  },

  /**
   * Get today's appointments
   */
  getTodayAppointments: async () => {
    const response = await apiClient.get('/dashboard/appointments/today');
    return response.data;
  },

  /**
   * Get SURI chatbot statistics
   */
  getSuriStats: async () => {
    const response = await apiClient.get('/dashboard/suri/stats');
    return response.data;
  },
  
  /**
   * Get pending items that require attention based on user role
   */
  getPendingItems: async () => {
    const response = await apiClient.get('/dashboard/pending/items');
    return response.data;
  }
};

export { dashboardService }; 