import { apiClient } from './apiClient';
import { BillingRule, BillingBatch, BillingItem } from '../types/billing';

const API_BASE_PATH = '/billing';

export const billingService = {
  /**
   * Get list of billing rules
   */
  getRules: async (params?: { entity_type?: string; entity_id?: number; is_active?: boolean }) => {
    const response = await apiClient.get<{ success: boolean; data: BillingRule[] }>(`${API_BASE_PATH}/rules`, { params });
    return response.data;
  },

  /**
   * Get a specific billing rule
   */
  getRule: async (ruleId: number) => {
    const response = await apiClient.get<{ success: boolean; data: BillingRule }>(`${API_BASE_PATH}/rules/${ruleId}`);
    return response.data;
  },

  /**
   * Create a new billing rule
   */
  createRule: async (ruleData: Omit<BillingRule, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await apiClient.post<{ success: boolean; data: BillingRule }>(`${API_BASE_PATH}/rules`, ruleData);
    return response.data;
  },

  /**
   * Update an existing billing rule
   */
  updateRule: async (ruleId: number, ruleData: Partial<BillingRule>) => {
    const response = await apiClient.put<{ success: boolean; data: BillingRule }>(`${API_BASE_PATH}/rules/${ruleId}`, ruleData);
    return response.data;
  },

  /**
   * Delete a billing rule
   */
  deleteRule: async (ruleId: number) => {
    const response = await apiClient.delete<{ success: boolean }>(`${API_BASE_PATH}/rules/${ruleId}`);
    return response.data;
  },

  /**
   * Get billing batches 
   */
  getBillingBatches: async (params?: { entity_type?: string; entity_id?: number; status?: string; start_date?: string; end_date?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: BillingBatch[] }>(`${API_BASE_PATH}/batches`, { params });
    return response.data;
  },

  /**
   * Get a specific billing batch with items
   */
  getBillingBatch: async (batchId: number, includeItems: boolean = true) => {
    const response = await apiClient.get<{ success: boolean; data: BillingBatch & { items?: BillingItem[] } }>(
      `${API_BASE_PATH}/batches/${batchId}`, { params: { include_items: includeItems } }
    );
    return response.data;
  },

  /**
   * Create a billing preview
   */
  createBillingPreview: async (params: { 
    rule_id: number;
    entity_type: string;
    entity_id: number;
    reference_start: string;
    reference_end: string;
  }) => {
    const response = await apiClient.post<{ success: boolean; data: any }>(`${API_BASE_PATH}/preview`, params);
    return response.data;
  },

  /**
   * Generate invoice for a billing batch
   */
  generateInvoice: async (batchId: number) => {
    const response = await apiClient.post<{ success: boolean; data: { invoice_path: string } }>(`${API_BASE_PATH}/batches/${batchId}/generate-invoice`);
    return response.data;
  }
}; 