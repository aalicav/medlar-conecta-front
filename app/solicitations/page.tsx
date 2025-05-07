"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { fetchResource, type QueryParams, type SortOrder } from "@/services/resource-service"
import { Plus, FileText, Edit, Calendar, AlertCircle, Loader2, MoreHorizontal, X, CalendarIcon } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDate, formatCurrency, cn } from "@/lib/utils"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import api from "@/services/api-client"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Solicitation {
  id: number
  health_plan_id: number
  health_plan_name: string
  patient_id: number
  patient_name: string
  tuss_id: number
  tuss_code: string
  tuss_name: string
  status: string
  priority: string
  preferred_date_start: string
  preferred_date_end: string
  created_at: string
  notes: string | null
  patient: {
    id: number
    name: string
    cpf: string
    health_card_number: string
    birth_date: string
    gender: string
    address: string
    city: string
    state: string
    postal_code: string
    age: number
  }
  health_plan: {
    id: number
    name: string
    cnpj: string
    ans_code: string
    status: string
  }
  tuss: {
    id: number
    code: string
    description: string
    category: string
  }
  requested_by_user?: {
    id: number
    name: string
    email: string
  }
  appointments?: Array<{
    id: number
    status: string
    scheduled_date: string
  }>
  is_active?: boolean
  days_remaining?: number
  is_expired?: boolean
}

interface ExtendedQueryParams extends QueryParams {
  sort_by?: string;
  sort_order?: SortOrder;
  date_from?: string;
  date_to?: string;
  created_from?: string;
  created_to?: string;
  status?: string;
  priority?: string;
  health_plan_id?: string;
  patient_id?: string;
  tuss_id?: string;
}

interface HealthPlan {
  id: number;
  name: string;
}

interface ProcedureWithPrice {
  id: number;
  tuss_procedure_id: number;
  price: number;
  procedure: {
    id: number;
    code: string;
    name: string;
    description: string;
    category: string;
  }
}

