import { api } from '@/lib/api';

export interface MedicalSpecialty {
  id: number;
  name: string;
  description?: string;
  default_price: number;
  tuss_code: string;
  tuss_description: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const specialtyService = {
  list: async (): Promise<MedicalSpecialty[]> => {
    try {
      const response = await api.get('/medical-specialties');
      return response.data.data;
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
  }
}; 