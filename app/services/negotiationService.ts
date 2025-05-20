// Import the shared API client used across the application
import api from '@/services/api-client';
import { ApiResponse, ForkGroupItem, handleApiError } from './types';

/**
 * Status constants with descriptions:
 * 
 * - 'draft': Rascunho inicial da negociação
 * - 'submitted': Enviado para entidade externa (plano, profissional, clínica)
 * - 'pending': Em aprovação interna
 * - 'approved': Aprovado internamente, aguardando veredito da entidade
 * - 'complete': Aprovado externamente (entidade aprovou todos os itens)
 * - 'partially_complete': Parcialmente aprovado externamente (entidade aprovou apenas parte dos itens)
 * - 'partially_approved': Negociação com alguns itens aprovados e outros rejeitados
 * - 'rejected': Rejeitado internamente ou externamente
 * - 'cancelled': Cancelado antes da conclusão
 */
export type NegotiationStatus = 
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'complete'
  | 'partially_complete'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'cancelled';

export type NegotiationItemStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'counter_offered';

export type ApprovalLevel = 'approval';

export type ApprovalAction = 'approve' | 'reject';

export type UserRole = 
  | 'commercial_manager'
  | 'financial_manager'
  | 'management_committee'
  | 'legal_manager'
  | 'director';

export interface User {
  id: number;
  name: string;
  email: string;
}

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

export interface ApprovalHistoryItem {
  id: number;
  level: ApprovalLevel;
  status: 'pending' | 'approve' | 'reject';
  user_id: number;
  user?: User;
  notes?: string;
  created_at: string;
}

export interface Negotiation {
  id: number;
  title: string;
  description?: string;
  negotiable_type: string;
  negotiable_id: number;
  negotiable?: any;
  creator_id: number;
  creator?: User;
  status: NegotiationStatus;
  start_date: string;
  end_date: string;
  notes?: string;
  items: NegotiationItem[];
  created_at: string;
  updated_at: string;
  approved_at?: string;
  current_approval_level?: ApprovalLevel;
  approval_history?: ApprovalHistoryItem[];
  
  // Campos de controle de ciclos
  negotiation_cycle?: number;
  max_cycles_allowed?: number;
  previous_cycles_data?: any[];
  
  // Campos de bifurcação
  is_fork?: boolean;
  forked_at?: string;
  fork_count?: number;
  parent_negotiation_id?: number;
  
  // Relações
  parent_negotiation?: Negotiation;
  forked_negotiations?: Negotiation[];
  status_history?: any[];
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
export const negotiationStatusLabels: Record<string, string> = {
  'draft': 'Rascunho',
  'submitted': 'Enviado',
  'pending': 'Pendente',
  'complete': 'Completo',
  'partially_complete': 'Parcialmente Completo',
  'approved': 'Aprovado',
  'partially_approved': 'Parcialmente Aprovado',
  'rejected': 'Rejeitado',
  'cancelled': 'Cancelado'
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
  partially_complete: 'geekblue',
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
  approval: 'Aprovação'
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
    return api.get(API_BASE_PATH, { params }).then(response => response.data);
  },

  /**
   * Get a specific negotiation
   */
  getNegotiation: (id: number) => {
    return api.get(`${API_BASE_PATH}/${id}`).then(response => response.data);
  },

  /**
   * Create a new negotiation
   */
  createNegotiation: (negotiationData: CreateNegotiationDto) => {
    return api.post(API_BASE_PATH, negotiationData).then(response => response.data);
  },

  /**
   * Update an existing negotiation
   */
  updateNegotiation: (id: number, negotiationData: UpdateNegotiationDto) => {
    return api.put(`${API_BASE_PATH}/${id}`, negotiationData).then(response => response.data);
  },

  /**
   * Delete a negotiation (não implementado no backend)
   */
  deleteNegotiation: (id: number) => {
    throw new Error('Esta funcionalidade não está disponível no backend');
  },

  /**
   * Cancel a negotiation
   */
  cancelNegotiation: (id: number) => {
    return api.post(`${API_BASE_PATH}/${id}/cancel`).then(response => response.data);
  },

  /**
   * Submit a negotiation (legacy method)
   * 
   * This method has been updated to use the new approval workflow endpoints
   * but is kept for backward compatibility with existing code.
   */
  submitNegotiation: (id: number) => {
    return api.post(`${API_BASE_PATH}/${id}/submit-approval`).then(response => response.data);
  },

  /**
   * Submit a negotiation for approval (new workflow)
   * 
   * This starts the multi-step approval workflow:
   * 1. Commercial approval
   * 2. Financial approval
   * 3. Management committee approval
   * 4. Legal approval
   * 5. Director approval
   */
  submitForApproval: (id: number) => {
    return api.post(`${API_BASE_PATH}/${id}/submit`).then(response => response.data);
  },

  /**
   * Generate a contract from a negotiation
   */
  generateContract: (id: number) => {
    return api.post(`${API_BASE_PATH}/${id}/generate-contract`).then(response => response.data);
  },

  /**
   * Respond to a negotiation item
   */
  respondToItem: (itemId: number, data: { 
    status: 'approved' | 'rejected'; 
    approved_value?: number; 
    notes?: string; 
  }) => {
    return api.post(`${API_BASE_PATH}/items/${itemId}/respond`, data).then(response => response.data);
  },

