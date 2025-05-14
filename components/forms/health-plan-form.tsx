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
import { Loader2, Plus, Trash, SearchIcon, DollarSign, AlertCircle, CheckCircle, InfoIcon, Trash2, Building2, User, FileText, Phone, AlertTriangle, X, Check } from "lucide-react"
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

// Atualizar o schema do formulário
const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().min(14, "CNPJ inválido"),
  municipal_registration: z.string().optional(),
  email: z.string().email("E-mail inválido"),
  password: z.string().optional(),
  ans_code: z.string().min(1, "Código ANS é obrigatório"),
  description: z.string(),  
  logo: z.any().optional(), // Adicionar campo logo ao schema
  // Representante Legal
  legal_representative_name: z.string().min(1, "Nome do representante legal é obrigatório"),
  legal_representative_cpf: z.string().min(11, "CPF inválido"),
  legal_representative_position: z.string().min(1, "Cargo do representante legal é obrigatório"),
  legal_representative_email: z.string().email("E-mail do representante legal inválido"),
  legal_representative_password: z.string().optional(),
  legal_representative_password_confirmation: z.string().optional(),
  
  // Representante Operacional
  operational_representative_name: z.string().min(1, "Nome do representante operacional é obrigatório"),
  operational_representative_cpf: z.string().min(11, "CPF inválido"),
  operational_representative_position: z.string().min(1, "Cargo do representante operacional é obrigatório"),
  operational_representative_email: z.string().email("E-mail do representante operacional inválido"),
  operational_representative_password: z.string().optional(),
  operational_representative_password_confirmation: z.string().optional(),
  
  // Endereço
  postal_code: z.string().min(8, "CEP inválido"),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  
  // Arrays
  phones: z.array(z.object({
    number: z.string().min(1, "Número de telefone é obrigatório"),
    type: z.enum(['mobile', 'landline', 'whatsapp', 'fax'], {
      required_error: "Tipo de telefone é obrigatório"
    })
  })),
  
  documents: z.array(documentSchema)
}).superRefine((data, ctx) => {
  // Validar confirmação de senha do representante legal
  if (data.legal_representative_password && data.legal_representative_password !== data.legal_representative_password_confirmation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "As senhas não coincidem",
      path: ["legal_representative_password_confirmation"]
    });
  }
  
  // Validar confirmação de senha do representante operacional
  if (data.operational_representative_password && data.operational_representative_password !== data.operational_representative_password_confirmation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "As senhas não coincidem",
      path: ["operational_representative_password_confirmation"]
    });
  }
});

// Atualizar o tipo FormValues
type FormValues = z.infer<typeof formSchema>;

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

