import { apiClient } from './apiClient';

export type NegotiationStatus = 
  | 'draft' 
  | 'submitted' 
  | 'pending' 
  | 'complete' 
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
    type: string;
  };
  creator_id: number;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  contract_template_id?: number;
  contract_id?: number;
  status: NegotiationStatus;
  notes?: string;
  items: NegotiationItem[];
  rejected_at?: string;
  completed_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export type CreateNegotiationDto = Omit<Negotiation, 'id' | 'creator_id' | 'creator' | 'negotiable' | 'created_at' | 'updated_at'>;
export type UpdateNegotiationDto = Partial<Omit<Negotiation, 'id' | 'creator_id' | 'creator' | 'negotiable' | 'created_at' | 'updated_at'>>;

// Nome mais amigável para os status
export const negotiationStatusLabels = {
  draft: 'Rascunho',
  submitted: 'Enviado',
  pending: 'Pendente',
  complete: 'Completo',
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
  complete: 'success',
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

export const negotiationService = {
  /**
   * Get negotiations with optional filters
   */
  getNegotiations: async (params?: {
    status?: NegotiationStatus;
    entity_type?: string;
    entity_id?: number;
    health_plan_id?: number; // Para compatibilidade
    search?: string;
    sort_field?: string;
    sort_order?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
  }) => {
    const response = await apiClient.get<{
      success: boolean;
      data: Negotiation[];
      meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
      };
    }>('/negotiations', { params });
    return response.data;
  },

  /**
   * Get a specific negotiation by ID
   */
  getNegotiation: async (id: number) => {
    const response = await apiClient.get<{
      success: boolean;
      data: Negotiation;
    }>(`/negotiations/${id}`);
    return response.data;
  },

  /**
   * Create a new negotiation
   */
  createNegotiation: async (negotiation: CreateNegotiationDto) => {
    const response = await apiClient.post<{
      success: boolean;
      data: Negotiation;
    }>('/negotiations', negotiation);
    return response.data;
  },

  /**
   * Update an existing negotiation
   */
  updateNegotiation: async (id: number, negotiation: UpdateNegotiationDto) => {
    const response = await apiClient.put<{
      success: boolean;
      data: Negotiation;
    }>(`/negotiations/${id}`, negotiation);
    return response.data;
  },

  /**
   * Submit a negotiation for approval
   */
  submitNegotiation: async (id: number) => {
    const response = await apiClient.post<{
      success: boolean;
      data: Negotiation;
    }>(`/negotiations/${id}/submit`);
    return response.data;
  },

  /**
   * Cancel a negotiation
   */
  cancelNegotiation: async (id: number) => {
    const response = await apiClient.post<{
      success: boolean;
      data: Negotiation;
    }>(`/negotiations/${id}/cancel`);
    return response.data;
  },

  /**
   * Generate a contract from a negotiation
   */
  generateContract: async (id: number, templateId?: number) => {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        contract_id: number;
        negotiation: Negotiation;
      };
    }>(`/negotiations/${id}/generate-contract`, {
      template_id: templateId
    });
    return response.data;
  },

  /**
   * Respond to a negotiation item
   */
  respondToItem: async (
    itemId: number, 
    response: {
      status: 'approved' | 'rejected' | 'counter_offered';
      approved_value?: number;
      notes?: string;
    }
  ) => {
    const apiResponse = await apiClient.post<{
      success: boolean;
      data: NegotiationItem;
    }>(`/negotiation-items/${itemId}/respond`, response);
    return apiResponse.data;
  },

  /**
   * Make a counter offer
   */
  counterOffer: async (
    itemId: number,
    counterOffer: {
      approved_value: number;
      notes?: string;
    }
  ) => {
    const response = await apiClient.post<{
      success: boolean;
      data: NegotiationItem;
    }>(`/negotiation-items/${itemId}/counter`, counterOffer);
    return response.data;
  }
}; 