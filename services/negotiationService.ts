// Import the shared API client used across the application
import { api } from "@/lib/api";
import { ForkGroupItem } from '../app/services/types';
import type * as Types from "@/types/negotiations";
import type { ApiResponse, PaginatedApiResponse } from '@/app/types/api';

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
 * - 'forked': Negociação bifurcada em múltiplas
 * - 'expired': Negociação expirada
 * - 'pending_approval': Aguardando aprovação
 * - 'pending_director_approval': Aguardando aprovação da direção
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
  | 'cancelled'
  | 'forked'
  | 'expired'
  | 'pending_approval'
  | 'pending_director_approval';

export type NegotiationItemStatus = 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'counter_offered'
  | 'completed';

export type ApprovalLevel = 'approval';

export type ApprovalAction = 'approve' | 'reject';

export type UserRole = 
  | 'commercial_manager'
  | 'financial_manager'
  | 'management_committee'
  | 'legal_manager'
  | 'director'
  | 'super_admin'
  | 'plan_admin'
  | 'professional'
  | 'clinic_admin';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  entity_type: string | null;
  entity_id: number | null;
  is_active: boolean;
  profile_photo_url: string | null;
  roles: string[];
  created_at: string;
  updated_at: string;
}

export interface Tuss {
  id: number;
  code: string;
  description: string;
  name?: string;
}

export interface Negotiable {
  id: number;
  name: string;
  cnpj: string;
  ans_code: string;
  description: string | null;
  municipal_registration: string;
  legal_representative_name: string;
  legal_representative_cpf: string;
  legal_representative_position: string;
  legal_representative_id: number | null;
  operational_representative_name: string;
  operational_representative_cpf: string;
  operational_representative_position: string;
  operational_representative_id: number | null;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  logo: string;
  status: string;
  approved_at: string;
  has_signed_contract: boolean;
  created_at: string;
  updated_at: string;
}

export interface NegotiationItem {
  id: number;
  negotiation_id: number;
  tuss: Tuss;
  proposed_value: string | number;
  approved_value: string | number | null;
  status: NegotiationItemStatus;
  notes: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: {
    id: number;
    name: string;
  };
  updated_by?: {
    id: number;
    name: string;
  };
  can_respond: boolean;
  is_approved: boolean;
  is_rejected: boolean;
  has_counter_offer: boolean;
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
  description: string | null;
  status: NegotiationStatus;
  status_label: string;
  start_date: string;
  end_date: string;
  total_value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  negotiation_cycle: number;
  max_cycles_allowed: number;
  is_fork: number | boolean;
  forked_at: string | null;
  fork_count: number;
  parent_negotiation_id: number | null;
  negotiable_type: string;
  negotiable_id: number;
  negotiable: Negotiable;
  creator: User;
  items: NegotiationItem[];
  approved_at: string | null;
  approval_notes: string | null;
  rejected_at: string | null;
  rejection_notes: string | null;
  can_approve: boolean;
  can_submit_for_approval: boolean;
  can_edit: boolean;
  approval_level?: string | null;
  approved_by?: number | null;
  rejected_by?: number | null;
  completed_at?: string | null;
  external_approval_notes?: string | null;
  external_approved_at?: string | null;
  external_approved_by?: number | null;
  external_rejection_notes?: string | null;
  external_rejected_at?: string | null;
  external_rejected_by?: number | null;
  approved_by_director_id?: number | null;
  director_approval_date?: string | null;
  director_approval_notes?: string | null;
  formalization_status?: 'pending_aditivo' | 'formalized' | null;
  approval_history?: ApprovalHistoryItem[];
  forked_negotiations?: Negotiation[];
}

export type CreateNegotiationDto = {
  entity_type: string;  // App\Models\HealthPlan, App\Models\Professional, App\Models\Clinic
  entity_id: number;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  notes?: string;
  status?: NegotiationStatus;
  items: {
    tuss_id: number;
    proposed_value: number;
    status?: NegotiationItemStatus;
    approved_value?: number;
    notes?: string;
    counter_value?: number;
    counter_notes?: string;
    medical_specialty_id?: number;
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
    medical_specialty_id?: number;
  }[];
}>;

const API_BASE_PATH = "/negotiations";

// Nome mais amigável para os status
export const negotiationStatusLabels = {
  draft: 'Rascunho',
  submitted: 'Enviado',
  pending: 'Pendente',
  complete: 'Completo',
  partially_complete: 'Parcialmente Completo',
  approved: 'Aprovado',
  partially_approved: 'Parcialmente Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
  forked: 'Negociação bifurcada',
  expired: 'Negociação expirada',
  pending_approval: 'Aguardando aprovação',
  pending_director_approval: 'Aguardando aprovação da direção'
} as const;

