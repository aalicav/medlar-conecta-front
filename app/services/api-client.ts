import axios from 'axios';
import { toast } from "@/hooks/use-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
 * Axios instance configured for API requests
 */
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    console.group('API Request');
    console.log('URL:', config.url);
    console.log('Method:', config.method?.toUpperCase());
    console.log('Headers:', config.headers);
    if (config.data) {
      console.log('Request Data:', config.data);
    }
    if (config.params) {
      console.log('Query Params:', config.params);
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.groupEnd();
    return config;
  },
  (error) => {
    console.group('Request Error');
    console.error('Error details:', {
      message: error.message,
      config: error.config,
      stack: error.stack
    });
    console.groupEnd();
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    console.group('API Response');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Response Data:', response.data);
    console.groupEnd();
    
    // Show success toast for POST, PUT, PATCH and DELETE operations
    const method = response.config.method?.toUpperCase();
    
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '') && response.status >= 200 && response.status < 300) {
      let successMessage = 'Operação realizada com sucesso';
      
      // Use server response message if available
      if (response.data?.message) {
        successMessage = response.data.message;
      } else {
        // Default messages based on method
        switch(method) {
          case 'POST':
            successMessage = 'Registro criado com sucesso';
            break;
          case 'PUT':
          case 'PATCH':
            successMessage = 'Registro atualizado com sucesso';
            break;
          case 'DELETE':
            successMessage = 'Registro excluído com sucesso';
            break;
        }
      }
      
      toast({
        title: "Sucesso",
        description: successMessage,
      });
    }
    
    return response;
  },
  (error) => {
    console.group('API Error');
    console.error('Error:', error);
    
    if (error.response) {
      console.error('Response Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      const status = error.response.status;
      const data = error.response.data;

      // Handle validation errors (422)
      if (status === 422) {
        console.log('Validation Error:', data);
        if (data?.errors) {
          // Get all validation error messages
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
            .join('\n');
          
          toast({
            title: "Erro de validação",
            description: errorMessages || "Verifique os dados informados",
            variant: "destructive",
          });
        } else if (data?.message) {
          toast({
            title: "Erro de validação",
            description: translateErrorMessage(data.message),
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro de validação",
            description: "Verifique os dados informados e tente novamente",
            variant: "destructive",
          });
        }
      }

      // Handle 401 Unauthorized errors
      if (status === 401) {
        console.log('Authentication Error:', data);
        toast({
          title: "Erro de autenticação",
          description: "Ocorreu um problema com sua autenticação.",
          variant: "destructive",
        });
        
        // Clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login';
      }

      // Handle forbidden errors
      if (status === 403) {
        console.log('Forbidden Error:', data);
        const errorMessage = data?.message ? translateErrorMessage(data.message) : "Você não tem permissão para acessar este recurso.";
        
        toast({
          title: "Acesso negado",
          description: errorMessage,
          variant: "destructive",
        });
      }

      // Handle not found errors
      if (status === 404) {
        console.log('Not Found Error:', data);
        const errorMessage = data?.message ? translateErrorMessage(data.message) : "O recurso solicitado não foi encontrado.";
        
        toast({
          title: "Recurso não encontrado",
          description: errorMessage,
          variant: "destructive",
        });
      }

      // Handle server errors
      if (status >= 500) {
        console.log('Server Error:', data);
        const errorMessage = data?.message ? translateErrorMessage(data.message) : "Ocorreu um erro no servidor. Tente novamente mais tarde.";
        
        toast({
          title: "Erro no servidor",
          description: errorMessage,
          variant: "destructive",
        });
      }
      
      // Handle 400 bad request errors
      if (status === 400) {
        console.log('Bad Request Error:', data);
        const errorMessage = data?.message ? translateErrorMessage(data.message) : "A requisição não pôde ser processada.";
        
        toast({
          title: "Erro na requisição",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } else {
      // Network or other errors
      console.error('Network Error:', {
        message: error.message,
        stack: error.stack
      });
      
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    }
    
    console.groupEnd();
    return Promise.reject(error);
  }
);

export { apiClient };

/**
 * Extract error message from API error and translate it
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

export default apiClient;