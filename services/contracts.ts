import { PaginatedResponse } from '@/app/types/api';
import axiosInstance from './api-client';
import { ApiResponse } from './resource-service';


export interface Contract {
  id: number;
  contract_number: string;
  contractable_id: number;
  contractable_type: string;
  contractable?: {
    id: number;
    name: string;
    [key: string]: any;
  };
  type: 'health_plan' | 'clinic' | 'professional';
  template_id: number;
  template_data: Record<string, any>;
  start_date: string;
  end_date: string | null;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  file_path: string;
  is_signed: boolean;
  signed_at: string | null;
  signature_ip: string | null;
  signature_token: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface ContractFormData {
  template_id: number;
  contractable_id: number;
  contractable_type: string;
  start_date: string;
  end_date?: string;
  template_data: Record<string, any>;
}

// Get contracts with pagination and filtering
export const getContracts = async (
  page = 1,
  type?: string,
  status?: string,
  signed?: boolean,
  search?: string
): Promise<ApiResponse<PaginatedResponse<Contract>>> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  
  if (type) {
    params.append('type', type);
  }
  
  if (status) {
    params.append('status', status);
  }
  
  if (signed !== undefined) {
    params.append('signed', signed ? 'true' : 'false');
  }
  
  if (search) {
    params.append('search', search);
  }

  const response = await axiosInstance.get(`/contracts?${params.toString()}`);
  return response.data;
};

// Get a single contract by ID
export const getContract = async (id: number): Promise<ApiResponse<Contract>> => {
  const response = await axiosInstance.get(`/contracts/${id}`);
  return response.data;
};

// Generate a new contract
export const generateContract = async (
  contractData: ContractFormData
): Promise<ApiResponse<Contract>> => {
  try {
    const response = await axiosInstance.post('/contracts/generate', contractData);
    return response.data;
  } catch (error) {
    console.error("Failed to generate contract:", error);
    return {
      status: 'error',
      message: 'Failed to generate contract',
      data: null as any
    };
  }
};

// Regenerate an existing contract with updated data
export const regenerateContract = async (
  id: number,
  contractData: Partial<ContractFormData>
): Promise<ApiResponse<Contract>> => {
  try {
    const response = await axiosInstance.post(`/contracts/${id}/regenerate`, contractData);
    return response.data;
  } catch (error) {
    console.error("Failed to regenerate contract:", error);
    return {
      status: 'error',
      message: 'Failed to regenerate contract',
      data: null as any
    };
  }
};

// Sign a contract
export const signContract = async (
  id: number, 
  signatureToken?: string
): Promise<ApiResponse<Contract>> => {
  try {
    const data = signatureToken ? { signature_token: signatureToken } : {};
    const response = await axiosInstance.post(`/contracts/${id}/sign`, data);
    return response.data;
  } catch (error) {
    console.error("Failed to sign contract:", error);
    return {
      status: 'error',
      message: 'Failed to sign contract',
      data: null as any
    };
  }
};

// Download a contract file
export const downloadContract = async (id: number): Promise<Blob> => {
  const response = await axiosInstance.get(`/contracts/${id}/download`, {
    responseType: 'blob'
  });
  return response.data;
};

// Get contract preview data
export const previewContract = async (
  templateId: number,
  data: Record<string, any>
): Promise<ApiResponse<{content: string}>> => {
  const response = await axiosInstance.post(`/contract-templates/${templateId}/preview`, { data });
  return response.data;
};

// Entity interface
export interface Entity {
  id: number;
  name: string;
  email?: string;
  [key: string]: any;
}

/**
 * Search entities (health plans, clinics, professionals) by name
 */
export const searchEntities = async (entity_type: 'health_plan' | 'clinic' | 'professional', query: string): Promise<ApiResponse<Entity[]>> => {
  try {
    // Map the entity types to their respective API endpoints
    const endpointMap = {
      'health_plan': '/health-plans',
      'clinic': '/clinics',
      'professional': '/professionals'
    };
    
    // Use the existing entity listing endpoints with search parameter
    const response = await axiosInstance.get(`${endpointMap[entity_type]}?search=${encodeURIComponent(query)}`);
    
    console.log("Search response:", response.data);
    
    // Check if we have a valid response with data
    if (response.data && (response.data.data || response.data.status === 'success')) {
      // Extract the correct data array - might be in data.data for paginated results
      // or directly in data for non-paginated results
      const items = response.data.data?.data || response.data.data || [];
      
      console.log("Extracted items:", items);
      
      // Transform to consistent format
      return {
        status: 'success',
        data: Array.isArray(items) ? items.map((item: any) => ({
          id: item.id,
          name: item.name,
          email: item.email || '',
          // Include other relevant fields
          ...item
        })) : [],
        message: ''
      };
    }
    
    // Fallback in case of unexpected format
    return {
      status: "error",
      message: "Unexpected response format",
      data: []
    };
  } catch (error) {
    console.error(`Failed to search ${entity_type}:`, error);
    return {
      status: "error",
      message: `Failed to search ${entity_type}`,
      data: [],
    };
  }
};

/**
 * Get entity data for auto-filling template fields
 */
export const getEntityData = async (entity_type: 'health_plan' | 'clinic' | 'professional', entity_id: number): Promise<ApiResponse<{template_data: Record<string, string>}>> => {
  try {
    // Map the entity types to their respective API endpoints
    const endpointMap = {
      'health_plan': '/health-plans',
      'clinic': '/clinics',
      'professional': '/professionals'
    };
    
    // Use the existing entity detail endpoints
    const response = await axiosInstance.get(`${endpointMap[entity_type]}/${entity_id}`);
    
    if (response.data && response.data.status === 'success') {
      const entity = response.data.data;
      
      // Transform the entity data into template data
      const templateData: Record<string, string> = {};
      
      // Common fields for all entity types
      if (entity.name) templateData['entity_name'] = entity.name;
      if (entity.email) templateData['entity_email'] = entity.email;
      if (entity.phone) templateData['entity_phone'] = entity.phone;
      if (entity.address) templateData['entity_address'] = entity.address;
      
      // Entity-specific fields
      if (entity_type === 'health_plan') {
        if (entity.ans_code) templateData['entity_ans_code'] = entity.ans_code;
        if (entity.cnpj) templateData['entity_cnpj'] = entity.cnpj;
      } else if (entity_type === 'clinic') {
        if (entity.cnpj) templateData['entity_cnpj'] = entity.cnpj;
        if (entity.technical_director) templateData['entity_technical_director'] = entity.technical_director;
      } else if (entity_type === 'professional') {
        if (entity.crm) templateData['entity_crm'] = entity.crm;
        if (entity.cpf) templateData['entity_cpf'] = entity.cpf;
        if (entity.specialty) templateData['entity_specialty'] = entity.specialty;
      }
      
      return {
        status: 'success',
        data: {
          template_data: templateData
        },
        message: ''
      };
    }
    
    return {
      status: 'error',
      message: 'Failed to get entity data',
      data: { template_data: {} }
    };
  } catch (error) {
    console.error(`Failed to get ${entity_type} data:`, error);
    return {
      status: "error",
      message: `Failed to get ${entity_type} data`,
      data: { template_data: {} },
    };
  }
}; 