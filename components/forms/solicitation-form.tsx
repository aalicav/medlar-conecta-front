"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, UseFormProps } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { toast, useToast } from "@/components/ui/use-toast"
import { createResource, updateResource, fetchResource } from "@/services/resource-service"
import { Loader2, PlusCircle, Search, AlertCircle } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"
import { CreatePatientModal } from "@/components/modals/create-patient-modal"
import debounce from "lodash/debounce"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import estadosCidades from "@/hooks/estados-cidades.json"

/**
 * TODO: TypeScript Type Issues
 * 
 * This file has several TypeScript type issues that need to be addressed
 * in a future refactoring. The main issues are:
 * 
 * 1. The API responses from fetchResource need proper typing to match the actual
 *    data structure.
 * 2. The map operations on response.data need consistent type definitions.
 * 3. The distinction between array and object responses needs to be handled properly.
 * 
 * To fix these issues:
 * 
 * 1. Create a proper fetchResource type system:
 *    - Define a generic ResourceResponse<T> interface
 *    - Create endpoint-specific types for each resource
 * 
 * 2. Fix the map operations with proper type assertions:
 *    - Change each `response.data.map(...)` to `(response.data as SomeType[]).map(...)`
 *    - Or implement proper type guards to check if data is an array
 * 
 * 3. Remove the conflicting interface definitions (ProcedureWithPrice, HealthPlan, Patient)
 *    and replace with more accurate types
 * 
 * 4. Extend QueryParams interface to include all the parameters used across the app
 * 
 * For now, to make the linter happy, you could add `// @ts-ignore` before each problematic
 * line, but a proper fix is recommended as soon as possible.
 */

// Define the form schema with Zod
const formSchema = z.object({
  health_plan_id: z.string().min(1, "Selecione um plano de saúde"),
  patient_id: z.string().min(1, "Selecione um paciente"),
  tuss_id: z.string().min(1, "Selecione uma especialidade"),
  medical_specialty_id: z.string().optional(),
  description: z.string().optional(),
  preferred_date: z.date().optional(),
  state: z.string().optional(),
  city: z.string().optional()
})

// Infer the type from the schema
type FormValues = z.infer<typeof formSchema>

// Define the form props
interface SolicitationFormProps {
  initialData?: Partial<FormValues>
  isEditing?: boolean
  solicitationId?: number
  isPlanAdmin?: boolean
  healthPlanId?: string
}

// Use any for API responses for now - can be improved in future refactoring
interface QueryParams {
  [key: string]: any
  per_page?: number
  search?: string
  status?: string
  health_plan_id?: string
}

// Type for fetchResource return
interface ResourceResponse<T> {
  data: T | T[];
  meta?: any;
}

// Type for multi-resource responses
interface MultiResourceResponse<T> {
  data: T[];
  meta?: any;
}

// Type for single-resource responses
interface SingleResourceResponse<T> {
  data: T;
  meta?: any;
}

// Define interfaces for API data
interface HealthPlan {
  id: number
  name: string
  [key: string]: any // Allow other properties that might be in the API response
}

interface Patient {
  id: number
  name: string
  [key: string]: any // Allow other properties that might be in the API response
}

interface TussProcedure {
  id: number
  code: string
  name: string
  description?: string
  [key: string]: any // Allow other properties that might be in the API response
}

interface MedicalSpecialty {
  id: number
  name: string
  description?: string
  default_price: number
  tuss_code: string
  tuss_description: string
  active: boolean
  created_at?: string
  updated_at?: string
}

// Type for procedure data including price
interface ProcedureWithPrice {
  procedure: {
    id: number;
    code: string;
    name: string;
    description?: string;
  };
  price: number;
}