export const negotiationItemStatusLabels = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  counter_offered: 'Contra-proposta',
  completed: 'Completo'
} as const;

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
  cancelled: 'default',
  forked: 'geekblue',
  expired: 'geekblue',
  pending_approval: 'warning',
  pending_director_approval: 'warning'
};

export const negotiationItemStatusColors = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  counter_offered: 'geekblue',
  completed: 'geekblue'
};

export const approvalLevelLabels: Record<ApprovalLevel, string> = {
  approval: 'Aprovação'
};

export interface GetNegotiationsParams {
  status?: NegotiationStatus;
  entity_type?: string;
  entity_id?: number;
  search?: string;
  page?: number;
  per_page?: number;
  sort_field?: string;
  sort_order?: 'asc' | 'desc';
}

export interface NegotiationServiceType {
  getNegotiations: (params?: GetNegotiationsParams) => Promise<PaginatedApiResponse<Negotiation>>;
  getById: (id: number) => Promise<ApiResponse<Negotiation>>;
  create: (data: CreateNegotiationDto) => Promise<ApiResponse<Negotiation>>;
  update: (id: number, data: UpdateNegotiationDto) => Promise<ApiResponse<Negotiation>>;
  submit: (id: number) => Promise<ApiResponse<Negotiation>>;
  submitForApproval: (id: number) => Promise<ApiResponse<Negotiation>>;
  submitForDirectorApproval: (id: number) => Promise<ApiResponse<Negotiation>>;
  processApproval: (id: number, data: NegotiationApprovalRequest) => Promise<ApiResponse<Negotiation>>;
  directorApprove: (id: number, data: NegotiationApprovalRequest) => Promise<ApiResponse<Negotiation>>;
  processExternalApproval: (id: number, data: NegotiationApprovalRequest) => Promise<ApiResponse<Negotiation>>;
  respondToItem: (itemId: number, data: any) => Promise<ApiResponse<NegotiationItem>>;
  counterItem: (itemId: number, data: any) => Promise<ApiResponse<NegotiationItem>>;
  batchCounterOffer: (id: number, data: any) => Promise<ApiResponse<Negotiation>>;
  forkNegotiation: (id: number, groups: ForkGroupItem[]) => Promise<ApiResponse<Negotiation>>;
  cancelNegotiation: (id: number) => Promise<ApiResponse<Negotiation>>;
  markAsComplete: (id: number, data?: any) => Promise<ApiResponse<Negotiation>>;
  markAsPartiallyComplete: (id: number, data?: any) => Promise<ApiResponse<Negotiation>>;
  startNewCycle: (id: number) => Promise<ApiResponse<Negotiation>>;
  rollbackStatus: (id: number, data: any) => Promise<ApiResponse<Negotiation>>;
  resendNotifications: (id: number) => Promise<ApiResponse<any>>;
  generateContract: (id: number) => Promise<ApiResponse<{ contract_id: number }>>;
  markAsFormalized: (id: number) => Promise<ApiResponse<Negotiation>>;
  getApprovalHistory: (id: number) => Promise<ApiResponse<ApprovalHistoryItem[]>>;
}

export interface NegotiationApprovalRequest {
  approved: boolean;
  approval_notes?: string;
  approved_items?: Array<{
    item_id: number;
    approved_value: number;
  }>;
}

