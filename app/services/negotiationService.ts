import { apiClient } from './apiClient';

export type NegotiationStatus = 
  | 'draft' 
  | 'submitted' 
  | 'pending' 
  | 'approved' 
  | 'partially_approved' 
  | 'rejected' 
  | 'cancelled';

export type NegotiationItemStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'counter_offered';

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
export const negotiationStatusLabels = {
  draft: 'Rascunho',
  submitted: 'Enviado',
  pending: 'Pendente',
  approved: 'Aprovado',
  partially_approved: 'Parcialmente Aprovado',
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

const API_BASE_PATH = '/negotiations';

export const negotiationService = {
  /**
   * Get list of negotiations
   */
  getNegotiations: async (params?: { 
    entity_type?: string; 
    entity_id?: number; 
    status?: NegotiationStatus;
    search?: string;
    sort_field?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
  }) => {
    const response = await apiClient.get(
      API_BASE_PATH, 
      { params }
    );
    return response.data;
  },

  /**
   * Get a specific negotiation
   */
  getNegotiation: async (id: number) => {
    const response = await apiClient.get(
      `${API_BASE_PATH}/${id}`
    );
    return response.data;
  },

  /**
   * Create a new negotiation
   */
  createNegotiation: async (negotiationData: CreateNegotiationDto) => {
    const response = await apiClient.post(
      API_BASE_PATH, 
      negotiationData
    );
    return response.data;
  },

  /**
   * Update an existing negotiation
   */
  updateNegotiation: async (id: number, negotiationData: UpdateNegotiationDto) => {
    const response = await apiClient.put(
      `${API_BASE_PATH}/${id}`, 
      negotiationData
    );
    return response.data;
  },

  /**
   * Delete a negotiation (não implementado no backend)
   */
  deleteNegotiation: async (id: number) => {
    throw new Error('Esta funcionalidade não está disponível no backend');
  },

  /**
   * Submit a negotiation for approval
   */
  submitNegotiation: async (id: number) => {
    const response = await apiClient.post(
      `${API_BASE_PATH}/${id}/submit`
    );
    return response.data;
  },

  /**
   * Cancel a negotiation
   */
  cancelNegotiation: async (id: number) => {
    const response = await apiClient.post(
      `${API_BASE_PATH}/${id}/cancel`
    );
    return response.data;
  },

  /**
   * Generate a contract from a negotiation
   */
  generateContract: async (id: number) => {
    const response = await apiClient.post(
      `${API_BASE_PATH}/${id}/generate-contract`
    );
    return response.data;
  },

  /**
   * Respond to a negotiation item
   */
  respondToItem: async (
    itemId: number, 
    data: {
      status: 'approved' | 'rejected';
      approved_value?: number;
      notes?: string;
    }
  ) => {
    const response = await apiClient.post(
      `/negotiation-items/${itemId}/respond`, 
      data
    );
    return response.data;
  },

  /**
   * Make a counter offer
   */
  counterOffer: async (
    itemId: number,
    data: {
      counter_value: number;
      notes?: string;
    }
  ) => {
    const response = await apiClient.post(
      `/negotiation-items/${itemId}/counter`, 
      data
    );
    return response.data;
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
  }
}; 