export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

export interface ForkGroupItem {
  items: number[];
  title: string;
  description?: string;
}

export const handleApiError = (error: ApiErrorResponse, defaultMessage: string): void => {
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