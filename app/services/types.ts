/**
 * Interface para uma resposta padrão da API
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * Interface para grupos de itens usados na bifurcação de negociação
 */
export interface ForkGroupItem {
  items: number[];
  title: string;
  notes?: string;
}

/**
 * Função para tratamento de erros da API
 */
export function handleApiError(error: any, defaultMessage: string): void {
  console.error(defaultMessage, error);
  
  // Extrai mensagem de erro da resposta, se disponível
  let errorMessage = defaultMessage;
  if (error?.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error?.message) {
    errorMessage = error.message;
  }
  
  throw new Error(errorMessage);
} 