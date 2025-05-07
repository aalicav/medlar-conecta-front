"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray, Control, SubmitHandler, FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"
import api from "@/services/api-client"
import { maskCPF, maskPhone, maskCEP, unmask } from "@/components/utils/masks"

import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Plus, Trash } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { fetchResource, createResource } from "@/services/resource-service"
import { DatePicker } from "@/components/ui/date-picker"
import { useToast } from "@/components/ui/use-toast"

// Estados brasileiros
const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

// Tipos de telefone aceitos pelo backend
const PHONE_TYPES = [
  { value: "mobile", label: "Celular" },
  { value: "landline", label: "Fixo" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "fax", label: "Fax" }
]

// Schema de validação para o formulário de paciente
const patientSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z.string().min(11, "CPF inválido").max(11, "CPF deve ter 11 dígitos"),
  birth_date: z.union([z.string(), z.instanceof(Date)]).refine(value => value !== "", {
    message: "Data de nascimento é obrigatória"
  }),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Selecione um gênero válido" }),
  }),
  health_plan_id: z.string().min(1, "Plano de saúde é obrigatório").optional(),
  health_card_number: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  phones: z.array(
    z.object({
      number: z.string().min(8, "Número inválido"),
      type: z.string().min(1, "Tipo obrigatório")
    })
  ).optional(),
})

// Interface para Campos Field Array
interface PhoneField {
  id?: string;
  number: string;
  type: string;
}

// Interface para o formulário
export interface PatientFormValues extends FieldValues {
  name: string;
  cpf: string;
  birth_date: string | Date;
  gender: "male" | "female" | "other";
  health_plan_id?: string;
  health_card_number?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phones?: PhoneField[];
}

// Interface para plano de saúde
interface HealthPlan {
  id: number;
  name: string;
}

interface PatientFormProps {
  patientId?: string;
  onSuccess: (patient: any) => void;
  onCancel: () => void;
  healthPlanId?: string;
}

