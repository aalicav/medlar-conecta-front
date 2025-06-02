"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray, Control, SubmitHandler, FieldValues, FieldErrors, ControllerRenderProps, FieldError, FieldPath } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"
import api from "@/services/api-client"
import { applyCNPJMask, applyCPFMask, applyPhoneMask, applyCEPMask, applyCurrencyMask, unmask, applyMunicipalRegistrationMask } from "@/utils/masks"
import { useEntityDocumentTypes } from '@/hooks/useEntityDocumentTypes'
import estadosCidadesData from '@/hooks/estados-cidades.json'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { getStorageUrl } from "@/lib/utils"

import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Plus, Trash, SearchIcon, DollarSign, AlertCircle, CheckCircle, InfoIcon, Trash2, Building2, User, FileText, Phone, AlertTriangle, X, Check, GitBranch, Save } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

// Adicionar uma estilização CSS global no início do arquivo para os erros
const formErrorStyles = "text-destructive font-medium mt-1.5";

// Estados brasileiros
const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

// Lista das principais cidades brasileiras
const MAJOR_BRAZILIAN_CITIES = [
  // Capitais
  "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", 
  "Manaus", "Curitiba", "Recife", "Porto Alegre", "Belém", "Goiânia", "Guarulhos", 
  "Campinas", "São Luís", "São Gonçalo", "Maceió", "Duque de Caxias", "Natal", "Campo Grande",
  "Teresina", "São Bernardo do Campo", "Nova Iguaçu", "João Pessoa", "Santo André", "Osasco",
  "São José dos Campos", "Jaboatão dos Guararapes", "Ribeirão Preto", "Uberlândia", "Sorocaba",
  "Contagem", "Aracaju", "Feira de Santana", "Cuiabá", "Juiz de Fora", "Joinville", "Londrina",
  "Niterói", "Ananindeua", "Belford Roxo", "Campos dos Goytacazes", "São João de Meriti",
  "Aparecida de Goiânia", "Caxias do Sul", "Porto Velho", "Florianópolis", "Santos", "Mauá",
  "Vila Velha", "Serra", "São José do Rio Preto", "Macapá", "Mogi das Cruzes", "Diadema",
  "Campina Grande", "Betim", "Olinda", "Jundiaí", "Carapicuíba", "Piracicaba", "Montes Claros"
]

// Tipos de telefone aceitos pelo backend
const PHONE_TYPES = [
  { value: "mobile", label: "Celular" },
  { value: "landline", label: "Fixo" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "fax", label: "Fax" }
]

// Tipos de documentos aceitos pelo backend
const DOCUMENT_TYPES = [
  { value: "contract", label: "Contrato" },
  { value: "ans_certificate", label: "Certificado ANS" },
  { value: "authorization", label: "Autorização" },
  { value: "financial", label: "Financeiro" },
  { value: "legal", label: "Legal" },
  { value: "identification", label: "Identificação" },
  { value: "agreement", label: "Acordo" },
  { value: "technical", label: "Técnico" },
  { value: "other", label: "Outro" }
]

// Defina os tipos para os procedimentos TUSS
const procedureSchema = z.object({
  tuss_id: z.number(),
  initial_price: z.number(),
  status: z.string()
});

// Tipos
interface EntityDocumentType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_required: boolean;
  is_active: boolean;
  expiration_alert_days: number | null;
}

interface PhoneField {
  number: string;
  type: 'mobile' | 'landline';
}

interface DocumentField {
  type_id: number;
  file: File | null;
  file_url?: string;
  name?: string;
  id?: number;
  expiration_date?: string;
  observation?: string;
}

// Atualizar o schema do documento - versão simplificada para evitar problemas com arquivos existentes
const documentSchema = z.object({
  type_id: z.number({
    required_error: "Tipo de documento é obrigatório",
  }),
  // Use z.any() para aceitar qualquer valor (incluindo null, File, ou undefined)
  // A validação será feita manualmente em validateRequiredDocuments
  file: z.any(),
  file_url: z.string().optional(),
  expiration_date: z.string().optional(),
  observation: z.string().optional()
});

// Update the form schema to handle conditional fields
type BaseFormFields = {
  name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  phones: {
    number: string;
    type: 'mobile' | 'landline' | 'whatsapp' | 'fax';
  }[];
  logo?: File | null;
};

type ParentFormFields = BaseFormFields & {
  cnpj: string;
  municipal_registration?: string;
  password?: string;
  ans_code: string;
  description: string;
  legal_representative_name: string;
  legal_representative_cpf: string;
  legal_representative_position: string;
  legal_representative_email: string;
  legal_representative_password?: string;
  legal_representative_password_confirmation?: string;
  operational_representative_name: string;
  operational_representative_cpf: string;
  operational_representative_position: string;
  operational_representative_email: string;
  operational_representative_password?: string;
  operational_representative_password_confirmation?: string;
  documents: {
    type_id: number;
    file: File | null;
    file_url?: string;
    expiration_date?: string;
    observation?: string;
  }[];
};

type FormValues = BaseFormFields | ParentFormFields;

