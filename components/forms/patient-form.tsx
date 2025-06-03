"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray, Control, SubmitHandler, FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useToast } from "@/components/ui/use-toast"
import api from "@/services/api-client"
import { applyCPFMask, applyPhoneMask, applyCEPMask, unmask } from "@/utils/masks"
import estadosCidades from "@/hooks/estados-cidades.json"
import { format, differenceInYears, parseISO } from "date-fns"

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
import { DateInput } from "../ui/date-input"
import { ToastIcon } from "@/components/ui/toast"

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
  cpf: z.string().min(11, "CPF inválido"),
  email: z.string().email("Email inválido").optional(),
  birth_date: z.date({
    required_error: "Data de nascimento é obrigatória",
    invalid_type_error: "Data de nascimento deve ser uma data válida"
  }).refine((date) => {
    const now = new Date();
    const minDate = new Date(1900, 0, 1);
    return date <= now && date >= minDate;
  }, {
    message: "Data de nascimento deve estar entre 01/01/1900 e hoje"
  }),
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Selecione um gênero válido" }),
  }),
  health_plan_id: z.string().optional(),
  health_card_number: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  responsible_name: z.string().optional(),
  responsible_email: z.string().optional().or(z.literal('')),
  responsible_phone: z.string().optional(),
  phones: z.array(
    z.object({
      number: z.string().min(8, "Número inválido"),
      type: z.string().min(1, "Tipo obrigatório")
    })
  ).optional(),
  secondary_contact_name: z.string().optional(),
  secondary_contact_phone: z.string().optional(),
  secondary_contact_relationship: z.string().optional(),
})

// Interface para Campos Field Array
interface PhoneField {
  id?: string;
  number: string;
  type: string;
}

// Atualizar o tipo FormValues para garantir que phones seja sempre um array
type FormValues = z.infer<typeof patientSchema> & {
  phones: {
    number: string;
    type: string;
  }[];
};

// Interface para o formulário
export interface PatientFormValues extends FieldValues {
  name: string;
  cpf: string;
  email: string;
  birth_date: string | Date;
  gender: "male" | "female" | "other";
  health_plan_id?: string;
  health_card_number?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  responsible_name?: string;
  responsible_email?: string;
  responsible_phone?: string;
  phones?: PhoneField[];
  secondary_contact_name?: string;
  secondary_contact_phone?: string;
  secondary_contact_relationship?: string;
}

// Interface para plano de saúde
interface HealthPlan {
  id: number;
  name: string;
}

// Interface para Estado/UF
interface Estado {
  sigla: string;
  nome: string;
  cidades: string[];
}

interface PatientFormProps {
  patientId?: string;
  onSuccess: (patient: any) => void;
  onError?: (error: any) => void;
  onCancel: () => void;
  healthPlanId?: string;
}

