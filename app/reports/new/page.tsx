'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { FileText, BarChart3, Receipt, Calendar, Filter, MapPin, Building } from 'lucide-react';
import api from '@/app/services/api-client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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

export default function NewReportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const [loading, setLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('report-type');
  
  // Comum para todos os relatórios
  const [reportType, setReportType] = useState(typeParam || 'financial');
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [scheduleReport, setScheduleReport] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState('monthly');
  
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
  const [cities, setCities] = useState<{[state: string]: string[]}>({});
  const [loadingOptions, setLoadingOptions] = useState(false);

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
        // Carregar todas as opções de uma vez
        const [clinicsResponse, healthPlansResponse, professionalsResponse] = await Promise.all([
          api.get('/api/clinics', { params: { per_page: 100 } }),
          api.get('/api/health-plans', { params: { per_page: 100 } }),
          api.get('/api/professionals', { params: { per_page: 100 } })
        ]);

        // Processar dados de clínicas e extrair estados e cidades
        if (clinicsResponse.data && Array.isArray(clinicsResponse.data.data)) {
          const clinicsData = clinicsResponse.data.data;
          setClinics(clinicsData);
          
          // Extrair estados únicos
          const uniqueStates = [...new Set(clinicsData.map((clinic: Clinic) => clinic.state))].sort();
          setStates(uniqueStates);
          
          // Agrupar cidades por estado
          const citiesByState: {[state: string]: string[]} = {};
          uniqueStates.forEach(state => {
            const stateCities = [...new Set(clinicsData
              .filter((clinic: Clinic) => clinic.state === state)
              .map((clinic: Clinic) => clinic.city))]
              .sort();
            citiesByState[state] = stateCities;
          });
          setCities(citiesByState);
        }

        // Processar dados de planos de saúde
        if (healthPlansResponse.data && Array.isArray(healthPlansResponse.data.data)) {
          setHealthPlans(healthPlansResponse.data.data);
        }

        // Processar dados de profissionais
        if (professionalsResponse.data && Array.isArray(professionalsResponse.data.data)) {
          setProfessionals(professionalsResponse.data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar opções:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar todas as opções de filtro"
        });
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptionsData();
  }, []);

  useEffect(() => {
    // Se tivermos um tipo na URL, já configuramos o nome padrão
    if (typeParam && ['financial', 'appointment', 'performance'].includes(typeParam)) {
      setReportType(typeParam);
      setReportName(getDefaultReportName());
    }
  }, [typeParam]);

  const handleCreateReport = async () => {
    if (!reportName) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, forneça um nome para o relatório"
      });
      return;
    }

    setLoading(true);
    try {
      const params: any = {
        name: reportName,
        description: reportDescription || `Relatório gerado em ${new Date().toLocaleDateString('pt-BR')}`,
        type: reportType,
        is_template: saveAsTemplate,
        is_scheduled: scheduleReport,
        schedule_frequency: scheduleReport ? scheduleFrequency : null,
        parameters: {
          start_date: startDate ? startDate.toISOString().split('T')[0] : null,
          end_date: endDate ? endDate.toISOString().split('T')[0] : null,
        }
      };

      // Adicionar parâmetros específicos de cada tipo de relatório
      if (reportType === 'financial') {
        params.parameters.include_summary = includeSummary;
        params.parameters.health_plan_id = healthPlanIdFinancial || null;
      } else if (reportType === 'appointment') {
        params.parameters.clinic_id = clinicId || null;
        params.parameters.professional_id = professionalId || null;
        params.parameters.health_plan_id = healthPlanIdAppointment || null;
        params.parameters.status = appointmentStatus !== 'all' ? appointmentStatus : null;
        params.parameters.include_summary = true;
        params.parameters.city = cityAppointment || null;
        params.parameters.state = stateAppointment || null;
      } else if (reportType === 'performance') {
        params.parameters.professional_id = professionalIdPerformance || null;
        params.parameters.clinic_id = clinicIdPerformance || null;
        params.parameters.city = cityPerformance || null;
        params.parameters.state = statePerformance || null;
      }

      const response = await api.post('/api/reports', params);
      
      if (response.data.status === 'success') {
        toast({
          title: "Sucesso",
          description: "Relatório criado com sucesso"
        });
        
        // Se for agendado, apenas redireciona para a página de relatórios
        if (scheduleReport) {
          router.push('/reports');
        } else {
          // Se não for agendado, gera o relatório imediatamente e oferece download
          const generateResponse = await api.post(`/api/reports/${response.data.data.id}/generate`);
          if (generateResponse.data.status === 'success') {
            toast({
              title: "Sucesso",
              description: "Relatório gerado com sucesso"
            });
            window.open(generateResponse.data.data.download_url, '_blank');
            router.push('/reports');
          }
        }
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao criar relatório"
        });
      }
    } catch (error) {
      console.error('Erro ao criar relatório:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o relatório"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectToReportPage = () => {
    if (reportType === 'financial') {
      router.push('/reports/financial');
    } else if (reportType === 'appointment') {
      router.push('/reports/appointments');
    } else if (reportType === 'performance') {
      router.push('/reports/performance');
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

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Novo Relatório</h1>
        <Button variant="outline" onClick={() => router.push('/reports')}>
          Voltar
        </Button>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full md:w-[600px] mx-auto">
          <TabsTrigger value="report-type">1. Tipo de Relatório</TabsTrigger>
          <TabsTrigger value="parameters">2. Parâmetros</TabsTrigger>
          <TabsTrigger value="schedule">3. Configurações</TabsTrigger>
        </TabsList>
        
        {/* Passo 1: Seleção do tipo de relatório */}
        <TabsContent value="report-type">
          <Card>
            <CardHeader>
              <CardTitle>Escolha o tipo de relatório</CardTitle>
              <CardDescription>Selecione o tipo de relatório que deseja gerar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`cursor-pointer border-2 ${reportType === 'financial' ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setReportType('financial')}>
                  <CardHeader className="text-center">
                    <Receipt className="w-12 h-12 mx-auto text-primary" />
                    <CardTitle>Financeiro</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center">
                      Visualize receitas, despesas e transações financeiras
                    </p>
                  </CardContent>
                </Card>
                
                <Card className={`cursor-pointer border-2 ${reportType === 'appointment' ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setReportType('appointment')}>
                  <CardHeader className="text-center">
                    <Calendar className="w-12 h-12 mx-auto text-primary" />
                    <CardTitle>Agendamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center">
                      Acompanhe agendamentos, taxa de comparecimento e cancelamentos
                    </p>
                  </CardContent>
                </Card>
                
                <Card className={`cursor-pointer border-2 ${reportType === 'performance' ? 'border-primary' : 'border-transparent'}`}
                      onClick={() => setReportType('performance')}>
                  <CardHeader className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto text-primary" />
                    <CardTitle>Desempenho</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-center">
                      Analise o desempenho dos profissionais e satisfação dos pacientes
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleRedirectToReportPage}>
                Ir para página do relatório
              </Button>
              <Button onClick={goToNextTab}>
                Próximo
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Passo 2: Parâmetros específicos do relatório */}
        <TabsContent value="parameters">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros do Relatório {reportType === 'financial' ? 'Financeiro' : 
                                                  reportType === 'appointment' ? 'de Agendamentos' : 
                                                  'de Desempenho'}</CardTitle>
              <CardDescription>Configure os parâmetros para geração do relatório</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Informações básicas do relatório */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reportName">Nome do Relatório</Label>
                      <Input 
                        id="reportName"
                        value={reportName}
                        onChange={(e) => setReportName(e.target.value)}
                        placeholder={getDefaultReportName()}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reportDescription">Descrição (opcional)</Label>
                      <Textarea 
                        id="reportDescription"
                        value={reportDescription}
                        onChange={(e) => setReportDescription(e.target.value)}
                        placeholder="Descreva o propósito deste relatório"
                        className="resize-none"
                        rows={1}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data Inicial</Label>
                      <DatePicker 
                        date={startDate}
                        setDate={(date: Date | null) => setStartDate(date)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Data Final</Label>
                      <DatePicker 
                        date={endDate}
                        setDate={(date: Date | null) => setEndDate(date)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />
                
                {/* Parâmetros específicos para cada tipo de relatório */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Filtros Específicos</h3>
                  
                  {reportType === 'financial' && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includeSummary" 
                          checked={includeSummary}
                          onCheckedChange={(checked) => 
                            setIncludeSummary(checked as boolean)
                          }
                        />
                        <Label htmlFor="includeSummary">Incluir resumo financeiro</Label>
                      </div>
                      
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="financialFilters">
                          <AccordionTrigger className="text-sm">
                            <span className="flex items-center">
                              <Filter className="h-4 w-4 mr-2" />
                              Filtros adicionais
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 mt-2">
                              <div className="space-y-2">
                                <Label htmlFor="healthPlanIdFinancial">Plano de Saúde</Label>
                                <Select
                                  value={healthPlanIdFinancial}
                                  onValueChange={setHealthPlanIdFinancial}
                                  disabled={loadingOptions}
                                >
                                  <SelectTrigger id="healthPlanIdFinancial">
                                    <SelectValue placeholder="Selecione o plano de saúde" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {healthPlans.map((plan) => (
                                      <SelectItem key={plan.id} value={plan.id.toString()}>
                                        {plan.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}
                  
                  {reportType === 'appointment' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="appointmentStatus">Status</Label>
                          <Select
                            value={appointmentStatus}
                            onValueChange={setAppointmentStatus}
                          >
                            <SelectTrigger id="appointmentStatus">
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="scheduled">Agendado</SelectItem>
                              <SelectItem value="confirmed">Confirmado</SelectItem>
                              <SelectItem value="completed">Realizado</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                              <SelectItem value="no_show">Não Compareceu</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="healthPlanIdAppointment">Plano de Saúde</Label>
                          <Select
                            value={healthPlanIdAppointment}
                            onValueChange={setHealthPlanIdAppointment}
                            disabled={loadingOptions}
                          >
                            <SelectTrigger id="healthPlanIdAppointment">
                              <SelectValue placeholder="Selecione o plano de saúde" />
                            </SelectTrigger>
                            <SelectContent>
                              {healthPlans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                  {plan.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="locationFilters">
                          <AccordionTrigger className="text-sm">
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              Filtros de localização
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                              <div className="space-y-2">
                                <Label htmlFor="stateAppointment">Estado</Label>
                                <Select
                                  value={stateAppointment}
                                  onValueChange={(value) => {
                                    setStateAppointment(value);
                                    setCityAppointment(''); // Reset city when state changes
                                  }}
                                  disabled={loadingOptions || states.length === 0}
                                >
                                  <SelectTrigger id="stateAppointment">
                                    <SelectValue placeholder="Selecione o estado" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {states.map((state) => (
                                      <SelectItem key={state} value={state}>
                                        {state}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="cityAppointment">Cidade</Label>
                                <Select
                                  value={cityAppointment}
                                  onValueChange={setCityAppointment}
                                  disabled={loadingOptions || !stateAppointment}
                                >
                                  <SelectTrigger id="cityAppointment">
                                    <SelectValue placeholder="Selecione a cidade" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getFilteredCities(stateAppointment).map((city) => (
                                      <SelectItem key={city} value={city}>
                                        {city}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="space-y-2 mt-4">
                              <Label htmlFor="clinicId">Clínica</Label>
                              <Select
                                value={clinicId}
                                onValueChange={setClinicId}
                                disabled={loadingOptions}
                              >
                                <SelectTrigger id="clinicId">
                                  <SelectValue placeholder="Selecione a clínica" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getFilteredClinics(stateAppointment, cityAppointment).map((clinic) => (
                                    <SelectItem key={clinic.id} value={clinic.id.toString()}>
                                      {clinic.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                        
                        <AccordionItem value="professionalFilters">
                          <AccordionTrigger className="text-sm">
                            <span className="flex items-center">
                              <Building className="h-4 w-4 mr-2" />
                              Filtros de profissional
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2 mt-2">
                              <Label htmlFor="professionalId">Profissional</Label>
                              <Select
                                value={professionalId}
                                onValueChange={setProfessionalId}
                                disabled={loadingOptions}
                              >
                                <SelectTrigger id="professionalId">
                                  <SelectValue placeholder="Selecione o profissional" />
                                </SelectTrigger>
                                <SelectContent>
                                  {professionals.map((professional) => (
                                    <SelectItem key={professional.id} value={professional.id.toString()}>
                                      {professional.name} - {professional.specialty}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}
                  
                  {reportType === 'performance' && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="professionalIdPerformance">Profissional</Label>
                        <Select
                          value={professionalIdPerformance}
                          onValueChange={setProfessionalIdPerformance}
                          disabled={loadingOptions}
                        >
                          <SelectTrigger id="professionalIdPerformance">
                            <SelectValue placeholder="Selecione o profissional" />
                          </SelectTrigger>
                          <SelectContent>
                            {professionals.map((professional) => (
                              <SelectItem key={professional.id} value={professional.id.toString()}>
                                {professional.name} - {professional.specialty}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="performanceLocationFilters">
                          <AccordionTrigger className="text-sm">
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2" />
                              Filtros de localização
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                              <div className="space-y-2">
                                <Label htmlFor="statePerformance">Estado</Label>
                                <Select
                                  value={statePerformance}
                                  onValueChange={(value) => {
                                    setStatePerformance(value);
                                    setCityPerformance(''); // Reset city when state changes
                                  }}
                                  disabled={loadingOptions || states.length === 0}
                                >
                                  <SelectTrigger id="statePerformance">
                                    <SelectValue placeholder="Selecione o estado" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {states.map((state) => (
                                      <SelectItem key={state} value={state}>
                                        {state}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="cityPerformance">Cidade</Label>
                                <Select
                                  value={cityPerformance}
                                  onValueChange={setCityPerformance}
                                  disabled={loadingOptions || !statePerformance}
                                >
                                  <SelectTrigger id="cityPerformance">
                                    <SelectValue placeholder="Selecione a cidade" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {getFilteredCities(statePerformance).map((city) => (
                                      <SelectItem key={city} value={city}>
                                        {city}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            
                            <div className="space-y-2 mt-4">
                              <Label htmlFor="clinicIdPerformance">Clínica</Label>
                              <Select
                                value={clinicIdPerformance}
                                onValueChange={setClinicIdPerformance}
                                disabled={loadingOptions}
                              >
                                <SelectTrigger id="clinicIdPerformance">
                                  <SelectValue placeholder="Selecione a clínica" />
                                </SelectTrigger>
                                <SelectContent>
                                  {getFilteredClinics(statePerformance, cityPerformance).map((clinic) => (
                                    <SelectItem key={clinic.id} value={clinic.id.toString()}>
                                      {clinic.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={goToPreviousTab}>
                Voltar
              </Button>
              <Button onClick={goToNextTab}>
                Próximo
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Passo 3: Configurações de agendamento e template */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Adicionais</CardTitle>
              <CardDescription>Escolha como o relatório será gerado e armazenado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="saveAsTemplate" 
                      checked={saveAsTemplate}
                      onCheckedChange={(checked) => 
                        setSaveAsTemplate(checked as boolean)
                      }
                    />
                    <Label htmlFor="saveAsTemplate">Salvar como modelo de relatório</Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    Modelos podem ser reutilizados para gerar relatórios com os mesmos parâmetros no futuro
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="scheduleReport" 
                      checked={scheduleReport}
                      onCheckedChange={(checked) => {
                        setScheduleReport(checked as boolean);
                        if (checked && !saveAsTemplate) {
                          setSaveAsTemplate(true);
                        }
                      }}
                    />
                    <Label htmlFor="scheduleReport">Agendar geração automática</Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    O relatório será gerado automaticamente na frequência selecionada
                  </p>
                </div>
                
                {scheduleReport && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="scheduleFrequency">Frequência</Label>
                    <Select
                      value={scheduleFrequency}
                      onValueChange={setScheduleFrequency}
                    >
                      <SelectTrigger id="scheduleFrequency">
                        <SelectValue placeholder="Selecione a frequência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quinzenal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="bg-muted p-4 rounded-lg mt-4">
                  <h3 className="font-medium mb-2 flex items-center">
                    <FileText className="mr-2 h-4 w-4" />
                    Resumo do Relatório
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Nome:</span>
                      <span className="col-span-2">{reportName || getDefaultReportName()}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="col-span-2">
                        {reportType === 'financial' ? 'Financeiro' : 
                        reportType === 'appointment' ? 'Agendamentos' : 
                        'Desempenho'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Período:</span>
                      <span className="col-span-2">
                        {startDate ? startDate.toLocaleDateString('pt-BR') : 'Início'} até {endDate ? endDate.toLocaleDateString('pt-BR') : 'Hoje'}
                      </span>
                    </div>
                    
                    {/* Exibir filtros selecionados */}
                    {reportType === 'financial' && healthPlanIdFinancial && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Plano de Saúde:</span>
                        <span className="col-span-2">
                          {healthPlans.find(p => p.id.toString() === healthPlanIdFinancial)?.name || 'Desconhecido'}
                        </span>
                      </div>
                    )}
                    
                    {reportType === 'appointment' && (
                      <>
                        {appointmentStatus !== 'all' && (
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-muted-foreground">Status:</span>
                            <span className="col-span-2">
                              {appointmentStatus === 'scheduled' ? 'Agendado' :
                               appointmentStatus === 'confirmed' ? 'Confirmado' :
                               appointmentStatus === 'completed' ? 'Realizado' :
                               appointmentStatus === 'cancelled' ? 'Cancelado' : 
                               appointmentStatus === 'no_show' ? 'Não Compareceu' : appointmentStatus}
                            </span>
                          </div>
                        )}
                        
                        {(clinicId || stateAppointment || cityAppointment) && (
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-muted-foreground">Localização:</span>
                            <span className="col-span-2">
                              {clinicId ? clinics.find(c => c.id.toString() === clinicId)?.name :
                               cityAppointment ? `${cityAppointment}/${stateAppointment}` :
                               stateAppointment ? stateAppointment : ''}
                            </span>
                          </div>
                        )}
                        
                        {professionalId && (
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-muted-foreground">Profissional:</span>
                            <span className="col-span-2">
                              {professionals.find(p => p.id.toString() === professionalId)?.name || 'Desconhecido'}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {reportType === 'performance' && (
                      <>
                        {professionalIdPerformance && (
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-muted-foreground">Profissional:</span>
                            <span className="col-span-2">
                              {professionals.find(p => p.id.toString() === professionalIdPerformance)?.name || 'Desconhecido'}
                            </span>
                          </div>
                        )}
                        
                        {(clinicIdPerformance || statePerformance || cityPerformance) && (
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-muted-foreground">Localização:</span>
                            <span className="col-span-2">
                              {clinicIdPerformance ? clinics.find(c => c.id.toString() === clinicIdPerformance)?.name :
                               cityPerformance ? `${cityPerformance}/${statePerformance}` :
                               statePerformance ? statePerformance : ''}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {scheduleReport && (
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-muted-foreground">Agendamento:</span>
                        <span className="col-span-2">
                          {scheduleFrequency === 'daily' ? 'Diário' : 
                          scheduleFrequency === 'weekly' ? 'Semanal' : 
                          scheduleFrequency === 'biweekly' ? 'Quinzenal' : 
                          'Mensal'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={goToPreviousTab}>
                Voltar
              </Button>
              <Button onClick={handleCreateReport} disabled={loading}>
                {loading ? "Processando..." : "Gerar Relatório"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 