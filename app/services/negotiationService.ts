// Import the shared API client used across the application
import api from '@/services/api-client';

export type NegotiationStatus = 
  | 'draft'
  | 'pending_commercial'
  | 'pending_financial'
  | 'pending_management'
  | 'pending_legal'
  | 'pending_direction'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'submitted';

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
  cancelled: 'Cancelado',
  submitted: 'Submetido'
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
    return api.post(`/negotiation-items/${itemId}/respond`, data).then(response => response.data);
  },

  /**
   * Make a counter offer
   */
  counterOffer: (itemId: number, data: { 
    counter_value: number; 
    notes?: string; 
  }) => {
    return api.post(`/negotiation-items/${itemId}/counter`, data).then(response => response.data);
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
   * If approved, it will move to the next approval level or mark as fully approved.
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
    // Use different endpoints based on negotiation status
    if (status === 'submitted') {
      return api.post(`${API_BASE_PATH}/${id}/resend-submitted-notifications`).then(response => response.data);
    } else {
      return api.post(`${API_BASE_PATH}/${id}/resend-notifications`).then(response => response.data);
    }
  }
};