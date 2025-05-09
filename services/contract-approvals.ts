import { api } from './api';

/**
 * Obtém a lista de contratos no fluxo de aprovação com filtros opcionais
 */
export const getContractsForApproval = async (params: { 
  status?: string; 
  type?: string;
  search?: string;
  page?: number;
  per_page?: number;
}) => {
  return await api.get('/contract-approvals', { params });
};

/**
 * Obtém os detalhes de um contrato específico no fluxo de aprovação
 */
export const getContractApprovalDetails = async (contractId: number) => {
  return await api.get(`/contracts/${contractId}`);
};

/**
 * Obtém o histórico de aprovações de um contrato
 */
export const getContractApprovalHistory = async (contractId: number) => {
  return await api.get(`/contract-approvals/${contractId}/history`);
};

/**
 * Submete um contrato para aprovação
 */
export const submitContractForApproval = async (contractId: number, data: { notes?: string }) => {
  return await api.post(`/contract-approvals/${contractId}/submit`, data);
};

/**
 * Realiza a análise jurídica de um contrato
 */
export const submitLegalReview = async (contractId: number, data: {
  action: 'approve' | 'reject';
  notes: string;
  suggested_changes?: string;
}) => {
  return await api.post(`/contract-approvals/${contractId}/legal-review`, data);
};

/**
 * Realiza a análise comercial de um contrato
 */
export const submitCommercialReview = async (contractId: number, data: {
  action: 'approve' | 'reject';
  notes: string;
}) => {
  return await api.post(`/contract-approvals/${contractId}/commercial-review`, data);
};

/**
 * Realiza a aprovação final pelo diretor
 */
export const submitDirectorApproval = async (contractId: number, data: {
  action: 'approve' | 'reject';
  notes: string;
}) => {
  return await api.post(`/contract-approvals/${contractId}/director-approval`, data);
}; 