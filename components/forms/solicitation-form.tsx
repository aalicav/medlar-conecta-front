"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { toast, useToast } from "@/components/ui/use-toast"
import { createResource, updateResource, fetchResource } from "@/services/resource-service"
import { Loader2, PlusCircle, Search } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"
import { CreatePatientModal } from "@/components/modals/create-patient-modal"
import debounce from "lodash/debounce"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"

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
  procedure_id: z.string().min(1, "Selecione um procedimento"),
  description: z.string().min(1, "Digite uma descrição"),
  tuss_id: z.string().min(1, "Selecione um procedimento"),
})

// Infer the type from the schema
type FormValues = z.infer<typeof formSchema>

interface SolicitationFormProps {
  initialData?: Partial<FormValues>
  onSubmit: (data: FormValues) => Promise<void>
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
  onSubmit,
  isPlanAdmin,
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

  // Read query params
  const healthPlanIdFromQuery = searchParams.get('health_plan_id')
  const tussIdFromQuery = searchParams.get('tuss_id')
  const priceFromQuery = searchParams.get('price')

  // Initialize the form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      health_plan_id: isPlanAdmin ? healthPlanId : initialData?.health_plan_id || "",
      patient_id: initialData?.patient_id || "",
      tuss_id: initialData?.tuss_id || "",
      procedure_id: initialData?.procedure_id || "",
      description: initialData?.description || "",
    },
  })

  // Watch health plan ID to fetch procedures
  const selectedHealthPlanId = form.watch("health_plan_id")

  // Set price from query params if available
  useEffect(() => {
    if (priceFromQuery) {
      form.setValue('tuss_id', priceFromQuery)
    }
  }, [priceFromQuery, form])

  // Pre-select values from query params
  useEffect(() => {
    if (healthPlanIdFromQuery) {
      form.setValue('health_plan_id', healthPlanIdFromQuery)
    }
  }, [healthPlanIdFromQuery, form])

  // Fetch procedures when health plan changes
  useEffect(() => {
    const fetchProceduresForHealthPlan = async (healthPlanId: string) => {
      if (!healthPlanId) {
        setProcedures([])
        return
      }

      setLoadingProcedures(true)
      try {
        // Fetch procedures for the selected health plan
        const response = await fetchResource(`health-plans/${healthPlanId}/procedures`)
        
        if (response && response.data) {
          // @ts-ignore
          const options = (response.data).map((item: any) => ({
            value: item.procedure.id.toString(),
            label: `${item.procedure.code} - ${item.procedure.name}`,
            // Store price as an extra property to display later
            price: item.price
          }))
          
          setProcedures(options)
          
          // Clear the current selection unless it's from a query param
          if (!tussIdFromQuery && !isPlanAdmin) {
            form.setValue('tuss_id', '')
            form.setValue('procedure_id', '')
          }
        }
      } catch (error) {
        console.error("Error fetching procedures for health plan:", error)
        useToastToast({
          title: "Erro",
          description: "Não foi possível carregar os procedimentos para este plano de saúde.",
          variant: "destructive",
        })
        setProcedures([])
      } finally {
        setLoadingProcedures(false)
      }
    }

    // If user is plan_admin, use healthPlanId directly
    if (isPlanAdmin && healthPlanId) {
      fetchProceduresForHealthPlan(healthPlanId.toString())
    } else if (selectedHealthPlanId) {
      fetchProceduresForHealthPlan(selectedHealthPlanId)
      
      // Reset patient selection when health plan changes
      if (!initialData?.patient_id) {
        form.setValue('patient_id', '')
        // Fetch patients for this health plan
        fetchPatientsForHealthPlan(selectedHealthPlanId)
      }
    } else {
      setProcedures([])
    }
  }, [selectedHealthPlanId, form, tussIdFromQuery, isPlanAdmin, healthPlanId, useToastToast, initialData?.patient_id])

  // Fetch patients for a specific health plan
  const fetchPatientsForHealthPlan = async (healthPlanId: string, search?: string) => {
    if (!healthPlanId) {
      setPatients([])
      return
    }

    setLoadingPatients(true)
    try {
      const params: QueryParams = { 
        per_page: 20,
        health_plan_id: healthPlanId
      }
      
      if (search && search.length >= 3) {
        params.search = search
      }
      
      const response = await fetchResource("patients", params as any) as ResourceResponse<Patient[]>
      
      if (response?.data && Array.isArray(response.data)) {
        // @ts-ignore
        const options = response.data.map((patient: Patient) => ({
          value: patient.id.toString(),
          label: patient.name
        }))
        setPatients(options)
      }
    } catch (error) {
      console.error("Error fetching patients for health plan:", error)
      useToastToast({
        title: "Erro",
        description: "Não foi possível carregar os pacientes para este plano de saúde.",
        variant: "destructive",
      })
    } finally {
      setLoadingPatients(false)
    }
  }

  // Fetch initial options for select fields
  useEffect(() => {
    const fetchHealthPlans = async () => {
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
          // @ts-ignore
          const options = (response.data).map((plan: any) => ({
            value: plan.id.toString(),
            label: plan.name
          }))
          setHealthPlans(options)
        }
      } catch (error) {
        console.error("Error fetching health plans:", error)
        useToastToast({
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
      if (initialData?.patient_id && initialData?.health_plan_id) {
        // If we have initialData with patient and health plan, fetch patients for that health plan
        fetchPatientsForHealthPlan(initialData.health_plan_id)
      } else if (isPlanAdmin && healthPlanId) {
        // If plan admin, fetch patients for their plan
        fetchPatientsForHealthPlan(healthPlanId)
      }
    }

    // Load options
    fetchHealthPlans()
    fetchInitialPatients()
  }, [isPlanAdmin, healthPlanId, initialData?.patient_id, initialData?.health_plan_id, useToastToast])

  // If there's initialData for patient, fetch that specific patient
  useEffect(() => {
    const fetchPatient = async () => {
      if (initialData?.patient_id) {
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
          useToastToast({
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
  }, [initialData?.patient_id, useToastToast])

  // Search patients
  const searchPatients = debounce((query: string) => {
    if (!selectedHealthPlanId) {
      useToastToast({
        title: "Selecione um plano",
        description: "Por favor, selecione um plano de saúde primeiro.",
        variant: "destructive",
      })
      return
    }
    
    setSearchPatientTerm(query)
    if (query.length >= 3) {
      fetchPatientsForHealthPlan(selectedHealthPlanId, query)
    }
  }, 300)

  // Search health plans
  const searchHealthPlans = debounce(async (query: string) => {
    if (!query || query.length < 3) return
    setSearchHealthPlanTerm(query)

    setLoadingHealthPlans(true)
    try {
      const params: QueryParams = {
        per_page: 20,
        search: query,
        status: 'approved'
      };
      
      const response = await fetchResource("health-plans", params as any) as ResourceResponse<HealthPlan[]>
      
      if (response?.data && Array.isArray(response.data)) {
        // @ts-ignore
        const options = response.data.map((plan: HealthPlan) => ({
          value: plan.id.toString(),
          label: plan.name
        }));
        setHealthPlans(options);
      }
    } catch (error) {
      console.error("Error searching health plans:", error)
    } finally {
      setLoadingHealthPlans(false)
    }
  }, 300)

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
    
    useToastToast({
      title: "Paciente criado",
      description: "O paciente foi criado e selecionado na solicitação.",
    })
  }

  // Handle form submission
  const handleSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      await onSubmit(data)
      useToastToast({
        title: "Sucesso",
        description: "Solicitação criada com sucesso",
      })
    } catch (error) {
      useToastToast({
        title: "Erro",
        description: "Não foi possível criar a solicitação",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Handle health plan selection
  const handleHealthPlanChange = (value: string) => {
    form.setValue("health_plan_id", value)
    form.setValue("patient_id", "") // Reset patient selection
    form.setValue("procedure_id", "") // Reset procedure selection
    form.setValue("tuss_id", "") // Reset TUSS selection
    
    // Fetch patients for this health plan
    fetchPatientsForHealthPlan(value)
  }

  // Add search functionality for procedures
  const searchProcedures = debounce((query: string) => {
    if (!selectedHealthPlanId) {
      useToastToast({
        title: "Selecione um plano",
        description: "Por favor, selecione um plano de saúde primeiro.",
        variant: "destructive",
      })
      return
    }
    
    setSearchProcedureTerm(query)
    if (query.length >= 3) {
      fetchProceduresForSearch(selectedHealthPlanId, query)
    }
  }, 300)

  // Fetch procedures by search query
  const fetchProceduresForSearch = async (healthPlanId: string, search?: string) => {
    if (!healthPlanId) {
      setProcedures([])
      return
    }

    setLoadingProcedures(true)
    try {
      // Fetch procedures for the selected health plan
      const endpoint = search && search.length >= 3 
        ? `health-plans/${healthPlanId}/procedures?search=${encodeURIComponent(search)}`
        : `health-plans/${healthPlanId}/procedures`
        
      const response = await fetchResource(endpoint)
      
      if (response && response.data) {
        // @ts-ignore
        const options = (response.data).map((item: any) => ({
          value: item.procedure.id.toString(),
          label: `${item.procedure.code} - ${item.procedure.name}`,
          price: item.price
        }))
        
        setProcedures(options)
      }
    } catch (error) {
      console.error("Error fetching procedures for health plan:", error)
      useToastToast({
        title: "Erro",
        description: "Não foi possível carregar os procedimentos para este plano de saúde.",
        variant: "destructive",
      })
      setProcedures([])
    } finally {
      setLoadingProcedures(false)
    }
  }

  // Update procedure selection to display price
  const handleProcedureChange = (value: string) => {
    form.setValue("procedure_id", value)
    
    // Find the selected procedure to get its price
    const selectedProc = procedures.find(p => p.value === value)
    if (selectedProc && selectedProc.price) {
      setSelectedProcedurePrice(selectedProc.price)
    } else {
      setSelectedProcedurePrice(null)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Nova Solicitação</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                              onValueChange={handleHealthPlanChange}
                              placeholder="Pesquise pelo nome do plano"
                              onSearch={searchHealthPlans}
                              loading={loadingHealthPlans}
                              disabled={loadingHealthPlans}
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
                name="procedure_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Procedimento</FormLabel>
                    <div className="space-y-2">
                      <div className="flex-1">
                        <Combobox
                          options={procedures}
                          value={field.value}
                          onValueChange={handleProcedureChange}
                          placeholder={selectedHealthPlanId ? "Pesquise pelo nome do procedimento" : "Selecione um plano de saúde primeiro"}
                          onSearch={searchProcedures}
                          loading={loadingProcedures}
                          disabled={loadingProcedures || !selectedHealthPlanId}
                        />
                        {selectedProcedurePrice !== null && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Valor: R$ {selectedProcedurePrice.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite a descrição da solicitação"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                  Salvar
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
