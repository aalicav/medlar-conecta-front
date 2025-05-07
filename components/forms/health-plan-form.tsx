"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray, Control, SubmitHandler, FieldValues } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"
import api from "@/services/api-client"
import { applyCNPJMask, applyCPFMask, applyPhoneMask, applyCEPMask, applyCurrencyMask, unmask, applyMunicipalRegistrationMask } from "@/utils/masks"

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Plus, Trash, SearchIcon, DollarSign, AlertCircle, CheckCircle, InfoIcon, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
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

// Schema de validação com campos adicionais
const healthPlanSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cnpj: z.string().min(14, "CNPJ inválido").max(18, "CNPJ inválido"),
  municipal_registration: z.string().min(11, "Inscrição Municipal inválida"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres").optional(),
  ans_code: z.string().optional(),
  description: z.string().optional(),
  legal_representative_name: z.string().min(3, "Nome do representante é obrigatório"),
  legal_representative_cpf: z.string().min(11, "CPF inválido"),
  legal_representative_position: z.string().min(2, "Cargo é obrigatório"),
  address: z.string().min(5, "Endereço é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "Selecione um estado válido"),
  postal_code: z.string().min(8, "CEP inválido"),
  phones: z.array(
    z.object({
      number: z.string().min(8, "Número inválido"),
      type: z.string().min(1, "Tipo obrigatório")
    })
  ).optional(),
  // Adicionar campos para procedimentos TUSS
  selected_procedures: z.array(
    z.object({
      tuss_id: z.number(),
      initial_price: z.number().min(0, "Valor deve ser positivo"),
    })
  ),
  // Adicionar campo para documentos
  documents: z.array(
    z.object({
      file: z.any(),
      type: z.string().min(1, "Tipo obrigatório"),
      description: z.string().min(1, "Descrição obrigatória"),
      reference_date: z.string().optional(),
      expiration_date: z.string().optional()
    })
  ).optional(),
  // Adicionar flag de auto-aprovação
  auto_approve: z.boolean().default(true)
})

// Interfaces para Campos Field Array
interface PhoneField {
  id?: string;
  number: string;
  type: string;
}

interface ProcedureField {
  id?: string;
  tuss_id: number;
  tuss_code: string;
  name: string;
  initial_price: number;
  status: "pending" | "negotiating" | "accepted" | "rejected";
}

interface DocumentField {
  id?: string;
  file: any;
  type: string;
  description: string;
  reference_date?: string;
  expiration_date?: string;
}

// Recria o tipo sem usar z.infer para evitar problemas de inferência
export interface HealthPlanFormValues extends FieldValues {
  name: string;
  cnpj: string;
  municipal_registration: string;
  email: string;
  password: string;
  ans_code?: string;
  description?: string;
  legal_representative_name: string;
  legal_representative_cpf: string;
  legal_representative_position: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  phones?: PhoneField[];
  selected_procedures?: ProcedureField[];
  documents?: DocumentField[];
  auto_approve: boolean;
}

// Interface for procedimento TUSS
interface TussProcedure {
  id: number
  code: string
  name: string
  type: string
  description?: string
}

interface Specialty {
  id: string;
  name: string;
}

// Interface for HealthPlanForm props
interface HealthPlanFormProps {
  initialData?: any;
  isEditing?: boolean;
  healthPlanId?: number;
}