export const negotiationService = {
  getNegotiations: async (params?: GetNegotiationsParams): Promise<PaginatedApiResponse<Negotiation>> => {
    try {
      const response = await api.get('/negotiations', { params });
      return {
        data: response.data.data,
        meta: {
          current_page: response.data.meta.current_page,
          last_page: response.data.meta.last_page,
          per_page: response.data.meta.per_page,
          total: response.data.meta.total
        }
      };
    } catch (error) {
      console.error('Error fetching negotiations:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.get(`/negotiations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching negotiation:', error);
      throw error;
    }
  },

  submitForApproval: async (id: number): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`/negotiations/${id}/submit`);
      return response.data;
    } catch (error) {
      console.error('Error submitting negotiation for approval:', error);
      throw error;
    }
  },

  cancelNegotiation: async (id: number): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`/negotiations/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error canceling negotiation:', error);
      throw error;
    }
  },

  markAsComplete: async (id: number): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`/negotiations/${id}/mark-complete`);
      return response.data;
    } catch (error) {
      console.error('Error marking negotiation as complete:', error);
      throw error;
    }
  },

  markAsPartiallyComplete: async (id: number): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`/negotiations/${id}/partially-complete`);
      return response.data;
    } catch (error) {
      console.error('Error marking negotiation as partially complete:', error);
      throw error;
    }
  },

  startNewCycle: async (id: number): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`/negotiations/${id}/start-new-cycle`);
      return response.data;
    } catch (error) {
      console.error('Error starting new negotiation cycle:', error);
      throw error;
    }
  },

  forkNegotiation: async (id: number, targetIds: number[]): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`/negotiations/${id}/fork`, { target_ids: targetIds });
      return response.data;
    } catch (error) {
      console.error('Error forking negotiation:', error);
      throw error;
    }
  },

  processApproval: async (id: number, data: NegotiationApprovalRequest): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`/negotiations/${id}/process-approval`, data);
      return response.data;
    } catch (error) {
      console.error('Error processing negotiation approval:', error);
      throw error;
    }
  },

  resendNotifications: async (id: number): Promise<ApiResponse<any>> => {
    try {
      const response = await api.post(`/negotiations/${id}/resend-notifications`);
      return response.data;
    } catch (error) {
      console.error('Error resending notifications:', error);
      throw error;
    }
  },

  generateContract: async (id: number): Promise<ApiResponse<{ contract_id: number }>> => {
    try {
      const response = await api.post(`/negotiations/${id}/generate-contract`);
      return response.data;
    } catch (error) {
      console.error('Error generating contract:', error);
      throw error;
    }
  },

  update: async (id: number, data: any): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.put(`/negotiations/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating negotiation:', error);
      throw error;
    }
  },

  respondToItem: async (itemId: number, response: { status: NegotiationItemStatus; approved_value?: number; notes?: string }): Promise<ApiResponse<NegotiationItem>> => {
    try {
      const apiResponse = await api.post(`/negotiation-items/${itemId}/respond`, response);
      return apiResponse.data;
    } catch (error) {
      console.error('Error responding to negotiation item:', error);
      throw error;
    }
  },

  counterItem: async (itemId: number, counterValue: number, notes?: string): Promise<ApiResponse<NegotiationItem>> => {
    try {
      const response = await api.post(`/negotiation-items/${itemId}/counter`, {
        counter_value: counterValue,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error counter offering negotiation item:', error);
      throw error;
    }
  },

  batchCounterOffer: async (id: number, data: any): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`/negotiations/${id}/batch-counter-offer`, data);
      return response.data;
    } catch (error) {
      console.error('Error batch counter offering negotiation:', error);
      throw error;
    }
  },

  submit: async (id: number): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`/negotiations/${id}/submit`);
      return response.data;
    } catch (error) {
      console.error('Error submitting negotiation:', error);
      throw error;
    }
  },

  submitForDirectorApproval: async (id: number): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`/negotiations/${id}/submit-director-approval`);
      return response.data;
    } catch (error) {
      console.error('Error submitting negotiation for director approval:', error);
      throw error;
    }
  },

  directorApprove: async (id: number, data: NegotiationApprovalRequest): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`/negotiations/${id}/director-approve`, data);
      return response.data;
    } catch (error) {
      console.error('Error processing director approval:', error);
      throw error;
    }
  },

  processExternalApproval: async (id: number, data: NegotiationApprovalRequest): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`/negotiations/${id}/process-external-approval`, data);
      return response.data;
    } catch (error) {
      console.error('Error processing external approval:', error);
      throw error;
    }
  },

  rollbackStatus: async (id: number, data: any): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`/negotiations/${id}/rollback-status`, data);
      return response.data;
    } catch (error) {
      console.error('Error rolling back negotiation status:', error);
      throw error;
    }
  },

  markAsFormalized: async (id: number): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post(`/negotiations/${id}/mark-formalized`);
      return response.data;
    } catch (error) {
      console.error('Error marking negotiation as formalized:', error);
      throw error;
    }
  },

  getApprovalHistory: async (id: number): Promise<ApiResponse<ApprovalHistoryItem[]>> => {
    try {
      const response = await api.get(`/negotiations/${id}/approval-history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching approval history:', error);
      throw error;
    }
  },

  create: async (data: CreateNegotiationDto): Promise<ApiResponse<Negotiation>> => {
    try {
      const response = await api.post('/negotiations', data);
      return response.data;
    } catch (error) {
      console.error('Error creating negotiation:', error);
      throw error;
    }
  }
}; 