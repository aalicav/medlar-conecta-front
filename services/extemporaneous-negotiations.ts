import { api } from './api';

/**
 * Obtém a lista de negociações extemporâneas com filtros opcionais
 */
export const getExtemporaneousNegotiations = async (params: {
  status?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  page?: number;
  per_page?: number;
}) => {
  return await api.get('/extemporaneous-negotiations', { params });
};

/**
 * Obtém os detalhes de uma negociação extemporânea específica
 */
export const getExtemporaneousNegotiation = async (id: number) => {
  return await api.get(`/extemporaneous-negotiations/${id}`);
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
  return await api.post('/extemporaneous-negotiations', data);
};

/**
 * Aprova uma negociação extemporânea
 */
export const approveExtemporaneousNegotiation = async (id: number, data: {
  approved_value: number;
  approval_notes?: string;
  is_requiring_addendum?: boolean;
}) => {
  return await api.post(`/extemporaneous-negotiations/${id}/approve`, data);
};

/**
 * Rejeita uma negociação extemporânea
 */
export const rejectExtemporaneousNegotiation = async (id: number, data: {
  rejection_reason: string;
}) => {
  return await api.post(`/extemporaneous-negotiations/${id}/reject`, data);
};

/**
 * Marca uma negociação extemporânea como incluída em aditivo contratual
 */
export const markAsAddendumIncluded = async (id: number, data: {
  addendum_number: string;
  addendum_date: string;
  notes?: string;
}) => {
  return await api.post(`/extemporaneous-negotiations/${id}/addendum`, data);
};

/**
 * Lista as negociações extemporâneas de um contrato específico
 */
export const getNegotiationsByContract = async (contractId: number) => {
  return await api.get(`/extemporaneous-negotiations/contract/${contractId}`);
}; 