"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
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

// Define the form schema with Zod
const formSchema = z.object({
  health_plan_id: z.string().min(1, { message: "Plano de saúde é obrigatório" }),
  patient_id: z.string().min(1, { message: "Paciente é obrigatório" }),
  tuss_id: z.string().min(1, { message: "Procedimento TUSS é obrigatório" }),
  priority: z.enum(["high", "normal", "low"]),
  preferred_date_start: z.date(),
  preferred_date_end: z.date(),
  notes: z.string().optional(),
  preferred_location_lat: z.string().optional(),
  preferred_location_lng: z.string().optional(),
  max_distance_km: z.string().optional(),
})

// Infer the type from the schema
type FormValues = z.infer<typeof formSchema>

interface SolicitationFormProps {
  initialData?: Partial<FormValues>
  isEditing?: boolean
  solicitationId?: number
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

export function SolicitationForm({ initialData, isEditing = false, solicitationId }: SolicitationFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [healthPlans, setHealthPlans] = useState<ComboboxOption[]>([])
  const [patients, setPatients] = useState<ComboboxOption[]>([])
  const [tussProcedures, setTussProcedures] = useState<ComboboxOption[]>([])
  const [isLoadingHealthPlans, setIsLoadingHealthPlans] = useState(false)
  const [isLoadingPatients, setIsLoadingPatients] = useState(false)
  const [isLoadingTuss, setIsLoadingTuss] = useState(false)
  const [patientModalOpen, setPatientModalOpen] = useState(false)
  const [procedurePrice, setProcedurePrice] = useState<string | null>(null)

  // Read query params
  const healthPlanIdFromQuery = searchParams.get('health_plan_id')
  const tussIdFromQuery = searchParams.get('tuss_id')
  const priceFromQuery = searchParams.get('price')

  // Initialize the form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      health_plan_id: initialData?.health_plan_id?.toString() || healthPlanIdFromQuery || "",
      patient_id: initialData?.patient_id?.toString() || "",
      tuss_id: initialData?.tuss_id?.toString() || tussIdFromQuery || "",
      priority: initialData?.priority || "normal",
      preferred_date_start: initialData?.preferred_date_start || new Date(),
      preferred_date_end: initialData?.preferred_date_end || new Date(),
      notes: initialData?.notes || "",
      preferred_location_lat: initialData?.preferred_location_lat?.toString() || "",
      preferred_location_lng: initialData?.preferred_location_lng?.toString() || "",
      max_distance_km: initialData?.max_distance_km?.toString() || "10",
    },
  })

  // Watch health plan ID to fetch procedures
  const selectedHealthPlanId = form.watch("health_plan_id");

  // Set price from query params if available
  useEffect(() => {
    if (priceFromQuery) {
      setProcedurePrice(priceFromQuery);
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
        // Fetch procedures for the selected health plan
        const response = await fetchResource(`health-plans/${healthPlanId}/procedures`);
        
        if (response && response.data) {
          const options = response.data.map((item: any) => ({
            value: item.procedure.id.toString(),
            label: `${item.procedure.code} - ${item.procedure.name}`,
            // Store price as an extra property to display later
            price: item.price
          }));
          
          setTussProcedures(options);
          
          // Clear the current selection unless it's from a query param
          if (!tussIdFromQuery && !isEditing) {
            form.setValue('tuss_id', '');
          }
        }
      } catch (error) {
        console.error("Error fetching procedures for health plan:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os procedimentos para este plano de saúde.",
          variant: "destructive",
        });
        setTussProcedures([]);
      } finally {
        setIsLoadingTuss(false);
      }
    };

    if (selectedHealthPlanId) {
      fetchProceduresForHealthPlan(selectedHealthPlanId);
    } else {
      setTussProcedures([]);
    }
  }, [selectedHealthPlanId, form, tussIdFromQuery, isEditing]);

  // Handle the price display when a procedure is selected
  const handleProcedureChange = (value: string) => {
    form.setValue('tuss_id', value);
    
    // Find the selected procedure to get its price
    const selectedProcedure = tussProcedures.find(proc => proc.value === value);
    if (selectedProcedure && 'price' in selectedProcedure) {
      // @ts-ignore - We know price exists because we added it
      setProcedurePrice(selectedProcedure.price.toString());
    } else {
      setProcedurePrice(null);
    }
  };

  // Fetch initial options for select fields
  useEffect(() => {
    const fetchHealthPlans = async () => {
      setIsLoadingHealthPlans(true)
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
        toast({
          title: "Erro",
          description: "Não foi possível carregar os planos de saúde.",
          variant: "destructive",
        })
      } finally {
        setIsLoadingHealthPlans(false)
      }
    }

    // On initial load, get the top patients if we don't have initialData
    const fetchInitialPatients = async () => {
      if (!initialData?.patient_id) {
        setIsLoadingPatients(true)
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
          toast({
            title: "Erro",
            description: "Não foi possível carregar os pacientes.",
            variant: "destructive",
          })
        } finally {
          setIsLoadingPatients(false)
        }
      }
    }

    // Load options
    fetchHealthPlans()
    fetchInitialPatients()
  }, [initialData?.patient_id])

  // If there's initialData for patient, fetch that specific patient
  useEffect(() => {
    const fetchPatient = async () => {
      if (initialData?.patient_id) {
        setIsLoadingPatients(true)
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
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados do paciente.",
            variant: "destructive",
          })
        } finally {
          setIsLoadingPatients(false)
        }
      }
    }

    fetchPatient()
  }, [initialData?.patient_id])

  // Search functions
  const searchPatients = debounce(async (query: string) => {
    if (!query || query.length < 3) return

    setIsLoadingPatients(true)
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
      setIsLoadingPatients(false)
    }
  }, 300)

  const searchHealthPlans = debounce(async (query: string) => {
    if (!query || query.length < 3) return

    setIsLoadingHealthPlans(true)
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
      setIsLoadingHealthPlans(false)
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
    
    toast({
      title: "Paciente criado",
      description: "O paciente foi criado e selecionado na solicitação.",
    })
  }

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      const formattedData = {
        ...data,
        health_plan_id: Number.parseInt(data.health_plan_id),
        patient_id: Number.parseInt(data.patient_id),
        tuss_id: Number.parseInt(data.tuss_id),
        preferred_location_lat: data.preferred_location_lat ? Number.parseFloat(data.preferred_location_lat) : null,
        preferred_location_lng: data.preferred_location_lng ? Number.parseFloat(data.preferred_location_lng) : null,
        max_distance_km: data.max_distance_km ? Number.parseInt(data.max_distance_km) : 10,
      }

      if (isEditing && solicitationId) {
        // Update existing solicitation
        await updateResource("solicitations", solicitationId, formattedData)
        toast({
          title: "Solicitação atualizada",
          description: "A solicitação foi atualizada com sucesso.",
        })
      } else {
        // Create new solicitation
        await createResource("solicitations", formattedData)
        toast({
          title: "Solicitação criada",
          description: "A solicitação foi criada com sucesso.",
        })
      }
      // Redirect back to solicitations list
      router.push("/solicitations")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Ocorreu um erro ao salvar a solicitação.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Solicitação" : "Nova Solicitação"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Atualize as informações da solicitação"
            : "Preencha as informações para criar uma nova solicitação"}
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="health_plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Saúde</FormLabel>
                  <FormControl>
                    <Combobox
                      options={healthPlans}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Selecione ou busque um plano de saúde"
                      searchPlaceholder="Digite para buscar planos..."
                      emptyText="Nenhum plano encontrado."
                      loading={isLoadingHealthPlans}
                      onSearch={handleHealthPlanSearch}
                      disabled={!!healthPlanIdFromQuery || isEditing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="patient_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paciente</FormLabel>
                  <div className="flex space-x-2">
                    <FormControl className="flex-1">
                      <Combobox
                        options={patients}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Selecione ou busque um paciente"
                        searchPlaceholder="Digite para buscar pacientes..."
                        emptyText="Nenhum paciente encontrado."
                        loading={isLoadingPatients}
                        onSearch={handlePatientSearch}
                        disabled={isEditing}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setPatientModalOpen(true)}
                      disabled={isEditing}
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span className="sr-only">Novo Paciente</span>
                    </Button>
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
                  <FormLabel>Procedimento TUSS</FormLabel>
                  <FormControl>
                    <Combobox
                      options={tussProcedures}
                      value={field.value}
                      onValueChange={handleProcedureChange}
                      placeholder={selectedHealthPlanId ? "Selecione um procedimento TUSS" : "Selecione um plano de saúde primeiro"}
                      searchPlaceholder="Digite para buscar procedimentos..."
                      emptyText={selectedHealthPlanId ? "Nenhum procedimento disponível para este plano" : "Selecione um plano de saúde primeiro"}
                      loading={isLoadingTuss}
                      onSearch={() => {}} // Procedure search not implemented yet
                      disabled={!selectedHealthPlanId || !!tussIdFromQuery || isEditing}
                    />
                  </FormControl>
                  {procedurePrice && (
                    <p className="text-sm mt-1 font-medium text-green-600">
                      Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(procedurePrice))}
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="preferred_date_start"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Preferencial (Início)</FormLabel>
                    <DatePicker date={field.value} setDate={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferred_date_end"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Preferencial (Fim)</FormLabel>
                    <DatePicker date={field.value} setDate={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações clínicas" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="preferred_location_lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input placeholder="Latitude" {...field} />
                    </FormControl>
                    <FormDescription>Coordenada de latitude do endereço do paciente</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preferred_location_lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input placeholder="Longitude" {...field} />
                    </FormControl>
                    <FormDescription>Coordenada de longitude do endereço do paciente</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_distance_km"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distância Máxima (km)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormDescription>Distância máxima em quilômetros</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Salvando..." : "Criando..."}
                </>
              ) : isEditing ? (
                "Salvar Alterações"
              ) : (
                "Criar Solicitação"
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>

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