export function SolicitationForm({ 
  initialData, 
  isEditing = false, 
  solicitationId,
  isPlanAdmin = false,
  healthPlanId
}: SolicitationFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast: useToastToast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [healthPlans, setHealthPlans] = useState<{ value: string; label: string }[]>([])
  const [patients, setPatients] = useState<{ value: string; label: string }[]>([])
  const [procedures, setProcedures] = useState<{ value: string; label: string; price?: number }[]>([])
  const [loadingHealthPlans, setLoadingHealthPlans] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingProcedures, setLoadingProcedures] = useState(false)
  const [patientModalOpen, setPatientModalOpen] = useState(false)
  const [searchHealthPlanTerm, setSearchHealthPlanTerm] = useState("")
  const [searchPatientTerm, setSearchPatientTerm] = useState("")
  const [searchProcedureTerm, setSearchProcedureTerm] = useState("")
  const [selectedProcedurePrice, setSelectedProcedurePrice] = useState<number | null>(null)
  const [tussProcedures, setTussProcedures] = useState<{ value: string; label: string; price?: number; code: string }[]>([])
  const [isLoadingTuss, setIsLoadingTuss] = useState(false)
  const [selectedState, setSelectedState] = useState<string>("")
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const [specialties, setSpecialties] = useState<{ value: string; label: string }[]>([])
  const [loadingSpecialties, setLoadingSpecialties] = useState(false)
  const [selectedTussCode, setSelectedTussCode] = useState<string>("")

  // Read query params
  const healthPlanIdFromQuery = searchParams?.get('health_plan_id')
  const tussIdFromQuery = searchParams?.get('tuss_id')
  const priceFromQuery = searchParams?.get('price')

  // Initialize the form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      health_plan_id: isPlanAdmin ? healthPlanId : initialData?.health_plan_id || "",
      patient_id: initialData?.patient_id || "",
      tuss_id: initialData?.tuss_id || "",
      medical_specialty_id: initialData?.medical_specialty_id || "",
      description: initialData?.description || "",
      preferred_date: initialData?.preferred_date ? new Date(initialData.preferred_date) : undefined,
      state: initialData?.state || "",
      city: initialData?.city || ""
    },
  });

  // Watch health plan ID to fetch procedures
  const selectedHealthPlanId = form.watch("health_plan_id");
  
  // Watch preferred_date to ensure it updates correctly
  const preferredDate = form.watch("preferred_date");

  // Debug log for preferred_date changes
  useEffect(() => {
  }, [preferredDate]);

  // Set price from query params if available
  useEffect(() => {
    if (priceFromQuery) {
      setSelectedProcedurePrice(Number(priceFromQuery));
    }
  }, [priceFromQuery]);

  // Pre-select values from query params
  useEffect(() => {
    if (healthPlanIdFromQuery) {
      form.setValue('health_plan_id', healthPlanIdFromQuery);
    }
    
    if (tussIdFromQuery) {
      form.setValue('tuss_id', tussIdFromQuery);
    }
  }, [healthPlanIdFromQuery, tussIdFromQuery, form]);

  // Fetch procedures when health plan changes
  useEffect(() => {
    const fetchProceduresForHealthPlan = async (healthPlanId: string) => {
      if (!healthPlanId) {
        setTussProcedures([]);
        return;
      }

      setIsLoadingTuss(true);
      try {
        // Fetch all available TUSS procedures/specialties
        const response = await fetchResource(`tuss`);
        
        if (response && response.data) {
          // @ts-ignore
          const options = (response.data).map((item: any) => ({
            value: item.id.toString(),
            label: `${item.code} - ${item.description}`,
            description: item.description,
            code: item.code
          }));
          
          setTussProcedures(options);
          
          // Clear the current selection unless it's from a query param
          if (!tussIdFromQuery && !isPlanAdmin) {
            form.setValue('tuss_id', '')
            form.setValue('medical_specialty_id', '')
          }
        }
      } catch (error) {
        console.error("Error fetching TUSS procedures:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as especialidades disponíveis.",
          variant: "destructive",
        });
        setTussProcedures([]);
      } finally {
        setIsLoadingTuss(false);
      }
    };

    // If user is plan_admin, use healthPlanId directly
    if (isPlanAdmin && healthPlanId) {
      fetchProceduresForHealthPlan(healthPlanId.toString());
    } else if (selectedHealthPlanId) {
      fetchProceduresForHealthPlan(selectedHealthPlanId)
      
      // Reset patient selection when health plan changes
      if (!initialData?.patient_id) {
        form.setValue('patient_id', '')
        // Fetch patients for this health plan
        fetchPatientsForHealthPlan(selectedHealthPlanId)
      }
    } else {
      setTussProcedures([]);
    }
  }, [selectedHealthPlanId, form, tussIdFromQuery, isPlanAdmin, healthPlanId, useToastToast, initialData?.patient_id])

  // Fetch patients for a specific health plan
  const fetchPatientsForHealthPlan = async (healthPlanId: string, search?: string) => {
    if (!healthPlanId) {
      setPatients([])
      form.setValue("patient_id", "")
      return
    }

    setLoadingPatients(true)
    try {
      const params: QueryParams = { 
        per_page: 20,
        health_plan_id: healthPlanId // Ensure health plan ID is included
      }
      
      if (search && search.length >= 3) {
        params.search = search
      }
            
      const response = await fetchResource("patients", params as any) as ResourceResponse<Patient[]>
      
      if (response?.data && Array.isArray(response.data)) {
        const options = response.data
          .filter((patient): patient is Patient => 
            patient != null && 
            typeof patient === 'object' && 
            'id' in patient && 
            patient.id != null && 
            'name' in patient && 
            patient.name != null
          )
          .map((patient: Patient) => ({
            value: String(patient.id),
            label: patient.name
          }))
        setPatients(options)
      }
    } catch (error) {
      console.error("Error fetching patients for health plan:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pacientes para este plano de saúde.",
        variant: "destructive",
      })
      setPatients([])
    } finally {
      setLoadingPatients(false)
    }
  }

  // Fetch initial options for select fields
  useEffect(() => {
    const fetchHealthPlans = async () => {
      // Skip fetching health plans if user is plan admin
      if (isPlanAdmin) {
        // Se for admin do plano, não precisa buscar planos
        setHealthPlans([{
          value: healthPlanId || "",
          label: "Meu Plano de Saúde" // This will be updated with the actual name
        }])
        return
      }

      setLoadingHealthPlans(true)
      try {
        const response = await fetchResource("health-plans", { 
          per_page: 20, 
          status: 'approved' 
        } as any) as ResourceResponse<HealthPlan[]>
        
        if (response && response.data) {
          const options = response.data
            .filter((plan): plan is HealthPlan => 
              plan != null && 
              typeof plan === 'object' && 
              'id' in plan && 
              plan.id != null && 
              'name' in plan && 
              plan.name != null
            )
            .map((plan: HealthPlan) => ({
              value: String(plan.id),
              label: plan.name || 'Unnamed Plan' // Fallback for empty names
            }));
          setHealthPlans(options);
        }
      } catch (error) {
        console.error("Error fetching health plans:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os planos de saúde.",
          variant: "destructive",
        })
      } finally {
        setLoadingHealthPlans(false)
      }
    }

    // On initial load, get the top patients if we don't have initialData
    const fetchInitialPatients = async () => {
    if (isPlanAdmin && healthPlanId) {
        // If plan admin, fetch patients for their plan
        fetchPatientsForHealthPlan(healthPlanId)
      } else {
        // Clear patients if no health plan is selected
        setPatients([])
        form.setValue("patient_id", "")
      }
    }

    // Load options
    if(!isPlanAdmin){
      fetchHealthPlans()
    }
    if(healthPlanId){ 
      fetchInitialPatients()
    }
  }, [isPlanAdmin, healthPlanId, initialData?.patient_id, initialData?.health_plan_id, useToastToast])

  // If there's initialData for patient, fetch that specific patient
  useEffect(() => {
    const fetchPatient = async () => {
      if (initialData?.patient_id && initialData?.patient_id !== "") {
        setLoadingPatients(true)
        try {
          const response = await fetchResource(`patients/${initialData.patient_id}`) as ResourceResponse<Patient>
          
          if (response?.data && !Array.isArray(response.data)) {
            const patient = response.data as Patient;
            setPatients([
              {
                value: patient.id?.toString() || "",
                label: patient.name || "Unknown Patient"
              }
            ])
          }
        } catch (error) {
          console.error("Error fetching patient:", error)
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados do paciente.",
            variant: "destructive",
          })
        } finally {
          setLoadingPatients(false)
        }
      }
    }

    fetchPatient()
  }, [initialData?.patient_id])

  // Search patients
  const searchPatients = debounce((query: string) => {
    const currentHealthPlanId = form.watch("health_plan_id")
    if (!currentHealthPlanId) {
      toast({
        title: "Selecione um plano",
        description: "Por favor, selecione um plano de saúde primeiro.",
        variant: "destructive",
      })
      setPatients([])
      return
    }
    
    setSearchPatientTerm(query)
    if (query.length >= 3) {
      fetchPatientsForHealthPlan(currentHealthPlanId, query)
    }
  }, 300)

  // Handle health plan selection
  const handleHealthPlanChange = (value: string) => {
    if (!value) return;
    
    // Ensure we're working with a string ID
    const healthPlanId = String(value);
    
    // Update form with the selected health plan ID
    form.setValue("health_plan_id", healthPlanId, {
      shouldValidate: true,
      shouldDirty: true
    });
    
    // Reset dependent fields
    form.setValue("patient_id", "");
    form.setValue("tuss_id", "");
    setPatients([]);
    
    // Fetch patients for the selected health plan
    if (healthPlanId) {
      fetchPatientsForHealthPlan(healthPlanId);
    }
  }

  // Update health plans fetching to include ID in label
  const searchHealthPlans = debounce(async (query: string) => {
    if (!query || query.length < 3) return;
    setSearchHealthPlanTerm(query);

    setLoadingHealthPlans(true);
    try {
      const params: QueryParams = {
        per_page: 20,
        search: query,
        status: 'approved'
      };
      
      const response = await fetchResource("health-plans", params as any) as ResourceResponse<HealthPlan[]>;
      
      if (response?.data && Array.isArray(response.data)) {
        const searchResults = response.data
          .filter((plan): plan is HealthPlan => 
            plan != null && 
            typeof plan === 'object' && 
            'id' in plan && 
            plan.id != null && 
            'name' in plan && 
            plan.name != null
          )
          .map((plan: HealthPlan) => ({
            value: String(plan.id),
            label: `${plan.name} (ID: ${plan.id})`
          }));
        
        // Ensure no duplicates by ID
        const uniquePlans = searchResults.filter((plan, index, self) =>
          index === self.findIndex((p) => p.value === plan.value)
        );
        
        setHealthPlans(uniquePlans);
      }
    } catch (error) {
      console.error("Error searching health plans:", error);
      toast({
        title: "Erro",
        description: "Não foi possível pesquisar os planos de saúde.",
        variant: "destructive",
      });
    } finally {
      setLoadingHealthPlans(false);
    }
  }, 300);

  // Handle patient creation modal
  const handlePatientCreated = (patientData: any) => {
    // Add the new patient to the options
    const newPatient = {
      value: patientData.id.toString(),
      label: patientData.name
    }
    
    setPatients(prev => [newPatient, ...prev])
    
    // Set the patient_id in the form
    form.setValue("patient_id", newPatient.value)
    
    toast({
      title: "Paciente criado",
      description: "O paciente foi criado e selecionado na solicitação.",
    })
  }

  // Handle form submission
  const handleSubmit = form.handleSubmit(async (values: FormValues) => {
    setLoading(true)
    try {
      const payload = {
        health_plan_id: parseInt(values.health_plan_id),
        patient_id: parseInt(values.patient_id),
        tuss_id: parseInt(values.tuss_id),
        medical_specialty_id: values.medical_specialty_id ? parseInt(values.medical_specialty_id) : undefined,
        description: values.description,
        preferred_date: values.preferred_date,
        state: values.state,
        city: values.city
      }

      if (isEditing && solicitationId) {
        await updateResource(`solicitations/${solicitationId}`, payload)
        toast({
          title: "Sucesso",
          description: "Solicitação atualizada com sucesso",
        })
      } else {
        await createResource("solicitations", payload)
        toast({
          title: "Sucesso",
          description: "Solicitação criada com sucesso",
        })
      }

      router.push("/solicitations")
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Erro",
        description: "Não foi possível salvar a solicitação",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  })

  // Add search functionality for TUSS procedures
  const searchTussProcedures = debounce(async (term: string) => {
    if (!term || term.length < 3) return;

    setIsLoadingTuss(true);
    try {
      const response = await fetchResource(`tuss?search=${term}`);
      if (response && response.data) {
        // @ts-ignore
        const options = response.data.map((item: any) => ({
          value: item.id.toString(),
          label: `${item.code} - ${item.description}`,
          description: item.description,
          code: item.code
        }));
        setTussProcedures(options);
      }
    } catch (error) {
      console.error("Error searching TUSS procedures:", error);
      toast({
        title: "Erro",
        description: "Não foi possível pesquisar os procedimentos",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTuss(false);
    }
  }, 300);

  // Atualizar cidades quando o estado for selecionado
  useEffect(() => {
    if (selectedState) {
      const estado = estadosCidades.estados.find((e: any) => e.sigla === selectedState)
      if (estado) {
        setAvailableCities(estado.cidades)
      } else {
        setAvailableCities([])
      }
    } else {
      setAvailableCities([])
    }
  }, [selectedState])

  // Atualizar estado selecionado quando mudar no formulário
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'state') {
        setSelectedState(value.state as string)
        // Limpar cidade se mudar o estado
        if (value.state !== selectedState) {
          form.setValue('city', '')
        }
      }
    })
    
    return () => subscription.unsubscribe()
  }, [form, selectedState])

  // Handle TUSS selection
  const handleTussChange = (value: string) => {
    const selectedTuss = tussProcedures.find(t => t.value === value);
    if (selectedTuss) {
      form.setValue('tuss_id', value);
      setSelectedTussCode(selectedTuss.code);
      
      // Clear specialty if TUSS is not 10101012
      if (selectedTuss.code !== "10101012") {
        form.setValue('medical_specialty_id', '');
        setSpecialties([]);
      } else {
        // Load specialties if TUSS is 10101012
        loadSpecialties();
      }
    }
  };

  // Carregar especialidades médicas
  const loadSpecialties = async () => {
    if (loadingSpecialties) return;
    
    setLoadingSpecialties(true);
    try {
      const response = await fetchResource("medical-specialties") as ResourceResponse<MedicalSpecialty[]>;
      if (response?.data && Array.isArray(response.data?.data)) {
        const specialtyOptions = (response.data?.data as MedicalSpecialty[])
          .filter((specialty: MedicalSpecialty): specialty is MedicalSpecialty => 
            specialty != null && 
            typeof specialty === 'object' && 
            'id' in specialty && 
            specialty.id != null && 
            'name' in specialty && 
            specialty.name != null
          )
          .map((specialty: MedicalSpecialty) => ({
            value: String(specialty.id),
            label: specialty.name || 'Unnamed Specialty'
          }));
        setSpecialties(specialtyOptions);
      }
    } catch (error) {
      console.error("Erro ao carregar especialidades:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as especialidades médicas",
        variant: "destructive",
      });
    } finally {
      setLoadingSpecialties(false);
    }
  };

  // Buscar especialidades médicas com debounce
  const buscarEspecialidadesComDebounce = debounce(async (termo: string) => {
    setLoadingSpecialties(true);
    try {
      const params: { active?: boolean; search?: string; per_page?: number } = { 
        active: true,
        per_page: 50
      };
      
      // Se há um termo de busca, adicionar ao parâmetro search
      if (termo && termo.length >= 2) {
        params.search = termo;
      }
      
      // @ts-ignore - API response type is complex
      const response = await fetchResource("medical-specialties", params);
      
      // Tratar diferentes formatos de resposta
      let especialidades: MedicalSpecialty[] = [];
      // @ts-ignore - Handle different response formats
      if (response?.data && Array.isArray(response.data)) {
        especialidades = response.data;
      // @ts-ignore - Handle paginated response
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        especialidades = response.data.data;
      }
      
      const specialtyOptions = especialidades
        .filter((specialty: MedicalSpecialty): specialty is MedicalSpecialty => 
          specialty != null && 
          typeof specialty === 'object' && 
          'id' in specialty && 
          specialty.id != null && 
          'name' in specialty && 
          specialty.name != null
        )
        .map((specialty: MedicalSpecialty) => ({
          value: String(specialty.id),
          label: specialty.name || 'Unnamed Specialty'
        }));
      
      setSpecialties(specialtyOptions);
    } catch (error) {
      console.error('Erro ao buscar especialidades:', error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar as especialidades médicas",
        variant: "destructive"
      });
    } finally {
      setLoadingSpecialties(false);
    }
  }, 300);

  // Carregar especialidades médicas quando necessário
  useEffect(() => {
    if (selectedTussCode === "10101012") {
      loadSpecialties();
    }
  }, [selectedTussCode]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "Editar Solicitação" : "Nova Solicitação"}
        </CardTitle>
        <CardDescription>
          Preencha os dados abaixo para {isEditing ? "editar a" : "criar uma nova"} solicitação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Alert about automatic scheduling */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Agendamento Automático</AlertTitle>
                <AlertDescription>
                  O sistema tentará agendar automaticamente a consulta com base nas informações fornecidas.
                  Se não for possível, entraremos em contato para agendar manualmente.
                </AlertDescription>
              </Alert>

              {!isPlanAdmin && (
                <FormField
                  control={form.control}
                  name="health_plan_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano de Saúde</FormLabel>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Combobox
                              options={healthPlans}
                              value={field.value}
                              onValueChange={(value) => {
                                handleHealthPlanChange(value);
                              }}
                              placeholder="Pesquise pelo nome do plano"
                              onSearch={searchHealthPlans}
                              loading={loadingHealthPlans}
                              disabled={loadingHealthPlans || isPlanAdmin}
                            />
                          </div>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paciente</FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Combobox
                            options={patients}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder={selectedHealthPlanId ? "Pesquise pelo nome ou CPF do paciente" : "Selecione um plano de saúde primeiro"}
                            onSearch={searchPatients}
                            loading={loadingPatients}
                            disabled={loadingPatients || !selectedHealthPlanId}
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={() => setPatientModalOpen(true)}
                          disabled={!selectedHealthPlanId}
                          title="Cadastrar novo paciente"
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tuss_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidade/Procedimento</FormLabel>
                    <div className="space-y-2">
                      <div className="flex-1">
                        <Combobox
                          options={tussProcedures}
                          value={field.value}
                          onValueChange={handleTussChange}
                          placeholder="Pesquise pela especialidade ou procedimento"
                          onSearch={searchTussProcedures}
                          loading={isLoadingTuss}
                        />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedTussCode === "10101012" && (
                <FormField
                  control={form.control}
                  name="medical_specialty_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especialidade Médica</FormLabel>
                      <Combobox
                        options={specialties}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Pesquise pelo nome da especialidade"
                        onSearch={buscarEspecialidadesComDebounce}
                        loading={loadingSpecialties}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="preferred_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Preferencial</FormLabel>
                    <DatePicker
                      date={field.value ? new Date(field.value) : null}
                      setDate={(date) => {
                        // Ensure we're setting a valid Date object or null
                        const normalizedDate = date instanceof Date && !isNaN(date.getTime()) ? date : null;
                        field.onChange(normalizedDate);
                        // Force form to recognize the change
                        form.trigger('preferred_date');
                      }}
                      placeholder="Selecione uma data preferencial"
                    />
                    {field.value && (
                      <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
                        <span>✓</span>
                        <span>Data selecionada: {new Date(field.value).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                    <FormDescription>
                      Selecione uma data preferencial para o agendamento (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Descrição</FormLabel>
                    <Textarea {...field} placeholder="Descreva detalhes adicionais sobre a solicitação" />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado (Opcional)</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          setSelectedState(value)
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {estadosCidades.estados.map((estado: any) => (
                            <SelectItem key={estado.sigla} value={estado.sigla}>
                              {estado.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione o estado para filtrar prestadores por localidade
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade (Opcional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedState}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedState ? "Selecione a cidade" : "Selecione um estado primeiro"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCities.map((cidade: string) => (
                            <SelectItem key={cidade} value={cidade}>
                              {cidade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione a cidade para filtrar prestadores por localidade
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  disabled={loading}
                >
                  Limpar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? "Atualizar" : "Criar"} Solicitação
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </CardContent>

      {/* Patient Creation Modal */}
      <CreatePatientModal
        open={patientModalOpen}
        onOpenChange={setPatientModalOpen}
        onSuccess={handlePatientCreated}
        healthPlanId={form.watch("health_plan_id")}
      />
    </Card>
  )
}
