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
import { toast } from "@/components/ui/use-toast"
import { createResource, updateResource, fetchResource } from "@/services/resource-service"
import { Loader2, PlusCircle } from "lucide-react"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { CreatePatientModal } from "@/components/modals/create-patient-modal"
import debounce from "lodash/debounce"
import type { DebouncedFunc } from "lodash"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/auth-context"

// Define the form schema with Zod
const formSchema = z.object({
  health_plan_id: z.string().min(1, "Selecione um plano de saúde"),
  patient_id: z.string().min(1, "Selecione um paciente"),
  procedure_id: z.string().min(1, "Selecione um procedimento"),
  description: z.string().min(1, "Digite uma descrição"),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "approved", "rejected"]),
})

// Infer the type from the schema
type FormValues = z.infer<typeof formSchema>

interface SolicitationFormProps {
  initialData?: Partial<FormValues>
  onSubmit: (data: FormValues) => Promise<void>
  isPlanAdmin?: boolean
  healthPlanId?: string
}

// TypeScript interface for API response
interface ApiResponse<T> {
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

// Define interface for fetchResource query params
interface QueryParams {
  per_page?: number
  page?: number
  filter?: string
  query?: string
  [key: string]: any  // Allow additional properties for flexibility
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
  const [healthPlans, setHealthPlans] = useState<ComboboxOption[]>([])
  const [patients, setPatients] = useState<ComboboxOption[]>([])
  const [procedures, setProcedures] = useState<ComboboxOption[]>([])
  const [loadingHealthPlans, setLoadingHealthPlans] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingProcedures, setLoadingProcedures] = useState(false)
  const [patientModalOpen, setPatientModalOpen] = useState(false)

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
      procedure_id: initialData?.procedure_id || "",
      description: initialData?.description || "",
      priority: initialData?.priority || "medium",
      status: initialData?.status || "pending",
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
          const options = response.data.map((item: any) => ({
            value: item.procedure.id.toString(),
            label: `${item.procedure.code} - ${item.procedure.name}`,
            // Store price as an extra property to display later
            price: item.price
          }))
          
          setProcedures(options)
          
          // Clear the current selection unless it's from a query param
          if (!tussIdFromQuery && !isPlanAdmin) {
            form.setValue('tuss_id', '')
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
    } else {
      setProcedures([])
    }
  }, [selectedHealthPlanId, form, tussIdFromQuery, isPlanAdmin, healthPlanId, useToastToast])

  // Fetch initial options for select fields
  useEffect(() => {
    const fetchHealthPlans = async () => {
      if (isPlanAdmin) {
        // Se for admin do plano, não precisa buscar planos
        setHealthPlans([{
          value: healthPlanId,
          label: "Meu Plano de Saúde" // This will be updated with the actual name
        }])
        return
      }

      setLoadingHealthPlans(true)
      try {
        const response = await fetchResource("health-plans", { per_page: 20, status: 'approved' })
        if (response && response.data) {
          const options = response.data.map((plan: any) => ({
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
      if (!initialData?.patient_id) {
        setLoadingPatients(true)
        try {
          const response = await fetchResource("patients", { per_page: 20 })
          if (response && response.data) {
            const options = response.data.map((patient: any) => ({
              value: patient.id.toString(),
              label: patient.name
            }))
            setPatients(options)
          }
        } catch (error) {
          console.error("Error fetching patients:", error)
          useToastToast({
            title: "Erro",
            description: "Não foi possível carregar os pacientes.",
            variant: "destructive",
          })
        } finally {
          setLoadingPatients(false)
        }
      }
    }

    // Load options
    fetchHealthPlans()
    fetchInitialPatients()
  }, [isPlanAdmin, healthPlanId, initialData?.patient_id, useToastToast])

  // If there's initialData for patient, fetch that specific patient
  useEffect(() => {
    const fetchPatient = async () => {
      if (initialData?.patient_id) {
        setLoadingPatients(true)
        try {
          const response = await fetchResource(`patients/${initialData.patient_id}`)
          if (response && response.data) {
            // Type assertion for the patient data
            const patient = response.data as any;
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

  // Search functions
  const searchPatients = debounce(async (query: string) => {
    if (!query || query.length < 3) return

    setLoadingPatients(true)
    try {
      // Use a generic object for parameters to avoid TypeScript errors
      const params: Record<string, any> = {
        per_page: 20
      };
      
      // Use 'search' parameter as expected by the API
      params.search = query;
      
      const response = await fetchResource("patients", params);
      
      if (response && response.data) {
        const options = response.data.map((patient: any) => ({
          value: patient.id.toString(),
          label: patient.name
        }));
        setPatients(options);
      }
    } catch (error) {
      console.error("Error searching patients:", error)
    } finally {
      setLoadingPatients(false)
    }
  }, 300)

  const searchHealthPlans = debounce(async (query: string) => {
    if (!query || query.length < 3) return

    setLoadingHealthPlans(true)
    try {
      // Use a generic object for parameters to avoid TypeScript errors
      const params: Record<string, any> = {
        per_page: 20,
        search: query
      };
      
      
      const response = await fetchResource("health-plans", params);
      
      if (response && response.data) {
        const options = response.data.map((plan: any) => ({
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

  // Connect search functions to combobox inputs
  const handleHealthPlanSearch = (query: string) => {
    if (query.length >= 3) {
      searchHealthPlans(query);
    }
  };

  const handlePatientSearch = (query: string) => {
    if (query.length >= 3) {
      searchPatients(query);
    }
  };

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
                      <Select
                        disabled={loadingHealthPlans}
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um plano de saúde" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {healthPlans.map((plan) => (
                            <SelectItem key={plan.value} value={plan.value}>
                              {plan.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                    <Select
                      disabled={loadingPatients || !selectedHealthPlanId}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um paciente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.value} value={patient.value}>
                            {patient.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select
                      disabled={loadingProcedures || !selectedHealthPlanId}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um procedimento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {procedures.map((procedure) => (
                          <SelectItem key={procedure.value} value={procedure.value}>
                            {procedure.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a prioridade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="approved">Aprovado</SelectItem>
                          <SelectItem value="rejected">Rejeitado</SelectItem>
                        </SelectContent>
                      </Select>
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
