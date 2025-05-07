import { ApiResponse } from "./resource-service";
import axiosInstance from "./api-client";

export interface ContractTemplate {
  id: number;
  name: string;
  entity_type: 'health_plan' | 'clinic' | 'professional';
  content: string;
  placeholders?: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplatePreview {
  content: string;
}

interface ContractTemplateFormData {
  name: string;
  entity_type: 'health_plan' | 'clinic' | 'professional';
  content: string;
  placeholders?: string[];
  is_active?: boolean;
}

interface PlaceholdersData {
  common: Record<string, string>;
  entity: Record<string, string>;
}

// Get all templates with pagination and filtering
export const getContractTemplates = async (
  page = 1,
  entityType?: string,
  active?: boolean
): Promise<ApiResponse<{data: ContractTemplate[]}>> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  
  if (entityType) {
    params.append('entity_type', entityType);
  }
  
  if (active !== undefined) {
    params.append('active', active ? 'true' : 'false');
  }

  const response = await axiosInstance.get(`/contract-templates?${params.toString()}`);
  return response.data;
};

// Get a single template by ID
export const getContractTemplate = async (id: number): Promise<ApiResponse<ContractTemplate>> => {
  const response = await axiosInstance.get(`/contract-templates/${id}`);
  return response.data;
};

// Create a new template
export const createContractTemplate = async (
  templateData: ContractTemplateFormData
): Promise<ApiResponse<ContractTemplate>> => {
  const response = await axiosInstance.post('/contract-templates', templateData);
  return response.data;
};

// Update an existing template
export const updateContractTemplate = async (
  id: number,
  templateData: Partial<ContractTemplateFormData>
): Promise<ApiResponse<ContractTemplate>> => {
  const response = await axiosInstance.put(`/contract-templates/${id}`, templateData);
  return response.data;
};

// Delete a template
export const deleteContractTemplate = async (id: number): Promise<ApiResponse<null>> => {
  const response = await axiosInstance.delete(`/contract-templates/${id}`);
  return response.data;
};

// Preview a template with data
export const previewContractTemplate = async (
  id: number,
  data: Record<string, string>
): Promise<ApiResponse<TemplatePreview>> => {
  const response = await axiosInstance.post(`/contract-templates/${id}/preview`, { data });
  return response.data;
};

// Get available placeholders by entity type
export const getPlaceholders = async (
  entityType: 'health_plan' | 'clinic' | 'professional'
): Promise<ApiResponse<PlaceholdersData>> => {
  const response = await axiosInstance.get(`/contract-templates/placeholders/${entityType}`);
  return response.data;
};

// Export template to DOCX
export const exportTemplateToDocx = async (
  id: number,
  data: Record<string, string>
): Promise<Blob> => {
  const response = await axiosInstance.post(
    `/contract-templates/${id}/export/docx`,
    { data },
    { responseType: 'blob' }
  );
  return response.data;
};

// Export template to PDF
export const exportTemplateToPdf = async (
  id: number,
  data: Record<string, string>
): Promise<Blob> => {
  const response = await axiosInstance.post(
    `/contract-templates/${id}/export/pdf`,
    { data },
    { responseType: 'blob' }
  );
  return response.data;
}; 