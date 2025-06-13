"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2, CalendarIcon } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import api from "@/services/api-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

interface Solicitation {
  id: number
  patient_name: string
  patient: {
    id: number
    name: string
    birth_date: string
    gender: string
  }
  tuss_code: string
  tuss_name: string
  preferred_date_start: string
  preferred_date_end: string
  status: string
  created_at: string
}

interface ProfessionalAvailability {
  id: number
  solicitation_id: number
  available_date: string
  available_time: string
  notes: string | null
  status: string
}

const availabilityFormSchema = z.object({
  available_date: z.date({
    required_error: "Data é obrigatória",
  }),
  available_time: z.string({
    required_error: "Horário é obrigatório",
  }),
  notes: z.string().optional(),
})

type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>

export default function ProfessionalAvailabilityPage() {
  const router = useRouter()
  const [solicitations, setSolicitations] = useState<Solicitation[]>([])
  const [selectedSolicitation, setSelectedSolicitation] = useState<Solicitation | null>(null)
  const [availabilities, setAvailabilities] = useState<ProfessionalAvailability[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false)

  const availabilityForm = useForm<AvailabilityFormValues>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: {
      available_date: new Date(),
      available_time: "",
      notes: "",
    },
  })

  const fetchSolicitations = async () => {
    try {
      setIsLoading(true)
      const response = await api.get("/solicitations", {
        params: {
          status: "waiting_professional_response",
          requested_for_me: true,
          per_page: 100,
        },
      })

      if (response.data.success) {
        setSolicitations(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching solicitations:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as solicitações",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailabilities = async (solicitationId: number) => {
    try {
      const response = await api.get(`/solicitations/${solicitationId}/availabilities`)
      if (response.data.success) {
        setAvailabilities(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching availabilities:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as disponibilidades",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchSolicitations()
  }, [])

  const handleSelectSolicitation = async (solicitation: Solicitation) => {
    setSelectedSolicitation(solicitation)
    await fetchAvailabilities(solicitation.id)
    setAvailabilityModalOpen(true)
  }

  const handleSubmitAvailability = async (values: AvailabilityFormValues) => {
    if (!selectedSolicitation) return

    try {
      setIsSubmitting(true)
      const response = await api.post("/availabilities", {
        solicitation_id: selectedSolicitation.id,
        available_date: values.available_date.toISOString().split("T")[0],
        available_time: values.available_time,
        notes: values.notes,
      })

      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Disponibilidade registrada com sucesso",
        })
        setAvailabilityModalOpen(false)
        await fetchAvailabilities(selectedSolicitation.id)
        availabilityForm.reset()
      }
    } catch (error: any) {
      console.error("Error submitting availability:", error)
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao registrar disponibilidade",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pendente</Badge>
      case "accepted":
        return <Badge variant="secondary">Aceita</Badge>
      case "rejected":
        return <Badge variant="destructive">Rejeitada</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const columns = [
    {
      accessorKey: "patient.name",
      header: "Paciente",
      cell: ({ row }: any) => (
        <div>
          <div>{row.original.patient.name}</div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(row.original.patient.birth_date), "dd/MM/yyyy")} - {row.original.patient.gender}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tuss_name",
      header: "Procedimento",
      cell: ({ row }: any) => (
        <div>
          <div>{row.original.tuss_code}</div>
          <div className="text-sm text-muted-foreground">{row.original.tuss_name}</div>
        </div>
      ),
    },
    {
      accessorKey: "preferred_date_start",
      header: "Data Preferencial",
      cell: ({ row }: any) => (
        <div>
          <div>De: {format(new Date(row.original.preferred_date_start), "dd/MM/yyyy")}</div>
          <div>Até: {format(new Date(row.original.preferred_date_end), "dd/MM/yyyy")}</div>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Criado em",
      cell: ({ row }: any) => format(new Date(row.original.created_at), "dd/MM/yyyy HH:mm"),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }: any) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleSelectSolicitation(row.original)}
        >
          Registrar Disponibilidade
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Disponibilidades</h1>
        <p className="text-muted-foreground">
          Gerencie suas disponibilidades para as solicitações de procedimentos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações Pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={solicitations}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={availabilityModalOpen} onOpenChange={setAvailabilityModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Registrar Disponibilidade</DialogTitle>
            <DialogDescription>
              {selectedSolicitation && (
                <div className="mt-2 space-y-2">
                  <div>
                    <strong>Paciente:</strong> {selectedSolicitation.patient.name}
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(selectedSolicitation.patient.birth_date), "dd/MM/yyyy")} - {selectedSolicitation.patient.gender}
                    </div>
                  </div>
                  <div><strong>Procedimento:</strong> {selectedSolicitation.tuss_code} - {selectedSolicitation.tuss_name}</div>
                  <div>
                    <strong>Data Preferencial:</strong>{" "}
                    {format(new Date(selectedSolicitation.preferred_date_start), "dd/MM/yyyy")} até{" "}
                    {format(new Date(selectedSolicitation.preferred_date_end), "dd/MM/yyyy")}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <Form {...availabilityForm}>
              <form onSubmit={availabilityForm.handleSubmit(handleSubmitAvailability)} className="space-y-4">
                <FormField
                  control={availabilityForm.control}
                  name="available_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className="w-full pl-3 text-left font-normal"
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: ptBR })
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            locale={ptBR}
                            disabled={(date) => {
                              if (!selectedSolicitation) return true
                              const start = new Date(selectedSolicitation.preferred_date_start)
                              const end = new Date(selectedSolicitation.preferred_date_end)
                              return date < start || date > end
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={availabilityForm.control}
                  name="available_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={availabilityForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações sobre a disponibilidade"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAvailabilityModalOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando...
                      </>
                    ) : (
                      "Registrar Disponibilidade"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>

            {availabilities.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Disponibilidades Registradas</h3>
                <div className="space-y-2">
                  {availabilities.map((availability) => (
                    <Card key={availability.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {format(new Date(availability.available_date), "dd/MM/yyyy", { locale: ptBR })} às{" "}
                            {availability.available_time}
                          </p>
                          {availability.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{availability.notes}</p>
                          )}
                        </div>
                        {getStatusBadge(availability.status)}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 