import { api } from '@/lib/api';

export interface MedicalSpecialty {
  id: number;
  name: string;
  description?: string;
  tuss_code: string;
  tuss_description: string;
  active: boolean;
  negotiable: boolean;
  city?: string;
  state?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateMedicalSpecialtyData {
  name: string;
  active: boolean;
}

export interface UpdateMedicalSpecialtyData extends Partial<CreateMedicalSpecialtyData> {}

export const specialtyService = {
  list: async (params?: { search?: string; active?: boolean; per_page?: number }): Promise<{data?:MedicalSpecialty[]}> => {
    try {
      const response = await api.get('/medical-specialties', { params });
      
      // Tratar diferentes formatos de resposta da API
      if (response?.data?.data?.data) {
        // API retorna dados paginados
        return { data: response.data.data.data };
      } else if (response?.data?.data) {
        // API retorna dados diretos
        return { data: response.data.data };
      } else if (Array.isArray(response?.data)) {
        // API retorna array direto
        return { data: response.data };
      }
      
      return { data: [] };
    } catch (error) {
      console.error('Error fetching medical specialties:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<MedicalSpecialty> => {
    try {
      const response = await api.get(`/medical-specialties/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching medical specialty:', error);
      throw error;
    }
  },

  create: async (data: CreateMedicalSpecialtyData): Promise<MedicalSpecialty> => {
    try {
      const response = await api.post('/medical-specialties', data);
      return response.data;
    } catch (error) {
      console.error('Error creating medical specialty:', error);
      throw error;
    }
  },

  update: async (id: number, data: UpdateMedicalSpecialtyData): Promise<MedicalSpecialty> => {
    try {
      const response = await api.put(`/medical-specialties/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating medical specialty:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await api.delete(`/medical-specialties/${id}`);
    } catch (error) {
      console.error('Error deleting medical specialty:', error);
      throw error;
    }
  }
}; 