import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, ReactNode } from "react"
import { useForm, useFieldArray, Controller, SubmitHandler, FieldValues, FieldErrors, ControllerRenderProps, FieldError, FieldPath, Control } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash2, Check, User, Building2, ArrowLeft, AlertTriangle, InfoIcon, CheckCircle, AlertCircle, Trash, FileText } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getStorageUrl } from "@/lib/utils"
import { applyCNPJMask, applyCPFMask, applyPhoneMask, applyCEPMask } from "@/utils/masks"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useEntityDocumentTypes } from '@/hooks/useEntityDocumentTypes'
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import estadosCidadesData from '@/hooks/estados-cidades.json'
import api from "@/services/api-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { DateInput } from "@/components/ui/date-input"

// Add these interfaces after imports and before formSchema
interface Clinic {
  id: string;
  name: string;
}

interface Specialty {
  id: string;
  name: string;
}

// Interface for document types
interface EntityDocumentType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  is_required: boolean;
  is_active: boolean;
  expiration_alert_days: number | null;
  entity_type: "professional" | "clinic";
}

// Document types accepted by the backend
const DOCUMENT_TYPES = [
  { value: "contract", label: "Contrato" },
  { value: "authorization", label: "Autorização" },
  { value: "identification", label: "Identificação" },
  { value: "certificate", label: "Certificado" },
  { value: "diploma", label: "Diploma" },
  { value: "license", label: "Licença" },
  { value: "other", label: "Outro" }
]

// Professional council types
const COUNCIL_TYPES = [
  { value: "CRM", label: "CRM - Conselho Regional de Medicina" },
  { value: "CRO", label: "CRO - Conselho Regional de Odontologia" },
  { value: "CREFITO", label: "CREFITO - Conselho Regional de Fisioterapia e Terapia Ocupacional" },
  { value: "CRP", label: "CRP - Conselho Regional de Psicologia" },
  { value: "COREN", label: "COREN - Conselho Regional de Enfermagem" },
  { value: "CRF", label: "CRF - Conselho Regional de Farmácia" },
  { value: "CREFONO", label: "CREFONO - Conselho Regional de Fonoaudiologia" },
  { value: "CRBM", label: "CRBM - Conselho Regional de Biomedicina" },
  { value: "CRN", label: "CRN - Conselho Regional de Nutrição" },
  { value: "CRMV", label: "CRMV - Conselho Regional de Medicina Veterinária" },
  { value: "CRESS", label: "CRESS - Conselho Regional de Serviço Social" },
  { value: "CRT", label: "CRT - Conselho Regional dos Técnicos" },
  { value: "OTHER", label: "Outro" }
];

// Medical specialties list
const MEDICAL_SPECIALTIES = [
  { value: "general_practice", label: "Clínica Geral" },
  { value: "cardiology", label: "Cardiologia" },
  { value: "dermatology", label: "Dermatologia" },
  { value: "endocrinology", label: "Endocrinologia" },
  { value: "gastroenterology", label: "Gastroenterologia" },
  { value: "geriatrics", label: "Geriatria" },
  { value: "gynecology", label: "Ginecologia" },
  { value: "hematology", label: "Hematologia" },
  { value: "infectology", label: "Infectologia" },
  { value: "nephrology", label: "Nefrologia" },
  { value: "neurology", label: "Neurologia" },
  { value: "obstetrics", label: "Obstetrícia" },
  { value: "oncology", label: "Oncologia" },
  { value: "ophthalmology", label: "Oftalmologia" },
  { value: "orthopedics", label: "Ortopedia" },
  { value: "otolaryngology", label: "Otorrinolaringologia" },
  { value: "pediatrics", label: "Pediatria" },
  { value: "pneumology", label: "Pneumologia" },
  { value: "psychiatry", label: "Psiquiatria" },
  { value: "radiology", label: "Radiologia" },
  { value: "rheumatology", label: "Reumatologia" },
  { value: "urology", label: "Urologia" }
];

// Dental specialties list
const DENTAL_SPECIALTIES = [
  { value: "general_dentistry", label: "Odontologia Geral" },
  { value: "endodontics", label: "Endodontia" },
  { value: "oral_surgery", label: "Cirurgia Bucomaxilofacial" },
  { value: "orthodontics", label: "Ortodontia" },
  { value: "pediatric_dentistry", label: "Odontopediatria" },
  { value: "periodontics", label: "Periodontia" },
  { value: "prosthodontics", label: "Prótese Dentária" }
];

// Physical therapy specialties
const PHYSICAL_THERAPY_SPECIALTIES = [
  { value: "general_physical_therapy", label: "Fisioterapia Geral" },
  { value: "orthopedic_physical_therapy", label: "Fisioterapia Ortopédica" },
  { value: "neurological_physical_therapy", label: "Fisioterapia Neurológica" },
  { value: "respiratory_physical_therapy", label: "Fisioterapia Respiratória" },
  { value: "cardiovascular_physical_therapy", label: "Fisioterapia Cardiovascular" },
  { value: "sports_physical_therapy", label: "Fisioterapia Esportiva" }
];

// Psychologist specialties
const PSYCHOLOGY_SPECIALTIES = [
  { value: "clinical_psychology", label: "Psicologia Clínica" },
  { value: "neuropsychology", label: "Neuropsicologia" },
  { value: "health_psychology", label: "Psicologia da Saúde" },
  { value: "child_psychology", label: "Psicologia Infantil" },
  { value: "organizational_psychology", label: "Psicologia Organizacional" }
];

// Nursing specialties
const NURSING_SPECIALTIES = [
  { value: "general_nursing", label: "Enfermagem Geral" },
  { value: "surgical_nursing", label: "Enfermagem Cirúrgica" },
  { value: "pediatric_nursing", label: "Enfermagem Pediátrica" },
  { value: "obstetric_nursing", label: "Enfermagem Obstétrica" },
  { value: "psychiatric_nursing", label: "Enfermagem Psiquiátrica" },
  { value: "intensive_care_nursing", label: "Enfermagem em UTI" }
];

// Nutrition specialties
const NUTRITION_SPECIALTIES = [
  { value: "clinical_nutrition", label: "Nutrição Clínica" },
  { value: "sports_nutrition", label: "Nutrição Esportiva" },
  { value: "pediatric_nutrition", label: "Nutrição Pediátrica" },
  { value: "nutritional_therapy", label: "Terapia Nutricional" }
];

// Form error styles
const formErrorStyles = "text-destructive font-medium mt-1.5";

// Document schema for validation
const documentSchema = z.object({
  type_id: z.number({
    required_error: "Tipo de documento é obrigatório",
  }),
  // Use z.any() to accept any value (File, null, or undefined)
  // Validation will be done manually in validateRequiredDocuments
  file: z.any(),
  file_url: z.string().optional(),
  expiration_date: z.string().optional(),
  observation: z.string().optional()
});

