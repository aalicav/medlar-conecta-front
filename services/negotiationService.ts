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

interface GetNegotiationsParams {
  status?: NegotiationStatus;
  entity_type?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface NegotiationServiceType {
  getNegotiations: (params: GetNegotiationsParams) => Promise<PaginatedApiResponse<Negotiation>>;
  processApproval: (id: number, data: NegotiationApprovalRequest) => Promise<ApiResponse<Negotiation>>;
  processExternalApproval: (id: number, data: NegotiationApprovalRequest) => Promise<ApiResponse<Negotiation>>;
  forkNegotiation: (id: number, groups: ForkGroupItem[]) => Promise<ApiResponse<Negotiation>>;
  submitForApproval: (id: number) => Promise<ApiResponse<Negotiation>>;
  cancelNegotiation: (id: number) => Promise<ApiResponse<Negotiation>>;
  markAsComplete: (id: number) => Promise<ApiResponse<Negotiation>>;
  markAsPartiallyComplete: (id: number) => Promise<ApiResponse<Negotiation>>;
  startNewCycle: (id: number) => Promise<ApiResponse<Negotiation>>;
}

export interface NegotiationApprovalRequest {
  approved: boolean;
  approval_notes?: string;
  approved_items?: Array<{
    item_id: number;
    approved_value: number;
  }>;
}

class NegotiationService implements NegotiationServiceType {
  async getNegotiations(params: GetNegotiationsParams): Promise<PaginatedApiResponse<Negotiation>> {
    const response = await api.get<PaginatedApiResponse<Negotiation>>('/negotiations', { params });
    return response.data;
  }

  async processApproval(id: number, data: NegotiationApprovalRequest): Promise<ApiResponse<Negotiation>> {
    const response = await api.post<ApiResponse<Negotiation>>(`/negotiations/${id}/process-approval`, data);
    return response.data;
  }

  async processExternalApproval(id: number, data: NegotiationApprovalRequest): Promise<ApiResponse<Negotiation>> {
    const response = await api.post<ApiResponse<Negotiation>>(`/negotiations/${id}/process-external-approval`, data);
    return response.data;
  }

  async forkNegotiation(id: number, groups: ForkGroupItem[]): Promise<ApiResponse<Negotiation>> {
    const response = await api.post<ApiResponse<Negotiation>>(`/negotiations/${id}/fork`, { item_groups: groups });
    return response.data;
  }

  async submitForApproval(id: number): Promise<ApiResponse<Negotiation>> {
    return api.post(`${API_BASE_PATH}/${id}/submit`);
  }

  async cancelNegotiation(id: number): Promise<ApiResponse<Negotiation>> {
    return api.post(`${API_BASE_PATH}/${id}/cancel`);
  }

  async markAsComplete(id: number): Promise<ApiResponse<Negotiation>> {
    return api.post(`${API_BASE_PATH}/${id}/complete`);
  }

  async markAsPartiallyComplete(id: number): Promise<ApiResponse<Negotiation>> {
    return api.post(`${API_BASE_PATH}/${id}/partially-complete`);
  }

  async startNewCycle(id: number): Promise<ApiResponse<Negotiation>> {
    return api.post(`${API_BASE_PATH}/${id}/new-cycle`);
  }
}

export const negotiationService = new NegotiationService(); 