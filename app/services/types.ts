import { toast } from "@/hooks/use-toast";

// Error message translator for negotiation-related errors
const negotiationErrorMessages: Record<string, string> = {
  // Status-related errors
  'Only draft negotiations can be updated': 'Apenas negociações em rascunho podem ser atualizadas',
  'Only draft negotiations can be submitted': 'Apenas negociações em rascunho podem ser enviadas',
  'Cannot submit a negotiation without items': 'Não é possível enviar uma negociação sem itens',
  'Failed to submit negotiation': 'Falha ao enviar negociação',
  'Only submitted negotiations can have notifications resent': 'Apenas negociações enviadas podem ter notificações reenviadas',
  'Can only respond to items in a submitted negotiation': 'Apenas itens de negociações enviadas podem receber respostas',
  'Can only propose values for items in a submitted negotiation': 'Apenas itens de negociações enviadas podem receber contrapropostas',
  'Can only counter items in a submitted negotiation': 'Apenas itens de negociações enviadas podem receber contrapropostas',
  'This negotiation is not ready for counter offer responses': 'Esta negociação não está pronta para respostas de contraoferta',
  'This item does not have a counter offer': 'Este item não possui uma contraoferta',
  
  // Entity-related errors
  'Entity not found': 'Entidade não encontrada',
  
  // Item-related errors
  'One or more items do not belong to this negotiation': 'Um ou mais itens não pertencem a esta negociação',
  'One or more items are not in pending status': 'Um ou mais itens não estão com status pendente',
  'Failed to respond to item': 'Falha ao responder ao item',
  'Failed to submit proposal': 'Falha ao enviar proposta',
  'Failed to submit batch counter offers': 'Falha ao enviar contrapropostas em lote',

  // Approval-related errors
  'Esta negociação não está pendente de aprovação': 'Esta negociação não está pendente de aprovação',
  'Você não tem permissão para aprovar negociações': 'Você não tem permissão para aprovar negociações',
  'Erro ao processar aprovação': 'Erro ao processar aprovação',
  
  // Fork-related errors
  'Apenas negociações em andamento podem ser bifurcadas': 'Apenas negociações em andamento podem ser bifurcadas',
  'Falha ao bifurcar negociação': 'Falha ao bifurcar negociação',
  
  // Cycle-related errors
  'Apenas negociações rejeitadas ou parcialmente aprovadas podem iniciar um novo ciclo': 'Apenas negociações rejeitadas ou parcialmente aprovadas podem iniciar um novo ciclo',
  'Esta negociação atingiu o limite máximo de ciclos permitidos': 'Esta negociação atingiu o limite máximo de ciclos permitidos',
  'Falha ao iniciar novo ciclo de negociação': 'Falha ao iniciar novo ciclo de negociação',
  
  // Rollback-related errors
  'Rollback não permitido para este status': 'Reversão não permitida para este status',
  'Falha ao reverter status da negociação': 'Falha ao reverter status da negociação',
  
  // General errors
  'Negotiation not found': 'Negociação não encontrada',
  'Failed to create negotiation': 'Falha ao criar negociação',
  'Failed to update negotiation': 'Falha ao atualizar negociação',
  'Failed to resend notifications': 'Falha ao reenviar notificações',
  'Failed to generate contract': 'Falha ao gerar contrato',
  'Failed to mark negotiation as complete': 'Falha ao marcar negociação como completa',
  'Failed to mark negotiation as partially complete': 'Falha ao marcar negociação como parcialmente completa'
};

// Translate error message if it's known
const translateErrorMessage = (message: string): string => {
  return negotiationErrorMessages[message] || message;
};

/**
 * Interface para uma resposta padrão da API
 */
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success: boolean;
  errors?: Record<string, string[]>;
}

/**
 * Interface para grupos de itens usados na bifurcação de negociação
 */
export interface ForkGroupItem {
  name: string;
  items: number[]; // Array of item IDs to include in this fork
}

/**
 * Extract and translate error message from API error
 */
export const getErrorMessage = (error: any): string => {
  let message = 'Ocorreu um erro desconhecido';
  
  if (error.response?.data?.message) {
    message = error.response.data.message;
  } else if (error.response?.data?.error) {
    message = error.response.data.error;
  } else if (error.message) {
    message = error.message;
  }
  
  return translateErrorMessage(message);
};

/**
 * Função para tratamento de erros da API
 */
export const handleApiError = (error: any, defaultMessage: string = 'Ocorreu um erro'): void => {
  console.error('API Error:', error);
  
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  }
  
  throw new Error(defaultMessage);
};

/**
 * Função para tratamento de erros da API com notificação de toast
 */
export const handleApiErrorWithToast = (error: any, defaultMessage: string = 'Ocorreu um erro'): void => {
  console.error('API Error:', error);
  
  const errorMessage = getErrorMessage(error) || defaultMessage;
  
  // Show toast notification
  toast({
    title: "Erro",
    description: errorMessage,
    variant: "destructive",
  });
  
  throw new Error(errorMessage);
};

/**
 * Função para tratamento de sucesso da API com notificação de toast
 */
export const handleApiSuccessWithToast = (message: string = 'Operação realizada com sucesso'): void => {
  toast({
    title: "Sucesso",
    description: message,
  });
}; 