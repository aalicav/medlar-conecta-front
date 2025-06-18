import { api } from '@/lib/api';
import { formatDate } from '@/app/utils/format';

export interface ExtemporaneousNegotiation {
  id: number;
  contract_id: number;
  contract: {
    id: number;
    contract_number: string;
  };
  tuss: {
    id: number;
    code: string;
    description: string;
  };
  requested_value: number;
  approved_value: number | null;
  justification: string;
  approval_notes: string | null;
  rejection_reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  urgency_level: 'low' | 'medium' | 'high';
  requested_by: number;
  approved_by: number | null;
  approved_at: string | null;
  is_requiring_addendum: boolean;
  addendum_included: boolean;
  addendum_number: string | null;
  addendum_date: string | null;
  addendum_notes: string | null;
  addendum_updated_by: number | null;
  created_at: string;
  updated_at: string;
  requestedBy: {
    id: number;
    name: string;
  };
  approvedBy: {
    id: number;
    name: string;
  } | null;
  pricingContract: {
    id: number;
    price: number;
    notes: string;
    start_date: string;
    end_date: string | null;
  } | null;
}

interface GetExtemporaneousNegotiationsParams {
  page?: number;
  per_page?: number;
  status?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}

interface ApiResponse<T> {
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
  const response = await api.get<ApiResponse<ExtemporaneousNegotiation[]>>('/extemporaneous-negotiations', { params });
  return response;
};

/**
 * Obtém os detalhes de uma negociação extemporânea específica
 */
export const getExtemporaneousNegotiation = async (id: number) => {
  const response = await api.get<ApiResponse<ExtemporaneousNegotiation>>(`/extemporaneous-negotiations/${id}`);
  return response;
};

/**
 * Cria uma nova solicitação de negociação extemporânea
 */
export const createExtemporaneousNegotiation = async (data: {
  contract_id: number;
  tuss_id: number;
  requested_value: number;
  justification: string;
  urgency_level?: 'low' | 'medium' | 'high';
}) => {
  const response = await api.post<ApiResponse<ExtemporaneousNegotiation>>('/extemporaneous-negotiations', data);
  return response;
};

/**
 * Aprova uma negociação extemporânea
 */
export const approveExtemporaneousNegotiation = async (id: number, data: {
  approved_value: number;
  approval_notes?: string;
  is_requiring_addendum?: boolean;
}) => {
  const response = await api.post<ApiResponse<ExtemporaneousNegotiation>>(`/extemporaneous-negotiations/${id}/approve`, data);
  return response;
};

/**
 * Rejeita uma negociação extemporânea
 */
export const rejectExtemporaneousNegotiation = async (id: number, data: {
  rejection_reason: string;
}) => {
  const response = await api.post<ApiResponse<ExtemporaneousNegotiation>>(`/extemporaneous-negotiations/${id}/reject`, data);
  return response;
};

/**
 * Marca uma negociação extemporânea como incluída em aditivo contratual
 */
export const markExtemporaneousNegotiationAsAddendumIncluded = async (id: number, data: {
  addendum_number: string;
  addendum_date: string;
  notes?: string;
}) => {
  const response = await api.post<ApiResponse<ExtemporaneousNegotiation>>(`/extemporaneous-negotiations/${id}/mark-as-addendum-included`, data);
  return response;
};

/**
 * Lista as negociações extemporâneas de um contrato específico
 */
export const listExtemporaneousNegotiationsByContract = async (contractId: number) => {
  const response = await api.get<ApiResponse<ExtemporaneousNegotiation[]>>(`/extemporaneous-negotiations/contract/${contractId}`);
  return response;
}; 