export function HealthPlanForm({ healthPlanId, initialData }: HealthPlanFormProps) {
  const router = useRouter()
  const { hasPermission } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [documentFiles, setDocumentFiles] = useState<(File | null)[]>([])
  
  // Debug initialData
  console.log("HealthPlanForm received initialData:", initialData);

  // Hook useToast
  const { toast } = useToast()
  
  // Mapear corretamente os tipos de documentos para os valores aceitos pela API
  const documentTypeApiMap: Record<number, string> = {
    1: "contract",
    2: "ans_certificate", 
    3: "authorization",
    4: "financial",
    5: "legal",
    6: "identification",
    7: "agreement",
    8: "technical",
    9: "other"
  };
  
  // Estados para TUSS e negociação
  const [activeTab, setActiveTab] = useState<string>("basic-info")
  const [tussProcedures, setTussProcedures] = useState<TussProcedure[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showTussDialog, setShowTussDialog] = useState(false)

  // Adicionar filtro de cidades
  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [citySearchTerm, setCitySearchTerm] = useState("");

  // Adicionar estado para armazenar as cidades do estado selecionado
  const [cidadesDoEstado, setCidadesDoEstado] = useState<string[]>([]);
  
  // Estado para o diálogo de confirmação de saída
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [navigationPath, setNavigationPath] = useState<string | null>(null);

  // Chave para o localStorage
  const FORM_STORAGE_KEY = `health-plan-form-${healthPlanId || 'new'}`;

  // Verificar se usuário tem permissão para criar planos
  const canCreateHealthPlan = hasPermission("create health plans")

  // Inicializar formulário com o tipo inferido do Zod
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      municipal_registration: "",
      email: "",
      password: "",
      ans_code: "",
      description: "",
      logo: null,
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
      address: "",
      city: "",
      state: "",
      postal_code: "",
      phones: [{ number: "", type: "mobile" }],
      documents: [],
    },
    mode: "onBlur",
    criteriaMode: "all",
    shouldFocusError: true
  })

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

      // Prepare basic data without documents
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

      // Add only new documents
      let newDocCount = 0;
      
      for (let i = 0; i < documentFiles.length; i++) {
        const docFile = documentFiles[i];
        // If it's a valid file, add it
        if (docFile instanceof File && docFile.size > 0) {
          const doc = data.documents[i];
          if (!doc || !doc.type_id) continue;
          
          const type = documentTypeApiMap[Number(doc.type_id)] || 'other';
          const typeName = documentTypes.find(dt => dt.id === Number(doc.type_id))?.name || 'Documento';
          
          formData.append(`new_documents[${newDocCount}][file]`, docFile);
          formData.append(`new_documents[${newDocCount}][type]`, type);
          formData.append(`new_documents[${newDocCount}][description]`, typeName);
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
      
      // Add document counter
      if (newDocCount > 0) {
        formData.append('new_document_count', String(newDocCount));
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
  const handleFormSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      // Special handling for updates to bypass document validation
      if (healthPlanId) {
        await handleUpdateSubmit(data as FormValues);
      } else {
        // For new health plans, use standard validation
        if (!validateRequiredDocuments()) {
          return;
        }
        await onSubmit(data);
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
      
      if (errors.name || errors.cnpj || errors.email || 
          errors.ans_code || errors.description) {
        tabToFocus = "basic-info";
      } 
      else if (errors.legal_representative_name || errors.legal_representative_cpf || 
               errors.address || errors.city || errors.state || 
               errors.postal_code || errors.phones) {
        tabToFocus = "additional-info";
      } 
      else if (errors.documents) {
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
      return;
    }

    // Buscar o estado nos dados
    const estadoEncontrado = estadosCidadesData.estados.find(
      estado => estado.sigla === uf
    );

    if (estadoEncontrado) {
      setCidadesDoEstado(estadoEncontrado.cidades);
    } else {
      setCidadesDoEstado([]);
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
            cnpj: initialData.cnpj || "",
            municipal_registration: initialData.municipal_registration || "",
            email: initialData.email || "",
            ans_code: initialData.ans_code || "",
            description: initialData.description || "",
            
            legal_representative_name: initialData.legal_representative_name || "",
            legal_representative_cpf: initialData.legal_representative_cpf || "",
            legal_representative_position: initialData.legal_representative_position || "",
            legal_representative_email: initialData.legal_representative?.email || "",
            
            operational_representative_name: initialData.operational_representative_name || "",
            operational_representative_cpf: initialData.operational_representative_cpf || "",
            operational_representative_position: initialData.operational_representative_position || "",
            operational_representative_email: initialData.operational_representative?.email || "",
            
            postal_code: initialData.postal_code || "",
            address: initialData.address || "",
            city: initialData.city || "",
            state: initialData.state || "",
            
            phones: Array.isArray(initialData.phones) ? initialData.phones : [],
            documents: [],
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
        
        // If no initialData is provided, fetch from API
        if (healthPlanId) {
          const response = await api.get(`/health-plans/${healthPlanId}`);
          const data = response.data.data || response.data;

          // Mapear os dados para o formulário
          form.reset({
            name: data.name || "",
            cnpj: data.cnpj || "",
            municipal_registration: data.municipal_registration || "",
            email: data.email || "",
            ans_code: data.ans_code || "",
            description: data.description || "",
            
            legal_representative_name: data.legal_representative_name || "",
            legal_representative_cpf: data.legal_representative_cpf || "",
            legal_representative_position: data.legal_representative_position || "",
            legal_representative_email: data.legal_representative?.email || "",
            
            operational_representative_name: data.operational_representative_name || "",
            operational_representative_cpf: data.operational_representative_cpf || "",
            operational_representative_position: data.operational_representative_position || "",
            operational_representative_email: data.operational_representative?.email || "",
            
            postal_code: data.postal_code || "",
            address: data.address || "",
            city: data.city || "",
            state: data.state || "",
            
            phones: data.phones || [],
            documents: [],
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
    if (searchTerm.length < 2) {
      setFilteredCities([]);
      return;
    }
    
    // Filtrar apenas entre as cidades do estado selecionado
    const filtered = cidadesDoEstado.filter(cidade => 
      cidade.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setFilteredCities(filtered.slice(0, 10));
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

  // Atualizar o onSubmit para melhorar o mapeamento de documentos
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Validar documentos obrigatórios
      if (!validateRequiredDocuments()) {
        setIsSubmitting(false);
        return;
      }

      // Usar FormData para envio de arquivos
      const formData = new FormData();
      
      // Adicionar campos básicos
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'documents' && key !== 'phones' && key !== 'logo' && value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      // Adicionar logo como arquivo independente
      if (logoFile instanceof File && logoFile.size > 0) {
        try {
          // Converter o arquivo para Blob antes de adicionar ao FormData
          const logoBlob = await fileToBlob(logoFile);
          formData.append('logo', logoBlob, logoFile.name);
        } catch (logoError) {
          console.error("Erro ao processar logo:", logoError);
        }
      }

      // Adicionar telefones
      data.phones.forEach((phone, index) => {
        formData.append(`phones[${index}][number]`, phone.number);
        formData.append(`phones[${index}][type]`, phone.type);
      });

      // Abordagem diferente para PUT vs POST
      if (healthPlanId) {
        // PUT request - só enviar documentos novos
        let newDocumentCount = 0;
        
        for (let index = 0; index < data.documents.length; index++) {
          const doc = data.documents[index];
          if (!doc.type_id) continue;
          
          // Obter o arquivo do array de documentFiles
          const docFile = documentFiles[index];
          
          // Apenas enviar arquivos novos
          if (docFile instanceof File && docFile.size > 0) {
            try {
              // Mapear o type_id para o valor aceito pela API
              const docTypeValue = documentTypeApiMap[Number(doc.type_id)] || 'other';
              const docTypeName = documentTypes.find(dt => dt.id === Number(doc.type_id))?.name || 'Documento';
              
              // Converter o arquivo para Blob
              const docBlob = await fileToBlob(docFile);
              
              // Adicionar o novo arquivo ao FormData
              const fieldPrefix = `new_documents[${newDocumentCount}]`;
              formData.append(`${fieldPrefix}[type]`, docTypeValue);
              formData.append(`${fieldPrefix}[description]`, docTypeName);
              formData.append(`${fieldPrefix}[name]`, docFile.name);
              formData.append(`${fieldPrefix}[file]`, docBlob, docFile.name);
              
              if (doc.expiration_date) {
                formData.append(`${fieldPrefix}[expiration_date]`, doc.expiration_date);
              }
              
              if (doc.observation) {
                formData.append(`${fieldPrefix}[observation]`, doc.observation);
              }
              
              newDocumentCount++;
            } catch (docError) {
              console.error(`Erro ao processar documento ${index}:`, docError);
            }
          }
        }
        
        // Indicar quantos documentos novos estamos enviando
        if (newDocumentCount > 0) {
          formData.append('new_document_count', String(newDocumentCount));
        }
      } else {
        // POST request - enviar todos os documentos
        for (let index = 0; index < data.documents.length; index++) {
          const doc = data.documents[index];
          if (!doc.type_id) continue;
          
          // Obter o documento do array de documentFiles
          const docFile = documentFiles[index];
          
          // Apenas processar documentos com arquivos
          if (docFile instanceof File && docFile.size > 0) {
            try {
              // Mapear o type_id para o valor aceito pela API
              const docTypeValue = documentTypeApiMap[Number(doc.type_id)] || 'other';
              const docTypeName = documentTypes.find(dt => dt.id === Number(doc.type_id))?.name || 'Documento';
              
              // Converter o arquivo para Blob
              const docBlob = await fileToBlob(docFile);
              
              // Adicionar o documento ao FormData
              formData.append(`documents[${index}][type]`, docTypeValue);
              formData.append(`documents[${index}][description]`, docTypeName);
              formData.append(`documents[${index}][name]`, docFile.name);
              formData.append(`documents[${index}][file]`, docBlob, docFile.name);
              
              if (doc.expiration_date) {
                formData.append(`documents[${index}][expiration_date]`, doc.expiration_date);
              }
              
              if (doc.observation) {
                formData.append(`documents[${index}][observation]`, doc.observation);
              }
            } catch (docError) {
              console.error(`Erro ao processar documento ${index}:`, docError);
            }
          }
        }
      }

      // Criar opções para a requisição
      const requestOptions = {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        }
      };

      // Log para debug - mostrar todos os campos do FormData
      console.log('==== CONTEÚDO FINAL DO FORMDATA ====');
      for (let pair of formData.entries()) {
        if (typeof pair[1] === 'object') {
          if ('name' in pair[1] && 'type' in pair[1] && 'size' in pair[1]) {
            console.log(`${pair[0]}: File: ${(pair[1] as any).name} (${(pair[1] as any).size} bytes, tipo: ${(pair[1] as any).type})`);
          } else if ('size' in pair[1] && 'type' in pair[1]) {
            console.log(`${pair[0]}: Blob: blob (${(pair[1] as any).size} bytes, tipo: ${(pair[1] as any).type})`);
          } else {
            console.log(`${pair[0]}: ${String(pair[1])}`);
          }
        } else {
          console.log(`${pair[0]}: ${String(pair[1])}`);
        }
      }

      // Enviar requisição para o backend
      let response;
      if (healthPlanId) {
        response = await api.put(`/health-plans/${healthPlanId}`, formData, requestOptions);
        showToast({
          title: "Sucesso",
          description: "Plano de saúde atualizado com sucesso",
          variant: "success"
        });
      } else {
        response = await api.post('/health-plans', formData, requestOptions);
        console.log("Resposta da API:", response.data);
        showToast({
          title: "Sucesso",
          description: "Plano de saúde cadastrado com sucesso",
          variant: "success"
        });
        // Limpar dados do localStorage após envio bem-sucedido
        localStorage.removeItem(FORM_STORAGE_KEY);
      }

      router.push('/health-plans');
    } catch (error: any) {
      console.error("Erro ao enviar formulário:", error);
      console.error("Detalhes da resposta:", error.response?.data);
      
      // Processar erros de validação específicos
      if (error.response?.data?.errors) {
        const errorMessages: string[] = [];
        const errors = error.response.data.errors;
        
        // Formatação de mensagens de erro amigáveis
        Object.keys(errors).forEach(field => {
          // Formatar o nome do campo para exibição
          let fieldName = field;
          
          // Melhorar exibição para campos de documentos
          if (field.includes('documents.')) {
            const match = field.match(/documents\.(\d+)\.(.+)/);
            if (match) {
              const index = parseInt(match[1]);
              const subfield = match[2];
              const subfieldDisplay = {
                file: "Arquivo",
                type: "Tipo", 
                description: "Descrição"
              }[subfield] || subfield;
              
              fieldName = `Documento ${index + 1} - ${subfieldDisplay}`;
            }
          } else {
            // Melhorar nomes de outros campos
            const fieldMapping: Record<string, string> = {
              logo: "Logo",
              name: "Nome",
              cnpj: "CNPJ",
              email: "Email",
              ans_code: "Código ANS"
            };
            fieldName = fieldMapping[field] || field;
          }
          
          // Adicionar mensagens traduzidas
          errors[field].forEach((msg: string) => {
            errorMessages.push(`${fieldName}: ${translateError(msg)}`);
          });
        });
        
        // Mostrar todas as mensagens de erro
        showToast({
          title: "Erro de validação",
          description: errorMessages.join('. '),
          variant: "destructive"
        });
      } else if (error.response?.data?.message) {
        showToast({
          title: "Erro",
          description: translateError(error.response.data.message),
          variant: "destructive"
        });
      } else if (error.message) {
        showToast({
          title: "Erro",
          description: translateError(error.message),
          variant: "destructive"
        });
      } else {
        showToast({
          title: "Erro",
          description: "Erro ao salvar o plano de saúde. Verifique os dados e tente novamente.",
          variant: "destructive"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Replace the TypedFormField definition
  const TypedFormField = FormField as any;

  // Update the renderDocuments function with explicit types
  const renderDocuments = () => {
    return documentFields.map((field, index) => {
      const currentTypeId = form.getValues(`documents.${index}.type_id`);
      const currentDocType = documentTypes?.find(dt => dt.id === currentTypeId);
      const hasExistingFile = !!form.getValues(`documents.${index}.file_url`);
      
      return (
        <div key={field.id} className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-end gap-4">
            <TypedFormField
              control={form.control}
              name={`documents.${index}.type_id`}
              render={({ field }: any) => (
                <FormItem className="flex-1">
                  <FormLabel>
                    Tipo de Documento
                    {currentDocType?.is_required && <span className="text-red-500">*</span>}
                  </FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => handleDocumentTypeChange(value, index)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes?.map((type) => (
                        <SelectItem
                          key={type.id}
                          value={type.id.toString()}
                          disabled={type.is_required && documentFields.some((f, i) => 
                            i !== index && form.getValues(`documents.${i}.type_id`) === type.id
                          )}
                        >
                          {type.name} {type.is_required && "(Obrigatório)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className={formErrorStyles} />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeDocument(index)}
              disabled={currentDocType?.is_required}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {hasExistingFile && (
            <div className="text-sm text-green-600 flex items-center gap-2 mb-2">
              <Check className="h-4 w-4" />
              Documento já enviado
            </div>
          )}

          <TypedFormField
            control={form.control}
            name={`documents.${index}.file`}
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>
                  Arquivo
                  {currentDocType?.is_required && !hasExistingFile && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(e) => handleDocumentChange(e, index)}
                  />
                </FormControl>
                <FormDescription>
                  {hasExistingFile ? "Você pode substituir o arquivo existente" : "Formatos aceitos: PDF, DOC, DOCX, JPG, PNG. Tamanho máximo: 10MB"}
                </FormDescription>
                <FormMessage className={formErrorStyles} />
              </FormItem>
            )}
          />

          <TypedFormField
            control={form.control}
            name={`documents.${index}.expiration_date`}
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>
                  Data de Expiração
                  {currentDocType?.expiration_alert_days && <span className="text-red-500">*</span>}
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

          <TypedFormField
            control={form.control}
            name={`documents.${index}.observation`}
            render={({ field }: any) => (
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
    });
  };

  // Separate useEffect to handle file_url in documents
  useEffect(() => {
    // Check if we have documentFields and the form is initialized
    if (documentFields.length > 0) {
      // Go through each document field
      documentFields.forEach((field, index) => {
        const docValue = form.getValues(`documents.${index}`);
        
        // If the document has a file_url but no file, set the file field to null
        if (docValue && docValue.file_url && !docValue.file) {
          form.setValue(`documents.${index}.file` as any, null, { shouldValidate: false });
        }
      });
    }
  }, [documentFields, form]);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form 
          onSubmit={form.handleSubmit(
            data => handleFormSubmit(data as FormValues), 
            handleFormSubmitError
          )} 
          className="space-y-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="basic-info" className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Informações Básicas
              </TabsTrigger>
              <TabsTrigger value="additional-info" className="text-base flex items-center gap-2">
                <User className="h-4 w-4" /> Informações Adicionais
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Documentos
              </TabsTrigger>
            </TabsList>

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
                    <TypedFormField
                      control={form.control}
                      name="logo"
                      render={({ field }: any) => (
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
                          <FormMessage className={formErrorStyles} />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Nome */}
                  <TypedFormField
                    control={form.control}
                    name="name"
                    render={({ field, fieldState }: any) => (
                      <FormItem>
                        <FormLabel>Nome do Plano de Saúde</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className={fieldState.error ? "border-destructive focus:ring-destructive" : ""}
                          />
                        </FormControl>
                        {fieldState.error ? (
                          <div className="flex items-center mt-1.5 text-destructive font-medium text-sm">
                            <AlertCircle className="h-4 w-4 mr-1.5" />
                            <span>{fieldState.error.message}</span>
                          </div>
                        ) : (
                          <FormMessage className={formErrorStyles} />
                        )}
                      </FormItem>
                    )}
                  />

                  {/* CNPJ */}
                  <TypedFormField
                    control={form.control}
                    name="cnpj"
                    render={({ field, fieldState }: any) => (
                      <FormItem>
                        <FormLabel>CNPJ</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={handleCNPJChange}
                            maxLength={18}
                            className={fieldState.error ? "border-destructive focus:ring-destructive" : ""}
                          />
                        </FormControl>
                        {fieldState.error ? (
                          <div className="flex items-center mt-1.5 text-destructive font-medium text-sm">
                            <AlertCircle className="h-4 w-4 mr-1.5" />
                            <span>{fieldState.error.message}</span>
                          </div>
                        ) : (
                          <FormMessage className={formErrorStyles} />
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Inscrição Municipal */}
                  <TypedFormField
                    control={form.control}
                    name="municipal_registration"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Inscrição Municipal</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={handleMunicipalRegistrationChange}
                          />
                        </FormControl>
                        <FormMessage className={formErrorStyles} />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <TypedFormField
                    control={form.control}
                    name="email"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email" 
                            className={formErrors.email ? "border-destructive focus:ring-destructive" : ""}
                          />
                        </FormControl>
                        <FormMessage className={formErrorStyles} />
                      </FormItem>
                    )}
                  />

                  {/* Senha (opcional) */}
                  {!healthPlanId && (
                    <TypedFormField
                      control={form.control}
                      name="password"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage className={formErrorStyles} />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Código ANS */}
                  <TypedFormField
                    control={form.control}
                    name="ans_code"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Código ANS</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            className={formErrors.ans_code ? "border-destructive focus:ring-destructive" : ""}
                          />
                        </FormControl>
                        <FormMessage className={formErrorStyles} />
                      </FormItem>
                    )}
                  />

                  {/* Descrição */}
                  <TypedFormField
                    control={form.control}
                    name="description"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            className={formErrors.description ? "border-destructive focus:ring-destructive" : ""}
                          />
                        </FormControl>
                        <FormMessage className={formErrorStyles} />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="additional-info">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-t-4 border-t-blue-500">
                  <CardHeader className="bg-muted/50">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-blue-500" /> 
                      Representantes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5 pt-6">
                    {/* Representante Legal - conteúdo existente com mais espaçamento */}
                    <div className="space-y-5 pb-4 border-b">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Badge className="bg-blue-600">Legal</Badge> Representante Legal
                      </h3>
                      <TypedFormField
                        control={form.control}
                        name="legal_representative_name"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className={formErrors.legal_representative_name ? "border-destructive focus:ring-destructive" : ""}
                              />
                            </FormControl>
                            <FormMessage className={formErrorStyles} />
                          </FormItem>
                        )}
                      />

                      <TypedFormField
                        control={form.control}
                        name="legal_representative_cpf"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onChange={(e) => handleCPFChange(e, "legal_representative_cpf")}
                                maxLength={14}
                                className={formErrors.legal_representative_cpf ? "border-destructive focus:ring-destructive" : ""}
                              />
                            </FormControl>
                            <FormMessage className={formErrorStyles} />
                          </FormItem>
                        )}
                      />

                      <TypedFormField
                        control={form.control}
                        name="legal_representative_position"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>Cargo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage className={formErrorStyles} />
                          </FormItem>
                        )}
                      />

                      <TypedFormField
                        control={form.control}
                        name="legal_representative_email"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage className={formErrorStyles} />
                          </FormItem>
                        )}
                      />

                      {!healthPlanId && (
                        <>
                          <TypedFormField
                            control={form.control}
                            name="legal_representative_password"
                            render={({ field }: any) => (
                              <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" />
                                </FormControl>
                                <FormMessage className={formErrorStyles} />
                              </FormItem>
                            )}
                          />

                          <TypedFormField
                            control={form.control}
                            name="legal_representative_password_confirmation"
                            render={({ field }: any) => (
                              <FormItem>
                                <FormLabel>Confirmar Senha</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" />
                                </FormControl>
                                <FormMessage className={formErrorStyles} />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>

                    {/* Representante Operacional - conteúdo existente com mais espaçamento */}
                    <div className="space-y-5 mt-6">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Badge className="bg-blue-600">Operacional</Badge> Representante Operacional
                      </h3>
                      <TypedFormField
                        control={form.control}
                        name="operational_representative_name"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>Nome</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage className={formErrorStyles} />
                          </FormItem>
                        )}
                      />

                      <TypedFormField
                        control={form.control}
                        name="operational_representative_cpf"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>CPF</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onChange={(e) => handleCPFChange(e, "operational_representative_cpf")}
                                maxLength={14}
                              />
                            </FormControl>
                            <FormMessage className={formErrorStyles} />
                          </FormItem>
                        )}
                      />

                      <TypedFormField
                        control={form.control}
                        name="operational_representative_position"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>Cargo</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage className={formErrorStyles} />
                          </FormItem>
                        )}
                      />

                      <TypedFormField
                        control={form.control}
                        name="operational_representative_email"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" />
                            </FormControl>
                            <FormMessage className={formErrorStyles} />
                          </FormItem>
                        )}
                      />

                      {!healthPlanId && (
                        <>
                          <TypedFormField
                            control={form.control}
                            name="operational_representative_password"
                            render={({ field }: any) => (
                              <FormItem>
                                <FormLabel>Senha</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" />
                                </FormControl>
                                <FormMessage className={formErrorStyles} />
                              </FormItem>
                            )}
                          />

                          <TypedFormField
                            control={form.control}
                            name="operational_representative_password_confirmation"
                            render={({ field }: any) => (
                              <FormItem>
                                <FormLabel>Confirmar Senha</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" />
                                </FormControl>
                                <FormMessage className={formErrorStyles} />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="border-t-4 border-t-green-500">
                    <CardHeader className="bg-muted/50">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Building2 className="h-5 w-5 text-green-500" /> 
                        Endereço
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                      {/* Campos de endereço existentes... */}
                      <TypedFormField
                        control={form.control}
                        name="postal_code"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                onChange={handleCEPChange}
                                maxLength={9}
                                className={formErrors.postal_code ? "border-destructive focus:ring-destructive" : ""}
                              />
                            </FormControl>
                            <FormMessage className={formErrorStyles} />
                          </FormItem>
                        )}
                      />

                      <TypedFormField
                        control={form.control}
                        name="address"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>Endereço</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                className={formErrors.address ? "border-destructive focus:ring-destructive" : ""}
                              />
                            </FormControl>
                            <FormMessage className={formErrorStyles} />
                          </FormItem>
                        )}
                      />

                      <TypedFormField
                        control={form.control}
                        name="city"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={(value) => form.setValue("city" as any, value)}
                                disabled={!form.getValues("state") || cidadesDoEstado.length === 0}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a cidade" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {cidadesDoEstado.map((cidade) => (
                                    <SelectItem key={cidade} value={cidade}>
                                      {cidade}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage className={formErrorStyles} />
                          </FormItem>
                        )}
                      />

                      <TypedFormField
                        control={form.control}
                        name="state"
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                form.setValue("state" as any, value);
                                atualizarCidadesPorEstado(value);
                                // Limpar campo cidade se mudar o estado
                                form.setValue("city" as any, "");
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
                            <FormMessage className={formErrorStyles} />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

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
                          <TypedFormField
                            control={form.control}
                            name={`phones.${index}.number`}
                            render={({ field }: any) => (
                              <FormItem className="flex-1">
                                <FormLabel>Número</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    onChange={(e) => handlePhoneChange(e, index)}
                                  />
                                </FormControl>
                                <FormMessage className={formErrorStyles} />
                              </FormItem>
                            )}
                          />

                          <TypedFormField
                            control={form.control}
                            name={`phones.${index}.type`}
                            render={({ field }: any) => (
                              <FormItem className="flex-1">
                                <FormLabel>Tipo</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={(value) =>
                                    form.setValue(`phones.${index}.type`, value as "mobile" | "landline")
                                  }
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
                                <FormMessage className={formErrorStyles} />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePhone(index)}
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

            <TabsContent value="documents">
              <Card className="border-t-4 border-t-purple-500">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-500" /> 
                    Documentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <InfoIcon className="h-4 w-4 text-purple-500" />
                        Documentação Necessária
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddDocument}
                        className="bg-purple-50 hover:bg-purple-100 border-purple-200"
                      >
                        <Plus className="w-4 h-4 mr-2 text-purple-500" />
                        Adicionar Documento
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {renderDocuments()}
                    </div>
                    
                    <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleNavigation('/health-plans')}
                        disabled={isSubmitting}
                      >
                        Cancelar
                      </Button>
                      
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {healthPlanId ? "Atualizar" : "Cadastrar"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Adicionar manipulador de erros global para capturar erros de validação */}
          <div className="hidden">
            {Object.keys(form.formState.errors).length > 0 && (
              <div aria-hidden="true" role="alert" className="sr-only">
                Formulário contém erros. Por favor, verifique os campos destacados.
              </div>
            )}
          </div>
        </form>
      </Form>
      
      {/* Diálogo de confirmação para sair */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja mesmo sair?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas no formulário. Se sair agora, as alterações ficarão salvas localmente para você continuar depois. Para limpar completamente as alterações, clique em "Limpar e sair".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowExitDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (navigationPath) {
                router.push(navigationPath);
              } else {
                router.back();
              }
              setShowExitDialog(false);
            }}>
              Manter dados e sair
            </AlertDialogAction>
            <AlertDialogAction onClick={handleConfirmExit} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Limpar e sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}