'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, FileText, BarChart3, Receipt, Calendar, Users, Building, TrendingUp, Filter, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateInput } from '@/components/ui/date-input';
import api from '@/services/api-client';
import { useAuth } from '@/contexts/auth-context';

import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

interface Clinic {
  id: number;
  name: string;
  city: string;
  state: string;
}

interface HealthPlan {
  id: number;
  name: string;
}

interface Professional {
  id: number;
  name: string;
  specialty: string;
}

interface ReportFilter {
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  label: string;
  options?: { [key: string]: string };
  required?: boolean;
}

interface ReportConfig {
  types: {
    [key: string]: {
      name: string;
      description: string;
      filters: {
        [key: string]: ReportFilter;
      };
    };
  };
}

interface ReportParameters {
  start_date?: string | undefined;
  end_date?: string | undefined;
  health_plan_id?: number | undefined;
  clinic_id?: number | undefined;
  professional_id?: number | undefined;
  status?: 'pending' | 'scheduled' | 'completed' | 'cancelled' | 'missed' | undefined;
  city?: string | undefined;
  state?: string | undefined;
  include_summary?: boolean;
  payment_type?: string | undefined;
  specialty?: string | undefined;
  [key: string]: any;
}

interface FormData {
  name: string;
  type: 'financial' | 'appointment' | 'performance' | 'custom';
  description: string | undefined;
  parameters: ReportParameters;
  file_format: 'pdf' | 'csv' | 'xlsx';
  is_scheduled: boolean;
  schedule_frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | undefined;
  recipients: string[];
  is_public: boolean;
  is_template: boolean;
  save_as_report?: boolean;
}

// Default form data
const defaultFormData: FormData = {
  name: '',
  type: 'financial',
  description: undefined,
  parameters: {
    start_date: undefined,
    end_date: undefined,
    health_plan_id: undefined,
    clinic_id: undefined,
    professional_id: undefined,
    status: undefined,
    city: undefined,
    state: undefined,
    include_summary: true,
    payment_type: undefined,
    specialty: undefined
  },
  file_format: 'pdf',
  is_scheduled: false,
  schedule_frequency: undefined,
  recipients: [],
  is_public: false,
  is_template: false,
  save_as_report: false
};

