// Import the shared API client used across the application
import { api } from "@/lib/api";
import { ForkGroupItem } from '../app/services/types';
import type * as Types from "@/types/negotiations";

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
  approved_value: number | null;
  status: NegotiationItemStatus;
  notes: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: {
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
  approval_history?: ApprovalHistoryItem[];
  forked_negotiations?: Negotiation[];
  formalization_status?: 'pending_aditivo' | 'formalized' | null;
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
  cancelled: 'Cancelado'
} as const;

export const negotiationItemStatusLabels = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  counter_offered: 'Contra-proposta'
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

export type NegotiationServiceType = {
  getEstablishmentNegotiations: (establishmentId: number) => Promise<ApiResponse<Negotiation[]>>;
  getNegotiations: (params: { status?: NegotiationStatus; entity_type?: string; search?: string; page?: number; per_page?: number; }) => Promise<ApiResponse<Negotiation[]>>;
  create: (data: CreateNegotiationDto) => Promise<Negotiation>;
  update: (id: number, data: UpdateNegotiationDto) => Promise<Negotiation>;
  getById: (id: number) => Promise<Negotiation>;
  getTussProcedures: (search: string) => Promise<ApiResponse<Tuss[]>>;
  createException: (data: {
    patient_id: number;
    tuss_id: number;
    proposed_value: number;
    justification: string;
  }) => Promise<Negotiation>;
  getExceptions: () => Promise<ApiResponse<Negotiation[]>>;
  approveException: (id: number) => Promise<Negotiation>;
  rejectException: (id: number) => Promise<Negotiation>;
  submitForApproval: (id: number) => Promise<Negotiation>;
  cancelNegotiation: (id: number) => Promise<Negotiation>;
  generateContract: (id: number) => Promise<ApiResponse<{ contract_id: number }>>;
  processApproval: (id: number, action: 'approve' | 'reject') => Promise<Negotiation>;
  resendNotifications: (id: number) => Promise<ApiResponse<void>>;
  markAsComplete: (id: number) => Promise<Negotiation>;
  markAsPartiallyComplete: (id: number) => Promise<Negotiation>;
  startNewCycle: (negotiationId: number) => Promise<Negotiation>;
  rollbackStatus: (
    negotiationId: number, 
    targetStatus: 'draft' | 'submitted' | 'pending',
    reason: string
  ) => Promise<Negotiation>;
  forkNegotiation: (
    negotiationId: number,
    itemGroups: ForkGroupItem[]
  ) => Promise<ApiResponse<{
    original_negotiation: Negotiation;
    forked_negotiations: Negotiation[];
  }>>;
  respondToItem: (itemId: number, data: {
    status: NegotiationItemStatus;
    approved_value?: number;
    notes?: string;
  }) => Promise<ApiResponse<NegotiationItem>>;
};

export interface ApiResponse<T> {
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export const negotiationService: NegotiationServiceType = {
  getEstablishmentNegotiations: async (establishmentId) => {
    const response = await api.get<Negotiation[]>(`${API_BASE_PATH}/establishment/${establishmentId}`);
    return response;
  },

  getNegotiations: async (params) => {
    const response = await api.get<Negotiation[]>(`${API_BASE_PATH}`, { params });
    return response;
  },

  create: async (data) => {
    const response = await api.post<Negotiation>(API_BASE_PATH, data);
    return response;
  },

  update: async (id, data) => {
    const response = await api.put<Negotiation>(`${API_BASE_PATH}/${id}`, data);
    return response;
  },

  getById: async (id) => {
    const response = await api.get<Negotiation>(`${API_BASE_PATH}/${id}`);
    return response;
  },

  getTussProcedures: async (search) => {
    const response = await api.get<ApiResponse<Tuss[]>>(`/tuss`, { params: { search } });
    return response;
  },

  createException: async (data) => {
    const response = await api.post<Negotiation>(`${API_BASE_PATH}/exceptions`, data);
    return response;
  },

  getExceptions: async () => {
    const response = await api.get<ApiResponse<Negotiation[]>>(`${API_BASE_PATH}/exceptions`);
    return response;
  },

  approveException: async (id) => {
    const response = await api.post<Negotiation>(`${API_BASE_PATH}/exceptions/${id}/approve`);
    return response;
  },

  rejectException: async (id) => {
    const response = await api.post<Negotiation>(`${API_BASE_PATH}/exceptions/${id}/reject`);
    return response;
  },

  submitForApproval: async (id) => {
    const response = await api.post<Negotiation>(`${API_BASE_PATH}/${id}/submit`);
    return response;
  },

  cancelNegotiation: async (id) => {
    const response = await api.post<Negotiation>(`${API_BASE_PATH}/${id}/cancel`);
    return response;
  },

  generateContract: async (id) => {
    const response = await api.post<ApiResponse<{ contract_id: number }>>(`${API_BASE_PATH}/${id}/generate-contract`);
    return response;
  },

  processApproval: async (id, action) => {
    const response = await api.post<Negotiation>(`${API_BASE_PATH}/${id}/process-approval`, { action });
    return response;
  },

  resendNotifications: async (id) => {
    const response = await api.post<ApiResponse<void>>(`${API_BASE_PATH}/${id}/resend-notifications`);
    return response;
  },

  markAsComplete: async (id) => {
    const response = await api.post<Negotiation>(`${API_BASE_PATH}/${id}/mark-complete`);
    return response;
  },

  markAsPartiallyComplete: async (id) => {
    const response = await api.post<Negotiation>(`${API_BASE_PATH}/${id}/mark-partially-complete`);
    return response;
  },

  startNewCycle: async (negotiationId) => {
    const response = await api.post<Negotiation>(`${API_BASE_PATH}/${negotiationId}/cycles`);
    return response;
  },

  rollbackStatus: async (negotiationId, targetStatus, reason) => {
    const response = await api.post<Negotiation>(`${API_BASE_PATH}/${negotiationId}/rollback`, {
      target_status: targetStatus,
      reason
    });
    return response;
  },

  forkNegotiation: async (negotiationId, itemGroups) => {
    const response = await api.post<ApiResponse<{
      original_negotiation: Negotiation;
      forked_negotiations: Negotiation[];
    }>>(`${API_BASE_PATH}/${negotiationId}/fork`, {
      item_groups: itemGroups
    });
    return response;
  },

  respondToItem: async (itemId, data) => {
    const response = await api.post<ApiResponse<NegotiationItem>>(`${API_BASE_PATH}/items/${itemId}/respond`, data);
    return response;
  },
}; 