export function HealthPlanForm({ initialData, isEditing = false, healthPlanId }: HealthPlanFormProps) {
  const router = useRouter()
  const { hasPermission } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [documentFiles, setDocumentFiles] = useState<(File | null)[]>([])
  
  // Estados para TUSS e negociação
  const [activeTab, setActiveTab] = useState("basic-info")
  const [tussProcedures, setTussProcedures] = useState<TussProcedure[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [showTussDialog, setShowTussDialog] = useState(false)
  const { toast: useToastToast } = useToast()
  const { toast } = useToast()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loadingSpecialties, setLoadingSpecialties] = useState(false)

  // Verificar se usuário tem permissão para criar planos
  const canCreateHealthPlan = hasPermission("create health plans")

  // Inicializar formulário
  const form = useForm<HealthPlanFormValues>({
    // Forçar tipo para resolver incompatibilidades
    resolver: zodResolver(
      isEditing 
        ? healthPlanSchema.omit({ password: true }) 
        : healthPlanSchema.extend({ 
            password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres") 
          })
    ) as any,
    defaultValues: {
      name: "",
      cnpj: "",
      municipal_registration: "",
      email: "",
      password: "",
      ans_code: "",
      description: "",
      legal_representative_name: "",
      legal_representative_cpf: "",
      legal_representative_position: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      phones: [{ number: "", type: "mobile" }],
      selected_procedures: [],
      documents: [],
      auto_approve: true
    },
    mode: "onSubmit" // Set validation mode to trigger on submit
  })

  // Watch for form errors to debug
  const formErrors = form.formState.errors
  
  // Field arrays usando a função importada, não como método de form
  const { fields: phoneFields, append: appendPhone, remove: removePhone, replace: replacePhones } = useFieldArray({
    control: form.control as unknown as Control<HealthPlanFormValues>,
    name: "phones"
  })
  
  // Field array para procedimentos TUSS
  const { 
    fields: procedureFields, 
    append: appendProcedure, 
    remove: removeProcedure,
    replace: replaceProcedures
  } = useFieldArray({
    control: form.control as unknown as Control<HealthPlanFormValues>,
    name: "selected_procedures"
  })
  
  // Documentos field array
  const { 
    fields: documentFields, 
    append: appendDocument, 
    remove: removeDocument,
    replace: replaceDocuments
  } = useFieldArray({
    control: form.control as unknown as Control<HealthPlanFormValues>,
    name: "documents"
  })

  // Populate form with initial data if provided
  useEffect(() => {
    if (initialData && isEditing) {
      console.log("Initializing form with data:", initialData);
      
      try {
        // Debug the data structure
        console.log("Original data structure:", JSON.stringify(initialData, null, 2));
        
        // Handle logo preview - check if it's a relative path or full URL
        if (initialData.logo) {
          console.log("Setting logo preview from initialData.logo:", initialData.logo);
          // If logo is a relative path, prefix with API URL
          const logoUrl = initialData.logo.startsWith('http') 
            ? initialData.logo 
            : `${process.env.NEXT_PUBLIC_API_URL}/storage/${initialData.logo}`;
          setLogoPreview(logoUrl);
        } else {
          setLogoPreview(null);
        }
        
        // Map the data more carefully, handling potential missing fields
        const formattedData = {
          name: initialData.name || "",
          cnpj: initialData.cnpj ? applyCNPJMask(initialData.cnpj) : "",
          municipal_registration: initialData.municipal_registration ? 
            applyMunicipalRegistrationMask(initialData.municipal_registration) : "",
          email: initialData.email || "",
          password: "",
          ans_code: initialData.ans_code || "",
          description: initialData.description || "",
          legal_representative_name: initialData.legal_representative_name || "",
          legal_representative_cpf: initialData.legal_representative_cpf ? 
            applyCPFMask(initialData.legal_representative_cpf) : "",
          legal_representative_position: initialData.legal_representative_position || "",
          address: initialData.address || "",
          city: initialData.city || "",
          state: initialData.state || "",
          postal_code: initialData.postal_code ? applyCEPMask(initialData.postal_code) : "",
          // Format phones array properly, handling various possible structures
          phones: Array.isArray(initialData.phones) && initialData.phones.length > 0 
            ? initialData.phones.map((phone: any) => ({
                id: phone.id,
                number: phone.number ? applyPhoneMask(phone.number) : "",
                type: phone.type || "mobile"
              }))
            : [{ number: "", type: "mobile" }],
          // For edit mode, we don't populate procedures as they're handled separately
          selected_procedures: [],
          documents: [],
          auto_approve: false // In edit mode, default to not auto-approve
        };

        console.log("Formatted data for form:", formattedData);
        
        // Actually reset the form with the data
        form.reset(formattedData);
        
        // Log current form values
        console.log("Form values after reset:", form.getValues());
        
      } catch (error) {
        console.error("Error populating form with initial data:", error);
        useToastToast({
          title: "Erro ao carregar dados",
          description: "Ocorreu um erro ao carregar os dados do plano de saúde",
          variant: "destructive"
        });
      }
    }
  }, [initialData, isEditing]);

  // Function to fetch health plan procedures
  const fetchHealthPlanProcedures = async (healthPlanId: number) => {
    try {
      console.log("Fetching procedures for health plan:", healthPlanId);
      const response = await api.get(`/health-plans/${healthPlanId}/procedures`);
      console.log("Procedures response:", response.data);
      
      const procedures = response.data.data || [];
      
      // Map procedures to the format expected by the form
      const mappedProcedures = procedures.map((proc: any) => ({
        tuss_id: proc.tuss_procedure_id,
        tuss_code: proc.procedure?.code || "",
        name: proc.procedure?.name || "",
        initial_price: proc.price || 0,
        status: "accepted" // Assume existing procedures are accepted
      }));
      
      console.log("Mapped procedures:", mappedProcedures);
      
      // Update the form and field array
      if (mappedProcedures.length > 0) {
        replaceProcedures(mappedProcedures);
        form.setValue("selected_procedures", mappedProcedures);
      }
    } catch (error) {
      console.error("Error fetching health plan procedures:", error);
      useToastToast({
        title: "Erro ao carregar procedimentos",
        description: "Não foi possível carregar os procedimentos do plano de saúde",
        variant: "destructive"
      });
    }
  };

  // Effect to initialize documentFiles array when fields change
  useEffect(() => {
    // Make sure documentFiles array has the same length as documentFields
    if (documentFields.length !== documentFiles.length) {
      setDocumentFiles(Array(documentFields.length).fill(null));
    }
  }, [documentFields.length]);

  // Log errors when they change (for debugging)
  useEffect(() => {
    if (Object.keys(formErrors).length > 0) {
      console.log("Form validation errors:", formErrors);
      
      // Automatically switch to the tab containing errors
      if (formErrors.name || formErrors.cnpj || formErrors.email || formErrors.municipal_registration) {
        setActiveTab("basic-info");
      } else if (formErrors.legal_representative_name || formErrors.legal_representative_cpf || 
                formErrors.address || formErrors.city || formErrors.state || 
                formErrors.postal_code || formErrors.phones) {
        setActiveTab("additional-info");
      } else if (formErrors.documents) {
        setActiveTab("documents");
      } else if (formErrors.selected_procedures) {
        setActiveTab("tuss-procedures");
      }
    }
  }, [formErrors]);

  // Handlers para máscaras de input
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = applyCNPJMask(value);
    e.target.value = maskedValue; // Set the masked value directly to the input
    form.setValue("cnpj", maskedValue);
  };

  const handleMunicipalRegistrationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = applyMunicipalRegistrationMask(value);
    e.target.value = maskedValue; // Set the masked value directly to the input
    form.setValue("municipal_registration", maskedValue);
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = applyCPFMask(value);
    e.target.value = maskedValue; // Set the masked value directly to the input
    form.setValue("legal_representative_cpf", maskedValue);
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = applyCEPMask(value);
    e.target.value = maskedValue; // Set the masked value directly to the input
    form.setValue("postal_code", maskedValue);
    
    // Buscar endereço pelo CEP se tiver 8 dígitos
    if (unmask(maskedValue).length === 8) {
      fetchAddressByCEP(unmask(maskedValue));
    }
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    const maskedValue = applyCurrencyMask(value);
    e.target.value = maskedValue; // Set the masked value directly to the input
    const numericValue = parseFloat(unmask(value)) / 100 || 0;
    form.setValue(`selected_procedures.${index}.initial_price`, numericValue);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    const maskedValue = applyPhoneMask(value);
    e.target.value = maskedValue; // Set the masked value directly to the input
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

  // Buscar procedimentos TUSS
  const searchTussProcedures = async () => {
    if (!searchTerm || searchTerm.length < 3) return
    
    setIsSearching(true)
    try {
      const response = await api.get(`/tuss?search=${encodeURIComponent(searchTerm)}`)
      setTussProcedures(response.data.data || [])
    } catch (error) {
      console.error("Erro ao buscar procedimentos TUSS:", error)
      useToastToast({
        title: "Erro na busca",
        description: "Não foi possível buscar os procedimentos TUSS",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Adicionar procedimento TUSS à lista de selecionados
  const addProcedure = (procedure: TussProcedure) => {
    // Verificar se o procedimento já está na lista
    const exists = procedureFields.some((p: any) => p.tuss_id === procedure.id)
    if (exists) {
      useToastToast({
        title: "Procedimento já adicionado",
        description: "Este procedimento já está na lista",
        variant: "destructive"
      })
      return
    }
    
    // Adicionar procedimento
    appendProcedure({
      tuss_id: procedure.id,
      tuss_code: procedure.code,
      name: procedure.name,
      initial_price: 0, // Valor inicial que será negociado
      status: "pending"
    })
    
    setShowTussDialog(false)
    useToastToast({
      title: "Procedimento adicionado",
      description: "O procedimento foi adicionado à lista",
    })
  }

  // Função para lidar com upload do logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      if (file.size > 2 * 1024 * 1024) {
        useToastToast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 2MB",
          variant: "destructive"
        })
        return
      }

      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setLogoPreview(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Função para lidar com erros de imagem
  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    const originalSrc = img.src;
    
    // Prevenir loop infinito
    img.onerror = null;

    // Se a URL atual começa com http e não é o placeholder
    if (originalSrc.startsWith('http') && !originalSrc.includes('data:image')) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // Se temos a URL da API e dados da logo, tentar com URL do storage
      if (apiUrl && initialData?.logo && !originalSrc.includes('/storage/')) {
        img.src = `${apiUrl}/storage/${initialData.logo}`;
        return;
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam, remover preview
    setLogoPreview(null);
  }

  // Função para lidar com upload de documentos
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      if (file.size > 10 * 1024 * 1024) {
        useToastToast({
          title: "Arquivo muito grande",
          description: "O documento deve ter no máximo 10MB",
          variant: "destructive"
        })
        return
      }

      // Atualizar o array de documentos
      const newDocumentFiles = [...documentFiles]
      newDocumentFiles[index] = file
      setDocumentFiles(newDocumentFiles)
      
      // Atualizar o nome do arquivo no formulário para exibição
      form.setValue(`documents.${index}.file`, file.name)
      
      useToastToast({
        title: "Documento adicionado",
        description: `O arquivo "${file.name}" foi adicionado com sucesso`,
      });
    }
  }

  // Function to validate documents before submission
  const validateDocuments = () => {
    if (documentFields.length > 0) {
      // Check if any document is missing a file
      const missingFiles = documentFields.some((doc, index) => !documentFiles[index]);
      
      if (missingFiles) {
        useToastToast({
          title: "Documentos incompletos",
          description: "Um ou mais documentos não possuem arquivos anexados",
          variant: "destructive"
        });
        setActiveTab("documents");
        return false;
      }
    }
    return true;
  };

  // Update onSubmit function to handle documents in edit mode
  const onSubmit = async (data: HealthPlanFormValues) => {
    console.log("Form submission started", data);
    
    // Check permission
    if (!isEditing && !canCreateHealthPlan) {
      useToastToast({
        title: "Permissão negada",
        description: "Você não tem permissão para criar planos de saúde",
        variant: "destructive"
      });
      return;
    }

    // Validate documents first
    if (!validateDocuments()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Criar FormData para enviar ao backend
      const formData = new FormData();
      
      // For PUT requests when editing
      if (isEditing && healthPlanId) {
        formData.append("_method", "PUT");
      }
      
      // Adicionar campos de texto (remover máscaras dos campos que precisam)
      formData.append("name", data.name);
      formData.append("cnpj", unmask(data.cnpj));
      formData.append("municipal_registration", unmask(data.municipal_registration));
      formData.append("email", data.email);
      if (!isEditing) {
        formData.append("password", data.password);
      }
      formData.append("ans_code", data.ans_code || "");
      formData.append("description", data.description || "");
      formData.append("legal_representative_name", data.legal_representative_name);
      formData.append("legal_representative_cpf", unmask(data.legal_representative_cpf));
      formData.append("legal_representative_position", data.legal_representative_position);
      formData.append("address", data.address);
      formData.append("city", data.city);
      formData.append("state", data.state);
      formData.append("postal_code", unmask(data.postal_code));
      
      // Adicionar arquivo de logo se existir
      if (logoFile) {
        formData.append("logo", logoFile);
      }
      
      // Adicionar telefones
      if (data.phones && data.phones.length > 0) {
        data.phones.forEach((phone, index) => {
          // If phone has ID, include it for update
          if (phone.id) {
            formData.append(`phones[${index}][id]`, phone.id.toString());
          }
          formData.append(`phones[${index}][number]`, unmask(phone.number));
          formData.append(`phones[${index}][type]`, phone.type);
        });
      }
      
      // Adicionar documentos - both for new and edit mode
      if (data.documents && data.documents.length > 0 && documentFiles.length > 0) {
        data.documents.forEach((doc, index) => {
          if (documentFiles[index]) {
            formData.append(`documents[${index}][file]`, documentFiles[index] as File);
            formData.append(`documents[${index}][type]`, doc.type);
            formData.append(`documents[${index}][description]`, doc.description);
            
            if (doc.reference_date) {
              formData.append(`documents[${index}][reference_date]`, doc.reference_date);
            }
            
            if (doc.expiration_date) {
              formData.append(`documents[${index}][expiration_date]`, doc.expiration_date);
            }
          }
        });
      }
      
      // Sempre adicionar auto_approve como true para novos planos
      if (!isEditing) {
        formData.append("auto_approve", "true");
      }
      
      // Adicionar procedimentos SOMENTE para novos planos, NUNCA para edição
      if (!isEditing && data.selected_procedures && data.selected_procedures.length > 0) {
        data.selected_procedures.forEach((proc, index) => {
          formData.append(`procedures[${index}][tuss_id]`, proc.tuss_id.toString());
          formData.append(`procedures[${index}][proposed_value]`, proc.initial_price.toString());
          if (proc.status !== "pending") {
            formData.append(`procedures[${index}][status]`, proc.status);
          }
        });
      }
      
      // Determine the endpoint based on whether we're creating or updating
      const endpoint = isEditing && healthPlanId 
        ? `/health-plans/${healthPlanId}` 
        : "/health-plans";
      
      console.log(`Sending ${isEditing ? 'PUT' : 'POST'} request to ${endpoint}`);
      const response = await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      console.log("API response:", response);
      
      useToastToast({
        title: isEditing ? "Plano de saúde atualizado" : "Plano de saúde criado",
        description: isEditing 
          ? "O plano de saúde foi atualizado com sucesso" 
          : "O plano de saúde foi criado com sucesso e os procedimentos foram automaticamente aprovados",
      });

      // Redirecionar para lista de planos
      router.push("/health-plans");
      router.refresh();
    } catch (error: any) {
      console.error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} plano de saúde:`, error);
      console.log("Error response:", error.response);
      
      useToastToast({
        title: `Erro ao ${isEditing ? 'atualizar' : 'criar'} plano de saúde`,
        description: error.response?.data?.message || "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive"
      });

      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchSpecialties = async () => {
      setLoadingSpecialties(true)
      try {
        const response = await fetch("/api/specialties")
        const data = await response.json()
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

    fetchSpecialties()
  }, [toast])

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Novo Plano de Saúde</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Plano</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome do plano" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o CNPJ" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o telefone" {...field} />
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
                        <Input type="email" placeholder="Digite o email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o endereço" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zip_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o CEP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite a cidade" {...field} />
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
                      <FormControl>
                        <Input placeholder="Digite o estado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Digite a descrição do plano"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="Digite o website" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="specialties"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidades</FormLabel>
                    <Select
                      disabled={loadingSpecialties}
                      onValueChange={(value) => {
                        const currentValues = field.value || []
                        if (!currentValues.includes(value)) {
                          field.onChange([...currentValues, value])
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione as especialidades" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem key={specialty.id} value={specialty.id}>
                            {specialty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {field.value?.map((specialtyId: string) => {
                        const specialty = specialties.find((s: Specialty) => s.id === specialtyId)
                        return specialty ? (
                          <Badge
                            key={specialtyId}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {specialty.name}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0"
                              onClick={() => {
                                field.onChange(
                                  field.value?.filter((id: string) => id !== specialtyId)
                                )
                              }}
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Remover especialidade</span>
                            </Button>
                          </Badge>
                        ) : null
                      })}
                    </div>
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
                  Salvar
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
