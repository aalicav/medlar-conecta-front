export interface DataConsent {
  id: number;
  user_id: number;
  consent_type: string;
  consent_given: boolean;
  entity_type?: string;
  entity_id?: number;
  consent_text: string;
  ip_address?: string;
  user_agent?: string;
  consented_at: string;
  revoked_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DataExportRequest {
  id: number;
  user_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requested_at: string;
  processed_at?: string;
  completed_at?: string;
  file_path?: string;
  ip_address?: string;
  user_agent?: string;
  processed_by?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DataDeletionRequest {
  id: number;
  user_id: number;
  reason?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'rejected';
  requested_at: string;
  processed_at?: string;
  completed_at?: string;
  ip_address?: string;
  user_agent?: string;
  processed_by?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PrivacyPolicyInfo {
  policy_version: string;
  last_updated: string;
  consent_types: Array<{
    id: string;
    name: string;
    description: string;
    is_required: boolean;
  }>;
}

export type ConsentType = 
  | 'basic_data_processing' 
  | 'analytics'
  | 'marketing'
  | 'third_party_sharing'
  | 'location_tracking'
  | 'health_data_processing'
  | 'medical_procedures'; 