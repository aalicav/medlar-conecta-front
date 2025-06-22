import { api } from '@/lib/api';
import { formatDate } from '@/app/utils/format';

export interface ExtemporaneousNegotiation {
  id: number;
  negotiable_type: string;
  negotiable_id: number;
  negotiable: {
    id: number;
    name: string;
    cnpj?: string;
  };
  tuss_procedure_id: number;
  tussProcedure: {
    id: number;
    code: string;
    description: string;
  };
  negotiated_price: number;
  justification: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'formalized' | 'cancelled';
  created_by: number;
  approved_by: number | null;
  rejected_by: number | null;
  formalized_by: number | null;
  cancelled_by: number | null;
  approved_at: string | null;
  rejected_at: string | null;
  formalized_at: string | null;
  cancelled_at: string | null;
  contract_id: number | null;
  addendum_number: string | null;
  addendum_signed_at: string | null;
  approval_notes: string | null;
  rejection_notes: string | null;
  formalization_notes: string | null;
  cancellation_notes: string | null;
  solicitation_id: number | null;
  created_at: string;
  updated_at: string;
  createdBy: {
    id: number;
    name: string;
  };
  approvedBy: {
    id: number;
    name: string;
  } | null;
  rejectedBy: {
    id: number;
    name: string;
  } | null;
  formalizedBy: {
    id: number;
    name: string;
  } | null;
  cancelledBy: {
    id: number;
    name: string;
  } | null;
  solicitation?: {
    id: number;
    patient_name: string;
  } | null;
}

interface GetExtemporaneousNegotiationsParams {
  page?: number;
  per_page?: number;
  status?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  entity_type?: string;
  entity_id?: number;
}

interface ApiResponse<T> {
  status: string;
  data: T;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * Obtém a lista de negociações extemporâneas com filtros opcionais
 */
export const getExtemporaneousNegotiations = async (params?: GetExtemporaneousNegotiationsParams) => {
  const response = await api.get<ApiResponse<ExtemporaneousNegotiation[]>>('/negotiations/extemporaneous', { params });
  return response;
};

/**
 * Obtém os detalhes de uma negociação extemporânea específica
 */
export const getExtemporaneousNegotiation = async (id: number) => {
  const response = await api.get<ApiResponse<ExtemporaneousNegotiation>>(`/negotiations/extemporaneous/${id}`);
  return response;
};

/**
 * Cria uma nova negociação extemporânea
 */
export const createExtemporaneousNegotiation = async (data: {
  negotiable_type: string;
  negotiable_id: number;
  tuss_procedure_id: number;
  negotiated_price: number;
  justification: string;
  solicitation_id?: number;
}) => {
  const response = await api.post<ApiResponse<ExtemporaneousNegotiation>>('/negotiations/extemporaneous', data);
  return response;
};

/**
 * Aprova uma negociação extemporânea
 */
export const approveExtemporaneousNegotiation = async (id: number, data: {
  approval_notes?: string;
}) => {
  const response = await api.post<ApiResponse<ExtemporaneousNegotiation>>(`/negotiations/extemporaneous/${id}/approve`, data);
  return response;
};

/**
 * Rejeita uma negociação extemporânea
 */
export const rejectExtemporaneousNegotiation = async (id: number, data: {
  rejection_notes: string;
}) => {
  const response = await api.post<ApiResponse<ExtemporaneousNegotiation>>(`/negotiations/extemporaneous/${id}/reject`, data);
  return response;
};

/**
 * Formaliza uma negociação extemporânea
 */
export const formalizeExtemporaneousNegotiation = async (id: number, data: {
  addendum_number: string;
  formalization_notes?: string;
}) => {
  const response = await api.post<ApiResponse<ExtemporaneousNegotiation>>(`/negotiations/extemporaneous/${id}/formalize`, data);
  return response;
};

/**
 * Cancela uma negociação extemporânea
 */
export const cancelExtemporaneousNegotiation = async (id: number, data: {
  cancellation_notes: string;
}) => {
  const response = await api.post<ApiResponse<ExtemporaneousNegotiation>>(`/negotiations/extemporaneous/${id}/cancel`, data);
  return response;
};

/**
 * Lista as negociações extemporâneas de um contrato específico
 */
export const listExtemporaneousNegotiationsByContract = async (contractId: number) => {
  const response = await api.get<ApiResponse<ExtemporaneousNegotiation[]>>(`/extemporaneous-negotiations/contract/${contractId}`);
  return response;
}; 