export function PatientForm({ patientId, onSuccess, onCancel, healthPlanId }: PatientFormProps) {
  const router = useRouter()
  const { hasPermission, hasRole } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const { toast: useToastToast } = useToast()
  
  // Verificar se usuário tem permissão para gerenciar pacientes
  const canManagePatients = hasPermission("manage patients")
  const isPlanAdmin = hasRole("plan_admin")
  
  // Inicializar formulário
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema) as any,
    defaultValues: {
      name: "",
      cpf: "",
      birth_date: "",
      gender: "male",
      health_plan_id: healthPlanId || "",
      health_card_number: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      phones: [{ number: "", type: "mobile" }],
    },
    mode: "onSubmit"
  })
  
  // Field arrays para telefones
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control: form.control as unknown as Control<PatientFormValues>,
    name: "phones"
  })
  
  // Carregar planos de saúde apenas se não for plan_admin
  useEffect(() => {
    const loadHealthPlans = async () => {
      if (isPlanAdmin) {
        // Se for plan_admin, não precisa carregar a lista de planos
        return;
      }

      try {
        const response = await fetchResource<{ data: HealthPlan[] }>("health-plans", { per_page: 100 })
        setHealthPlans(response.data?.data || [])
      } catch (error) {
        console.error("Erro ao carregar planos de saúde:", error)
        useToastToast({
          title: "Erro",
          description: "Não foi possível carregar a lista de planos de saúde",
          variant: "destructive"
        })
      }
    }
    
    loadHealthPlans()
  }, [isPlanAdmin, useToastToast])
  
  // Carregar dados do paciente para edição
  useEffect(() => {
    if (patientId) {
      const loadPatient = async () => {
        setIsLoading(true)
        try {
          const response = await api.get(`/patients/${patientId}`)
          const patient = response.data.data
          
          // Preencher o formulário com os dados do paciente
          form.reset({
            name: patient.name,
            cpf: patient.cpf ? maskCPF(patient.cpf) : "",
            birth_date: patient.birth_date ? new Date(patient.birth_date).toISOString().split('T')[0] : "",
            gender: patient.gender || "male",
            health_plan_id: patient.health_plan_id ? String(patient.health_plan_id) : "",
            health_card_number: patient.health_card_number || "",
            address: patient.address || "",
            city: patient.city || "",
            state: patient.state || "",
            postal_code: patient.postal_code ? maskCEP(patient.postal_code) : "",
            phones: patient.phones?.length ? patient.phones.map((phone: any) => ({
              number: maskPhone(phone.number),
              type: phone.type
            })) : [{ number: "", type: "mobile" }],
          })
          
        } catch (error) {
          console.error("Erro ao carregar paciente:", error)
          useToastToast({
            title: "Erro",
            description: "Não foi possível carregar os dados do paciente",
            variant: "destructive"
          })
        } finally {
          setIsLoading(false)
        }
      }
      
      loadPatient()
    }
  }, [patientId, form, useToastToast])
  
  // Handlers para máscaras de input
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = maskCPF(value);
    form.setValue("cpf", maskedValue);
  };
  
  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = maskCEP(value);
    form.setValue("postal_code", maskedValue);
    
    // Buscar endereço pelo CEP se tiver 8 dígitos
    if (unmask(maskedValue).length === 8) {
      fetchAddressByCEP(unmask(maskedValue));
    }
  };
  
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    const maskedValue = maskPhone(value);
    form.setValue(`phones.${index}.number`, maskedValue);
  };
  
  // Função para buscar endereço pelo CEP usando API ViaCEP
  const fetchAddressByCEP = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        useToastToast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado",
          variant: "destructive"
        });
        return;
      }
      
      // Preencher os campos de endereço com os dados retornados
      form.setValue("address", `${data.logradouro}${data.complemento ? ', ' + data.complemento : ''}, ${data.bairro}`);
      form.setValue("city", data.localidade);
      form.setValue("state", data.uf);
      
      useToastToast({
        title: "Endereço preenchido",
        description: "Os dados de endereço foram preenchidos automaticamente",
      });
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      useToastToast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível buscar o endereço pelo CEP",
        variant: "destructive"
      });
    }
  };
  
  // Função para enviar dados ao backend
  const onSubmit = async (data: PatientFormValues) => {
    if (!canManagePatients) {
      useToastToast({
        title: "Permissão negada",
        description: "Você não tem permissão para gerenciar pacientes",
        variant: "destructive"
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Preparar dados para envio (remover máscaras)
      const formData = {
        ...data,
        cpf: unmask(data.cpf),
        postal_code: data.postal_code ? unmask(data.postal_code) : undefined,
        phones: data.phones?.map(phone => ({
          ...phone,
          number: unmask(phone.number)
        })),
        // Converter strings vazias para null
        health_plan_id: data.health_plan_id || null,
        health_card_number: data.health_card_number || null,
      }
      
      // Corrigir formato da data
      if (formData.birth_date) {
        // Se for um objeto Date, converter para string no formato ISO
        if (formData.birth_date instanceof Date) {
          formData.birth_date = formData.birth_date.toISOString().split('T')[0];
        }
      }
      
      let response;
      
      if (patientId) {
        // Atualizar paciente existente
        response = await api.put(`/patients/${patientId}`, formData);
        
        if (response.status === 200 || response.status === 201) {
          useToastToast({
            title: "Paciente atualizado",
            description: "O paciente foi atualizado com sucesso"
          });
          
          // Chamar o callback de sucesso com os dados do paciente
          const patientData = response.data.data || response.data;
          console.log("Paciente atualizado:", patientData);
          onSuccess(patientData);
        } else {
          throw new Error("Erro ao atualizar paciente");
        }
      } else {
        // Criar novo paciente
        console.log("Enviando dados:", formData);
        response = await createResource("patients", formData);
        console.log("Resposta:", response);
        
        // Verificar se a resposta foi bem-sucedida
        // createResource já retorna response.data que tem a estrutura ApiResponse
        if (response && response.status === 'success') {
          useToastToast({
            title: "Paciente criado",
            description: "O paciente foi criado com sucesso"
          });
          
          // Chamar o callback de sucesso com os dados do paciente
          // Garantir que estamos passando o objeto completo do paciente
          console.log("Paciente criado:", response.data);
          onSuccess(response.data);
        } else {
          // Se não tiver mensagem específica, usar mensagem genérica
          throw new Error("Erro ao criar paciente");
        }
      }
    } catch (error: any) {
      console.error("Erro ao salvar paciente:", error);
      
      // Verificar se é um erro de validação do backend
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.entries(errors)
          .map(([field, messages]) => {
            const fieldName = {
              name: "Nome",
              cpf: "CPF",
              birth_date: "Data de nascimento",
              gender: "Gênero",
              health_plan_id: "Plano de saúde",
              health_card_number: "Número da carteirinha",
              address: "Endereço",
              city: "Cidade",
              state: "Estado",
              postal_code: "CEP",
              phones: "Telefones"
            }[field] || field;

            return `${fieldName}: ${Array.isArray(messages) ? messages[0] : messages}`;
          })
          .join("\n");

        useToastToast({
          title: "Erro de validação",
          description: errorMessages,
          variant: "destructive"
        });
      } else if (error.response?.data?.message) {
        useToastToast({
          title: "Erro ao salvar paciente",
          description: error.response.data.message,
          variant: "destructive"
        });
      } else {
        useToastToast({
          title: "Erro inesperado",
          description: error.message || "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Função para exibir erros de validação como toast
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar validação antes de enviar
    const result = await form.trigger();
    
    if (!result) {
      // Se houver erros de validação, exibi-los em um toast
      const errors = form.formState.errors;
      const errorMessages: string[] = [];
      
      // Processar erros de campos simples
      Object.entries(errors).forEach(([field, error]) => {
        // Ignorar erros de array (phones) que serão processados separadamente
        if (field !== 'phones' && error && typeof error.message === 'string') {
          const fieldName = {
            name: "Nome",
            cpf: "CPF",
            birth_date: "Data de nascimento",
            gender: "Gênero",
            health_plan_id: "Plano de saúde",
            health_card_number: "Número da carteirinha",
            address: "Endereço",
            city: "Cidade",
            state: "Estado",
            postal_code: "CEP"
          }[field] || field;

          errorMessages.push(`${fieldName}: ${error.message}`);
        }
      });
      
      // Processar erros de telefones (array aninhado)
      if (errors.phones) {
        // @ts-ignore - Acessando a propriedade não tipada
        const phoneErrors = errors.phones;
        
        if (Array.isArray(phoneErrors)) {
          phoneErrors.forEach((phoneError, index) => {
            if (phoneError && typeof phoneError === 'object') {
              // @ts-ignore - Acessando as propriedades não tipadas
              Object.entries(phoneError).forEach(([phoneField, fieldError]) => {
                // @ts-ignore - Verificando a mensagem de erro
                if (fieldError && fieldError.message) {
                  const fieldLabel = phoneField === 'number' ? 'Número' : 'Tipo';
                  // @ts-ignore - Acessando a mensagem de erro
                  errorMessages.push(`Telefone ${index + 1} - ${fieldLabel}: ${fieldError.message}`);
                }
              });
            }
          });
        }
      }

      if (errorMessages.length > 0) {
        useToastToast({
          title: "Erros de validação",
          description: errorMessages.join("\n"),
          variant: "destructive"
        });
      }
      
      return;
    }
    
    // Se a validação passar, chamar onSubmit
    form.handleSubmit(onSubmit as unknown as SubmitHandler<FieldValues>)(e);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Informações Pessoais</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo*</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do paciente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF*</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="000.000.000-00" 
                          value={field.value}
                          onChange={(e) => {
                            handleCPFChange(e);
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento*</FormLabel>
                      <FormControl>
                        <DatePicker 
                          date={field.value ? new Date(field.value) : null} 
                          setDate={(date) => field.onChange(date)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o gênero" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Plano de Saúde</h2>
              {!isPlanAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="health_plan_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plano de Saúde</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o plano de saúde" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingOptions ? (
                              <SelectItem value="loading" disabled>
                                Carregando...
                              </SelectItem>
                            ) : (
                              healthPlans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                  {plan.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="health_card_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número da Carteirinha</FormLabel>
                        <FormControl>
                          <Input placeholder="Número da carteirinha do plano" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Endereço</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="00000-000" 
                          value={field.value}
                          onChange={(e) => {
                            handleCEPChange(e);
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Endereço Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, número, complemento, bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BRAZILIAN_STATES.map((state) => (
                            <SelectItem key={state} value={state ?? 'unknown'}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Telefones</h2>
              <div className="space-y-4">
                {phoneFields.map((field, index) => (
                  <div key={field.id} className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <FormField
                        control={form.control}
                        name={`phones.${index}.number`}
                        render={({ field: phoneField }) => (
                          <FormItem>
                            <FormLabel>Número*</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(00) 00000-0000" 
                                value={phoneField.value}
                                onChange={(e) => {
                                  handlePhoneChange(e, index);
                                  phoneField.onChange(e);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`phones.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo de telefone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {PHONE_TYPES.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Botão para remover telefone */}
                    {phoneFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="mt-0 sm:mt-8"
                        onClick={() => removePhone(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {/* Botão para adicionar telefone */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendPhone({ number: "", type: "mobile" })}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar telefone
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              
              <Button 
                type="submit" 
                disabled={isSubmitting || !canManagePatients}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {patientId ? "Atualizando..." : "Salvando..."}
                  </>
                ) : (
                  patientId ? "Atualizar Paciente" : "Salvar Paciente"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 