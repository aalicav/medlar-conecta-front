type Role = 'commercial_manager' | 'super_admin' | 'director' | 'plan_admin' | 'professional' | 'clinic_admin';

type NegotiationStatus = 
  | 'draft'
  | 'submitted'
  | 'pending'
  | 'approved'
  | 'complete'
  | 'partially_complete'
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

interface NegotiationItem {
  id: number;
  tuss_id: number;
  proposed_value: number;
  approved_value?: number;
  status: 'pending' | 'approved' | 'rejected' | 'counter_offered';
  notes?: string;
  responded_at?: string;
}

export interface ApprovalHistoryItem {
  id: number;
  level: ApprovalLevel;
  status: 'pending' | 'approved' | 'rejected';
  user_id: number;
  user?: User;
  notes?: string;
  created_at: string;
}

interface Negotiation {
  id: number;
  title: string;
  description?: string;
  status: NegotiationStatus;
  status_label: string;
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
  notes?: string;
  created_at: string;
  updated_at: string;
  negotiation_cycle: number;
  max_cycles_allowed: number;
  is_fork: boolean;
  forked_at?: string;
  fork_count: number;
  parent_negotiation_id?: number;
  approved_at?: string;
  approval_notes?: string;
  rejected_at?: string;
  rejection_notes?: string;
  can_approve: boolean;
  can_submit_for_approval: boolean;
  can_edit: boolean;
  formalization_status?: 'pending_aditivo' | 'formalized' | null;
}

interface ForkGroupItem {
  name: string;
  items: number[];
}

interface NegotiationApprovalRequest {
  approved: boolean;
  approval_notes?: string;
  approved_items?: Array<{
    item_id: number;
    approved_value: number;
  }>;
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

const statusLabels: Record<NegotiationStatus, string> = {
  draft: 'Rascunho',
  submitted: 'Enviado',
  pending: 'Pendente',
  approved: 'Aprovado',
  complete: 'Completo',
  partially_complete: 'Parcialmente Completo',
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

export type {
  Role,
  NegotiationStatus,
  NegotiationItem,
  Negotiation,
  ForkGroupItem,
  NegotiationApprovalRequest
};

export { statusLabels }; 