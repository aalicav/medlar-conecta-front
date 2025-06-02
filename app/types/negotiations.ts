export type NegotiationStatus = 
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'pending_approval'
  | 'pending_director_approval'
  | 'approved'
  | 'complete'
  | 'partially_complete'
  | 'partially_approved'
  | 'rejected'
  | 'cancelled'
  | 'forked'
  | 'expired';

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
  permissions?: string[];
}

export interface TussProcedure {
  id: number;
  code: string;
  name: string;
  description: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface NegotiationItem {
  id: number;
  negotiation_id: number;
  tuss: TussProcedure;
  tuss_id: number;
  proposed_value: number;
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
  description: string | undefined;
  status: NegotiationStatus;
  negotiable_type: string;
  negotiable_id: number;
  negotiable: {
    id: number;
    name: string;
    [key: string]: any;
  };
  creator_id: number;
  creator: {
    id: number;
    name: string;
    [key: string]: any;
  };
  items: NegotiationItem[];
  start_date: string;
  end_date: string;
  total_value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  negotiation_cycle: number;
  max_cycles_allowed: number;
  is_fork: boolean;
  forked_at: string | null;
  fork_count: number;
  parent_negotiation_id: number | null;
  approved_at: string | null;
  approval_notes: string | null;
  rejected_at: string | null;
  rejection_notes: string | null;
  can_approve: boolean;
  can_submit_for_approval: boolean;
  can_edit: boolean;
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

// Nome mais amigável para os status
export const negotiationStatusLabels: Record<NegotiationStatus, string> = {
  draft: 'Rascunho',
  submitted: 'Enviado',
  pending: 'Pendente',
  pending_approval: 'Aguardando Aprovação',
  pending_director_approval: 'Aguardando Aprovação do Diretor',
  complete: 'Completo',
  partially_complete: 'Parcialmente Completo',
  approved: 'Aprovado',
  partially_approved: 'Parcialmente Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
  forked: 'Bifurcado',
  expired: 'Expirado'
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

export interface ItemResponse {
  status: NegotiationItemStatus;
  approved_value?: number;
  notes?: string;
} 