// Função para traduzir mensagens de erro do backend
const translateValidationError = (field: string, message: string) => {
  // Tradução de campos
  const fieldTranslations: Record<string, string> = {
    name: "Nome",
    cpf: "CPF",
    email: "Email",
    birth_date: "Data de nascimento",
    gender: "Gênero",
    health_plan_id: "Plano de saúde",
    health_card_number: "Número da carteirinha",
    address: "Endereço",
    city: "Cidade",
    state: "Estado",
    postal_code: "CEP",
    phones: "Telefones",
    "phones.*.number": "Número do telefone",
    "phones.*.type": "Tipo do telefone",
    responsible_name: "Nome do responsável",
    responsible_email: "Email do responsável",
    responsible_phone: "Telefone do responsável",
    secondary_contact_name: "Nome do contato secundário",
    secondary_contact_phone: "Telefone do contato secundário",
    secondary_contact_relationship: "Relacionamento do contato secundário"
  }

  // Tradução de mensagens comuns
  const messageTranslations: Record<string, string> = {
    "This field is required": "Este campo é obrigatório",
    "Invalid email address": "Endereço de email inválido",
    "The cpf field must be 11 characters": "O CPF deve ter 11 dígitos",
    "The cpf has already been taken": "Este CPF já está cadastrado",
    "The email has already been taken": "Este email já está cadastrado",
    "The selected health plan id is invalid": "O plano de saúde selecionado é inválido",
    "The birth date field is required": "A data de nascimento é obrigatória",
    "The birth date is not a valid date": "A data de nascimento não é válida",
    "The gender field is required": "O gênero é obrigatório",
    "The selected gender is invalid": "O gênero selecionado é inválido",
    "The health card number field is required when health plan id is present": "O número da carteirinha é obrigatório quando há plano de saúde",
    "The phones field is required": "É necessário informar pelo menos um telefone",
    "The phones.*.number field is required": "O número do telefone é obrigatório",
    "The phones.*.type field is required": "O tipo do telefone é obrigatório",
    "The selected phones.*.type is invalid": "O tipo de telefone selecionado é inválido"
  }

  // Traduzir o nome do campo
  const translatedField = fieldTranslations[field] || field

  // Traduzir a mensagem de erro
  const translatedMessage = messageTranslations[message] || message

  return `${translatedField}: ${translatedMessage}`
}

