import { apiClient } from './apiClient';

export type NegotiationStatus = 
  | 'draft'
  | 'pending_commercial'
  | 'pending_financial'
  | 'pending_management'
  | 'pending_legal'
  | 'pending_direction'
  | 'approved'
  | 'rejected'
  | 'cancelled';

export type NegotiationItemStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'counter_offered';

export type ApprovalLevel = 
  | 'commercial'
  | 'financial'
  | 'management'
  | 'legal'
  | 'direction';

export type ApprovalAction = 'approve' | 'reject';

export type UserRole = 
  | 'commercial_manager'
  | 'financial_manager'
  | 'management_committee'
  | 'legal_manager'
  | 'director';

export interface NegotiationItem {
  id?: number;
  negotiation_id?: number;
  tuss_id: number;
  tuss?: {
    id: number;
    code: string;
    name: string;
    description?: string;
  };
  proposed_value: number;
  approved_value?: number;
  status: NegotiationItemStatus;
  notes?: string;
  responded_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApprovalHistory {
  id: number;
  negotiation_id: number;
  level: ApprovalLevel;
  status: 'pending' | 'approved' | 'rejected';
  user_id: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
  };
}

export interface Negotiation {
  id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  negotiable_type: string;
  negotiable_id: number;
  negotiable?: {
    id: number;
    name: string;
    type?: string;
  };
  creator_id: number;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  status: NegotiationStatus;
  notes?: string;
  items: NegotiationItem[];
  approved_at?: string;
  created_at: string;
  updated_at: string;
  // Aliases para manter compatibilidade para trás
  entity_type?: string;
  entity_id?: number;
  current_approval_level?: ApprovalLevel;
  approval_history?: ApprovalHistory[];
}

export type CreateNegotiationDto = {
  entity_type: string;  // App\Models\HealthPlan, App\Models\Professional, App\Models\Clinic
  entity_id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  notes?: string;
  status?: 'draft' | 'submitted' | 'approved';
  items: {
    tuss_id: number;
    proposed_value: number;
    status?: 'pending' | 'approved';
    approved_value?: number;
    notes?: string;
  }[];
};

export type UpdateNegotiationDto = Partial<{
  entity_type: string;
  entity_id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  notes: string;
  items: {
    id?: number;
    tuss_id: number;
    proposed_value: number;
    notes?: string;
  }[];
}>;

// Nome mais amigável para os status
export const negotiationStatusLabels: Record<NegotiationStatus, string> = {
  draft: 'Rascunho',
  pending_commercial: 'Pendente Comercial',
  pending_financial: 'Pendente Financeiro',
  pending_management: 'Pendente Gestão',
  pending_legal: 'Pendente Jurídico',
  pending_direction: 'Pendente Direção',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado'
};

export const negotiationItemStatusLabels = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  counter_offered: 'Contra-proposta'
};

// Cores para os status
export const negotiationStatusColors = {
  draft: 'default',
  submitted: 'processing',
  pending: 'warning',
  approved: 'success',
  partially_approved: 'geekblue',
  rejected: 'error',
  cancelled: 'default'
};

export const negotiationItemStatusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  counter_offered: 'geekblue'
};

export const approvalLevelLabels: Record<ApprovalLevel, string> = {
  commercial: 'Comercial',
  financial: 'Financeiro',
  management: 'Gestão',
  legal: 'Jurídico',
  direction: 'Direção'
};

const API_BASE_PATH = '/negotiations';

export const negotiationService = {
  /**
   * Get list of negotiations
   */
  getNegotiations: (params?: { 
    entity_type?: string; 
    entity_id?: number; 
    status?: NegotiationStatus;
    search?: string;
    sort_field?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
  }) => {
    return apiClient.get(API_BASE_PATH, { params }).then(response => response.data);
  },

  /**
   * Get a specific negotiation
   */
  getNegotiation: (id: number) => {
    return apiClient.get(`${API_BASE_PATH}/${id}`).then(response => response.data);
  },

  /**
   * Create a new negotiation
   */
  createNegotiation: (negotiationData: CreateNegotiationDto) => {
    return apiClient.post(API_BASE_PATH, negotiationData).then(response => response.data);
  },

  /**
   * Update an existing negotiation
   */
  updateNegotiation: (id: number, negotiationData: UpdateNegotiationDto) => {
    return apiClient.put(`${API_BASE_PATH}/${id}`, negotiationData).then(response => response.data);
  },

  /**
   * Delete a negotiation (não implementado no backend)
   */
  deleteNegotiation: (id: number) => {
    throw new Error('Esta funcionalidade não está disponível no backend');
  },

  /**
   * Submit a negotiation for approval
   */
  submitNegotiation: (id: number) => {
    return apiClient.post(`${API_BASE_PATH}/${id}/submit`).then(response => response.data);
  },

  /**
   * Cancel a negotiation
   */
  cancelNegotiation: (id: number) => {
    return apiClient.post(`${API_BASE_PATH}/${id}/cancel`).then(response => response.data);
  },

  /**
   * Generate a contract from a negotiation
   */
  generateContract: (id: number) => {
    return apiClient.post(`${API_BASE_PATH}/${id}/generate-contract`).then(response => response.data);
  },

  /**
   * Respond to a negotiation item
   */
  respondToItem: (itemId: number, data: { 
    status: 'approved' | 'rejected'; 
    approved_value?: number; 
    notes?: string; 
  }) => {
    return apiClient.post(`${API_BASE_PATH}/items/${itemId}/respond`, data).then(response => response.data);
  },

  /**
   * Make a counter offer
   */
  counterOffer: (itemId: number, data: { 
    counter_value: number; 
    notes?: string; 
  }) => {
    return apiClient.post(`${API_BASE_PATH}/items/${itemId}/counter`, data).then(response => response.data);
  },

  /**
   * Get TUSS procedures 
   */
  getTussProcedures: async (search?: string) => {
    try {
      const response = await apiClient.get(
        '/tuss',
        { params: { search } }
      );
      
      if (response?.data?.data) {
        return {
          success: true,
          data: response.data.data
        };
      }
      
      return { success: false, data: [] };
    } catch (error) {
      console.error('Erro ao buscar procedimentos TUSS:', error);
      return { success: false, data: [] };
    }
  },

  submitForApproval: (id: number) => {
    return apiClient.post(`${API_BASE_PATH}/${id}/submit-approval`).then(response => response.data);
  },

  processApproval: (id: number, action: ApprovalAction) => {
    return apiClient.post(`${API_BASE_PATH}/${id}/process-approval`, { action }).then(response => response.data);
  }
}; 