// Create a form schema for the appointment creation
const appointmentFormSchema = z.object({
  provider_type: z.enum(["App\Models\Clinic", "App\Models\Professional"], {
    required_error: "Tipo de provedor é obrigatório",
  }),
  provider_id: z.string({
    required_error: "Provedor é obrigatório",
  }),
  scheduled_date: z.date({
    required_error: "Data e hora são obrigatórios",
  }),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

// Create interfaces for providers
interface Clinic {
  id: number;
  name: string;
}

interface Professional {
  id: number;
  name: string;
  specialties?: string[];
}

export default function SolicitationsPage() {
  const router = useRouter()
  const [data, setData] = useState<Solicitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  })
  const [sorting, setSorting] = useState<{ column: string; direction: "asc" | "desc" }>({
    column: "created_at",
    direction: "desc",
  })
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [dateFilters, setDateFilters] = useState({
    date_from: "",
    date_to: "",
    created_from: "",
    created_to: "",
  })
  const [selectedSolicitation, setSelectedSolicitation] = useState<Solicitation | null>(null);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const params: ExtendedQueryParams = {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        sort_by: sorting.column,
        sort_order: sorting.direction,
        ...filters,
        ...dateFilters
      }

      const response = await fetchResource<Solicitation[]>("solicitations", params)

      if (response.data) {
        setData(response.data)
      }
      
      if (response.meta) {
        setPagination({
          ...pagination,
          pageCount: response.meta.last_page || 0,
          total: response.meta.total || 0,
        })
      }
    } catch (error) {
      console.error("Error fetching solicitations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize, sorting, filters, dateFilters])

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({
      ...pagination,
      pageIndex: page - 1,
      pageSize,
    })
  }

  const handleSortingChange = (column: string, direction: "asc" | "desc") => {
    setSorting({ column, direction })
  }

  const handleFilterChange = (columnId: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [columnId]: value,
    }))
    setPagination({
      ...pagination,
      pageIndex: 0,
    })
  }

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setDateFilters((prev) => ({
      ...prev,
      [name]: value,
    }))
    setPagination({
      ...pagination,
      pageIndex: 0,
    })
  }

  const clearFilters = () => {
    setFilters({})
    setDateFilters({
      date_from: "",
      date_to: "",
      created_from: "",
      created_to: "",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pendente</Badge>
      case "processing":
        return <Badge>Processando</Badge>
      case "scheduled":
        return <Badge variant="secondary">Agendada</Badge>
      case "completed":
        return <Badge variant="secondary">Concluída</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelada</Badge>
      case "failed":
        return <Badge variant="destructive">Falha</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgente</Badge>
      case "high":
        return <Badge variant="destructive">Alta</Badge>
      case "normal":
        return <Badge variant="secondary">Normal</Badge>
      case "low":
        return <Badge variant="outline">Baixa</Badge>
      default:
        return <Badge>{priority}</Badge>
    }
  }

  // Create form
  const appointmentForm = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      provider_type: "App\Models\Clinic",
      notes: "",
    },
  });

  // Watch provider type to load the appropriate providers
  const providerType = appointmentForm.watch("provider_type");

  // Load providers based on provider type and tuss_id
  useEffect(() => {
    if (!appointmentModalOpen || !selectedSolicitation) return;

    const fetchProviders = async () => {
      setIsLoadingProviders(true);
      try {
        if (providerType === "App\Models\Clinic") {
          // Fetch clinics that offer the procedure
          const response = await api.get(`/clinics`, {
            params: {
              tuss_id: selectedSolicitation.tuss_id,
              status: 'approved',
              per_page: 100,
            }
          });
          
          if (response.data.success) {
            setClinics(response.data.data || []);
          }
        } else {
          // Fetch professionals that offer the procedure
          const response = await api.get(`/professionals`, {
            params: {
              tuss_id: selectedSolicitation.tuss_id,
              status: 'approved',
              per_page: 100,
            }
          });
          
          if (response.data.success) {
            setProfessionals(response.data.data || []);
          }
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os provedores",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProviders(false);
      }
    };

    fetchProviders();
  }, [appointmentModalOpen, selectedSolicitation, providerType]);

  // Handle form submission
  const handleCreateAppointment = async (values: AppointmentFormValues) => {
    if (!selectedSolicitation) return;
    
    try {
      setIsLoading(true);
      
      const payload = {
        ...values,
        solicitation_id: selectedSolicitation.id,
        // Format date to ISO string
        scheduled_date: values.scheduled_date.toISOString(),
      };
      
      const response = await api.post('/appointments/create-manually', payload);
      
      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Agendamento criado com sucesso",
        });
        
        // Close modal and refresh data
        setAppointmentModalOpen(false);
        fetchData();
      } else {
        throw new Error(response.data.message || "Erro ao criar agendamento");
      }
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao criar agendamento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle opening the appointment modal
  const handleScheduleRequest = (id: number) => {
    const solicitation = data.find(sol => sol.id === id);
    
    if (solicitation && solicitation.status === "failed") {
      setSelectedSolicitation(solicitation);
      setAppointmentModalOpen(true);
      
      // Reset form
      appointmentForm.reset({
        provider_type: "App\Models\Clinic",
        provider_id: "",
        scheduled_date: new Date(),
        notes: "",
      });
    } else {
      toast({
        title: "Ação não permitida",
        description: "Apenas solicitações com status 'Falha' podem ser agendadas manualmente.",
        variant: "destructive",
      });
    }
  }

  const handleRetryScheduling = async (id: number) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/solicitations/${id}/force-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        fetchData()
      } else {
        console.error("Failed to retry scheduling")
      }
    } catch (error) {
      console.error("Error retrying scheduling:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const columns: ColumnDef<Solicitation>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "patient.name",
      header: "Paciente",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("patient.name")}>
          {row.getValue("patient.name")}
          <div className="text-xs text-muted-foreground">
            {row.original.patient.name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "health_plan_name",
      header: "Plano de Saúde",
      enableSorting: true,
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("health_plan_name")}>
          {row.getValue("health_plan_name")}
          <div className="text-xs text-muted-foreground">
            {row.original.health_plan.name}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "tuss_name",
      header: "Procedimento",
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate" title={row.getValue("tuss_name")}>
          {row.getValue("tuss_name")}
          <div className="text-xs text-muted-foreground">
            {row.original.tuss.code}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
      enableSorting: true,
    },
    {
      accessorKey: "priority",
      header: "Prioridade",
      cell: ({ row }) => getPriorityBadge(row.getValue("priority")),
      enableSorting: true,
    },
    {
      accessorKey: "preferred_date_start",
      header: "Data Preferencial",
      cell: ({ row }) => (
        <div>
          {formatDate(row.getValue("preferred_date_start"))}
          <div className="text-xs text-muted-foreground">
            até {formatDate(row.original.preferred_date_end)}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "created_at",
      header: "Criado em",
      cell: ({ row }) => formatDate(row.getValue("created_at")),
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const solicitation = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <MoreHorizontal className="h-4 w-4" />
                Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Opções</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`/solicitations/${solicitation.id}`)}>
                <FileText className="h-4 w-4 mr-2" />
                Ver detalhes
              </DropdownMenuItem>
              
              {(solicitation.status === "pending" || solicitation.status === "processing" || solicitation.status === "failed") && (
                <DropdownMenuItem onClick={() => router.push(`/solicitations/${solicitation.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              
              {solicitation.status === "failed" && (
                <DropdownMenuItem onClick={() => handleScheduleRequest(solicitation.id)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar manualmente
                </DropdownMenuItem>
              )}
              
              {solicitation.status === "failed" && (
                <DropdownMenuItem onClick={() => handleRetryScheduling(solicitation.id)}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Tentar novamente
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solicitações</h1>
          <p className="text-muted-foreground">Gerencie as solicitações de procedimentos médicos</p>
        </div>
        <Button onClick={() => router.push("/solicitations/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Solicitação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select 
                onValueChange={(value) => handleFilterChange("status", value)}
                value={filters.status || ""}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="priority-filter">Prioridade</Label>
              <Select 
                onValueChange={(value) => handleFilterChange("priority", value)}
                value={filters.priority || ""}
              >
                <SelectTrigger id="priority-filter">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="health_plan_id">Plano de Saúde</Label>
              <Input 
                id="health_plan_id"
                type="text" 
                name="health_plan_id"
                value={filters.health_plan_id || ""}
                onChange={(e) => handleFilterChange("health_plan_id", e.target.value)}
                placeholder="ID do plano"
              />
            </div>
            
            <div>
              <Label htmlFor="tuss_id">Código TUSS</Label>
              <Input 
                id="tuss_id"
                type="text" 
                name="tuss_id"
                value={filters.tuss_id || ""}
                onChange={(e) => handleFilterChange("tuss_id", e.target.value)}
                placeholder="ID do procedimento"
              />
            </div>
            
            <div>
              <Label htmlFor="date-from">Data preferencial (início)</Label>
              <Input 
                id="date-from"
                type="date" 
                name="date_from"
                value={dateFilters.date_from}
                onChange={handleDateFilterChange}
              />
            </div>
            
            <div>
              <Label htmlFor="date-to">Data preferencial (fim)</Label>
              <Input 
                id="date-to"
                type="date" 
                name="date_to"
                value={dateFilters.date_to}
                onChange={handleDateFilterChange}
              />
            </div>
            
            <div>
              <Label htmlFor="created-from">Criado de</Label>
              <Input 
                id="created-from"
                type="date" 
                name="created_from"
                value={dateFilters.created_from}
                onChange={handleDateFilterChange}
              />
            </div>
            
            <div>
              <Label htmlFor="created-to">Criado até</Label>
              <Input 
                id="created-to"
                type="date" 
                name="created_to"
                value={dateFilters.created_to}
                onChange={handleDateFilterChange}
              />
            </div>
          </div>
          
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        data={data}
        onPaginationChange={handlePaginationChange}
        onSortingChange={(sorting) => {
          if (sorting.length > 0) {
            handleSortingChange(sorting[0].id, sorting[0].desc ? "desc" : "asc")
          }
        }}
        onFilterChange={handleFilterChange}
        pageCount={pagination.pageCount}
        currentPage={pagination.pageIndex + 1}
        pageSize={pagination.pageSize}
        totalItems={pagination.total}
        isLoading={isLoading}
      />
      
      {/* Add the appointment creation modal */}
      <Dialog open={appointmentModalOpen} onOpenChange={setAppointmentModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criar Agendamento Manual</DialogTitle>
            <DialogDescription>
              {selectedSolicitation && (
                <div className="mt-2 text-sm">
                  <div><strong>Paciente:</strong> {selectedSolicitation.patient.name}</div>
                  <div><strong>Plano:</strong> {selectedSolicitation.health_plan.name}</div>
                  <div><strong>Procedimento:</strong> {selectedSolicitation.tuss.code} - {selectedSolicitation.tuss.description}</div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...appointmentForm}>
            <form onSubmit={appointmentForm.handleSubmit(handleCreateAppointment)} className="space-y-6">
              {/* Provider Type Selection */}
              <FormField
                control={appointmentForm.control}
                name="provider_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Provedor</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="App\Models\Clinic" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Clínica
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="App\Models\Professional" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Profissional
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Provider Selection */}
              <FormField
                control={appointmentForm.control}
                name="provider_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {providerType === "App\Models\Clinic" ? "Clínica" : "Profissional"}
                    </FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isLoadingProviders}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={`Selecione ${providerType === "App\Models\Clinic" ? "uma clínica" : "um profissional"}`} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providerType === "App\Models\Clinic" ? (
                          clinics.length > 0 ? (
                            clinics.map(clinic => (
                              <SelectItem key={clinic.id} value={clinic.id.toString()}>
                                {clinic.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-options" disabled>
                              Nenhuma clínica disponível
                            </SelectItem>
                          )
                        ) : (
                          professionals.length > 0 ? (
                            professionals.map(prof => (
                              <SelectItem key={prof.id} value={prof.id.toString()}>
                                {prof.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-options" disabled>
                              Nenhum profissional disponível
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Date Selection */}
              <FormField
                control={appointmentForm.control}
                name="scheduled_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data e Hora</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP 'às' HH:mm", { locale: ptBR })
                            ) : (
                              <span>Selecione a data e hora</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          locale={ptBR}
                        />
                        <div className="p-3 border-t border-border">
                          <Label htmlFor="appointment-time">Horário</Label>
                          <Input
                            id="appointment-time"
                            type="time"
                            className="mt-2"
                            onChange={(e) => {
                              const date = new Date(field.value || new Date());
                              const [hours, minutes] = e.target.value.split(":");
                              date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                              field.onChange(date);
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Notes */}
              <FormField
                control={appointmentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações sobre o agendamento"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Informações adicionais para o agendamento
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setAppointmentModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Agendamento"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
