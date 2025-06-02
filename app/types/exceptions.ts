import { User, TussProcedure } from './negotiations';

export type ExceptionStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'formalized';

export interface Patient {
  id: number;
  name: string;
  // Adicione outros campos necessários do paciente
}

export interface ExceptionNegotiation {
  id: number;
  title: string;
  description: string;
  status: ExceptionStatus;
  patient_id: number;
  patient: any; // TODO: Define Patient type
  creator_id: number;
  creator: any; // TODO: Define User type
  approved_at?: string;
  rejected_at?: string;
  formalized_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExceptionDto {
  title: string;
  description: string;
  patient_id: number;
}

export interface UpdateExceptionDto {
  title?: string;
  description?: string;
  status?: ExceptionStatus;
} 