const validateFormData = (data: FormData, isPlanAdmin: boolean = false): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields
  if (!data.name?.trim()) {
    errors.push('Nome do relatório é obrigatório');
  }

  if (!data.type) {
    errors.push('Tipo de relatório é obrigatório');
  }

  if (!data.file_format) {
    errors.push('Formato do arquivo é obrigatório');
  }

  // Validate schedule frequency if scheduled
  if (data.is_scheduled && !data.schedule_frequency) {
    errors.push('Frequência de agendamento é obrigatória para relatórios agendados');
  }

  // Validate recipients if any
  if (data.recipients?.length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    data.recipients.forEach((email, index) => {
      if (!emailRegex.test(email)) {
        errors.push(`Formato de e-mail inválido para o destinatário ${index + 1}`);
      }
    });
  }

  // Validate parameters based on report type
  if (data.type === 'financial') {
    if (!data.parameters.start_date) {
      errors.push('Data inicial é obrigatória para relatórios financeiros');
    }
    if (!data.parameters.end_date) {
      errors.push('Data final é obrigatória para relatórios financeiros');
    }
    // Only require health_plan_id for non-plan-admin users
    if (!isPlanAdmin && !data.parameters.health_plan_id) {
      errors.push('Plano de saúde é obrigatório para relatórios financeiros');
    }
  }

  if (data.type === 'appointment') {
    if (!data.parameters.start_date) {
      errors.push('Data inicial é obrigatória para relatórios de agendamentos');
    }
    if (!data.parameters.end_date) {
      errors.push('Data final é obrigatória para relatórios de agendamentos');
    }
  }

  if (data.type === 'performance') {
    if (!data.parameters.start_date) {
      errors.push('Data inicial é obrigatória para relatórios de desempenho');
    }
    if (!data.parameters.end_date) {
      errors.push('Data final é obrigatória para relatórios de desempenho');
    }
    // Only require professional_id or clinic_id for non-plan-admin users
    if (!isPlanAdmin && !data.parameters.professional_id && !data.parameters.clinic_id) {
      errors.push('Profissional ou clínica é obrigatório para relatórios de desempenho');
    }
  }

  // Validate date ranges
  if (data.parameters.start_date && data.parameters.end_date) {
    const start = new Date(data.parameters.start_date);
    const end = new Date(data.parameters.end_date);
    if (end < start) {
      errors.push('A data final não pode ser anterior à data inicial');
    }
  }

  // Log validation results
  console.log('Form data being validated:', data);
  console.log('Is plan admin:', isPlanAdmin);
  if (errors.length > 0) {
    console.log('Validation errors:', errors);
  } else {
    console.log('Validation passed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Client component that uses useSearchParams
const NewReportContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams?.get('type') ?? '';
  const { getUserRole, hasRole, user: authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('report-type');
  
  // Form data state
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  
  // Comum para todos os relatórios
  const [reportType, setReportType] = useState(typeParam || 'financial');
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [scheduleReport, setScheduleReport] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState('monthly');
  const [reportFormat, setReportFormat] = useState('pdf');
  
  // Relatório Financeiro
  const [includeSummary, setIncludeSummary] = useState(true);
  const [healthPlanIdFinancial, setHealthPlanIdFinancial] = useState('');
  
  // Relatório de Agendamentos
  const [appointmentStatus, setAppointmentStatus] = useState('all');
  const [clinicId, setClinicId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [healthPlanIdAppointment, setHealthPlanIdAppointment] = useState('');
  const [cityAppointment, setCityAppointment] = useState('');
  const [stateAppointment, setStateAppointment] = useState('');
  
  // Relatório de Desempenho
  const [professionalIdPerformance, setProfessionalIdPerformance] = useState('');
  const [clinicIdPerformance, setClinicIdPerformance] = useState('');
  const [cityPerformance, setCityPerformance] = useState('');
  const [statePerformance, setStatePerformance] = useState('');

  // Opções para selects
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<Record<string, string[]>>({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [reportConfig, setReportConfig] = useState<ReportConfig | null>(null);

  // Check if user is plan-admin
  const isPlanAdmin = getUserRole() === 'plan_admin';

  // Definir os tipos de relatórios e suas permissões necessárias
  const reportTypes = [
    { 
      value: 'financial', 
      label: 'Financeiro', 
      permission: 'view financial reports',
      icon: Receipt,
      description: 'Visualize receitas, despesas e transações financeiras',
      roles: ['super_admin', 'plan_admin']
    },
    { 
      value: 'appointment', 
      label: 'Agendamentos', 
      permission: 'view appointments',
      icon: Calendar,
      description: 'Acompanhe agendamentos, taxa de comparecimento e cancelamentos',
      roles: ['super_admin', 'plan_admin', 'clinic_admin']
    },
    { 
      value: 'performance', 
      label: 'Desempenho', 
      permission: 'view reports',
      icon: BarChart3,
      description: 'Analise o desempenho dos profissionais e satisfação dos pacientes',
      roles: ['super_admin', 'clinic_admin']
    },
    {
      value: 'custom',
      label: 'Personalizado',
      permission: 'create custom reports',
      icon: FileText,
      description: 'Crie relatórios personalizados com filtros específicos',
      roles: ['super_admin']
    }
  ];

  // Verificar se o usuário tem acesso ao tipo de relatório
  const hasAccessToReportType = (type: string) => {
    const reportType = reportTypes.find(t => t.value === type);
    if (!reportType) return false;

    // Super admin tem acesso a tudo
    if (hasRole('super_admin')) return true;

    // Plan-admin only has access to financial and appointment reports
    if (isPlanAdmin) {
      return type === 'financial' || type === 'appointment';
    }

    // Verifica se o usuário tem uma das roles necessárias
    return hasRole(reportType.roles);
  };

  // Filtrar os tipos de relatórios baseado nas permissões e roles
  const allowedReportTypes = reportTypes.filter(type => hasAccessToReportType(type.value));

  const getDefaultReportName = () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('pt-BR');
    
    const typeLabels = {
      financial: 'Financeiro',
      appointment: 'Agendamentos',
      performance: 'Desempenho'
    };
    
    return `Relatório ${typeLabels[reportType as keyof typeof typeLabels]} - ${formattedDate}`;
  };

  // Carregar dados de opções
  useEffect(() => {
    const loadOptionsData = async () => {
      setLoadingOptions(true);
      try {
        // Build the requests array based on user role
        const requests = [];
        
        // Only load health plans if user is not plan-admin (plan-admin doesn't need to select from list)
        if (!isPlanAdmin) {
          requests.push(api.get('/health-plans', { params: { per_page: 100 } }));
        }
        
        // Only load clinics and professionals if user is not plan-admin
        if (!isPlanAdmin) {
          requests.push(
            api.get('/clinics', { params: { per_page: 100 } }),
            api.get('/professionals', { params: { per_page: 100 } })
          );
        }

        // If no requests to make, just set loading to false
        if (requests.length === 0) {
          setLoadingOptions(false);
          return;
        }

        const responses = await Promise.all(requests);
        
        // Process health plans data only if loaded
        if (!isPlanAdmin && responses[0] && responses[0].data && Array.isArray(responses[0].data.data)) {
          const healthPlansData = responses[0].data.data as HealthPlan[];
          setHealthPlans(healthPlansData);
        }

        // Process clinics and professionals data only if loaded
        if (!isPlanAdmin && responses.length > 1) {
          // Process clinics data
          if (responses[1] && responses[1].data && Array.isArray(responses[1].data.data)) {
            const clinicsData = responses[1].data.data as Clinic[];
            setClinics(clinicsData);
            
            // Extrair estados únicos
            const uniqueStates = [...new Set(clinicsData.map(clinic => clinic.state))].sort();
            setStates(uniqueStates);
            
            // Agrupar cidades por estado
            const citiesByState: Record<string, string[]> = {};
            uniqueStates.forEach(state => {
              const stateCities = [...new Set(clinicsData
                .filter(clinic => clinic.state === state)
                .map(clinic => clinic.city))]
                .sort();
              citiesByState[state] = stateCities;
            });
            setCities(citiesByState);
          }

          // Process professionals data
          if (responses[2] && responses[2].data && Array.isArray(responses[2].data.data)) {
            const professionalsData = responses[2].data.data as Professional[];
            setProfessionals(professionalsData);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar todos os dados necessários',
          variant: 'destructive',
        });
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptionsData();
  }, [isPlanAdmin]);

  useEffect(() => {
    // Safely access localStorage only on client side
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // setUser(parsedUser); // This line was removed as per the new_code
          
          // Se o usuário não tem acesso ao tipo selecionado, seleciona o primeiro tipo permitido
          if (!hasAccessToReportType(reportType) && allowedReportTypes.length > 0) {
            setReportType(allowedReportTypes[0].value);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    // Se tivermos um tipo na URL, já configuramos o nome padrão
    if (typeParam && ['financial', 'appointment', 'performance'].includes(typeParam)) {
      setReportType(typeParam);
      setReportName(getDefaultReportName());
    }
  }, [typeParam]);

  useEffect(() => {
    fetchReportConfig();
  }, []);

  const fetchReportConfig = async () => {
    try {
      const response = await api.get('/reports/config');
      if (response.data.success) {
        setReportConfig(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching report config:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a configuração dos relatórios',
        variant: 'destructive',
      });
    }
  };

  // Get health plan ID from user context - automatically set for plan users
  const userHealthPlanId = authUser?.entity_type === 'health_plan' ? authUser.entity_id : null;

  // Update form data with health plan ID when user changes or when component mounts
  useEffect(() => {
    if (userHealthPlanId && hasRole(['plan_admin', 'health_plan'])) {
      setFormData(prev => ({
        ...prev,
        parameters: {
          ...prev.parameters,
          health_plan_id: userHealthPlanId
        }
      }));
    }
  }, [userHealthPlanId, authUser, hasRole]);

  // Also update form data when report type changes to ensure health_plan_id is set
  useEffect(() => {
    if (userHealthPlanId && hasRole(['plan_admin', 'health_plan']) && formData.type) {
      setFormData(prev => ({
        ...prev,
        parameters: {
          ...prev.parameters,
          health_plan_id: userHealthPlanId
        }
      }));
    }
  }, [formData.type, userHealthPlanId, hasRole]);

  const handleCreateReport = async () => {
    try {
      setLoading(true);
      console.group('Creating New Report');
      console.log('Form Data:', formData);

      // Automatically include health plan ID for plan users
      const healthPlanId = userHealthPlanId || formData.parameters.health_plan_id;

      // Prepare report data according to backend structure
      const reportData = {
        type: formData.type,
        name: formData.name,
        description: formData.description || null,
        filters: {
          start_date: formData.parameters.start_date,
          end_date: formData.parameters.end_date,
          health_plan_id: healthPlanId ? Number(healthPlanId) : undefined,
          ...(isPlanAdmin ? {} : {
            clinic_id: formData.parameters.clinic_id ? Number(formData.parameters.clinic_id) : undefined,
            professional_id: formData.parameters.professional_id ? Number(formData.parameters.professional_id) : undefined,
          }),
          status: formData.parameters.status,
          city: formData.parameters.city,
          state: formData.parameters.state,
          include_summary: formData.parameters.include_summary,
          payment_type: formData.parameters.payment_type,
          specialty: formData.parameters.specialty
        },
        format: formData.file_format
      };

      console.log('Prepared request data:', reportData);
      console.log('Making API request to:', '/reports/create');
      
      const response = await api.post('/reports/create', reportData);
      console.log('API Response:', response.data);

      if (!response.data.success) {
        console.error('API returned error status:', response.data);
        throw new Error(response.data.message || 'Falha ao criar relatório');
      }

      toast({
        title: "Sucesso",
        description: "Relatório criado com sucesso. Você receberá uma notificação quando estiver pronto para download.",
      });

      // Log redirect information
      console.log('Processing response for redirect:', {
        reportId: response.data.data?.report?.id
      });

      // Redirect to report page
      if (response.data.data?.report?.id) {
        const reportUrl = `/reports/${response.data.data.report.id}`;
        console.log('Redirecting to report:', reportUrl);
        router.push(reportUrl);
      }
      // Otherwise, redirect to reports list
      else {
        console.log('Redirecting to reports list');
        router.push('/reports');
      }

    } catch (error: any) {
      console.error('Error creating report:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || 'Falha ao criar relatório'
      });
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  const handleRedirectToReportPage = () => {
    if (reportType === 'financial') {
      router.push('/reports/financial');
    } else if (reportType === 'appointment') {
      router.push('/reports/appointments');
    } else if (reportType === 'performance' && !isPlanAdmin) {
      // Only non-plan-admin users can access performance reports
      router.push('/reports/performance');
    } else {
      // For restricted report types or plan-admin users, stay on current page or redirect to main reports
      router.push('/reports');
    }
  };

  // Funções para navegar entre abas
  const goToNextTab = () => {
    if (currentTab === 'report-type') {
      setCurrentTab('parameters');
    } else if (currentTab === 'parameters') {
      setCurrentTab('schedule');
    }
  };

  const goToPreviousTab = () => {
    if (currentTab === 'parameters') {
      setCurrentTab('report-type');
    } else if (currentTab === 'schedule') {
      setCurrentTab('parameters');
    }
  };

  // Filtrar cidades com base no estado selecionado
  const getFilteredCities = (state: string) => {
    if (!state) return [];
    return cities[state] || [];
  };

  // Filtrar clínicas com base no estado e cidade
  const getFilteredClinics = (state: string, city: string) => {
    let filtered = [...clinics];
    
    if (state) {
      filtered = filtered.filter(clinic => clinic.state === state);
    }
    
    if (city) {
      filtered = filtered.filter(clinic => clinic.city === city);
    }
    
    return filtered;
  };

  // Validate required filters from API configuration
  const validateRequiredFilters = (data: FormData): string[] => {
    const errors: string[] = [];
    
    if (reportConfig && data.type && reportConfig.types[data.type]) {
      const typeConfig = reportConfig.types[data.type];
      
      Object.entries(typeConfig.filters).forEach(([key, filter]) => {
        if (filter.required) {
          const paramKey = key as keyof ReportParameters;
          const value = data.parameters[paramKey];
          
          // Skip validation for plan-admin users on certain fields
          if (isPlanAdmin && (key === 'health_plan_id' || key === 'clinic_id' || key === 'professional_id')) {
            return; // Skip validation for these fields for plan-admin users
          }
          
          if (!value || (typeof value === 'string' && !value.trim())) {
            errors.push(`${filter.label} é obrigatório`);
          }
        }
      });
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.group('Form Submission');
    console.log('Form submitted with data:', formData);

    // Validate form data
    const validation = validateFormData(formData, isPlanAdmin);
    const filterErrors = validateRequiredFilters(formData);
    const allErrors = [...validation.errors, ...filterErrors];
    
    if (!validation.isValid || filterErrors.length > 0) {
      console.log('Form validation failed:', allErrors);
      
      // Show each validation error in a separate toast with delay
      allErrors.forEach((error, index) => {

          toast({
            variant: "destructive",
            title: "Erro de Validação",
            description: error
          });
      });
      
      console.groupEnd();
      return;
    }

    console.log('Form validation passed, creating report...');
    await handleCreateReport();
    console.groupEnd();
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    console.log('Input changed:', field, value);
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleParameterChange = (name: keyof ReportParameters, value: any) => {
    console.log('Parameter changed:', name, value);
    setFormData((prev) => ({
      ...prev,
      parameters: {
        ...prev.parameters,
        [name]: value,
      },
    }));
  };

  // Update the filter rendering to use type-safe parameter names
  const renderFilter = (key: string, filter: ReportFilter) => {
    const paramKey = key as keyof ReportParameters;
    
    // Skip health_plan_id, clinic_id and professional_id filters for plan-admin users
    if (isPlanAdmin && (key === 'health_plan_id' || key === 'clinic_id' || key === 'professional_id')) {
      return null;
    }
    
    return (
      <div key={key} className="space-y-2">
        <Label className="block">{filter.label}</Label>
        {filter.type === 'select' && filter.options ? (
          <Select
            value={String(formData.parameters[paramKey] || '')}
            onValueChange={(value) => handleParameterChange(paramKey, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${filter.label}`} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(filter.options).map(([optKey, optValue]) => (
                <SelectItem key={optKey} value={optKey}>
                  {optValue}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : filter.type === 'date' ? (
          <DatePicker
            date={formData.parameters[paramKey] ? new Date(formData.parameters[paramKey] as string) : null}
            setDate={(date: Date | null) =>
              handleParameterChange(paramKey, date?.toISOString() ?? null)
            }
          />
        ) : (
          <Input
            className="mt-1"
            type={filter.type === 'number' ? 'number' : 'text'}
            value={String(formData.parameters[paramKey] || '')}
            onChange={(e) =>
              handleParameterChange(
                paramKey,
                filter.type === 'number' ? Number(e.target.value) : e.target.value
              )
            }
            required={filter.required}
          />
        )}
      </div>
    );
  };

  if (!reportConfig) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Carregando configurações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Novo Relatório</h1>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="required">Nome do Relatório</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                placeholder="Digite o nome do relatório"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="required">Tipo de Relatório</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(reportConfig.types).filter(([key, type]) => {
                    // For plan-admin, only show financial and appointment reports
                    if (isPlanAdmin) {
                      return key === 'financial' || key === 'appointment';
                    }
                    // For other users, show all available report types
                    return true;
                  }).map(([key, type]) => (
                    <SelectItem key={key} value={key}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                placeholder="Digite uma descrição para o relatório"
              />
            </div>
          </div>

          {formData.type && reportConfig.types[formData.type]?.filters && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(reportConfig.types[formData.type].filters).map(([key, filter]) =>
                  renderFilter(key, filter)
                )}
              </div>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Configurações</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="file_format" className="required">Formato do Arquivo</Label>
                <Select
                  value={formData.file_format}
                  onValueChange={(value) => handleInputChange('file_format', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) =>
                      handleInputChange('is_public', checked)
                    }
                  />
                  <Label htmlFor="is_public">Relatório Público</Label>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="save_as_report"
                    checked={formData.save_as_report}
                    onCheckedChange={(checked) =>
                      handleInputChange('save_as_report', checked)
                    }
                  />
                  <Label htmlFor="save_as_report">Salvar como Relatório</Label>
                </div>
              </div>
            </div>
          </div>

          <style jsx global>{`
            .required:after {
              content: " *";
              color: red;
            }
          `}</style>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              disabled={loading}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                'Criar Relatório'
              )}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

// Main page component with Suspense boundary
export default function NewReportPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <NewReportContent />
    </Suspense>
  );
} 