// Update the form schema based on isChildPlan
const getFormSchema = (isChildPlan: boolean): z.ZodType<FormValues> => {
  const baseSchema = {
    name: z.string().min(1, "Nome é obrigatório"),
    email: z.string().email("E-mail inválido"),
    address: z.string().min(1, "Endereço é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    state: z.string().min(2, "Estado é obrigatório"),
    postal_code: z.string().min(8, "CEP inválido"),
    phones: z.array(z.object({
      number: z.string().min(1, "Número de telefone é obrigatório"),
      type: z.enum(['mobile', 'landline', 'whatsapp', 'fax'], {
        required_error: "Tipo de telefone é obrigatório"
      })
    }))
  };

  if (!isChildPlan) {
    return z.object({
      ...baseSchema,
      cnpj: z.string().min(14, "CNPJ inválido"),
      municipal_registration: z.string()
        .min(1, "Inscrição municipal é obrigatória")
        .max(15, "Inscrição municipal deve ter no máximo 15 caracteres")
        .regex(/^\d+$/, "Inscrição municipal deve conter apenas números"),
      password: z.string().optional(),
      ans_code: z.string().min(1, "Código ANS é obrigatório"),
      description: z.string(),
      legal_representative_name: z.string().min(1, "Nome do representante legal é obrigatório"),
      legal_representative_cpf: z.string().min(11, "CPF inválido"),
      legal_representative_position: z.string().min(1, "Cargo do representante legal é obrigatório"),
      legal_representative_email: z.string().email("E-mail do representante legal inválido"),
      legal_representative_password: z.string().optional(),
      legal_representative_password_confirmation: z.string().optional(),
      operational_representative_name: z.string().min(1, "Nome do representante operacional é obrigatório"),
      operational_representative_cpf: z.string().min(11, "CPF inválido"),
      operational_representative_position: z.string().min(1, "Cargo do representante operacional é obrigatório"),
      operational_representative_email: z.string().email("E-mail do representante operacional inválido"),
      operational_representative_password: z.string().optional(),
      operational_representative_password_confirmation: z.string().optional(),
      documents: z.array(z.object({
        type_id: z.number(),
        file: z.any(),
        file_url: z.string().optional(),
        expiration_date: z.string().optional(),
        observation: z.string().optional(),
      })).optional(),
    });
  }

  return z.object(baseSchema);
};

// Interfaces para Campos Field Array
interface ProcedureField {
  id?: string;
  tuss_id: number;
  tuss_code: string;
  name: string;
  initial_price: number;
  status: "pending" | "negotiating" | "accepted" | "rejected";
}

// Interface for procedimento TUSS
interface TussProcedure {
  id: number
  code: string
  name: string
  type: string
  description?: string
}

// Interface for HealthPlanForm props
interface HealthPlanFormProps {
  healthPlanId?: number;
  initialData?: any;
  isChildPlan?: boolean;
  parentPlanId?: string;
}

// Adicionar um tradutor de mensagens de erro
const translateError = (errorMsg: string): string => {
  // Mapeamento de erros comuns de validação do Laravel
  const errorTranslations: Record<string, string> = {
    // Erros genéricos
    'Validation error': 'Erro de validação',
    'Failed to create health plan': 'Falha ao criar plano de saúde',
    'Failed to update health plan': 'Falha ao atualizar plano de saúde',
    'The given data was invalid': 'Os dados fornecidos são inválidos',
    
    // Campos específicos
    'The name field is required': 'O campo nome é obrigatório',
    'The cnpj field is required': 'O campo CNPJ é obrigatório',
    'The cnpj has already been taken': 'Este CNPJ já está cadastrado',
    'The email field is required': 'O campo e-mail é obrigatório',
    'The email must be a valid email address': 'O e-mail deve ser um endereço válido',
    'The email has already been taken': 'Este e-mail já está em uso',
    'The legal representative email has already been taken': 'O e-mail do representante legal já está em uso',
    'The operational representative email has already been taken': 'O e-mail do representante operacional já está em uso',
    'The legal representative name field is required': 'O nome do representante legal é obrigatório',
    'The legal representative cpf field is required': 'O CPF do representante legal é obrigatório',
    'The legal representative position field is required': 'O cargo do representante legal é obrigatório',
    'The legal representative email field is required': 'O e-mail do representante legal é obrigatório',
    'The legal representative password field is required': 'A senha do representante legal é obrigatória',
    'The operational representative name field is required': 'O nome do representante operacional é obrigatório',
    'The operational representative cpf field is required': 'O CPF do representante operacional é obrigatório',
    'The operational representative position field is required': 'O cargo do representante operacional é obrigatório',
    'The operational representative email field is required': 'O e-mail do representante operacional é obrigatório',
    'The operational representative password field is required': 'A senha do representante operacional é obrigatória',
    'The address field is required': 'O campo endereço é obrigatório',
    'The city field is required': 'O campo cidade é obrigatório',
    'The state field is required': 'O campo estado é obrigatório',
    'The postal code field is required': 'O campo CEP é obrigatório',
    'The password must be at least 8 characters': 'A senha deve ter no mínimo 8 caracteres',
    'The password confirmation does not match': 'A confirmação de senha não corresponde',
    'The legal representative password confirmation does not match': 'A confirmação de senha do representante legal não corresponde',
    'The operational representative password confirmation does not match': 'A confirmação de senha do representante operacional não corresponde',
    'Validation failed': 'Falha na validação',
    'Unauthorized': 'Não autorizado',
    'The logo must be an image': 'O logo deve ser uma imagem',
    'The logo must not be greater than 2048 kilobytes': 'O logo deve ter no máximo 2MB',
    'Failed to upload documents': 'Falha ao enviar documentos',
    'Field is required': 'Campo obrigatório',
    'must be string': 'deve ser texto',
    'must be an email address': 'deve ser um endereço de e-mail válido',
    'Documentos Obrigatórios': 'Documentos Obrigatórios',
    
    // Mensagens para o botão de debug
    'Validação': 'Validação',
    'Formulário contém erros. Verifique os campos.': 'Formulário contém erros. Verifique os campos destacados em vermelho.',
    'Validação OK': 'Validação Bem-Sucedida',
    'Falha na Validação': 'Falha na Validação',
    'Todos os documentos obrigatórios foram fornecidos': 'Todos os documentos obrigatórios foram fornecidos corretamente.',
    'Existem problemas com os documentos obrigatórios': 'Há problemas com os documentos obrigatórios. Verifique os campos destacados.'
  };

  // Tentar encontrar tradução exata
  if (errorMsg in errorTranslations) {
    return errorTranslations[errorMsg];
  }

  // Procurar por correspondências parciais
  for (const [key, translation] of Object.entries(errorTranslations)) {
    if (errorMsg.includes(key)) {
      return errorMsg.replace(key, translation);
    }
  }

  // Para erros de campo específicos no formato Laravel
  const fieldRegex = /The (\w+) field is required/;
  const match = errorMsg.match(fieldRegex);
  if (match) {
    const field = match[1];
    const fieldTranslations: Record<string, string> = {
      name: 'nome',
      cnpj: 'CNPJ',
      email: 'e-mail',
      password: 'senha',
      ans_code: 'código ANS',
      description: 'descrição',
      address: 'endereço',
      city: 'cidade',
      state: 'estado',
      postal_code: 'CEP'
    };
    
    const translatedField = fieldTranslations[field] || field;
    return `O campo ${translatedField} é obrigatório`;
  }

  // Retornar a mensagem original se não houver tradução
  return errorMsg;
};

// Função para processar e traduzir erros da API
const processApiErrors = (error: any): string => {
  console.log("Processando erro da API:", error);
  
  if (error.response?.data?.errors) {
    // Processar múltiplos erros de validação do Laravel
    const errorMessages: string[] = [];
    const errors = error.response.data.errors;
    
    Object.keys(errors).forEach(field => {
      // Traduzir o nome do campo
      const fieldTranslations: Record<string, string> = {
        name: 'Nome',
        cnpj: 'CNPJ',
        email: 'E-mail',
        password: 'Senha',
        ans_code: 'Código ANS',
        description: 'Descrição',
        address: 'Endereço',
        city: 'Cidade',
        state: 'Estado',
        postal_code: 'CEP',
        legal_representative_name: 'Nome do Representante Legal',
        legal_representative_cpf: 'CPF do Representante Legal',
        legal_representative_email: 'E-mail do Representante Legal',
        operational_representative_name: 'Nome do Representante Operacional',
        operational_representative_cpf: 'CPF do Representante Operacional',
        operational_representative_email: 'E-mail do Representante Operacional'
      };
      
      const translatedField = fieldTranslations[field] || field;
      
      errors[field].forEach((errorMsg: string) => {
        const translatedMsg = translateError(errorMsg);
        errorMessages.push(`${translatedField}: ${translatedMsg}`);
      });
    });
    
    return errorMessages.join('. ');
  } else if (error.response?.data?.message) {
    // Processar mensagem de erro única
    return translateError(error.response.data.message);
  } else if (error.message) {
    // Processar mensagem de erro genérica
    return translateError(error.message);
  }
  
  return "Ocorreu um erro desconhecido";
};

// After the FormValues type definition, add field render types
type FieldRenderProps<T extends FieldPath<FormValues> = FieldPath<FormValues>> = {
  field: ControllerRenderProps<FormValues, T>;
  fieldState: {
    invalid: boolean;
    isTouched: boolean;
    isDirty: boolean;
    error?: FieldError;
  };
};

// Adicione esta função de tradução de erros de validação
const translateValidationError = (field: string, message: string): string => {
  const fieldTranslations: Record<string, string> = {
    name: "Nome",
    cnpj: "CNPJ",
    email: "E-mail",
    ans_code: "Código ANS",
    description: "Descrição",
    address: "Endereço",
    city: "Cidade",
    state: "Estado",
    postal_code: "CEP",
    legal_representative_name: "Nome do Representante Legal",
    legal_representative_cpf: "CPF do Representante Legal",
    legal_representative_email: "E-mail do Representante Legal",
    operational_representative_name: "Nome do Representante Operacional",
    operational_representative_cpf: "CPF do Representante Operacional",
    operational_representative_email: "E-mail do Representante Operacional"
  };

  const messageTranslations: Record<string, string> = {
    "The name field is required": "O campo nome é obrigatório",
    "The description field is required": "O campo descrição é obrigatório",
    "The cnpj field is required": "O campo CNPJ é obrigatório",
    "The email field is required": "O campo e-mail é obrigatório",
    "The ans_code field is required": "O código ANS é obrigatório",
    "validation.required": "Este campo é obrigatório",
    "The selected documents.0.type is invalid": "O tipo do documento 1 é inválido",
    "The selected documents.1.type is invalid": "O tipo do documento 2 é inválido",
    "The selected documents.2.type is invalid": "O tipo do documento 3 é inválido",
    "The selected documents.3.type is invalid": "O tipo do documento 4 é inválido",
    "The selected documents.4.type is invalid": "O tipo do documento 5 é inválido",
    "The selected documents.5.type is invalid": "O tipo do documento 6 é inválido",
    "The selected documents.6.type is invalid": "O tipo do documento 7 é inválido",
    "The selected documents.7.type is invalid": "O tipo do documento 8 é inválido",
    "The selected documents.8.type is invalid": "O tipo do documento 9 é inválido",
    "The selected documents.9.type is invalid": "O tipo do documento 10 é inválido"
  };

  const translatedField = fieldTranslations[field] || field;
  const translatedMessage = messageTranslations[message] || message;

  return `${translatedField}: ${translatedMessage}`;
};

export function HealthPlanForm({ healthPlanId, initialData, isChildPlan = false, parentPlanId }: HealthPlanFormProps) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [documentFiles, setDocumentFiles] = useState<(File | null)[]>([]);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("basic-info");
  const [showTussDialog, setShowTussDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [navigationPath, setNavigationPath] = useState<string | null>(null);
  const [cidadesDoEstado, setCidadesDoEstado] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [citySearchTerm, setCitySearchTerm] = useState<string>("");
  const FORM_STORAGE_KEY = `health-plan-form-${healthPlanId || 'new'}`;
  const canCreateHealthPlan = hasPermission("create health plans");

  // Initialize form with the correct schema based on isChildPlan
  const form = useForm<FormValues>({
    resolver: zodResolver(getFormSchema(isChildPlan)),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      postal_code: initialData?.postal_code || "",
      phones: initialData?.phones || [{ number: "", type: "mobile" }],
      ...(isChildPlan ? {} : {
        cnpj: initialData?.cnpj || "",
        municipal_registration: initialData?.municipal_registration || "",
        password: "",
        ans_code: initialData?.ans_code || "",
        description: initialData?.description || "",
        legal_representative_name: initialData?.legal_representative_name || "",
        legal_representative_cpf: initialData?.legal_representative_cpf || "",
        legal_representative_position: initialData?.legal_representative_position || "",
        legal_representative_email: initialData?.legal_representative_email || "",
        legal_representative_password: "",
        legal_representative_password_confirmation: "",
        operational_representative_name: initialData?.operational_representative_name || "",
        operational_representative_cpf: initialData?.operational_representative_cpf || "",
        operational_representative_position: initialData?.operational_representative_position || "",
        operational_representative_email: initialData?.operational_representative_email || "",
        operational_representative_password: "",
        operational_representative_password_confirmation: "",
        documents: initialData?.documents || [],
      })
    },
    mode: "onBlur",
    criteriaMode: "all",
    shouldFocusError: true
  });

  // Handle form submission
  const onSubmit = async (formData: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Create FormData object
      const data = new FormData();
      
      // Add basic fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'phones' && key !== 'documents' && value !== undefined && value !== null) {
          data.append(key, value.toString());
        }
      });
      
      // Add phones
      formData.phones.forEach((phone, index) => {
        data.append(`phones[${index}][number]`, phone.number);
        data.append(`phones[${index}][type]`, phone.type);
      });
      
      // Add documents for parent plans
      if (!isChildPlan && 'documents' in formData) {
        formData.documents.forEach((doc, index) => {
          if (doc.file) {
            data.append(`documents[${index}][file]`, doc.file);
          }
          if (doc.type_id) {
            data.append(`documents[${index}][type_id]`, doc.type_id.toString());
          }
          if (doc.expiration_date) {
            data.append(`documents[${index}][expiration_date]`, doc.expiration_date);
          }
          if (doc.observation) {
            data.append(`documents[${index}][observation]`, doc.observation);
          }
        });
      }
      
      // Add parent_id for child plans
      if (isChildPlan && parentPlanId) {
        data.append('parent_id', parentPlanId);
      }
      
      // Add logo if present
      if (logoFile) {
        data.append('logo', logoFile);
      }
      
      const response = await (healthPlanId ? api.put(`/health-plans/${healthPlanId}`, data, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        }
      }) : api.post('/health-plans', data, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        }
      }));
      
      // Check for success in the response data
      if (response.data?.success === true) {
        toast({
          title: healthPlanId ? "Plano atualizado" : "Plano criado",
          description: response.data.message || (healthPlanId 
            ? "O plano de saúde foi atualizado com sucesso"
            : "O plano de saúde foi criado com sucesso"),
          variant: "success",
        });
        
        router.push('/health-plans');
        return;
      }
      
      // If we get here and don't have success: true, treat as error
      throw new Error(response.data?.message || 'Falha ao salvar o plano de saúde');
      
    } catch (error: any) {
      console.error('Error saving health plan:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || error.message || "Ocorreu um erro ao salvar o plano de saúde",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch for form errors to debug
  const formErrors = form.formState.errors
  
  // Field arrays usando o tipo inferido do Zod
  const { fields: phoneFields, append: appendPhone, remove: removePhone, replace: replacePhones } = useFieldArray({
    control: form.control,
    name: "phones"
  })
  
  // Obter os tipos de documentos usando o hook com o tipo de entidade correta
  const { data: documentTypes = [] } = useEntityDocumentTypes("health_plan");

  // Field arrays usando o tipo inferido do Zod
  const { fields: documentFields, append: appendDocument, remove: removeDocument } = useFieldArray({
    control: form.control,
    name: "documents"
  })

  // Ajustar a função showToast para incluir ícones nos toasts
  const showToast = (props: { 
    title: string; 
    description: string; 
    variant?: "default" | "destructive" | "success" | "warning" | "info" 
  }) => {
    // Traduzir título e descrição
    const translatedTitle = translateError(props.title);
    const translatedDescription = translateError(props.description);
    
    // Adicionar ícones baseados no tipo de toast
    let icon;
    switch (props.variant) {
      case "destructive":
        icon = <AlertCircle className="h-4 w-4" />;
        break;
      case "success":
        icon = <CheckCircle className="h-4 w-4" />;
        break;
      case "warning":
        icon = <AlertTriangle className="h-4 w-4" />;
        break;
      case "info":
        icon = <InfoIcon className="h-4 w-4" />;
        break;
      default:
        icon = <InfoIcon className="h-4 w-4" />;
    }
    
    // Criar o toast com ícones
    toast({
      variant: props.variant,
      title: (
        <div className="flex items-center gap-2">
          {icon}
          <span>{translatedTitle}</span>
        </div>
      ) as any,
      description: translatedDescription,
    });
  };
  
  // Corrigir a função validateRequiredDocuments para não depender de um parâmetro de skip
  const validateRequiredDocuments = useCallback(() => {
    if (!documentTypes?.length) {
      return true; // Nada para validar
    }

    const requiredTypes = documentTypes.filter(dt => dt.is_required);
    if (requiredTypes.length === 0) {
      return true; // Nenhum documento obrigatório
    }

    const currentDocs = form.getValues("documents") || [];
    
    let validationFailed = false;
    let failureMessages = [];
    
    for (const requiredType of requiredTypes) {
      // Checar se existe um documento do tipo requerido com arquivo válido ou com file_url (documento já existente)
      const doc = currentDocs.find(d => d.type_id === requiredType.id);
      const hasValidDocument = doc && (
        (doc.file instanceof File) || 
        (doc.file_url && typeof doc.file_url === 'string')
      );

      if (!hasValidDocument) {
        const errorMsg = `O documento "${requiredType.name}" é obrigatório`;
        failureMessages.push(errorMsg);
        validationFailed = true;
      } else if (requiredType.expiration_alert_days) {
        // Se tem documento, verificar data de expiração se necessário
        if (!doc.expiration_date) {
          const errorMsg = `O documento "${requiredType.name}" requer data de expiração`;
          failureMessages.push(errorMsg);
          validationFailed = true;
        } else {
          // Verificar se a data é válida e está no futuro
          const expDate = new Date(doc.expiration_date);
          const today = new Date();
          if (isNaN(expDate.getTime()) || expDate < today) {
            const errorMsg = `A data de expiração para "${requiredType.name}" deve ser no futuro`;
            failureMessages.push(errorMsg);
            validationFailed = true;
          }
        }
      }
    }
    
    if (validationFailed) {
      const errorMessage = failureMessages.join(', ');
      
      showToast({
        title: "Documentos Obrigatórios",
        description: errorMessage,
        variant: "warning"
      });
      
      return false;
    }
    
    return true;
  }, [documentTypes, form, showToast]);

  // Function for special handling of update submissions (bypassing document validation)
  const handleUpdateSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      const formData = new FormData();
      
      // Add basic fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'documents' && key !== 'phones' && key !== 'logo' && value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      // Add logo
      if (logoFile instanceof File && logoFile.size > 0) {
        formData.append('logo', logoFile);
      }

      // Add phones
      data.phones.forEach((phone, index) => {
        formData.append(`phones[${index}][number]`, phone.number);
        formData.append(`phones[${index}][type]`, phone.type);
      });

      // Add only new documents if this is a parent plan
      if ('documents' in data) {
        let newDocCount = 0;
        
        for (let i = 0; i < documentFiles.length; i++) {
          const docFile = documentFiles[i];
          if (docFile instanceof File && docFile.size > 0) {
            const doc = data.documents[i];
            if (!doc || !doc.type_id) continue;
            
            const type = documentTypeApiMap[Number(doc.type_id)] || 'other';
            const typeName = documentTypes.find(dt => dt.id === Number(doc.type_id))?.name || 'Documento';
            
            formData.append(`new_documents[${newDocCount}][file]`, docFile);
            formData.append(`new_documents[${newDocCount}][type]`, type);
            formData.append(`new_documents[${newDocCount}][description]`, docFile.name);
            formData.append(`new_documents[${newDocCount}][name]`, docFile.name);
            
            if (doc.expiration_date) {
              formData.append(`new_documents[${newDocCount}][expiration_date]`, doc.expiration_date);
            }
            
            if (doc.observation) {
              formData.append(`new_documents[${newDocCount}][observation]`, doc.observation);
            }
            
            newDocCount++;
          }
        }
        
        if (newDocCount > 0) {
          formData.append('new_document_count', String(newDocCount));
        }
      }

      // Send request
      const response = await api.put(`/health-plans/${healthPlanId}`, formData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        }
      });
      
      showToast({
        title: "Sucesso",
        description: "Plano de saúde atualizado com sucesso",
        variant: "success"
      });
      
      router.push('/health-plans');
      
    } catch (error: any) {
      console.error("Erro ao atualizar:", error);
      const errorMsg = error.response?.data?.message || "Erro ao atualizar plano de saúde";
      showToast({
        title: "Erro",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Adjust the handleFormSubmit to use a different approach for updates
  const handleFormSubmit = async (formData: FormValues) => {
    try {
      if (healthPlanId) {
        await handleUpdateSubmit(formData);
      } else {
        if (!validateRequiredDocuments()) {
          return;
        }
        await onSubmit(formData);
      }
    } catch (error) {
      showToast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar o formulário. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para lidar com erros do formulário
  const handleFormError = (errors: FieldErrors<FormValues>) => {
    if (Object.keys(errors).length > 0) {
      let tabToFocus = "basic-info";
      
      if (errors.name || errors.email || 
          errors.address || errors.city || errors.state || 
          errors.postal_code || errors.phones) {
        tabToFocus = "basic-info";
      } 
      else if ('legal_representative_name' in errors || 'legal_representative_cpf' in errors || 
               errors.address || errors.city || errors.state || 
               errors.postal_code || errors.phones) {
        tabToFocus = "additional-info";
      } 
      else if ('documents' in errors) {
        tabToFocus = "documents";
      }
      
      setActiveTab(tabToFocus);
      console.log("Mudando para a aba:", tabToFocus);
    }
  };

  // Função para lidar com erros de validação
  const handleFormSubmitError = (errors: FieldErrors<FormValues>) => {
    console.log('Erros de validação do formulário:', errors);
    
    // Extrair a primeira mensagem de erro para o toast
    const firstErrorKey = Object.keys(errors)[0];
    let errorMessage = "Verifique os campos destacados";
    
    if (firstErrorKey) {
      const error = errors[firstErrorKey as keyof FormValues];
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string;
      } else if (Array.isArray(error) && error.length > 0 && error[0]?.message) {
        errorMessage = error[0].message;
      }
    }
    
    showToast({
      title: "Erro de validação",
      description: errorMessage,
      variant: "warning"
    });
    
    // Mudar para a aba com erros
    handleFormError(errors);
  };
  
  // Memoizar a função de atualização de cidades para evitar recriações desnecessárias
  const atualizarCidadesPorEstado = useCallback((uf: string) => {
    if (!uf) {
      setCidadesDoEstado([]);
      setFilteredCities([]);
      return;
    }

    // Buscar o estado nos dados
    const estadoEncontrado = estadosCidadesData.estados.find(
      estado => estado.sigla === uf
    );

    if (estadoEncontrado) {
      const cidades = estadoEncontrado.cidades;
      setCidadesDoEstado(cidades);
      setFilteredCities(cidades); // Inicialmente, mostra todas as cidades
    } else {
      setCidadesDoEstado([]);
      setFilteredCities([]);
    }
  }, []);

  // Manipular tentativa de navegação para fora do formulário
  const handleNavigation = (path: string) => {
    const formHasChanges = Object.keys(form.formState.dirtyFields).length > 0;
    
    if (formHasChanges) {
      setNavigationPath(path);
      setShowExitDialog(true);
    } else {
      router.push(path);
    }
  };

  // Limpar dados do localStorage e navegar
  const handleConfirmExit = () => {
    localStorage.removeItem(FORM_STORAGE_KEY);
    if (navigationPath) {
      router.push(navigationPath);
    } else {
      router.back();
    }
    setShowExitDialog(false);
  };

  // Add this ref near other refs at the top of component
  const formInitializedRef = useRef(false);

  // Modify the useEffect that populates form data
  useEffect(() => {
    // Skip if already initialized
    if (formInitializedRef.current) {
      return;
    }
    
    const fetchHealthPlan = async () => {
      try {
        // If initialData is provided, use it directly
        if (initialData) {
          console.log("Using provided initialData:", initialData);
          
          // Map the data to the form structure
          const formValues = {
            name: initialData.name || "",
            email: initialData.email || "",
            address: initialData.address || "",
            city: initialData.city || "",
            state: initialData.state || "",
            postal_code: initialData.postal_code || "",
            phones: Array.isArray(initialData.phones) ? initialData.phones : [],
            ...(isChildPlan ? {} : {
              cnpj: initialData.cnpj || "",
              municipal_registration: initialData.municipal_registration || "",
              password: initialData.password || "",
              ans_code: initialData.ans_code || "",
              description: initialData.description || "",
              legal_representative_name: initialData.legal_representative_name || "",
              legal_representative_cpf: initialData.legal_representative_cpf || "",
              legal_representative_position: initialData.legal_representative_position || "",
              legal_representative_email: initialData.legal_representative?.email || "",
              legal_representative_password: initialData.legal_representative_password || "",
              legal_representative_password_confirmation: initialData.legal_representative_password_confirmation || "",
              operational_representative_name: initialData.operational_representative_name || "",
              operational_representative_cpf: initialData.operational_representative_cpf || "",
              operational_representative_position: initialData.operational_representative_position || "",
              operational_representative_email: initialData.operational_representative?.email || "",
              operational_representative_password: initialData.operational_representative_password || "",
              operational_representative_password_confirmation: initialData.operational_representative_password_confirmation || "",
              documents: [],
            }),
          };
          
          form.reset(formValues);
          
          // Update the logo preview if it exists
          if (initialData.logo) {
            setLogoPreview(getStorageUrl(initialData.logo));
          }

          // Process existing documents, if available
          if (Array.isArray(initialData.documents) && initialData.documents.length > 0) {
            console.log("Processing documents:", initialData.documents);
            
            const formattedDocs = initialData.documents.map((doc: any) => ({
              type_id: doc.entity_document_type_id || 0,
              file: null,
              file_url: getStorageUrl(doc.file_path),
              name: doc.name || doc.file_name || "Documento",
              expiration_date: doc.expiration_date || "",
              observation: doc.observation || ""
            }));
            
            form.setValue('documents', formattedDocs);
          }
          
          // Mark as initialized
          formInitializedRef.current = true;
          return;
        }
        
        // If no initialData is provided and we're creating a new health plan, use defaults
        if (!healthPlanId) {
          form.reset({
            name: "",
            email: "",
            address: "",
            city: "",
            state: "",
            postal_code: "",
            phones: [{ number: "", type: "mobile" }],
            ...(isChildPlan ? {} : {
              cnpj: "",
              municipal_registration: "",
              password: "",
              ans_code: "",
              description: "",
              legal_representative_name: "",
              legal_representative_cpf: "",
              legal_representative_position: "",
              legal_representative_email: "",
              legal_representative_password: "",
              legal_representative_password_confirmation: "",
              operational_representative_name: "",
              operational_representative_cpf: "",
              operational_representative_position: "",
              operational_representative_email: "",
              operational_representative_password: "",
              operational_representative_password_confirmation: "",
              documents: [],
            }),
          });
          
          // Mark as initialized
          formInitializedRef.current = true;
          return;
        }
        
        // If no initialData is provided, fetch from API
        if (healthPlanId) {
          const response = await api.get(`/health-plans/${healthPlanId}`);
          const data = response.data.data || response.data;

          // Mapear os dados para o formulário
          form.reset({
            name: data.name || "",
            email: data.email || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            postal_code: data.postal_code || "",
            phones: data.phones || [],
            ...(isChildPlan ? {} : {
              cnpj: data.cnpj || "",
              municipal_registration: data.municipal_registration || "",
              password: data.password || "",
              ans_code: data.ans_code || "",
              description: data.description || "",
              legal_representative_name: data.legal_representative_name || "",
              legal_representative_cpf: data.legal_representative_cpf || "",
              legal_representative_position: data.legal_representative_position || "",
              legal_representative_email: data.legal_representative?.email || "",
              legal_representative_password: data.legal_representative_password || "",
              legal_representative_password_confirmation: data.legal_representative_password_confirmation || "",
              operational_representative_name: data.operational_representative_name || "",
              operational_representative_cpf: data.operational_representative_cpf || "",
              operational_representative_position: data.operational_representative_position || "",
              operational_representative_email: data.operational_representative?.email || "",
              operational_representative_password: data.operational_representative_password || "",
              operational_representative_password_confirmation: data.operational_representative_password_confirmation || "",
              documents: [],
            }),
          });

          // Atualizar o preview do logo se existir
          if (data.logo_url) {
            setLogoPreview(getStorageUrl(data.logo_url));
          } else if (data.logo) {
            setLogoPreview(getStorageUrl(data.logo));
          }

          // Processar documentos existentes, se houver
          if (data.documents?.length) {
            const formattedDocs = data.documents.map((doc: any) => ({
              type_id: doc.entity_document_type_id || 0,
              file: null,
              file_url: getStorageUrl(doc.file_path),
              expiration_date: doc.expiration_date || "",
              observation: doc.observation || ""
            }));
            
            form.setValue('documents', formattedDocs);
          }
        }
        
        // Mark as initialized
        formInitializedRef.current = true;
      } catch (error) {
        console.error("Error fetching health plan:", error);
        showToast({
          title: "Erro",
          description: "Erro ao carregar os dados do plano de saúde",
          variant: "destructive"
        });
        // Mark as initialized even on error to prevent infinite retry
        formInitializedRef.current = true;
      }
    };

    fetchHealthPlan();
  // Explicitly type the dependencies to resolve linter errors
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthPlanId, form, initialData, showToast]);

  // Adicionar documentos obrigatórios que ainda não foram adicionados
  useEffect(() => {
    if (documentTypes?.length && documentFields.length === 0) {
      // Filtrar apenas os tipos de documentos obrigatórios
      const requiredDocsTypes = documentTypes
        .filter(dt => dt.is_required);
      
      // Adicionar documentos obrigatórios vazios
      requiredDocsTypes.forEach(docType => {
        appendDocument({
          type_id: docType.id,
          file: undefined as unknown as File,
          expiration_date: undefined,
          observation: undefined
        });
      });
    }
  }, [documentTypes, documentFields.length, appendDocument]);

  // Effect to initialize documentFiles array when fields change
  useEffect(() => {
    // Make sure documentFiles array has the same length as documentFields
    const newDocumentFiles = Array.from(documentFiles || []);
    
    // Resize the array if needed
    if (documentFields.length !== documentFiles.length) {
      // Fill new slots with null
      while (newDocumentFiles.length < documentFields.length) {
        newDocumentFiles.push(null);
      }
      // Truncate if too long
      if (newDocumentFiles.length > documentFields.length) {
        newDocumentFiles.length = documentFields.length;
      }
      
      setDocumentFiles(newDocumentFiles);
    }
    
    // Check if any fields have file_url but are missing the file property
    for (let i = 0; i < documentFields.length; i++) {
      const field = form.getValues(`documents.${i}`);
      if (field && field.file_url && !field.file) {
        // Set file field to null to avoid validation errors, since we have file_url
        form.setValue(`documents.${i}.file`, null);
      }
    }
  }, [documentFields.length, documentFiles, form]);

  // Log errors when they change (for debugging)
  useEffect(() => {
    if (Object.keys(formErrors).length > 0) {
      console.log("Form validation errors:", formErrors);
      
      // Automatically switch to the tab containing errors
      handleFormError(formErrors);
    }
  }, [formErrors]);

  // Efeito para atualizar as cidades quando o estado mudar
  useEffect(() => {
    // Verificar estado inicial
    const estadoAtual = form.getValues("state");
    if (estadoAtual) {
      atualizarCidadesPorEstado(estadoAtual);
    }
    
    // Escutar mudanças no campo "state"
    const subscription = form.watch((formValues) => {
      if (formValues && typeof formValues === 'object' && 'state' in formValues) {
        const novoEstado = formValues.state as string;
        if (novoEstado && novoEstado !== estadoAtual) {
          atualizarCidadesPorEstado(novoEstado);
        }
      }
    });
    
    // Limpar subscription
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [form, atualizarCidadesPorEstado]);

  // Update the handlers to use form.setValue
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = applyCNPJMask(value);
    form.setValue("cnpj" as any, maskedValue, { shouldValidate: true });
  };

  const handleMunicipalRegistrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = applyMunicipalRegistrationMask(value);
    form.setValue("municipal_registration" as any, maskedValue, { shouldValidate: true });
  };

  // Update handleCPFChange for proper typing
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string = "legal_representative_cpf") => {
    const value = e.target.value;
    const maskedValue = applyCPFMask(value);
    form.setValue(fieldName as any, maskedValue, { shouldValidate: true });
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = applyCEPMask(value);
    form.setValue("postal_code" as any, maskedValue, { shouldValidate: true });
    
    // Buscar endereço pelo CEP se tiver 8 dígitos
    if (unmask(maskedValue).length === 8) {
      fetchAddressByCEP(unmask(maskedValue));
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    const maskedValue = applyPhoneMask(value);
    form.setValue(`phones.${index}.number` as any, maskedValue, { shouldValidate: true });
  };

  // Atualizar a função filterCities para filtrar cidades do estado selecionado
  const filterCities = (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setFilteredCities(cidadesDoEstado); // Mostra todas as cidades se não houver busca
      return;
    }
    
    // Filtrar apenas entre as cidades do estado selecionado
    const filtered = cidadesDoEstado.filter(cidade => 
      cidade.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredCities(filtered);
  };

  // Atualizar a função fetchAddressByCEP para usar as cidades do JSON
  const fetchAddressByCEP = async (cep: string) => {
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        showToast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado",
          variant: "destructive"
        });
        return;
      }
      
      // Preencher os campos de endereço com os dados retornados
      form.setValue("address" as any, `${data.logradouro}${data.complemento ? ', ' + data.complemento : ''}, ${data.bairro}`);
      form.setValue("state" as any, data.uf);
      
      // Atualizar as cidades do estado
      atualizarCidadesPorEstado(data.uf);
      
      // Definir a cidade
      form.setValue("city" as any, data.localidade);
      setCitySearchTerm(data.localidade);
      
      showToast({
        title: "Endereço preenchido",
        description: "Os dados de endereço foram preenchidos automaticamente",
        variant: "success"
      });
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      showToast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível buscar o endereço pelo CEP",
        variant: "destructive"
      });
    }
  };

  // Adicionar função para converter File para Blob
  const fileToBlob = async (file: File): Promise<Blob> => {
    const buffer = await file.arrayBuffer();
    return new Blob([buffer], { type: file.type });
  };

  // Update the logo change handler
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (file.size > 2 * 1024 * 1024) {
        showToast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 2MB",
          variant: "destructive"
        });
        return;
      }

      console.log(`Logo selecionado: ${file.name} (${file.size} bytes, tipo: ${file.type})`);
      
      // Armazenar o arquivo no estado
      setLogoFile(file);
      
      // Definir o arquivo no formulário - usar as any para evitar erro de tipo
      form.setValue("logo" as any, file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setLogoPreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para lidar com erros de imagem
  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    const originalSrc = img.src;
    
    // Prevenir loop infinito
    img.onerror = null;

    // Se a URL atual começa com http e não é o placeholder
    if (originalSrc.startsWith('http') && !originalSrc.includes('data:image')) {
      if (initialData?.logo) {
        // Tentar com URL alternativa da logo
        img.src = getStorageUrl(initialData.logo);
        return;
      }
      
      // Ou tentar com URL do healthPlanId
      if (healthPlanId) {
        img.src = getStorageUrl(`health-plans/${healthPlanId}/logo`);
        return;
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam, remover preview
    setLogoPreview(null);
  }

  // Validação de documentos
  const validateDocument = (file: File): { isValid: boolean; error?: string } => {
    // Validação de tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        error: "O arquivo deve ter no máximo 10MB"
      };
    }

    // Validação de tipo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "Formato de arquivo inválido. Use PDF, DOC, DOCX, JPG ou PNG"
      };
    }

    return { isValid: true };
  };

  // Updated handleDocumentChange with proper typing
  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateDocument(file);
      if (!validation.isValid && validation.error) {
        showToast({
          title: "Erro",
          description: validation.error,
          variant: "destructive"
        });
        return;
      }

      console.log(`Documento ${index} selecionado: ${file.name} (${file.size} bytes, tipo: ${file.type})`);
      
      // Atualizar o array de documentos com o novo arquivo
      const newDocumentFiles = [...documentFiles];
      newDocumentFiles[index] = file;
      setDocumentFiles(newDocumentFiles);
      
      // Definir o arquivo no formulário com cast explícito
      form.setValue(`documents.${index}.file` as any, file);
      
      // Definir o nome do arquivo como descrição
      form.setValue(`documents.${index}.description` as any, file.name);
      
      // Limpar o file_url já que agora temos um novo arquivo
      form.setValue(`documents.${index}.file_url` as any, undefined);
      
      showToast({
        title: "Sucesso",
        description: "Documento adicionado com sucesso",
        variant: "success"
      });
    }
  };

  // Update handleDocumentTypeChange with proper typing
  const handleDocumentTypeChange = (value: string, index: number) => {
    const typeId = parseInt(value);
    const docType = documentTypes?.find(dt => dt.id === typeId);
    
    if (docType) {
      form.setValue(`documents.${index}.type_id` as any, typeId);
    }
  };

  const handleAddDocument = () => {
    appendDocument({
      type_id: 0,
      file: undefined as unknown as File,
      expiration_date: undefined,
      observation: undefined
    });
  };

  // Render documents function
  const renderDocuments = () => (
    <>
      {documentFields.map((field, index) => {
        const currentTypeId = form.getValues(`documents.${index}.type_id`);
        const currentDocType = documentTypes?.find(dt => dt.id === currentTypeId);
        const hasExistingFile = !!form.getValues(`documents.${index}.file_url`);
        
        if (!currentDocType?.is_required) return null;
        
        return (
          <div 
            key={field.id} 
            className="space-y-4 p-4 border border-red-100 rounded-lg bg-red-50/30"
          >
            <FormField
              control={form.control}
              name={`documents.${index}.type_id`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className="flex items-center">
                    {currentDocType.name}
                    <span className="text-red-500 ml-1 font-bold">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                  <FormMessage className={formErrorStyles} />
                </FormItem>
              )}
            />

            {hasExistingFile && (
              <div className="text-sm text-green-600 flex items-center gap-2 p-2 bg-green-50 rounded-md">
                <Check className="h-4 w-4" />
                Documento já enviado
              </div>
            )}

            <FormField
              control={form.control}
              name={`documents.${index}.file`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Arquivo
                    {!hasExistingFile && <span className="text-red-500 ml-1 font-bold">*</span>}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentChange(e, index)}
                    />
                  </FormControl>
                  <FormDescription>
                    {hasExistingFile ? 
                      "Você pode substituir o arquivo existente" : 
                      "Formatos aceitos: PDF, DOC, DOCX, JPG, PNG. Tamanho máximo: 10MB"}
                  </FormDescription>
                  <FormMessage className={formErrorStyles} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`documents.${index}.expiration_date`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Data de Expiração
                    {currentDocType?.expiration_alert_days && 
                      <span className="text-red-500 ml-1 font-bold">*</span>
                    }
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ''}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  {currentDocType?.expiration_alert_days && (
                    <FormDescription>
                      Este documento requer alerta de expiração {currentDocType.expiration_alert_days} dias antes do vencimento
                    </FormDescription>
                  )}
                  <FormMessage className={formErrorStyles} />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`documents.${index}.observation`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observação</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage className={formErrorStyles} />
                </FormItem>
              )}
            />
          </div>
        );
      })}
    </>
  );

  // Add missing type definitions and state
  // const [cidadesDoEstado, setCidadesDoEstado] = useState<string[]>([]);

  // Add documentTypeApiMap definition
  const documentTypeApiMap: Record<number, string> = {
    1: 'contract',
    2: 'ans_certificate',
    3: 'authorization',
    4: 'financial',
    5: 'legal',
    6: 'identification',
    7: 'agreement',
    8: 'technical',
    9: 'other'
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic-info" className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Informações Básicas
              </TabsTrigger>
              <TabsTrigger value="additional-info" className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> {isChildPlan ? 'Endereço e Contatos' : 'Informações Adicionais'}
              </TabsTrigger>
              {!isChildPlan && (
                <TabsTrigger value="documents" className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Documentos
                </TabsTrigger>
              )}
            </TabsList>

            {/* Notice about child plan if applicable */}
            {isChildPlan && parentPlanId && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <div className="flex items-center gap-2 text-blue-700">
                  <GitBranch className="h-5 w-5" />
                  <p className="text-sm font-medium">
                    Você está criando um plano filho. Algumas configurações serão herdadas do plano pai.
                  </p>
                </div>
              </div>
            )}

            {/* Basic Info Tab */}
            <TabsContent value="basic-info">
              <Card className="border-t-4 border-t-primary">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" /> 
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-6">
                  {/* Logo */}
                  <div className="flex items-center space-x-4">
                    {logoPreview && (
                      <img
                        src={logoPreview}
                        alt="Logo Preview"
                        className="w-20 h-20 object-contain"
                        onError={handleLogoError}
                      />
                    )}
                    <FormField
                      control={form.control}
                      name="logo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleLogoChange}
                            />
                          </FormControl>
                          <FormDescription>
                            Tamanho máximo: 2MB
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Nome */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Plano de Saúde<span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Digite o nome do plano" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email<span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="Digite o email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Only show these fields for non-child plans */}
                  {!isChildPlan && (
                    <>
                      {/* CNPJ */}
                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ<span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Digite o CNPJ"
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(applyCNPJMask(value));
                                }}
                                maxLength={18}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Inscrição Municipal */}
                      <FormField
                        control={form.control}
                        name="municipal_registration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inscrição Municipal<span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Digite a inscrição municipal"
                                maxLength={15}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/\D/g, '');
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormDescription>
                              Apenas números, máximo 15 caracteres
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Código ANS */}
                      <FormField
                        control={form.control}
                        name="ans_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código ANS<span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Digite o código ANS" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Descrição */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Digite uma descrição" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Additional Info Tab */}
            <TabsContent value="additional-info">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Only show Representatives section for non-child plans */}
                {!isChildPlan && (
                  <Card className="border-t-4 border-t-blue-500">
                    <CardHeader className="bg-muted/50">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-blue-500" /> 
                        Representantes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                      {/* Representante Legal */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <Badge className="bg-blue-600">Legal</Badge> Representante Legal
                        </h3>

                        <FormField
                          control={form.control}
                          name="legal_representative_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome<span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nome do representante legal" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="legal_representative_cpf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF<span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="CPF do representante legal"
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
                          name="legal_representative_position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cargo<span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Cargo do representante legal" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="legal_representative_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email<span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="Email do representante legal" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Representante Operacional */}
                      <div className="space-y-4 mt-8 pt-4 border-t">
                        <h3 className="text-lg font-medium flex items-center gap-2">
                          <Badge className="bg-blue-600">Operacional</Badge> Representante Operacional
                        </h3>

                        <FormField
                          control={form.control}
                          name="operational_representative_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome<span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Nome do representante operacional" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="operational_representative_cpf"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CPF<span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="CPF do representante operacional"
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
                          name="operational_representative_position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cargo<span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Cargo do representante operacional" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="operational_representative_email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email<span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="Email do representante operacional" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-6">
                  {/* Endereço */}
                  <Card className="border-t-4 border-t-green-500">
                    <CardHeader className="bg-muted/50">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-5 w-5 text-green-500" /> 
                        Endereço
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                      <FormField
                        control={form.control}
                        name="postal_code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP<span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Digite o CEP"
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const maskedValue = applyCEPMask(value);
                                  field.onChange(maskedValue);
                                  
                                  // Buscar endereço se CEP completo
                                  if (unmask(maskedValue).length === 8) {
                                    fetchAddressByCEP(unmask(maskedValue));
                                  }
                                }}
                                maxLength={9}
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
                          <FormItem>
                            <FormLabel>Endereço<span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Digite o endereço" />
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
                            <FormLabel>Estado<span className="text-red-500">*</span></FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue("city", "");
                                atualizarCidadesPorEstado(value);
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o estado" />
                              </SelectTrigger>
                              <SelectContent>
                                {estadosCidadesData.estados.map((estado) => (
                                  <SelectItem key={estado.sigla} value={estado.sigla}>
                                    {estado.nome} ({estado.sigla})
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
                            <FormLabel>Cidade<span className="text-red-500">*</span></FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={!form.getValues("state") || cidadesDoEstado.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a cidade" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {filteredCities.map((cidade) => (
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
                    </CardContent>
                  </Card>

                  {/* Telefones */}
                  <Card className="border-t-4 border-t-orange-500">
                    <CardHeader className="bg-muted/50">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Phone className="h-5 w-5 text-orange-500" /> 
                        Telefones
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium">Contatos</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendPhone({ number: "", type: "mobile" })}
                          className="bg-orange-50 hover:bg-orange-100 border-orange-200"
                        >
                          <Plus className="w-4 h-4 mr-2 text-orange-500" />
                          Adicionar Telefone
                        </Button>
                      </div>

                      {phoneFields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-4">
                          <FormField
                            control={form.control}
                            name={`phones.${index}.number`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Número</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Digite o número"
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
                              <FormItem className="flex-1">
                                <FormLabel>Tipo</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {PHONE_TYPES.map((type) => (
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

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePhone(index)}
                            disabled={phoneFields.length <= 1}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            {!isChildPlan && (
              <TabsContent value="documents">
                <Card className="border-t-4 border-t-primary">
                  <CardHeader className="bg-muted/50">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" /> 
                      Documentos Exigidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 pt-6">
                    {/* Required Documents List */}
                    <div className="bg-muted/30 p-4 rounded-lg mb-4">
                      <div className="text-sm text-muted-foreground mb-2">
                        Os seguintes documentos são obrigatórios para o cadastro do plano de saúde:
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {documentTypes
                          ?.filter(type => type.is_required)
                          .map(type => (
                            <div key={type.id} className="flex items-start gap-2">
                              <span className="text-red-500 font-bold">*</span>
                              <div>
                                <span className="font-medium">{type.name}</span>
                                {type.description && (
                                  <p className="text-sm text-muted-foreground">{type.description}</p>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Document Form Fields */}
                    <div className="space-y-6">
                      {renderDocuments()}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/health-plans')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !canCreateHealthPlan}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {healthPlanId ? 'Atualizar' : 'Criar'} Plano
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja mesmo sair?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas no formulário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>
              Descartar alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}