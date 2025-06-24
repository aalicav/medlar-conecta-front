export interface Report {
  id: number;
  name: string;
  type: string;
  description: string;
  parameters: Record<string, any>;
  file_format: 'pdf' | 'csv' | 'xlsx';
  is_scheduled: boolean;
  schedule_frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  is_public: boolean;
  created_at: string;
  created_by: number;
  generations: ReportGeneration[];
}

export interface ReportGeneration {
  id: number;
  report_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  file_path?: string;
  completed_at?: string;
  created_at: string;
  error_message?: string;
}

export interface ReportConfig {
  types: {
    [key: string]: {
      name: string;
      description: string;
      filters: ReportFilter[];
    };
  };
  permissions: {
    [key: string]: string[];
  };
}

export interface ReportFilter {
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  label: string;
  options?: Record<string, string>;
  required?: boolean;
  default_value?: any;
}

export interface ReportParameters {
  start_date?: string;
  end_date?: string;
  status?: string;
  city?: string;
  state?: string;
  health_plan_id?: number;
  professional_id?: number;
  clinic_id?: number;
  specialty?: string;
  [key: string]: any;
}

export interface ReportGenerationRequest {
  type: string;
  format: 'pdf' | 'csv' | 'xlsx';
  filters?: ReportParameters;
  name?: string;
  description?: string;
  save_as_report?: boolean;
}

export interface ReportGenerationResponse {
  success: boolean;
  message: string;
  data?: {
    generation: ReportGeneration;
    report?: Report;
    download_url: string;
  };
} 