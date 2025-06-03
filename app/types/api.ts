export interface ApiResponse<T> {
  data: T;
  message?: string;
  success?: boolean;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export interface ForkGroupItem {
  items: number[];
  name: string;
  description?: string;
}

export const handleApiError = (error: ErrorResponse, defaultMessage: string): void => {
  console.error('API Error:', error);
  
  if (error.errors) {
    // Log validation errors
    Object.entries(error.errors).forEach(([field, messages]) => {
      console.error(`${field}:`, messages.join(', '));
    });
  }
  
  throw new Error(error.message || defaultMessage);
};

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  total: number;
  per_page: number;
  last_page: number;
} 