  /**
   * Make a counter offer
   */
  counterOffer: (itemId: number, data: { 
    counter_value: number; 
    notes?: string; 
  }) => {
    return api.post(`${API_BASE_PATH}/items/${itemId}/counter`, data).then(response => response.data);
  },

  /**
   * Make batch counter offers for multiple items at once
   */
  batchCounterOffer: (negotiationId: number, items: { 
    item_id: number;
    counter_value: number; 
    notes?: string;
  }[]) => {
    return api.post(`${API_BASE_PATH}/${negotiationId}/batch-counter`, { items }).then(response => response.data);
  },

  /**
   * Get announcements related to negotiations
   */
  getAnnouncements: () => {
    return api.get(`${API_BASE_PATH}/announcements`).then(response => response.data);
  },

  /**
   * Get TUSS procedures 
   */
  getTussProcedures: async (search?: string) => {
    try {
      // Build search params with more options
      const params: any = {};
      
      if (search) {
        params.search = search;
        // Set a larger per_page to get more results
        params.per_page = 50;
      } else {
        // If no search term, get a default list limited to fewer items
        params.per_page = 20;
      }
      
      console.log('TUSS search params:', params);
      
      const response = await api.get(
        '/tuss',
        { params }
      );
      
      console.log('TUSS API response:', response);
      
      // Handle paginated response format (Laravel standard)
      if (response?.data?.data && Array.isArray(response.data.data)) {
        console.log('TUSS data found, mapping', response.data.data.length, 'items');
        console.log('First TUSS item structure:', JSON.stringify(response.data.data[0], null, 2));
        
        // Map each TUSS item to our expected format
        const mappedData = response.data.data.map((item: any) => {
          const mappedItem = {
            id: item.id,
            code: item.code,
            name: item.description, // Use description as name since the backend is using description field
            description: item.description // Keep the full description
          };
          console.log('TUSS item mapped:', { original: item, mapped: mappedItem });
          return mappedItem;
        });
        
        console.log('Mapped TUSS data:', mappedData);
        
        return {
          success: true,
          data: mappedData
        };
      }
      
      console.log('No TUSS data found or invalid format');
      return { success: false, data: [] };
    } catch (error) {
      console.error('Erro ao buscar procedimentos TUSS:', error);
      return { success: false, data: [] };
    }
  },

  /**
   * Process approval for a negotiation
   * 
   * Used to approve or reject a negotiation at the current approval level.
   * If approved, the negotiation status changes to 'approved' e será necessária uma confirmação 
   * da entidade externa (plano/profissional/clínica) para marcar como completa ou parcialmente completa.
   * If rejected, it will mark the negotiation as rejected.
   */
  processApproval: (id: number, action: ApprovalAction) => {
    return api.post(`${API_BASE_PATH}/${id}/process-approval`, { action }).then(response => response.data);
  },

  /**
   * Resend notifications for a pending negotiation
   * 
   * Used to resend notifications to users who need to approve a negotiation
   * that is currently in a pending status.
   */
  resendNotifications: (id: number, status?: string) => {
    // Use the only endpoint that exists in the backend
    return api.post(`${API_BASE_PATH}/${id}/resend-notifications`).then(response => response.data);
  },

  /**
   * Mark a negotiation as complete
   */
  markAsComplete: (id: number) => {
    return api.post(`${API_BASE_PATH}/${id}/mark-complete`).then(response => response.data);
  },

  /**
   * Mark a negotiation as partially complete
   */
  markAsPartiallyComplete: (id: number) => {
    return api.post(`${API_BASE_PATH}/${id}/mark-partially-complete`).then(response => response.data);
  },

  /**
   * Inicia um novo ciclo de negociação
   */
  startNewCycle: async (negotiationId: number): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`${API_BASE_PATH}/${negotiationId}/cycles`);
      return {
        data: response.data.data,
        message: response.data.message || 'Novo ciclo de negociação iniciado',
        success: true
      };
    } catch (error) {
      handleApiError(error, 'Falha ao iniciar ciclo de negociação');
      throw error;
    }
  },

  /**
   * Reverte o status de uma negociação para um status anterior
   */
  rollbackStatus: async (
    negotiationId: number, 
    targetStatus: 'draft' | 'submitted' | 'pending',
    reason: string
  ): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`${API_BASE_PATH}/${negotiationId}/rollback`, {
        target_status: targetStatus,
        reason
      });
      return {
        data: response.data.data,
        message: response.data.message || 'Status revertido com sucesso',
        success: true
      };
    } catch (error) {
      handleApiError(error, 'Falha ao reverter status da negociação');
      throw error;
    }
  },

  /**
   * Bifurca uma negociação em múltiplas com base nos grupos de itens fornecidos
   */
  forkNegotiation: async (
    negotiationId: number,
    itemGroups: ForkGroupItem[]
  ): Promise<ApiResponse<{original_negotiation: Negotiation, forked_negotiations: Negotiation[]}>> => {
    try {
      const response = await api.post(`${API_BASE_PATH}/${negotiationId}/fork`, {
        item_groups: itemGroups
      });
      return {
        data: response.data,
        message: response.data.message || 'Negociação bifurcada com sucesso',
        success: true
      };
    } catch (error) {
      handleApiError(error, 'Falha ao bifurcar negociação');
      throw error;
    }
  }
}; 