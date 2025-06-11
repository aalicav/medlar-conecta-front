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

export type ExceptionStatus = 'pending' | 'approved' | 'rejected' | 'formalized';

export interface Tuss {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface NegotiationItem {
  id: number;
  negotiation_id: number;
  tuss: Tuss;
  medical_specialty?: {
    id: number;
    name: string;
    default_price: number;
  };
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
  negotiable: {
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
  };
  creator: {
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
  };
  items: {
    id: number;
    negotiation_id: number;
    tuss: {
      id: number;
      code: string;
      description: string;
    };
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
  }[];
  approved_at: string | null;
  approval_notes: string | null;
  rejected_at: string | null;
  rejection_notes: string | null;
  can_approve: boolean;
  can_submit_for_approval: boolean;
  can_edit: boolean;
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

export interface UpdateNegotiationDto {
  items: {
    id?: number;
    tuss_id: number;
    proposed_value: number;
    notes?: string;
  }[];
}

export interface ApproveNegotiationDto {
  items: {
    id: number;
    approved_value: number;
    notes?: string;
  }[];
}

export interface RejectNegotiationDto {
  reason: string;
}

export interface CreateExceptionDto {
  patient_id: number;
  tuss_id: number;
  proposed_value: number;
  notes?: string;
  urgency_level?: 'low' | 'medium' | 'high';
  justification?: string;
}

export interface ExceptionNegotiation {
  id: number;
  patient_id: number;
  tuss_id: number;
  proposed_value: number;
  approved_value?: number;
  notes?: string;
  urgency_level: 'low' | 'medium' | 'high';
  justification?: string;
  status: ExceptionStatus;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  rejected_at?: string;
  formalized_at?: string;
  contract_id?: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
} 