// Interface para endereço
interface Address {
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  postal_code: string;
  is_main: boolean;
  neighborhood?: string;
  is_primary?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

// Utility to unmask a string (remove non-digits)
const unmask = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Update the address schema to make is_main required
const addressSchema = z.object({
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  district: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  postal_code: z.string().min(8, "CEP é obrigatório"),
  is_main: z.boolean()
});

// Update the form schema at the beginning of the file
const formSchema = z.object({
  documentType: z.enum(["cpf", "cnpj"]),
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phones: z.array(z.object({
    number: z.string().min(1, "Número é obrigatório"),
    is_main: z.boolean(),
    type: z.enum(["mobile", "landline"]),
    is_whatsapp: z.boolean()
  })).min(1, "Pelo menos um telefone é obrigatório"),
  addresses: z.array(z.object({
    street: z.string().min(1, "Rua é obrigatória"),
    number: z.string().min(1, "Número é obrigatório"),
    complement: z.string().optional(),
    district: z.string().min(1, "Bairro é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    state: z.string().min(1, "Estado é obrigatório"),
    postal_code: z.string().min(1, "CEP é obrigatório"),
    is_main: z.boolean()
  })).min(1, "Pelo menos um endereço é obrigatório"),
  
  // Professional fields
  cpf: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  specialty: z.string().optional(),
  council_type: z.string().optional(),
  council_number: z.string().optional(),
  council_state: z.string().optional(),
  bio: z.string().optional(),
  clinic_id: z.string().optional(),
  
  // Establishment fields
  cnpj: z.string().optional(),
  trading_name: z.string().optional(),
  foundation_date: z.string().optional(),
  business_hours: z.string().optional(),
  services: z.string().optional(),
  health_reg_number: z.string().optional(),
  
  // Documents
  documents: z.array(z.object({
    id: z.number().optional(),
    type_id: z.number(),
    file: z.any().optional(),
    file_url: z.string().optional(),
    expiration_date: z.string().optional(),
    observation: z.string().optional()
  }))
});


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

// Near TypedFormField declaration or where components are used
// Create a typed wrapper for FormField

interface UnifiedFormProps {
  initialData?: ApiData;
  onSubmit: (data: FormValues) => Promise<void>;
  isClinicAdmin?: boolean;
  clinicId?: string;
  entityId?: string;
  isEdit?: boolean;
}

// Add this helper function before the ProfessionalForm component
// Function to format field error messages for toast display
const formatErrorsForToast = (errors: FieldErrors<FormValues>): string => {
  const errorMessages: string[] = [];
  
  // Extract error messages from all fields with errors
  Object.entries(errors).forEach(([field, error]) => {
    if (error && typeof error === 'object' && 'message' in error && error.message) {
      // Convert field name to more readable format
      const fieldName = field
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
      
      // Add formatted error message
      errorMessages.push(`${fieldName}: ${error.message}`);
    } else if (error && Array.isArray(error)) {
      // Handle nested array errors (like addresses or documents)
      error.forEach((item, index) => {
        if (item && typeof item === 'object') {
          Object.entries(item).forEach(([nestedField, nestedError]) => {
            if (nestedError && typeof nestedError === 'object' && 'message' in nestedError && nestedError.message) {
              errorMessages.push(`${field}[${index}].${nestedField}: ${nestedError.message}`);
            }
          });
        }
      });
    }
  });

  // If there are too many errors, condense them
  if (errorMessages.length > 5) {
    const firstErrors = errorMessages.slice(0, 3);
    return `${firstErrors.join('\n')}\n... e mais ${errorMessages.length - 3} erros`;
  }
  
  return errorMessages.join('\n');
};

// Add this function before the ProfessionalForm component
const formatApiValidationErrors = (errors: Record<string, string[]>) => {
  const errorMessages: string[] = [];
  
  // Map API error fields to user-friendly names
  const fieldNames: Record<string, string> = {
    professional_type: "Tipo de Profissional",
    council_type: "Conselho Profissional",
    council_number: "Número do Conselho",
    council_state: "Estado do Conselho",
    email: "Email"
  };
  
  Object.entries(errors).forEach(([field, messages]) => {
    const fieldName = fieldNames[field] || field;
    messages.forEach(message => {
      // Translate common error messages
      let translatedMessage = message;
      if (message.includes("has already been taken")) {
        translatedMessage = "já está em uso";
      } else if (message.includes("is required")) {
        translatedMessage = "é obrigatório";
      }
      
      errorMessages.push(`${fieldName}: ${translatedMessage}`);
    });
  });
  
  return errorMessages;
};

// Adicionar esta função para traduzir mensagens de erro comuns
const translateError = (errorMsg: string): string => {
  // Mapeamento de erros comuns de validação
  const errorTranslations: Record<string, string> = {
    // Erros genéricos
    'Validation error': 'Erro de validação',
    'Failed to create professional': 'Falha ao criar profissional',
    'Failed to update professional': 'Falha ao atualizar profissional',
    'The given data was invalid': 'Os dados fornecidos são inválidos',
    
    // Erros específicos do campo address
    "Field 'address' doesn't have a default value": "O endereço é obrigatório e não foi fornecido",
    "SQLSTATE[HY000]: General error: 1364 Field 'address' doesn't have a default value": "O endereço é obrigatório e não foi fornecido",
    
    // Campos específicos
    'The name field is required': 'O campo nome é obrigatório',
    'The cpf field is required': 'O campo CPF é obrigatório',
    'The cpf has already been taken': 'Este CPF já está cadastrado',
    'The email field is required': 'O campo e-mail é obrigatório',
    'The email must be a valid email address': 'O e-mail deve ser um endereço válido',
    'The email has already been taken': 'Este e-mail já está em uso',
    'The professional_type field is required': 'O tipo de profissional é obrigatório',
    'Documentos Obrigatórios': 'Documentos Obrigatórios',
    'The documents.0.type field is required': 'O tipo do documento 1 é obrigatório',
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

  // Verificar erros específicos de campos faltantes no banco de dados
  if (errorMsg.includes("Field 'address' doesn't have a default value")) {
    return "O campo de endereço é obrigatório. Por favor, verifique se há pelo menos um endereço cadastrado.";
  }

  // Retornar a mensagem original se não houver tradução
  return errorMsg;
};

// Ajustar a função showToast para incluir ícones nos toasts e aceitar ReactNode
const showToast = (toastInstance: any, props: { 
  title: string; 
  description: string | ReactNode; 
  variant?: "default" | "destructive" | "success" | "warning" | "info";
  duration?: number;
}) => {
  // Traduzir título e descrição (apenas se for string)
  const translatedTitle = translateError(props.title);
  const translatedDescription = typeof props.description === 'string' 
    ? translateError(props.description) 
    : props.description;
  
  // Adicionar ícones baseados no tipo de toast
  let iconComponent;
  switch (props.variant) {
    case "destructive":
      iconComponent = <AlertCircle className="h-4 w-4" />;
      break;
    case "success":
      iconComponent = <CheckCircle className="h-4 w-4" />;
      break;
    case "warning":
      iconComponent = <AlertTriangle className="h-4 w-4" />;
      break;
    case "info":
      iconComponent = <InfoIcon className="h-4 w-4" />;
      break;
    default:
      iconComponent = <InfoIcon className="h-4 w-4" />;
  }
  
  // Criar o toast com ícones
  toastInstance({
    variant: props.variant,
    title: (
      <div className="flex items-center gap-2">
        {iconComponent}
        <span>{translatedTitle}</span>
      </div>
    ),
    description: translatedDescription,
    duration: props.duration || 5000
  });
};

// Add interfaces at the beginning of the file, before any usage
interface Phone {
  id?: number;
  number: string;
  country_code?: string;
  type: string;
  is_whatsapp: boolean;
  is_primary: boolean;
  formatted_number?: string;
}

interface Address {
  id?: number;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  postal_code: string;
  is_main: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

interface ApiAddress {
  id?: number;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postal_code: string;
  is_primary: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

interface Document {
  id?: number;
  type_id: number;
  file?: File | null;
  file_url?: string;
  expiration_date?: string;
  observation?: string;
}

interface ApiData {
  id?: number;
  name: string;
  documentType?: "cpf" | "cnpj";
  professional_type?: "individual" | "clinic";
  cpf?: string;
  cnpj?: string;
  description?: string;
  cnes?: string;
  created_at?: string;
  phones: Phone[];
  addresses: ApiAddress[];
  documents: Document[];
  birth_date?: string;
  gender?: "male" | "female" | "other";
  specialty?: string;
  council_type?: string;
  council_number?: string;
  council_state?: string;
  bio?: string;
  clinic_id?: string;
  business_hours?: string;
  services?: string;
  email?: string;
}

// Remove duplicate FormValues interface and update type definitions
type DocumentType = "cpf" | "cnpj";

interface FormValues {
  documentType: "cpf" | "cnpj";
  name: string;
  phones: {
    number: string;
    is_main: boolean;
    type: "mobile" | "landline";
    is_whatsapp: boolean;
  }[];
  email: string;
  addresses: Address[];
  
  // Professional fields
  cpf?: string;
  birth_date?: string;
  gender?: "male" | "female" | "other";
  specialty?: string;
  council_type?: string;
  council_number?: string;
  council_state?: string;
  bio?: string;
  clinic_id?: string;
  
  // Establishment fields
  cnpj?: string;
  trading_name?: string;
  foundation_date?: string;
  business_hours?: string;
  services?: string;
  health_reg_number?: string;
  
  // Documents
  documents: Document[];
}

interface UnifiedFormProps {
  initialData?: ApiData;
  onSubmit: (data: FormValues) => Promise<void>;
  isClinicAdmin?: boolean;
  clinicId?: string;
  entityId?: string;
  isEdit?: boolean;
}

// Near the top of the file, after imports and before other code
interface TypedFormFieldProps<T extends FieldPath<FormValues>> {
  name: T;
  control: Control<FormValues>;
  render: (props: {
    field: ControllerRenderProps<FormValues, T>;
    fieldState: {
      invalid: boolean;
      isTouched: boolean;
      isDirty: boolean;
      error?: FieldError;
    };
  }) => React.ReactElement;
}

const TypedFormField = FormField as any;

// Export the form as a forwarded ref component
export const ProfessionalForm = forwardRef(function ProfessionalForm({
  initialData,
  onSubmit: submitCallback,
  isClinicAdmin,
  clinicId,
  entityId,
  isEdit,
}: UnifiedFormProps, ref) {
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loadingClinics, setLoadingClinics] = useState(false)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loadingSpecialties, setLoadingSpecialties] = useState(false)
  const [documentType, setDocumentType] = useState<"cpf" | "cnpj">(initialData?.documentType || "cpf")
  const [formProgressed, setFormProgressed] = useState(false)
  const [activeTab, setActiveTab] = useState("basic-info")
  
  // Document related states
  const [documentFiles, setDocumentFiles] = useState<(File | null)[]>([])
  const formInitializedRef = useRef(false)
  
  // Get document types based on the selected entity type
  const { data: documentTypes = [] } = useEntityDocumentTypes(
    documentType === "cpf" ? "professional" : "clinic"
  )
  
  // Map document types to API values
  const documentTypeApiMap: Record<number, string> = {
    1: "identification",
    2: "certificate", 
    3: "diploma",
    4: "license",
    5: "contract",
    6: "authorization",
    7: "other"
  };

  // Update form initialization
  const form = useForm<FormValues>({
    resolver: isEdit ? undefined : zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      documentType: initialData?.documentType || (initialData?.cpf ? "cpf" : "cnpj"),
      name: initialData?.name || "",
      email: initialData?.email || "",
      phones: initialData?.phones?.map(phone => ({
        number: phone.number ? applyPhoneMask(phone.number) : "",
        is_main: phone.is_primary || false,
        type: phone.type as "mobile" | "landline",
        is_whatsapp: phone.is_whatsapp || false
      })) || [{
        number: "",
        is_main: true,
        type: "mobile",
        is_whatsapp: false
      }],
      addresses: initialData?.addresses?.map(addr => ({
        street: addr.street || "",
        number: addr.number || "",
        complement: addr.complement || "",
        district: addr.neighborhood || "",
        city: addr.city || "",
        state: addr.state || "",
        postal_code: addr.postal_code ? applyCEPMask(addr.postal_code) : "",
        is_main: addr.is_primary || false
      })) || [{
        street: "",
        number: "",
        complement: "",
        district: "",
        city: "",
        state: "",
        postal_code: "",
        is_main: true
      }],
      cpf: initialData?.cpf ? applyCPFMask(initialData.cpf) : "",
      cnpj: initialData?.cnpj ? applyCNPJMask(initialData.cnpj) : "",
      birth_date: initialData?.birth_date || "",
      gender: initialData?.gender || undefined,
      specialty: initialData?.specialty || "",
      council_type: initialData?.council_type || "",
      council_number: initialData?.council_number || "",
      council_state: initialData?.council_state || "",
      bio: initialData?.bio || "",
      clinic_id: initialData?.clinic_id || clinicId || "",
      business_hours: initialData?.business_hours || "",
      services: initialData?.services || "",
      documents: initialData?.documents || []
    }
  });

  // Add effect to handle document initialization in edit mode
  useEffect(() => {
    if (isEdit && initialData?.documents?.length) {
      // Initialize document files from existing documents
      const files = initialData.documents.map(doc => {
        if (doc.file_url) {
          // Create a placeholder for existing files
          return new File([], doc.file_url.split('/').pop() || 'document', {
            type: 'application/octet-stream'
          });
        }
        return null;
      });
      setDocumentFiles(files);
    }
  }, [isEdit, initialData]);

  // Update document type handling for edit mode
  useEffect(() => {
    if (!formInitializedRef.current) {
      const currentDocType = initialData?.documentType || form.getValues("documentType");
      if (currentDocType) {
        setDocumentType(currentDocType);
        if (!isEdit) {
          // Only reset documents for new entries
          form.setValue("documents", []);
          setDocumentFiles([]);
        }
      }
      formInitializedRef.current = true;
    }
  }, [form, isEdit, initialData]);

  // Atualizar o estado de progresso do formulário
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Verificar se há valores preenchidos em campos importantes
      const hasValues = Boolean(
        value.name || 
        value.email || 
        value.cpf || 
        value.cnpj || 
        (value.addresses?.[0]?.street)
      );
      
      setFormProgressed(hasValues);
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  // Field arrays for documents
  const { fields: documentFields, append: appendDocument, remove: removeDocument } = useFieldArray({
    control: form.control,
    name: "documents"
  });

  // Adicionar o FieldArray para endereços
  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
    control: form.control,
    name: "addresses"
  });

  // Document validation functions
  const validateDocument = (file: File): { isValid: boolean; error?: string } => {
    // Size validation (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return {
        isValid: false,
        error: "O arquivo deve ter no máximo 10MB"
      };
    }

