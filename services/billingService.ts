import { api } from '@/lib/api';

interface BillingOverviewParams {
  start_date: string;
  end_date: string;
  health_plan_id?: number;
}

interface TransactionParams extends BillingOverviewParams {
  status?: string;
  type?: string;
  per_page?: number;
}

export const billingService = {
  async getBillingOverview(params: BillingOverviewParams) {
    try {
      const response = await api.get('/billing/overview', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching billing overview:', error);
      throw error;
    }
  },

  async getTransactions(params: TransactionParams) {
    try {
      const response = await api.get('/billing/transactions', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  async generateInvoice(transactionId: number) {
    try {
      const response = await api.get(`/billing/transactions/${transactionId}/invoice`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error generating invoice:', error);
      throw error;
    }
  },

  async updateTransactionStatus(transactionId: number, status: string) {
    try {
      const response = await api.patch(`/billing/transactions/${transactionId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating transaction status:', error);
      throw error;
    }
  },

  downloadReceipt: async (transactionId: number) => {
    const response = await api.get(`/billing/transactions/${transactionId}/receipt`);
    return response.data;
  },

  getRules: async (params: any) => {
    const response = await api.get('/billing/rules', { params });
    return response.data;
  },

  deleteRule: async (ruleId: number) => {
    const response = await api.delete(`/billing/rules/${ruleId}`);
    return response.data;
  }
}; 