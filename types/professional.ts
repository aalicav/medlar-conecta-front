import { MedicalSpecialty } from '@/services/specialtyService';

export interface Professional {
  id: number;
  name: string;
  email: string;
  phone: string;
  document: string;
  documentType: 'cpf' | 'cnpj';
  clinicId?: string;
  birthDate?: Date;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  website?: string;
  bio?: string;
  avatar?: string;
  active: boolean;
  status: 'active' | 'pending' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface ProfessionalDocument {
  type: string;
  file: File;
  description?: string;
} 