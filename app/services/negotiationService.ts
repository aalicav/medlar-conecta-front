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
  entity_type: string;
  entity_id: number;
}

export type CreateNegotiationDto = Omit<Negotiation, 'id' | 'creator_id' | 'creator' | 'negotiable' | 'created_at' | 'updated_at'> & {
  items: Omit<NegotiationItem, 'id' | 'created_at' | 'updated_at'>[]
};

export type UpdateNegotiationDto = Partial<Omit<Negotiation, 'id' | 'creator_id' | 'creator' | 'negotiable' | 'created_at' | 'updated_at'>> & {
  items?: Partial<Omit<NegotiationItem, 'created_at' | 'updated_at'>>[]
};

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

const API_BASE_PATH = '/negotiations';

export const negotiationService = {
  /**
   * Get list of negotiations
   */
  getNegotiations: async (params?: { 
    entity_type?: string; 
    entity_id?: number; 
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await apiClient.get<{ success: boolean; data: Negotiation[] }>(
      API_BASE_PATH, 
      { params }
    );
    return response.data;
  },

  /**
   * Get a specific negotiation
   */
  getNegotiation: async (id: number, includeItems: boolean = true) => {
    const response = await apiClient.get<{ success: boolean; data: Negotiation }>(
      `${API_BASE_PATH}/${id}`, 
      { params: { include_items: includeItems } }
    );
    return response.data;
  },

  /**
   * Create a new negotiation
   */
  createNegotiation: async (negotiationData: CreateNegotiationDto) => {
    const response = await apiClient.post<{ success: boolean; data: Negotiation }>(
      API_BASE_PATH, 
      negotiationData
    );
    return response.data;
  },

  /**
   * Update an existing negotiation
   */
  updateNegotiation: async (id: number, negotiationData: UpdateNegotiationDto) => {
    const response = await apiClient.put<{ success: boolean; data: Negotiation }>(
      `${API_BASE_PATH}/${id}`, 
      negotiationData
    );
    return response.data;
  },

  /**
   * Delete a negotiation
   */
  deleteNegotiation: async (id: number) => {
    const response = await apiClient.delete<{ success: boolean }>(
      `${API_BASE_PATH}/${id}`
    );
    return response.data;
  },

  /**
   * Change negotiation status
   */
  changeStatus: async (id: number, status: 'draft' | 'pending' | 'approved' | 'rejected') => {
    const response = await apiClient.patch<{ success: boolean; data: Negotiation }>(
      `${API_BASE_PATH}/${id}/status`,
      { status }
    );
    return response.data;
  },

  /**
   * Get TUSS procedures 
   */
  getTussProcedures: async (search?: string) => {
    try {
      const response = await apiClient.get<{ success: boolean; data: { id: number; code: string; name: string }[] }>(
        '/tuss',
        { params: { search } }
      );
      
      // Verificar e garantir a estrutura de dados
      if (response?.data?.success && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data.map((item: any) => ({
            id: item.id || 0,
            code: item.code || '',
            name: item.name || item.description || ''
          }))
        };
      } else if (response?.data) {
        // Caso a API não retorne no formato esperado, tentar adaptar
        const dados = response.data.data || response.data;
        
        if (Array.isArray(dados)) {
          return {
            success: true,
            data: dados.map((item: any) => ({
              id: item.id || 0,
              code: item.code || '',
              name: item.name || item.description || ''
            }))
          };
        }
      }
      
      // Fallback para resposta vazia
      console.error('Formato de resposta inesperado:', response);
      return { success: false, data: [] };
    } catch (error) {
      console.error('Erro ao buscar procedimentos TUSS:', error);
      return { success: false, data: [] };
    }
  },

  /**
   * Submit a negotiation for approval
   */
  submitNegotiation: async (id: number) => {
    const response = await apiClient.post<{
      success: boolean;
      data: Negotiation;
    }>(`${API_BASE_PATH}/${id}/submit`);
    return response.data;
  },

  /**
   * Cancel a negotiation
   */
  cancelNegotiation: async (id: number) => {
    const response = await apiClient.post<{
      success: boolean;
      data: Negotiation;
    }>(`${API_BASE_PATH}/${id}/cancel`);
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
    }>(`${API_BASE_PATH}/${id}/generate-contract`, {
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