import { 
  Negotiation, 
  NegotiationStatus, 
  NegotiationItem, 
  CreateNegotiationDto, 
  UpdateNegotiationDto, 
  ApiResponse,
  NegotiationItemStatus
} from '@/types/negotiations';

import api from '@/services/api-client';
import { ApiErrorResponse } from '../types/api';
import { handleApiError } from './types';
import { CreateExceptionDto, ExceptionNegotiation, ExceptionStatus } from '../types/exceptions';

const API_BASE_PATH = '/api';

export type ApprovalAction = 'approve' | 'reject';

interface ItemResponse {
  status: NegotiationItemStatus;
  approved_value?: number;
  notes?: string;
}

export type { 
  Negotiation,
  NegotiationStatus,
  NegotiationItem,
  CreateNegotiationDto,
  UpdateNegotiationDto
};

export interface NegotiationServiceType {
  getNegotiations: (params?: {
    status?: NegotiationStatus;
    entity_type?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) => Promise<ApiResponse<Negotiation[]>>;

  getById: (id: number) => Promise<ApiResponse<Negotiation>>;
  submitForApproval: (id: number) => Promise<ApiResponse<Negotiation>>;
  cancelNegotiation: (id: number) => Promise<ApiResponse<Negotiation>>;
  markAsComplete: (id: number) => Promise<ApiResponse<Negotiation>>;
  markAsPartiallyComplete: (id: number) => Promise<ApiResponse<Negotiation>>;
  startNewCycle: (id: number) => Promise<ApiResponse<Negotiation>>;
  forkNegotiation: (id: number, targetIds: number[]) => Promise<ApiResponse<Negotiation>>;
  processApproval: (id: number, action: ApprovalAction) => Promise<ApiResponse<Negotiation>>;
  resendNotifications: (id: number) => Promise<ApiResponse<any>>;
  generateContract: (id: number) => Promise<ApiResponse<{ contract_id: number }>>;
  update: (id: number, data: any) => Promise<ApiResponse<Negotiation>>;
  respondToItem: (itemId: number, response: { status: NegotiationItemStatus; approved_value?: number; notes?: string }) => Promise<ApiResponse<NegotiationItem>>;
  counterItem: (itemId: number, counterValue: number, notes?: string) => Promise<ApiResponse<NegotiationItem>>;
  createException: (data: CreateExceptionDto) => Promise<ApiResponse<ExceptionNegotiation>>;
  getExceptions: (params?: {
    status?: ExceptionStatus;
    patient_id?: number;
    search?: string;
    page?: number;
    per_page?: number;
  }) => Promise<ApiResponse<ExceptionNegotiation[]>>;
  approveException: (id: number, notes?: string) => Promise<ApiResponse<ExceptionNegotiation>>;
  rejectException: (id: number, notes?: string) => Promise<ApiResponse<ExceptionNegotiation>>;
  markExceptionAsFormalized: (id: number, contract_id: number) => Promise<ApiResponse<ExceptionNegotiation>>;
}

export const negotiationService: NegotiationServiceType = {
  getNegotiations: async (params) => {
    try {
      const response = await api.get(`${API_BASE_PATH}/negotiations`, { params });
      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta,
        message: 'Negociações carregadas com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao carregar negociações');
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`${API_BASE_PATH}/negotiations/${id}`);
      return {
        success: true,
        data: response.data,
        message: 'Negociação carregada com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao carregar negociação');
      throw error;
    }
  },

  submitForApproval: async (id) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/negotiations/${id}/submit`);
      return {
        success: true,
        data: response.data,
        message: 'Negociação enviada para aprovação'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao enviar para aprovação');
      throw error;
    }
  },

  cancelNegotiation: async (id) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/negotiations/${id}/cancel`);
      return {
        success: true,
        data: response.data,
        message: 'Negociação cancelada com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao cancelar negociação');
      throw error;
    }
  },

  markAsComplete: async (id) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/negotiations/${id}/complete`);
      return {
        success: true,
        data: response.data,
        message: 'Negociação marcada como completa'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao marcar como completa');
      throw error;
    }
  },

  markAsPartiallyComplete: async (id) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/negotiations/${id}/partially-complete`);
      return {
        success: true,
        data: response.data,
        message: 'Negociação marcada como parcialmente completa'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao marcar como parcialmente completa');
      throw error;
    }
  },

  startNewCycle: async (id) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/negotiations/${id}/new-cycle`);
      return {
        success: true,
        data: response.data,
        message: 'Novo ciclo iniciado com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao iniciar novo ciclo');
      throw error;
    }
  },

  forkNegotiation: async (id, targetIds) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/negotiations/${id}/fork`, { target_ids: targetIds });
      return {
        success: true,
        data: response.data,
        message: 'Negociação bifurcada com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao bifurcar negociação');
      throw error;
    }
  },

  processApproval: async (id, action) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/negotiations/${id}/process-approval`, { action });
      return {
        success: true,
        data: response.data,
        message: `Negociação ${action === 'approve' ? 'aprovada' : 'rejeitada'} com sucesso`
      };
    } catch (error) {
      handleApiError(error, `Falha ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} negociação`);
      throw error;
    }
  },

  resendNotifications: async (id) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/negotiations/${id}/resend-notifications`);
      return {
        success: true,
        data: response.data,
        message: 'Notificações reenviadas com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao reenviar notificações');
      throw error;
    }
  },

  generateContract: async (id) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/negotiations/${id}/generate-contract`);
      return {
        success: true,
        data: response.data,
        message: 'Contrato gerado com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao gerar contrato');
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      const response = await api.put(`${API_BASE_PATH}/negotiations/${id}`, data);
      return {
        success: true,
        data: response.data,
        message: 'Negociação atualizada com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao atualizar negociação');
      throw error;
    }
  },

  respondToItem: async (itemId: number, response: { status: NegotiationItemStatus; approved_value?: number; notes?: string }) => {
    try {
      const apiResponse = await api.post(`${API_BASE_PATH}/negotiation-items/${itemId}/respond`, response);
      return {
        success: true,
        data: apiResponse.data,
        message: 'Resposta ao item registrada com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao responder ao item');
      throw error;
    }
  },

  counterItem: async (itemId: number, counterValue: number, notes?: string) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/negotiation-items/${itemId}/counter`, {
        counter_value: counterValue,
        notes
      });
      return {
        success: true,
        data: response.data,
        message: 'Contraproposta enviada com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao enviar contraproposta');
      throw error;
    }
  },

  createException: async (data: CreateExceptionDto) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/exceptions`, data);
      return {
        success: true,
        data: response.data,
        message: 'Exceção criada com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao criar exceção');
      throw error;
    }
  },

  getExceptions: async (params?: {
    status?: ExceptionStatus;
    patient_id?: number;
    search?: string;
    page?: number;
    per_page?: number;
  }) => {
    try {
      const response = await api.get(`${API_BASE_PATH}/exceptions`, { params });
      return {
        success: true,
        data: response.data.data,
        meta: response.data.meta,
        message: 'Exceções carregadas com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao carregar exceções');
      throw error;
    }
  },

  approveException: async (id: number, notes?: string) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/exceptions/${id}/approve`, { notes });
      return {
        success: true,
        data: response.data,
        message: 'Exceção aprovada com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao aprovar exceção');
      throw error;
    }
  },

  rejectException: async (id: number, notes?: string) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/exceptions/${id}/reject`, { notes });
      return {
        success: true,
        data: response.data,
        message: 'Exceção rejeitada com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao rejeitar exceção');
      throw error;
    }
  },

  markExceptionAsFormalized: async (id: number, contract_id: number) => {
    try {
      const response = await api.post(`${API_BASE_PATH}/exceptions/${id}/formalize`, { contract_id });
      return {
        success: true,
        data: response.data,
        message: 'Exceção formalizada com sucesso'
      };
    } catch (error) {
      handleApiError(error, 'Falha ao formalizar exceção');
      throw error;
    }
  }
};