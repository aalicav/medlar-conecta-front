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
import { createResource, fetchResource } from "@/services/resource-service"
import { Loader2, ArrowLeft } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"
import debounce from "lodash/debounce"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"

// Define the form schema with Zod
const formSchema = z.object({
  patient_id: z.string().min(1, "Selecione um paciente"),
  health_plan_id: z.string().min(1, "Selecione um plano de saúde"),
  tuss_id: z.string().min(1, "Selecione um procedimento"),
  provider_type: z.enum(["clinic", "professional"], {
    required_error: "Selecione o tipo de provedor",
  }),
  provider_id: z.string().min(1, "Selecione um provedor"),
  scheduled_for: z.date({
    required_error: "Selecione a data e hora",
  }),
  notes: z.string().optional(),
})

// Infer the type from the schema
type FormValues = z.infer<typeof formSchema>

interface Provider {
  id: number
  name: string
  type: "clinic" | "professional"
}

interface Patient {
  id: number
  name: string
  health_plan_id: number
  health_plan_name: string
}

interface HealthPlan {
  id: number
  name: string
}

interface TussProcedure {
  id: number
  code: string
  name: string
}

export default function NewAppointmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<{ value: string; label: string }[]>([])
  const [healthPlans, setHealthPlans] = useState<{ value: string; label: string }[]>([])
  const [procedures, setProcedures] = useState<{ value: string; label: string }[]>([])
  const [providers, setProviders] = useState<{ value: string; label: string }[]>([])
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingHealthPlans, setLoadingHealthPlans] = useState(false)
  const [loadingProcedures, setLoadingProcedures] = useState(false)
  const [loadingProviders, setLoadingProviders] = useState(false)
  const [searchPatientTerm, setSearchPatientTerm] = useState("")
  const [searchHealthPlanTerm, setSearchHealthPlanTerm] = useState("")
  const [searchProcedureTerm, setSearchProcedureTerm] = useState("")
  const [searchProviderTerm, setSearchProviderTerm] = useState("")

  // Initialize the form with react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider_type: "clinic",
      notes: "",
    },
  })

  // Watch provider type to load the appropriate providers
  const providerType = form.watch("provider_type")
  const selectedHealthPlanId = form.watch("health_plan_id")
  const selectedTussId = form.watch("tuss_id")

  // Load initial data from query params
  useEffect(() => {
    const patientId = searchParams?.get("patient_id")
    const healthPlanId = searchParams?.get("health_plan_id")
    const tussId = searchParams?.get("tuss_id")

    if (patientId) {
      form.setValue("patient_id", patientId)
      fetchPatient(patientId)
    }

    if (healthPlanId) {
      form.setValue("health_plan_id", healthPlanId)
      fetchHealthPlan(healthPlanId)
    }

    if (tussId) {
      form.setValue("tuss_id", tussId)
      fetchProcedure(tussId)
    }
  }, [searchParams])

  // Fetch a specific patient
  const fetchPatient = async (id: string) => {
    try {
      const response = await fetchResource(`patients/${id}`)
      if (response.data) {
        setPatients([{
          value: response.data.id.toString(),
          label: response.data.name
        }])
        
        // Also set the health plan
        form.setValue("health_plan_id", response.data.health_plan_id.toString())
        setHealthPlans([{
          value: response.data.health_plan_id.toString(),
          label: response.data.health_plan_name
        }])
      }
    } catch (error) {
      console.error("Error fetching patient:", error)
    }
  }

  // Fetch a specific health plan
  const fetchHealthPlan = async (id: string) => {
    try {
      const response = await fetchResource(`health-plans/${id}`)
      if (response.data) {
        setHealthPlans([{
          value: response.data.id.toString(),
          label: response.data.name
        }])
      }
    } catch (error) {
      console.error("Error fetching health plan:", error)
    }
  }

  // Fetch a specific procedure
  const fetchProcedure = async (id: string) => {
    try {
      const response = await fetchResource(`tuss/${id}`)
      if (response.data) {
        setProcedures([{
          value: response.data.id.toString(),
          label: `${response.data.code} - ${response.data.name}`
        }])
      }
    } catch (error) {
      console.error("Error fetching procedure:", error)
    }
  }

  // Search patients
  const searchPatients = debounce(async (query: string) => {
    if (!query || query.length < 3) return
    setSearchPatientTerm(query)

    setLoadingPatients(true)
    try {
      const response = await fetchResource("patients", {
        search: query,
        per_page: 10
      })
      
      if (response.data) {
        const options = response.data.map((patient: Patient) => ({
          value: patient.id.toString(),
          label: patient.name
        }))
        setPatients(options)
      }
    } catch (error) {
      console.error("Error searching patients:", error)
      toast({
        title: "Erro",
        description: "Não foi possível buscar os pacientes",
        variant: "destructive"
      })
    } finally {
      setLoadingPatients(false)
    }
  }, 300)

  // Search health plans
  const searchHealthPlans = debounce(async (query: string) => {
    if (!query || query.length < 3) return
    setSearchHealthPlanTerm(query)

    setLoadingHealthPlans(true)
    try {
      const response = await fetchResource("health-plans", {
        search: query,
        per_page: 10
      })
      
      if (response.data) {
        const options = response.data.map((plan: HealthPlan) => ({
          value: plan.id.toString(),
          label: plan.name
        }))
        setHealthPlans(options)
      }
    } catch (error) {
      console.error("Error searching health plans:", error)
      toast({
        title: "Erro",
        description: "Não foi possível buscar os planos de saúde",
        variant: "destructive"
      })
    } finally {
      setLoadingHealthPlans(false)
    }
  }, 300)

  // Search procedures
  const searchProcedures = debounce(async (query: string) => {
    if (!query || query.length < 3) return
    setSearchProcedureTerm(query)

    setLoadingProcedures(true)
    try {
      const response = await fetchResource("tuss", {
        search: query,
        per_page: 10
      })
      
      if (response.data) {
        const options = response.data.map((procedure: TussProcedure) => ({
          value: procedure.id.toString(),
          label: `${procedure.code} - ${procedure.name}`
        }))
        setProcedures(options)
      }
    } catch (error) {
      console.error("Error searching procedures:", error)
      toast({
        title: "Erro",
        description: "Não foi possível buscar os procedimentos",
        variant: "destructive"
      })
    } finally {
      setLoadingProcedures(false)
    }
  }, 300)

  // Search providers
  const searchProviders = debounce(async (query: string) => {
    if (!query || query.length < 3 || !selectedTussId) return
    setSearchProviderTerm(query)

    setLoadingProviders(true)
    try {
      const endpoint = providerType === "clinic" ? "clinics" : "professionals"
      const response = await fetchResource(endpoint, {
        search: query,
        tuss_id: selectedTussId,
        per_page: 10
      })
      
      if (response.data) {
        const options = response.data.map((provider: Provider) => ({
          value: provider.id.toString(),
          label: provider.name
        }))
        setProviders(options)
      }
    } catch (error) {
      console.error("Error searching providers:", error)
      toast({
        title: "Erro",
        description: "Não foi possível buscar os provedores",
        variant: "destructive"
      })
    } finally {
      setLoadingProviders(false)
    }
  }, 300)

  // Handle form submission
  const handleSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      await createResource("appointments", {
        ...data,
        scheduled_for: format(data.scheduled_for, "yyyy-MM-dd'T'HH:mm:ss'Z'")
      })
      
      toast({
        title: "Sucesso",
        description: "Agendamento criado com sucesso",
      })
      
      router.push("/appointments")
    } catch (error) {
      console.error("Error creating appointment:", error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o agendamento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Reset provider when type changes
  useEffect(() => {
    form.setValue("provider_id", "")
    setProviders([])
  }, [providerType])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Agendamento</h1>
          <p className="text-muted-foreground">Crie um novo agendamento de procedimento médico</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Agendamento</CardTitle>
          <CardDescription>
            Preencha os dados necessários para criar o agendamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="patient_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paciente</FormLabel>
                      <FormControl>
                        <Combobox
                          options={patients}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Pesquise pelo nome do paciente"
                          onSearch={searchPatients}
                          loading={loadingPatients}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          placeholder="Pesquise pelo nome do plano"
                          onSearch={searchHealthPlans}
                          loading={loadingHealthPlans}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tuss_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procedimento</FormLabel>
                      <FormControl>
                        <Combobox
                          options={procedures}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Pesquise pelo código ou nome do procedimento"
                          onSearch={searchProcedures}
                          loading={loadingProcedures}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="provider_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Provedor</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de provedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="clinic">Clínica</SelectItem>
                          <SelectItem value="professional">Profissional</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="provider_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {providerType === "clinic" ? "Clínica" : "Profissional"}
                      </FormLabel>
                      <FormControl>
                        <Combobox
                          options={providers}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder={`Pesquise pelo nome ${providerType === "clinic" ? "da clínica" : "do profissional"}`}
                          onSearch={searchProviders}
                          loading={loadingProviders}
                          disabled={!selectedTussId}
                        />
                      </FormControl>
                      {!selectedTussId && (
                        <FormDescription>
                          Selecione um procedimento primeiro para buscar os provedores disponíveis
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduled_for"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data e Hora</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Adicione observações sobre o agendamento"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Informações adicionais para o agendamento (opcional)
                      </FormDescription>
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
                    Criar Agendamento
                  </Button>
                </div>
              </form>
            </Form>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
} 