    // Type validation
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
  
  // Validate required documents
  const validateRequiredDocuments = useCallback(() => {
    if (isEdit || !documentTypes?.length) {
      return true; // Skip validation in edit mode or when there are no document types
    }

    const entityType = documentType === "cpf" ? "professional" : "clinic";
    const requiredTypes = documentTypes.filter(dt => dt.is_required && dt.entity_type === entityType);
    
    if (requiredTypes.length === 0) {
      return true; // No required documents
    }

    const currentDocs = form.getValues("documents") || [];
    
    let validationFailed = false;
    const failureMessages: string[] = [];
    
    for (const requiredType of requiredTypes) {
      // Check if a document of the required type exists with a valid file or file_url
      const doc = currentDocs.find(d => d.type_id === requiredType.id);
      const hasValidDocument = doc && (
        (doc.file instanceof File) || 
        (doc.file_url && typeof doc.file_url === 'string')
      );

      if (!hasValidDocument) {
        const errorMsg = `O documento "${requiredType.name}" é obrigatório`;
        failureMessages.push(errorMsg);
        validationFailed = true;
        
        // Set field error
        const docIndex = currentDocs.findIndex(d => d.type_id === requiredType.id);
        if (docIndex !== -1) {
          form.setError(`documents.${docIndex}.file`, {
            type: 'required',
            message: 'Este documento é obrigatório'
          });
        }
      } else if (requiredType.expiration_alert_days) {
        // If there is a document, check expiration date if needed
        if (!doc.expiration_date) {
          const errorMsg = `O documento "${requiredType.name}" requer data de expiração`;
          failureMessages.push(errorMsg);
          validationFailed = true;
          
          // Set field error
          const docIndex = currentDocs.findIndex(d => d.type_id === requiredType.id);
          if (docIndex !== -1) {
            form.setError(`documents.${docIndex}.expiration_date`, {
              type: 'required',
              message: 'Data de expiração é obrigatória'
            });
          }
        } else {
          // Check if the date is valid and in the future
          const expDate = new Date(doc.expiration_date);
          const today = new Date();
          if (isNaN(expDate.getTime()) || expDate < today) {
            const errorMsg = `A data de expiração para "${requiredType.name}" deve ser no futuro`;
            failureMessages.push(errorMsg);
            validationFailed = true;
            
            // Set field error
            const docIndex = currentDocs.findIndex(d => d.type_id === requiredType.id);
            if (docIndex !== -1) {
              form.setError(`documents.${docIndex}.expiration_date`, {
                type: 'validate',
                message: 'A data deve ser no futuro'
              });
            }
          }
        }
      }
    }
    
    if (validationFailed) {
      showToast(toast, {
        title: "Documentos Obrigatórios",
        description: (
          <div className="max-h-[200px] overflow-y-auto">
            <p className="mb-2 font-semibold text-destructive">Verifique os seguintes documentos:</p>
            {failureMessages.map((message, index) => (
              <div key={index} className="flex gap-2 items-start mb-1">
                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0"></div>
                <p className="text-sm">{message}</p>
              </div>
            ))}
          </div>
        ),
        variant: "destructive",
        duration: 5000
      });
      
      // Scroll to the first document with error
      const firstErrorDoc = document.querySelector('[data-error="true"]');
      if (firstErrorDoc) {
        firstErrorDoc.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      return false;
    }
    
    return true;
  }, [documentTypes, form, toast, documentType, isEdit]);

  useEffect(() => {
    const fetchClinics = async () => {
      if (isClinicAdmin) {
        // Se for admin da clínica, não precisa buscar clínicas
        setClinics([{ id: clinicId ?? '', name: "Minha Clínica" }])
        return
      }

      setLoadingClinics(true)
      try {
        const response = await api.get("/clinics")
        const data = response.data?.data;
        setClinics(data)
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as clínicas",
          variant: "destructive",
        })
      } finally {
        setLoadingClinics(false)
      }
    }

    const fetchSpecialties = async () => {
      setLoadingSpecialties(true)
      try {
        const response = await api.get("/specialties")
        const data = response.data?.data;
        setSpecialties(data)
      } catch (error) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar as especialidades",
          variant: "destructive",
        })
      } finally {
        setLoadingSpecialties(false)
      }
    }

    fetchClinics()
    fetchSpecialties()
  }, [isClinicAdmin, clinicId, toast])

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

  // Effect to initialize required documents
  useEffect(() => {
    if (documentTypes?.length && !documentFields.length) {
      const entityType = documentType === "cpf" ? "professional" : "clinic";
      const requiredDocsTypes = documentTypes.filter(dt => 
        dt.is_required && 
        dt.is_active && 
        dt.entity_type === entityType
      );
      
      form.setValue("documents", []);
      
      requiredDocsTypes.forEach(docType => {
        appendDocument({
          type_id: docType.id,
          file: undefined as unknown as File,
          expiration_date: undefined,
          observation: undefined
        });
      });
      
      formInitializedRef.current = true;
    }
  }, [documentTypes, appendDocument, form, documentType]);

  // Replace the handleFormSubmitError function with this enhanced version
  const handleFormSubmitError = (errors: FieldErrors<FormValues>) => {
    console.error("Form validation errors:", errors);
    
    // Prepare error messages for toast
    const errorMessages = formatErrorsForToast(errors);
    
    // Show toast with error messages
    showToast(toast, {
      title: "Erro de validação",
      description: (
        <div className="max-h-[200px] overflow-y-auto">
          <p className="mb-2 font-semibold text-destructive">Por favor, corrija os seguintes erros:</p>
          {errorMessages.split('\n').map((message, index) => (
            <div key={index} className="flex gap-2 items-start mb-1">
              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0"></div>
              <p className="text-sm">{message}</p>
            </div>
          ))}
        </div>
      ),
      variant: "destructive",
      duration: 5000,
    });
    
    // Navigate to the tab with errors
    const basicInfoHasErrors = hasErrorsInTab(errors, "basic-info");
    const additionalInfoHasErrors = hasErrorsInTab(errors, "additional-info");
    const documentsHasErrors = hasErrorsInTab(errors, "documents");
    
    // Determine which tab to navigate to
    let tabToFocus = activeTab;
    
    // If we're not already on a tab with errors, navigate to the first tab with errors
    if (
      (activeTab === "basic-info" && !basicInfoHasErrors) ||
      (activeTab === "additional-info" && !additionalInfoHasErrors) ||
      (activeTab === "documents" && !documentsHasErrors)
    ) {
    if (basicInfoHasErrors) {
        tabToFocus = "basic-info";
    } else if (additionalInfoHasErrors) {
        tabToFocus = "additional-info";
    } else if (documentsHasErrors) {
        tabToFocus = "documents";
      }
      
      // Navigate to the tab with errors
      if (tabToFocus !== activeTab) {
        setActiveTab(tabToFocus);
      }
    }
  };

  // Helper to check if a tab has errors
  const hasErrorsInTab = (errors: FieldErrors<FormValues>, tabName: string): boolean => {
    switch (tabName) {
      case "basic-info":
        return !!(
          errors.documentType || 
          errors.name || 
          errors.email || 
          errors.phones || 
          errors.cpf || 
          errors.cnpj || 
          errors.addresses
        );
      case "additional-info":
        return documentType === "cpf" 
          ? !!(errors.birth_date || errors.gender || errors.specialty || errors.council_type || errors.council_number || errors.council_state || errors.bio) 
          : !!(errors.trading_name || errors.foundation_date || errors.health_reg_number || errors.business_hours || errors.services);
      case "documents":
        return !!errors.documents;
      default:
        return false;
    }
  };

  // Update validateTab to skip validation in edit mode
  const validateTab = async (currentTab: string, nextTab: string) => {
    // Se estiver em modo de edição ou indo para uma aba anterior, não precisa validar
    if (
      isEdit ||
      (currentTab === "additional-info" && nextTab === "basic-info") ||
      (currentTab === "documents" && (nextTab === "basic-info" || nextTab === "additional-info"))
    ) {
      return true;
    }
    
    try {
      if (currentTab === "basic-info") {
        // Validar campos básicos primeiro
        const basicFields = [
          "documentType",
          "name",
          "email",
          ...(documentType === "cpf" ? ["cpf", "birth_date", "gender"] : ["cnpj", "trading_name", "foundation_date"])
        ];
        
        const isValid = await form.trigger(basicFields as any);
        
        if (!isValid) {
          const errors = form.formState.errors;
          const errorMessages = formatErrorsForToast(errors);
          
          showToast(toast, {
            title: "Erro de validação",
            description: (
              <div className="max-h-[200px] overflow-y-auto">
                <p className="mb-2 font-semibold text-destructive">Por favor, corrija os seguintes erros:</p>
                {errorMessages.split('\n').map((message, index) => (
                  <div key={index} className="flex gap-2 items-start mb-1">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0"></div>
                    <p className="text-sm">{message}</p>
                  </div>
                ))}
              </div>
            ),
            variant: "destructive"
          });
        }
        
        return isValid;
      } 
      else if (currentTab === "additional-info") {
        // Validate additional info fields
        const commonFields = ["phones"];
        const cpfFields = ["specialty", "council_type", "council_number", "council_state", "bio"];
        const cnpjFields = ["health_reg_number"];
        
        const fieldsToValidate = [
          ...commonFields,
          ...(documentType === "cpf" ? cpfFields : cnpjFields)
        ];
        
        const isValid = await form.trigger(fieldsToValidate as any);
        
        if (!isValid) {
          const errors = form.formState.errors;
          const errorMessages = formatErrorsForToast(errors);
          
          showToast(toast, {
            title: "Erro de validação",
            description: (
              <div className="max-h-[200px] overflow-y-auto">
                <p className="mb-2 font-semibold text-destructive">Por favor, corrija os seguintes erros:</p>
                {errorMessages.split('\n').map((message, index) => (
                  <div key={index} className="flex gap-2 items-start mb-1">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0"></div>
                    <p className="text-sm">{message}</p>
                  </div>
                ))}
              </div>
            ),
            variant: "destructive",
            duration: 5000
          });
        }
        
        return isValid;
      }
      
      return true;
    } catch (error) {
      console.error("Error validating tab:", error);
      return false;
    }
  };

  // Update handleNextTab to use internal state
  const handleNextTab = async (currentTab: string, nextTab: string) => {
    // Se estiver voltando para uma aba anterior, permite sem validação
    if (
      (currentTab === "additional-info" && nextTab === "basic-info") ||
      (currentTab === "documents" && (nextTab === "basic-info" || nextTab === "additional-info"))
    ) {
      setActiveTab(nextTab);
      return;
    }
    
    const isValid = await validateTab(currentTab, nextTab);
    
    if (isValid) {
      if (currentTab === "basic-info") {
        setFormProgressed(true);
      }
      setActiveTab(nextTab);
    } else {
      // Se a validação falhar, mostrar toast de erro
      showToast(toast, {
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos obrigatórios antes de continuar.",
        variant: "destructive"
      });
    }
  };

  // Atualizar os handlers dos inputs
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string = "cpf") => {
    const value = e.target.value;
    const maskedValue = applyCPFMask(value);
    e.target.value = maskedValue;
    form.setValue(fieldName as any, maskedValue);
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = applyCNPJMask(value);
    e.target.value = maskedValue;
    form.setValue("cnpj", maskedValue);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    try {
      const value = e.target.value;
      const maskedValue = applyPhoneMask(value);
      const phones = form.getValues("phones");
      phones[index].number = maskedValue;
      form.setValue("phones", phones);
    } catch (error) {
      showToast(toast, {
        title: "Erro",
        description: "Erro ao formatar o número de telefone",
        variant: "destructive"
      });
    }
  };

  // Atualizar o onSubmit para usar FormData corretamente
  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      const formData = new FormData();

      // Adicionar campos básicos
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'documents' && key !== 'addresses' && key !== 'phones' && value !== null && value !== undefined) {
          if (key === 'cpf' && typeof value === 'string') {
            formData.append(key, unmask(value));
          } else if (key === 'cnpj' && typeof value === 'string') {
            formData.append(key, unmask(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // Adicionar telefones
      if (data.phones?.length) {
        data.phones.forEach((phone, index) => {
          formData.append(`phones[${index}][number]`, unmask(phone.number));
          formData.append(`phones[${index}][type]`, phone.type);
          formData.append(`phones[${index}][is_whatsapp]`, String(phone.is_whatsapp));
          formData.append(`phones[${index}][is_primary]`, String(phone.is_main));
        });
      }

      // Adicionar endereços
      if (data.addresses?.length) {
        data.addresses.forEach((address, index) => {
          Object.entries(address).forEach(([key, value]) => {
            if (key === 'postal_code') {
              formData.append(`addresses[${index}][${key}]`, unmask(String(value)));
            } else if (key === 'district') {
              formData.append(`addresses[${index}][neighborhood]`, String(value));
            } else if (key === 'is_main') {
              formData.append(`addresses[${index}][is_primary]`, String(value));
            } else {
              formData.append(`addresses[${index}][${key}]`, String(value));
            }
          });
        });
      }

      // Adicionar documentos
      if (data.documents?.length) {
        data.documents.forEach((doc, index) => {
          if (doc.file instanceof File) {
            formData.append(`documents[${index}][file]`, doc.file);
          }
          formData.append(`documents[${index}][type_id]`, String(doc.type_id));
          if (doc.expiration_date) {
            formData.append(`documents[${index}][expiration_date]`, doc.expiration_date);
          }
          if (doc.observation) {
            formData.append(`documents[${index}][observation]`, doc.observation);
          }
        });
      }

      // Se for edição, adicionar método PUT
      if (isEdit) {
        formData.append('_method', 'PUT');
      }

      // Enviar requisição
      const endpoint = documentType === 'cpf' ? 
        (isEdit ? `/professionals/${entityId}` : '/professionals') : 
        (isEdit ? `/clinics/${entityId}` : '/clinics');

      const response = await api.post(endpoint, formData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        }
      });

      showToast(toast, {
        title: "Sucesso",
        description: isEdit 
          ? "Profissional atualizado com sucesso!" 
          : "Profissional cadastrado com sucesso!",
        variant: "success"
      });

      router.push('/professionals');
    } catch (error: any) {
      console.error("Erro ao enviar formulário:", error);
      
      if (error.response?.data?.errors) {
        const errorMessages = formatApiValidationErrors(error.response.data.errors);
        
        showToast(toast, {
          title: "Erro de validação",
          description: (
            <div className="max-h-[200px] overflow-y-auto">
              <p className="mb-2 font-semibold text-destructive">Por favor, corrija os seguintes erros:</p>
              {errorMessages.map((message, index) => (
                <div key={index} className="flex gap-2 items-start mb-1">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0"></div>
                  <p className="text-sm">{message}</p>
                </div>
              ))}
            </div>
          ),
          variant: "destructive"
        });
      } else {
        showToast(toast, {
          title: "Erro",
          description: translateError(error.message || "Erro ao processar o formulário"),
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Atualizar o handleFormSubmit para usar a função correta
  const handleFormSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      // Validar se há pelo menos um telefone
      if (!data.phones || data.phones.length === 0) {
        showToast(toast, {
          title: "Erro de validação",
          description: "É necessário adicionar pelo menos um telefone.",
          variant: "destructive"
        });
        return;
      }

      // Validar se há pelo menos um endereço
      if (!data.addresses || data.addresses.length === 0) {
        showToast(toast, {
          title: "Erro de validação",
          description: "É necessário adicionar pelo menos um endereço.",
          variant: "destructive"
        });
        return;
      }

      // Mostrar toast de carregamento
      showToast(toast, {
        title: "Processando",
        description: "Salvando as informações...",
        variant: "default"
      });

      // Preparar os dados para envio
      const formData = new FormData();

      // Adicionar campos básicos
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'documents' && key !== 'addresses' && key !== 'phones' && value !== null && value !== undefined) {
          if (key === 'cpf' && typeof value === 'string') {
            formData.append(key, unmask(value));
          } else if (key === 'cnpj' && typeof value === 'string') {
            formData.append(key, unmask(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // Adicionar telefones
      if (data.phones?.length) {
        data.phones.forEach((phone, index) => {
          formData.append(`phones[${index}][number]`, unmask(phone.number));
          formData.append(`phones[${index}][type]`, phone.type);
          formData.append(`phones[${index}][is_whatsapp]`, String(phone.is_whatsapp));
          formData.append(`phones[${index}][is_primary]`, String(phone.is_main));
          formData.append(`phones[${index}][country_code]`, '+55');
        });
      }

      // Adicionar endereços
      if (data.addresses?.length) {
        data.addresses.forEach((address, index) => {
          Object.entries(address).forEach(([key, value]) => {
            if (key === 'postal_code') {
              formData.append(`addresses[${index}][${key}]`, unmask(String(value)));
            } else if (key === 'district') {
              formData.append(`addresses[${index}][neighborhood]`, String(value));
            } else if (key === 'is_main') {
              formData.append(`addresses[${index}][is_primary]`, String(value));
            } else {
              formData.append(`addresses[${index}][${key}]`, String(value));
            }
          });
        });
      }

      // Adicionar documentos
      if (data.documents?.length) {
        data.documents.forEach((doc, index) => {
          if (doc.file instanceof File) {
            formData.append(`documents[${index}][file]`, doc.file);
          }
          formData.append(`documents[${index}][type_id]`, String(doc.type_id));
          if (doc.expiration_date) {
            formData.append(`documents[${index}][expiration_date]`, doc.expiration_date);
          }
          if (doc.observation) {
            formData.append(`documents[${index}][observation]`, doc.observation);
          }
        });
      }

      // Se for edição, adicionar método PUT
      if (isEdit) {
        formData.append('_method', 'PUT');
      }

      // Enviar requisição
      const endpoint = documentType === 'cpf' ? 
        (isEdit ? `/professionals/${entityId}` : '/professionals') : 
        (isEdit ? `/clinics/${entityId}` : '/clinics');

      const response = await api.post(endpoint, formData, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data'
        }
      });

      showToast(toast, {
        title: "Sucesso",
        description: isEdit 
          ? "Profissional atualizado com sucesso!" 
          : "Profissional cadastrado com sucesso!",
        variant: "success"
      });

      router.push('/professionals');
    } catch (error: any) {
      console.error("Erro ao enviar formulário:", error);
      
      if (error.response?.data?.errors) {
        const errorMessages = formatApiValidationErrors(error.response.data.errors);
        
        showToast(toast, {
          title: "Erro de validação",
          description: (
            <div className="max-h-[200px] overflow-y-auto">
              <p className="mb-2 font-semibold text-destructive">Por favor, corrija os seguintes erros:</p>
              {errorMessages.map((message, index) => (
                <div key={index} className="flex gap-2 items-start mb-1">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0"></div>
                  <p className="text-sm">{message}</p>
                </div>
              ))}
            </div>
          ),
          variant: "destructive"
        });
      } else {
        showToast(toast, {
          title: "Erro",
          description: translateError(error.message || "Erro ao processar o formulário"),
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Also update the handleFormError function
  const handleFormError = (errors: FieldErrors<FormValues>) => {
    console.log("Form errors:", errors);
    
    // Show toast with error message
    const errorMessages = formatErrorsForToast(errors);
    
    showToast(toast, {
      title: "Erro de validação",
      description: (
        <div className="max-h-[200px] overflow-y-auto">
          <p className="mb-2 font-semibold text-destructive">Por favor, corrija os seguintes erros:</p>
          {errorMessages.split('\n').map((message, index) => (
            <div key={index} className="flex gap-2 items-start mb-1">
              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0"></div>
              <p className="text-sm">{message}</p>
            </div>
          ))}
        </div>
      ),
      variant: "destructive",
      duration: 5000,
    });
    
    if (Object.keys(errors).length > 0) {
      let tabToFocus = "basic-info";
      
      const basicInfoFields = ["name", "cpf", "cnpj", "email", "trading_name", "birth_date", "foundation_date", "gender"];
      const additionalInfoFields = ["addresses", "phone", "specialty", "council_type", "council_number", "council_state", "bio", "clinic_id", "business_hours", "services", "health_reg_number"];
      const documentFields = ["documents"];
      
      // Check which tab has errors
      const hasBasicInfoErrors = Object.keys(errors).some(field => basicInfoFields.includes(field));
      const hasAdditionalInfoErrors = Object.keys(errors).some(field => additionalInfoFields.includes(field));
      const hasDocumentErrors = Object.keys(errors).some(field => documentFields.includes(field)) || 
                               (typeof errors.documents !== 'undefined' && Array.isArray(errors.documents) && 
                                errors.documents.some((doc) => doc !== null && typeof doc === 'object'));
      
      if (hasDocumentErrors) {
        tabToFocus = "documents";
      } else if (hasAdditionalInfoErrors) {
        tabToFocus = "additional-info";
      } else if (hasBasicInfoErrors) {
        tabToFocus = "basic-info";
      }
      
      // Change to the tab with errors
      if (setActiveTab) {
        setActiveTab(tabToFocus);
      }
    }
  };

  // Handle document file change
  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateDocument(file);
      if (!validation.isValid && validation.error) {
        showToast(toast, {
          title: "Erro",
          description: validation.error,
          variant: "destructive"
        });
        return;
      }

      console.log(`Documento ${index} selecionado: ${file.name} (${file.size} bytes, tipo: ${file.type})`);
      
      // Update the documentFiles array with the new file
      const newDocumentFiles = [...documentFiles];
      newDocumentFiles[index] = file;
      setDocumentFiles(newDocumentFiles);
      
      // Set the file in the form
      form.setValue(`documents.${index}.file` as any, file);
      
      // Clear file_url since we now have a new file
      form.setValue(`documents.${index}.file_url` as any, undefined);
      
      showToast(toast, {
        title: "Sucesso",
        description: "Documento adicionado com sucesso",
        variant: "success"
      });
    }
  };

  // Handle document type change
  const handleDocumentTypeChange = (value: "cpf" | "cnpj") => {
    setDocumentType(value);
    // Reset form initialization flag to force document reinitialization
    formInitializedRef.current = false;
    // Reset documents array
    form.setValue("documents", []);
    // Reset document files
    setDocumentFiles([]);
    
    // Reset form fields specific to the other document type
    if (value === "cpf") {
      form.setValue("cnpj", "");
      form.setValue("trading_name", "");
      form.setValue("foundation_date", "");
      form.setValue("health_reg_number", "");
      form.setValue("business_hours", "");
      form.setValue("services", "");
    } else {
      form.setValue("cpf", "");
      form.setValue("birth_date", "");
      form.setValue("gender", undefined);
      form.setValue("specialty", "");
      form.setValue("council_type", "");
      form.setValue("council_number", "");
      form.setValue("council_state", "");
      form.setValue("bio", "");
    }
  };

  // Add a new document to the form
  const handleAddDocument = () => {
    appendDocument({
      type_id: 0,
      file: undefined as unknown as File,
      expiration_date: undefined,
      observation: undefined
    });
  };
  
  // Handle file to blob conversion for upload
  const fileToBlob = async (file: File): Promise<Blob> => {
    const buffer = await file.arrayBuffer();
    return new Blob([buffer], { type: file.type });
  };

  // Render document fields
  const renderDocuments = () => {
    // Filtrar apenas documentos ativos
    const activeDocumentTypes = documentTypes?.filter(type => type.is_active) || [];
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Documentos</h3>
            <p className="text-sm text-muted-foreground">
              Adicione os documentos necessários
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddDocument}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Documento
          </Button>
        </div>

        <div className="space-y-4">
          {documentFields.map((field, index) => {
            const selectedType = activeDocumentTypes.find(
              type => type.id === Number(field.type_id)
            );

            return (
              <div key={field.id} className={cn(
                "flex flex-col gap-4 p-4 border rounded-lg",
                selectedType?.is_required && "border-red-100 bg-red-50/30"
              )}>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Label>
                      Tipo de Documento
                      {selectedType?.is_required && (
                        <span className="ml-1 text-destructive">*</span>
                      )}
                    </Label>
                    <Select
                      value={field.type_id?.toString() || ""}
                      onValueChange={(value) => handleDocumentItemTypeChange(value, index)}
                    >
                      <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Selecione o tipo de documento" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeDocumentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            <div className="flex items-center justify-between w-full">
                              <span>{type.name}</span>
                              {type.is_required && (
                                <span className="text-xs text-destructive ml-2">*Obrigatório</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedType?.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedType.description}
                      </p>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDocument(index)}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Arquivo</Label>
                    <Input
                      type="file"
                      onChange={(e) => handleDocumentChange(e, index)}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    {field.file_url && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        <a 
                          href={field.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          Ver arquivo atual
                        </a>
                      </div>
                    )}
                  </div>

                  {selectedType?.expiration_alert_days !== null && (
                    <div className="space-y-2">
                      <Label>
                        Data de Vencimento
                        {selectedType?.expiration_alert_days && (
                          <span className="ml-1 text-destructive">*</span>
                        )}
                      </Label>
                      <DateInput
                        value={field.expiration_date ? new Date(field.expiration_date) : null}
                        onChange={(date) => {
                          updateDocument(index, {
                            ...field,
                            expiration_date: date?.toISOString()
                          });
                        }}
                      />
                      {selectedType?.expiration_alert_days && (
                        <p className="text-xs text-muted-foreground">
                          Alerta {selectedType.expiration_alert_days} dias antes do vencimento
                        </p>
                      )}
                    </div>
                  )}

                  <div className="col-span-full">
                    <Label>Observações</Label>
                    <Textarea
                      value={field.observation || ""}
                      onChange={(e) => {
                        updateDocument(index, {
                          ...field,
                          observation: e.target.value
                        });
                      }}
                      placeholder="Observações sobre o documento"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Aviso sobre documentos obrigatórios */}
        {activeDocumentTypes.some(type => type.is_required) && (
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <span className="text-destructive">*</span>
            Documentos obrigatórios
          </p>
        )}
      </div>
    );
  };

  // Adicionar validação para documentos obrigatórios
  const validateDocuments = () => {
    if (isEdit || !documentTypes?.length) {
      return true;
    }

    const entityType = documentType === "cpf" ? "professional" : "clinic";
    const requiredTypes = documentTypes.filter(dt => 
      dt.is_required && 
      dt.is_active && 
      dt.entity_type === entityType
    );
    
    if (requiredTypes.length === 0) {
      return true;
    }

    const currentDocs = form.getValues("documents") || [];
    const errors: string[] = [];

    requiredTypes.forEach(requiredType => {
      const doc = currentDocs.find(d => d.type_id === requiredType.id);
      const hasValidDocument = doc && (
        (doc.file instanceof File) || 
        (doc.file_url && typeof doc.file_url === 'string')
      );

      if (!hasValidDocument) {
        errors.push(`O documento "${requiredType.name}" é obrigatório`);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "Documentos Obrigatórios",
        description: (
          <div className="flex flex-col gap-1">
            {errors.map((error, index) => (
              <p key={index} className="text-sm">{error}</p>
            ))}
          </div>
        ),
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  // Atualizar handleFormSubmit para incluir validação de documentos
  // const handleFormSubmit = async (data: FormValues) => {
  //   const documentErrors = validateDocuments();
    
  //   if (documentErrors.length > 0) {
  //     toast({
  //       title: "Documentos Pendentes",
  //       description: (
  //         <div className="flex flex-col gap-1">
  //           {documentErrors.map((error, index) => (
  //             <p key={index} className="text-sm">{error}</p>
  //           ))}
  //         </div>
  //       ),
  //       variant: "destructive"
  //     });
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     const formData = new FormData();

  //     // Adicionar campos básicos
  //     Object.entries(data).forEach(([key, value]) => {
  //       if (key !== 'documents' && key !== 'addresses' && key !== 'phones' && value !== null && value !== undefined) {
  //         if (key === 'cpf' && typeof value === 'string') {
  //           formData.append(key, unmask(value));
  //         } else if (key === 'cnpj' && typeof value === 'string') {
  //           formData.append(key, unmask(value));
  //         } else {
  //           formData.append(key, String(value));
  //         }
  //       }
  //     });

  //     // Adicionar telefones
  //     if (data.phones?.length) {
  //       data.phones.forEach((phone, index) => {
  //         formData.append(`phones[${index}][number]`, unmask(phone.number));
  //         formData.append(`phones[${index}][type]`, phone.type);
  //         formData.append(`phones[${index}][is_whatsapp]`, String(phone.is_whatsapp));
  //         formData.append(`phones[${index}][is_primary]`, String(phone.is_main));
  //       });
  //     }

  //     // Adicionar endereços
  //     if (data.addresses?.length) {
  //       data.addresses.forEach((address, index) => {
  //         Object.entries(address).forEach(([key, value]) => {
  //           if (key === 'postal_code') {
  //             formData.append(`addresses[${index}][${key}]`, unmask(String(value)));
  //           } else if (key === 'district') {
  //             formData.append(`addresses[${index}][neighborhood]`, String(value));
  //           } else if (key === 'is_main') {
  //             formData.append(`addresses[${index}][is_primary]`, String(value));
  //           } else {
  //             formData.append(`addresses[${index}][${key}]`, String(value));
  //           }
  //         });
  //       });
  //     }

  //     // Adicionar documentos
  //     if (data.documents?.length) {
  //       data.documents.forEach((doc, index) => {
  //         if (doc.file instanceof File) {
  //           formData.append(`documents[${index}][file]`, doc.file);
  //         }
  //         formData.append(`documents[${index}][type_id]`, String(doc.type_id));
  //         if (doc.expiration_date) {
  //           formData.append(`documents[${index}][expiration_date]`, doc.expiration_date);
  //         }
  //         if (doc.observation) {
  //           formData.append(`documents[${index}][observation]`, doc.observation);
  //         }
  //       });
  //     }

  //     // Se for edição, adicionar método PUT
  //     if (isEdit) {
  //       formData.append('_method', 'PUT');
  //     }

  //     // Enviar requisição
  //     const endpoint = documentType === 'cpf' ? 
  //       (isEdit ? `/professionals/${entityId}` : '/professionals') : 
  //       (isEdit ? `/clinics/${entityId}` : '/clinics');

  //     const response = await api.post(endpoint, formData, {
  //       headers: {
  //         'Accept': 'application/json',
  //         'Content-Type': 'multipart/form-data'
  //       }
  //     });

  //     showToast(toast, {
  //       title: "Sucesso",
  //       description: isEdit 
  //         ? "Profissional atualizado com sucesso!" 
  //         : "Profissional cadastrado com sucesso!",
  //       variant: "success"
  //     });

  //     router.push('/professionals');
  //   } catch (error: any) {
  //     console.error("Erro ao enviar formulário:", error);
      
  //     if (error.response?.data?.errors) {
  //       const errorMessages = formatApiValidationErrors(error.response.data.errors);
        
  //       showToast(toast, {
  //         title: "Erro de validação",
  //         description: (
  //           <div className="max-h-[200px] overflow-y-auto">
  //             <p className="mb-2 font-semibold text-destructive">Por favor, corrija os seguintes erros:</p>
  //             {errorMessages.map((message, index) => (
  //               <div key={index} className="flex gap-2 items-start mb-1">
  //                 <div className="mt-1 h-1.5 w-1.5 rounded-full bg-destructive shrink-0"></div>
  //                 <p className="text-sm">{message}</p>
  //               </div>
  //             ))}
  //           </div>
  //         ),
  //         variant: "destructive"
  //       });
  //     } else {
  //       showToast(toast, {
  //         title: "Erro",
  //         description: translateError(error.message || "Erro ao processar o formulário"),
  //         variant: "destructive"
  //       });
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Atualizar a função handleDocumentItemTypeChange para filtrar documentos ativos
  const handleDocumentItemTypeChange = (value: string, index: number) => {
    const activeDocumentTypes = documentTypes?.filter(type => type.is_active) || [];
    const selectedType = activeDocumentTypes.find(type => type.id === Number(value));
    
    if (selectedType) {
      update(index, {
        ...fields[index],
        type_id: Number(value)
      });
    }
  };

  return (
    <div ref={ref} className="space-y-4">
      {/* ... existing code ... */}
    </div>
  )
}) 