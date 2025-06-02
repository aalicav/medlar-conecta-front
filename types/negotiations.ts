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

export interface Tuss {
  id: number;
  code: string;
  description: string;
}

export interface NegotiationItem {
  id: number;
  tuss: Tuss;
  proposed_value: number;
  approved_value: number | null;
  status: NegotiationItemStatus;
  notes?: string;
  created_at: string;
  updated_by: {
    id: number;
    name: string;
  };
}

export interface Negotiation {
  id: number;
  establishment: {
    id: number;
    name: string;
    type: 'professional' | 'clinic';
  };
  items: {
    id: number;
    tuss: Tuss;
    proposed_value: number;
    approved_value: number | null;
    status: NegotiationItemStatus;
    notes?: string;
  }[];
  status: NegotiationStatus;
  created_at: string;
  updated_at: string;
  created_by: {
    id: number;
    name: string;
  };
  approved_by?: {
    id: number;
    name: string;
  };
  approved_at?: string;
}

export interface CreateNegotiationDto {
  establishment_id: number;
  items: {
    tuss_id: number;
    proposed_value: number;
    notes?: string;
  }[];
}

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

export interface ApiResponse<T> {
  data: T;
  message?: string;
} 