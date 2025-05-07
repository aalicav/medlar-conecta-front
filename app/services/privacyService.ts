import { apiClient } from './apiClient';
import { DataConsent, DataExportRequest, DataDeletionRequest } from '../types/privacy';

const API_BASE_PATH = '/privacy';

export const privacyService = {
  /**
   * Get user's consent records
   */
  getConsents: async () => {
    const response = await apiClient.get<{ success: boolean; data: DataConsent[] }>(`${API_BASE_PATH}/consents`);
    return response.data;
  },

  /**
   * Record a new user consent
   */
  storeConsent: async (consentData: {
    consent_type: string;
    consent_given: boolean;
    entity_type?: string;
    entity_id?: number;
    consent_text: string;
  }) => {
    const response = await apiClient.post<{ success: boolean; data: DataConsent }>(`${API_BASE_PATH}/consents`, consentData);
    return response.data;
  },

  /**
   * Revoke a specific consent
   */
  revokeConsent: async (consentId: number) => {
    const response = await apiClient.delete<{ success: boolean; data: DataConsent }>(`${API_BASE_PATH}/consents/${consentId}`);
    return response.data;
  },

  /**
   * Request data export (LGPD right to access)
   */
  requestDataExport: async () => {
    const response = await apiClient.post<{ success: boolean; data: { request_id: number; requested_at: string } }>(`${API_BASE_PATH}/export-data`);
    return response.data;
  },

  /**
   * Request account deletion (LGPD right to erasure)
   */
  requestAccountDeletion: async (data: {
    confirmation: string;
    reason?: string;
    password: string;
  }) => {
    const response = await apiClient.post<{ success: boolean; data: { request_id: number; requested_at: string } }>(`${API_BASE_PATH}/request-deletion`, data);
    return response.data;
  },

  /**
   * Get privacy policy and terms information
   */
  getPrivacyInfo: async () => {
    const response = await apiClient.get<{ success: boolean; data: any }>(`${API_BASE_PATH}/info`);
    return response.data;
  }
}; 