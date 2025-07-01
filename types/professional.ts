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
  
  // Campos adicionais do backend
  cpf?: string;
  professional_type?: string;
  professional_id?: number;
  specialty?: string;
  registration_number?: string;
  registration_state?: string;
  clinic_id?: number;
  photo?: string;
  approved_at?: string;
  is_active?: boolean;
  has_signed_contract?: boolean;
  
  // Campos pessoais
  birth_date?: string;
  gender?: string;
  council_type?: string;
  council_number?: string;
  council_state?: string;
  
  // Endereço
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  
  // Relacionamentos
  phones?: Array<{
    id: number;
    number: string;
    country_code: string;
    type: string;
    is_whatsapp: boolean;
    is_primary: boolean;
    formatted_number: string;
    phoneable_type: string;
    phoneable_id: number;
    created_at: string;
    updated_at: string;
  }>;
  
  addresses?: Array<{
    id: number;
    street: string;
    number: string | null;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    postal_code: string;
    latitude: number | null;
    longitude: number | null;
    is_primary: boolean;
    addressable_type: string;
    addressable_id: number;
    created_at: string;
    updated_at: string;
  }>;
  
  documents?: any[];
  approver?: {
    id: number;
    name: string;
  } | null;
  clinic?: any | null;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    entity_type: string | null;
    entity_id: number | null;
    is_active: boolean;
    profile_photo_url: string | null;
    roles: string[];
    created_at: string;
    updated_at: string;
  } | null;
  contract?: any | null;
  parent_clinic?: any | null;
  pricing_contracts?: any[];
  professionals?: any[];
  professionals_count?: number;
  appointments_count?: number;
  branches_count?: number;
}

export interface ProfessionalDocument {
  type: string;
  file: File;
  description?: string;
} 