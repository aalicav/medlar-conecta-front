import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import api from "@/services/api-client"

// Schemas e interfaces
const appointmentFormSchema = z.object({
  provider_type: z.enum(["App\\Models\\Clinic", "App\\Models\\Professional"], {
    required_error: "Tipo de provedor é obrigatório",
  }),
  provider_id: z.string({
    required_error: "Provedor é obrigatório",
  }),
  scheduled_date: z.date({
    required_error: "Data e hora são obrigatórios",
  }),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface Professional {
  id: number;
  name: string;
  specialties?: string[];
}

interface Clinic {
  id: number;
  name: string;
}

interface ProfessionalAvailability {
  id: number;
  professional: {
    id: number;
    name: string;
  };
  available_date: string;
  available_time: string;
  notes: string | null;
  status: string;
}

interface AppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSolicitation: any | null;
  onSuccess: () => void;
  showDirectScheduling?: boolean;
}

export function AppointmentModal({
  open,
  onOpenChange,
  selectedSolicitation,
  onSuccess,
  showDirectScheduling = false
}: AppointmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [availabilities, setAvailabilities] = useState<ProfessionalAvailability[]>([]);
  const [isLoadingAvailabilities, setIsLoadingAvailabilities] = useState(false);

  const appointmentForm = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      provider_type: "App\\Models\\Clinic",
      notes: "",
    },
  });

  const providerType = appointmentForm.watch("provider_type");

  useEffect(() => {
    if (!open || !selectedSolicitation) return;

    const fetchProviders = async () => {
      setIsLoadingProviders(true);
      try {
        if (providerType === "App\\Models\\Clinic") {
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
  }, [open, selectedSolicitation, providerType]);

  useEffect(() => {
    if (selectedSolicitation && open && !showDirectScheduling) {
      fetchAvailabilities(selectedSolicitation.id);
    }
  }, [selectedSolicitation, open, showDirectScheduling]);

  const fetchAvailabilities = async (solicitationId: number) => {
    setIsLoadingAvailabilities(true);
    try {
      const response = await api.get(`/solicitations/${solicitationId}/availabilities`);
      if (response.data.success) {
        setAvailabilities(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching availabilities:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as disponibilidades",
        variant: "destructive",
      });
    } finally {
      setIsLoadingAvailabilities(false);
    }
  };

  const handleCreateAppointment = async (values: AppointmentFormValues) => {
    if (!selectedSolicitation) return;
    
    setIsLoading(true);
    try {
      const payload = {
        solicitation_id: selectedSolicitation.id,
        provider_type: values.provider_type,
        provider_id: parseInt(values.provider_id),
        scheduled_date: values.scheduled_date.toISOString(),
        notes: values.notes,
        location: values.location
      };
      
      const response = await api.post('/appointments', payload);
      
      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Agendamento criado com sucesso"
        });
        
        onOpenChange(false);
        onSuccess();
      } else {
        throw new Error(response.data.message || "Erro ao criar agendamento");
      }
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao criar agendamento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Criar Agendamento</DialogTitle>
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
            <div className="grid grid-cols-2 gap-4">
              {/* Left column - Form */}
              <div className="space-y-4">
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
                              <RadioGroupItem value="App\\Models\\Clinic" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Clínica
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="App\\Models\\Professional" />
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
                
                <FormField
                  control={appointmentForm.control}
                  name="provider_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {providerType === "App\\Models\\Clinic" ? "Clínica" : "Profissional"}
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoadingProviders}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={`Selecione ${providerType === "App\\Models\\Clinic" ? "uma clínica" : "um profissional"}`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {providerType === "App\\Models\\Clinic" ? (
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
                
                <FormField
                  control={appointmentForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <Input placeholder="Local do atendimento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                          <Calendar
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
              </div>

              {/* Right column - Availabilities */}
              {!showDirectScheduling && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Disponibilidades</h3>
                  {isLoadingAvailabilities ? (
                    <div className="flex items-center justify-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : availabilities.length > 0 ? (
                    <div className="space-y-2">
                      {availabilities.map((availability) => (
                        <Card key={availability.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{availability.professional.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(availability.available_date), "dd/MM/yyyy", { locale: ptBR })} às{" "}
                                {availability.available_time}
                              </p>
                              {availability.notes && (
                                <p className="text-sm text-muted-foreground mt-1">{availability.notes}</p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const date = new Date(availability.available_date);
                                const [hours, minutes] = availability.available_time.split(":");
                                date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                                
                                appointmentForm.setValue("provider_type", "App\\Models\\Professional");
                                appointmentForm.setValue("provider_id", availability.professional.id.toString());
                                appointmentForm.setValue("scheduled_date", date);
                              }}
                            >
                              Usar
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma disponibilidade encontrada</p>
                  )}
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
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
  );
} 