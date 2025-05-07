import api from "@/services/api-client";

export interface Entity {
  id: number;
  name: string;
  email?: string;
  [key: string]: any;
}

export interface ContractData {
  template_id: number;
  contractable_id: number;
  contractable_type: string;
  start_date: string;
  end_date?: string;
  template_data: Record<string, string>;
}

/**
 * Generate a new contract
 */
export const generateContract = async (data: ContractData) => {
  try {
    const response = await api.post('/api/contracts', data);
    return response.data;
  } catch (error) {
    console.error('Failed to generate contract:', error);
    return {
      status: "error",
      message: "Failed to generate contract",
    };
  }
};

/**
 * Preview a contract without generating it
 */
export const previewContract = async (template_id: number, template_data: Record<string, string>, negotiation_id?: string) => {
  try {
    const response = await api.post('/api/contracts/preview', {
      template_id,
      template_data,
      negotiation_id
    });
    return response.data;
  } catch (error) {
    console.error('Failed to preview contract:', error);
    return {
      status: "error",
      message: "Failed to preview contract",
      data: { html: "" },
    };
  }
};

/**
 * Search entities (health plans, clinics, professionals) by name
 */
export const searchEntities = async (entity_type: 'health_plan' | 'clinic' | 'professional', query: string) => {
  try {
    // Map the entity types to their respective API endpoints
    const endpointMap = {
      'health_plan': '/health-plans',
      'clinic': '/clinics',
      'professional': '/professionals'
    };
    
    // Use the existing entity listing endpoints with search parameter
    const response = await api.get(`${endpointMap[entity_type]}?search=${encodeURIComponent(query)}`);
    
    console.log("Search response for", entity_type, ":", response.data);
    
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
        })) : []
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
export const getEntityData = async (entity_type: 'health_plan' | 'clinic' | 'professional', entity_id: number) => {
  try {
    // Map the entity types to their respective API endpoints
    const endpointMap = {
      'health_plan': '/api/health-plans',
      'clinic': '/api/clinics',
      'professional': '/api/professionals'
    };
    
    // Use the existing entity detail endpoints
    const response = await api.get(`${endpointMap[entity_type]}/${entity_id}`);
    
    if (response.data.status === 'success') {
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
        }
      };
    }
    
    return response.data;
  } catch (error) {
    console.error(`Failed to get ${entity_type} data:`, error);
    return {
      status: "error",
      message: `Failed to get ${entity_type} data`,
      data: { template_data: {} },
    };
  }
};

export async function getContracts(params?: Record<string, any>) {
  try {
    const response = await api.get("/api/contracts", { params });
    return response.data;
  } catch (error) {
    console.error("Failed to get contracts:", error);
    return {
      status: "error",
      message: "Failed to get contracts",
      data: [],
    };
  }
}

export async function getContract(id: number) {
  try {
    const response = await api.get(`/api/contracts/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to get contract ${id}:`, error);
    return {
      status: "error",
      message: `Failed to get contract ${id}`,
      data: null,
    };
  }
}

export async function updateContract(id: number, data: any) {
  try {
    const response = await api.put(`/api/contracts/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Failed to update contract ${id}:`, error);
    return {
      status: "error",
      message: `Failed to update contract ${id}`,
    };
  }
}

export async function signContract(id: number) {
  try {
    const response = await api.post(`/api/contracts/${id}/sign`);
    return response.data;
  } catch (error) {
    console.error(`Failed to sign contract ${id}:`, error);
    return {
      status: "error",
      message: `Failed to sign contract ${id}`,
    };
  }
}

export async function downloadContract(id: number) {
  try {
    const response = await api.get(`/api/contracts/${id}/download`, {
      responseType: "blob",
    });
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contract-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    
    return { status: "success" };
  } catch (error) {
    console.error(`Failed to download contract ${id}:`, error);
    return {
      status: "error",
      message: `Failed to download contract ${id}`,
    };
  }
} 