export function PatientForm({ patientId, onSuccess, onError, onCancel, healthPlanId }: PatientFormProps) {
  const router = useRouter()
  const { hasPermission, hasRole } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [selectedHealthPlanName, setSelectedHealthPlanName] = useState<string>("")
  const [selectedState, setSelectedState] = useState<string>("")
  const [availableCities, setAvailableCities] = useState<string[]>([])
  const { toast } = useToast()
  const [showSecondaryContact, setShowSecondaryContact] = useState(false)
  
  // Verificar se usuário tem permissão para gerenciar pacientes
  const isPlanAdmin = hasRole("plan_admin")
  
  // Inicializar formulário
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema) as any,
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      birth_date: "",
      gender: "male",
      health_plan_id: "",
      health_card_number: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      responsible_name: "",
      responsible_email: "",
      responsible_phone: "",
      phones: [{ number: "", type: "mobile" }],
      secondary_contact_name: "",
      secondary_contact_phone: "",
      secondary_contact_relationship: "",
    },
    mode: "onBlur"
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
        setIsLoadingOptions(true)
        const response = await fetchResource<any>("health-plans", { per_page: 100 })
        if (response && response.data) {
          // Corrigir tipo para Array de HealthPlan
          const healthPlansData: HealthPlan[] = response.data;
          setHealthPlans(healthPlansData)
        }
      } catch (error) {
        console.error("Erro ao carregar planos de saúde:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar a lista de planos de saúde",
          variant: "destructive"
        })
      } finally {
        setIsLoadingOptions(false)
      }
    }
    
    loadHealthPlans()
  }, [isPlanAdmin, toast])
  
  // Carregar dados do paciente para edição
  useEffect(() => {
    if (patientId) {
      const loadPatient = async () => {
        setIsLoading(true)
        try {
          const response = await api.get(`/patients/${patientId}`)
          const patient = response.data.data
          
          // Verificar idade para mostrar campos de contato secundário
          if (patient.birth_date) {
            const birthDate = new Date(patient.birth_date)
            const age = differenceInYears(new Date(), birthDate)
            setShowSecondaryContact(age < 18 || age >= 65)
          }
          
          // Preencher o formulário com os dados do paciente
          form.reset({
            ...patient,
            cpf: applyCPFMask(patient.cpf),
            birth_date: patient.birth_date ? new Date(patient.birth_date) : undefined,
            gender: patient.gender || "male",
            health_plan_id: patient.health_plan_id ? String(patient.health_plan_id) : "",
            health_card_number: patient.health_card_number || "",
            address: patient.address || "",
            city: patient.city || "",
            state: patient.state || "",
            postal_code: patient.postal_code ? applyCEPMask(patient.postal_code) : "",
            responsible_name: patient.responsible_name || "",
            responsible_email: patient.responsible_email || "",
            responsible_phone: patient.responsible_phone ? applyPhoneMask(patient.responsible_phone) : "",
            phones: patient.phones?.length ? patient.phones.map((phone: any) => ({
              number: applyPhoneMask(phone.number),
              type: phone.type
            })) : [{ number: "", type: "mobile" }],
            secondary_contact_name: patient.secondary_contact_name || "",
            secondary_contact_phone: patient.secondary_contact_phone ? applyPhoneMask(patient.secondary_contact_phone) : "",
            secondary_contact_relationship: patient.secondary_contact_relationship || "",
          })
          
        } catch (error) {
          console.error("Erro ao carregar paciente:", error)
          toast({
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
  }, [patientId, form, toast])
  
  // Fetch health plan name when ID is provided via props
  useEffect(() => {
    const getHealthPlanName = async () => {
      if (!healthPlanId) return
      
      try {
        const response = await fetchResource(`health-plans/${healthPlanId}`)
        if (response && response.data) {
          const planData = response.data as any
          setSelectedHealthPlanName(planData.name || "Plano selecionado")
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes do plano:", error)
        setSelectedHealthPlanName("Plano selecionado")
      }
    }
    
    if (healthPlanId) {
      getHealthPlanName()
    }
  }, [healthPlanId])
  
  // Atualizar cidades quando o estado for selecionado
  useEffect(() => {
    if (selectedState) {
      const estado = estadosCidades.estados.find((e: Estado) => e.sigla === selectedState)
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
  
  // Atualizar a função handleCPFChange
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("cpf", applyCPFMask(value), { shouldValidate: true });
  };
  
  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = applyCEPMask(value);
    form.setValue("postal_code", maskedValue);
    
    // Buscar endereço pelo CEP se tiver 8 dígitos
    if (unmask(maskedValue).length === 8) {
      fetchAddressByCEP(unmask(maskedValue));
    }
  };
  
  // Atualizar a função handlePhoneChange
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    form.setValue(`phones.${index}.number`, applyPhoneMask(value), { shouldValidate: true });
  };

  // Atualizar a função handleResponsiblePhoneChange
  const handleResponsiblePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("responsible_phone", applyPhoneMask(value), { shouldValidate: true });
  };

  // Adicionar função para o telefone do contato secundário
  const handleSecondaryContactPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    form.setValue("secondary_contact_phone", applyPhoneMask(value), { shouldValidate: true });
  };
  
  // Função para buscar endereço pelo CEP usando API ViaCEP
  const fetchAddressByCEP = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast({
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
      
      toast({
        title: "Endereço preenchido",
        description: "Os dados de endereço foram preenchidos automaticamente",
      });
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível buscar o endereço pelo CEP",
        variant: "destructive"
      });
    }
  };
  
  // Atualizar o onSubmit para usar onSuccess ao invés de router.push
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Toast de processamento
      toast({
        title: "Processando...",
        description: patientId 
          ? "Atualizando dados do paciente" 
          : "Cadastrando novo paciente",
        variant: "info"
      });

      // Preparar dados para envio usando FormData
      const formData = new FormData();
      
      // Adicionar campos básicos
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'phones' && value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      // Adicionar telefones
      if (data.phones?.length) {
        data.phones.forEach((phone, index) => {
          formData.append(`phones[${index}][number]`, unmask(phone.number));
          formData.append(`phones[${index}][type]`, phone.type);
        });
      }

      // Adicionar campos específicos com unmask
      if (data.cpf) {
        formData.set('cpf', unmask(data.cpf));
      }
      if (data.responsible_phone) {
        formData.set('responsible_phone', unmask(data.responsible_phone));
      }
      if (data.secondary_contact_phone) {
        formData.set('secondary_contact_phone', unmask(data.secondary_contact_phone));
      }
      if (data.postal_code) {
        formData.set('postal_code', unmask(data.postal_code));
      }

      if(data.birth_date) {
        formData.set('birth_date', data.birth_date.toISOString());
      }

      if(healthPlanId) {
        formData.set('health_plan_id', healthPlanId);
      }

      let response;
      if (patientId) {
        response = await api.put(`/patients/${patientId}`, formData);
      } else {
        response = await api.post('/patients', formData);
      }

      if (response.status === 200 || response.status === 201) {
        // Feedback de sucesso com detalhes
        const patientData = response.data.data || response.data;
        const successMessage = patientId
          ? `Paciente ${patientData.name} atualizado com sucesso`
          : `Paciente ${patientData.name} cadastrado com sucesso`;
          
        toast({
          title: "Sucesso!",
          description: (
            <div className="flex flex-col gap-2">
              <p>{successMessage}</p>
              <p className="text-sm text-muted-foreground">
                {patientData.health_plan_id ? "Plano de saúde vinculado" : "Paciente particular"}
              </p>
            </div>
          ),
          variant: "success",
          duration: 5000
        });
        
        // Usar o callback onSuccess
        onSuccess(patientData);
      }
    } catch (error: any) {
      console.error("Erro ao salvar paciente:", error);
      
      // Tratamento detalhado de erros
      let errorMessage = "Erro ao salvar o paciente";
      let errorDetails = "";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // Verificar erros de validação específicos
      if (error.response?.data?.errors) {
        errorDetails = Object.entries(error.response.data.errors)
          .map(([field, messages]) => {
            // Se messages é um array, pega a primeira mensagem
            const message = Array.isArray(messages) ? messages[0] : messages;
            return translateValidationError(field, message as string);
          })
          .join('\n');
      }
      
      toast({
        title: "Erro ao salvar paciente",
        description: (
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-white">{errorMessage}</p>
            {errorDetails && (
              <p className="text-sm whitespace-pre-line text-white/90">{errorDetails}</p>
            )}
          </div>
        ),
        variant: "destructive",
        duration: 7000
      });
      
      // Chamar onError se fornecido
      if (onError) {
        onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
        toast({
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
    <Card className="w-full shadow-sm">
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
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(applyCPFMask(value));
                          }}
                          maxLength={14}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@exemplo.com" {...field} />
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
                        <DateInput
                          value={field.value ? new Date(field.value) : null}
                          onChange={(date) => {
                            field.onChange(date);
                            // Verificar idade para mostrar campos de contato secundário
                            if (date) {
                              const age = differenceInYears(new Date(), date);
                              setShowSecondaryContact(age < 18 || age >= 65);
                            }
                          }}
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
              {!isPlanAdmin && !healthPlanId && (
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

              {(healthPlanId || isPlanAdmin) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <FormLabel>Plano de Saúde</FormLabel>
                    <div className="p-2 border rounded-md mt-1 bg-muted">
                      {selectedHealthPlanName || "Plano pré-selecionado"}
                    </div>
                  </div>
                  
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
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedState(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {estadosCidades.estados.map((estado: Estado) => (
                            <SelectItem key={estado.sigla} value={estado.sigla}>
                              {estado.nome}
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
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
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
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número*</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="(00) 00000-0000" 
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(applyPhoneMask(value));
                                }}
                                maxLength={15}
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
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-4">Contato Secundário (Opcional)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="secondary_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Contato</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Digite o nome do contato" 
                          {...field} 
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="secondary_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone do Contato</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(00) 00000-0000" 
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(applyPhoneMask(value));
                          }}
                          maxLength={15}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="secondary_contact_relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relacionamento</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Ex: Mãe, Pai, Filho" 
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                disabled={isSubmitting}
                className="relative"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="relative">
                      {patientId ? (
                        <>
                          Atualizando
                          <span className="absolute -right-12 animate-pulse">...</span>
                        </>
                      ) : (
                        <>
                          Salvando
                          <span className="absolute -right-12 animate-pulse">...</span>
                        </>
                      )}
                    </span>
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