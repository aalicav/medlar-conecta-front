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
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Plus, Trash, SearchIcon, DollarSign, AlertCircle, CheckCircle, InfoIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

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
        toast({
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
      toast({
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

  // Buscar procedimentos TUSS
  const searchTussProcedures = async () => {
    if (!searchTerm || searchTerm.length < 3) return
    
    setIsSearching(true)
    try {
      const response = await api.get(`/tuss?search=${encodeURIComponent(searchTerm)}`)
      setTussProcedures(response.data.data || [])
    } catch (error) {
      console.error("Erro ao buscar procedimentos TUSS:", error)
      toast({
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
      toast({
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
    toast({
      title: "Procedimento adicionado",
      description: "O procedimento foi adicionado à lista",
    })
  }

  // Função para lidar com upload do logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      
      if (file.size > 2 * 1024 * 1024) {
        toast({
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
        toast({
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
      
      toast({
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
        toast({
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
      toast({
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
      
      toast({
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
      
      toast({
        title: `Erro ao ${isEditing ? 'atualizar' : 'criar'} plano de saúde`,
        description: error.response?.data?.message || "Ocorreu um erro ao processar sua solicitação",
        variant: "destructive"
      });

      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full shadow-sm">
      <CardContent className="pt-6 px-2 sm:px-6">
        <Tabs defaultValue="basic-info" value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="mb-6 w-full max-w-none grid grid-cols-3">
              <TabsTrigger value="basic-info" className="text-xs sm:text-sm">
                Informações Básicas
                {!!formErrors.name || !!formErrors.cnpj || !!formErrors.email && (
                  <span className="ml-2 text-red-500">•</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="additional-info" className="text-xs sm:text-sm">
                Informações Adicionais
                {!!formErrors.legal_representative_name || !!formErrors.legal_representative_cpf || 
                 !!formErrors.address || !!formErrors.city || !!formErrors.state || 
                 !!formErrors.postal_code || !!formErrors.phones && (
                  <span className="ml-2 text-red-500">•</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs sm:text-sm">
                Documentos
                {!!formErrors.documents && (
                  <span className="ml-2 text-red-500">•</span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="basic-info">
                {/* Seção: Informações Básicas */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Informações Básicas</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Plano *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo do plano de saúde" {...field} />
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
                          <FormLabel>CNPJ *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="00.000.000/0000-00" 
                              {...field}
                              onChange={(e) => {
                                handleCNPJChange(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="municipal_registration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inscrição Municipal *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field}
                              onChange={(e) => {
                                handleMunicipalRegistrationChange(e);
                              }}
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
                          <FormLabel>E-mail *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="E-mail do plano de saúde" 
                              type="email"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {!isEditing && (
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Senha</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Senha para acesso" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="ans_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código ANS</FormLabel>
                          <FormControl>
                            <Input placeholder="Código da Agência Nacional de Saúde" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="sm:col-span-2">
                      <FormLabel>Logo</FormLabel>
                      <div className="mt-1">
                        <div className="flex items-center justify-center border rounded-md p-2">
                          <label className="cursor-pointer flex flex-col items-center space-y-2 w-full">
                            {logoPreview ? (
                              <div className="w-24 h-24 sm:w-32 sm:h-32 relative">
                                <img
                                  src={logoPreview}
                                  alt="Logo preview"
                                  className="w-full h-full object-contain"
                                  onError={handleLogoError}
                                />
                              </div>
                            ) : (
                              <div className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-dashed rounded-md flex items-center justify-center bg-gray-50">
                                <div className="text-center">
                                  <div className="flex justify-center">
                                    <svg
                                      className="mx-auto h-12 w-12 text-gray-400"
                                      stroke="currentColor"
                                      fill="none"
                                      viewBox="0 0 48 48"
                                      aria-hidden="true"
                                    >
                                      <path
                                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </div>
                                  <span className="mt-2 block text-sm text-gray-500">
                                    Selecionar logo
                                  </span>
                                </div>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoChange}
                            />
                            <Button type="button" variant="outline" size="sm">
                              {logoPreview ? "Alterar imagem" : "Escolher imagem"}
                            </Button>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Informações adicionais sobre o plano de saúde"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-6">
                  <Button type="button" onClick={() => setActiveTab("additional-info")} className="w-full sm:w-auto">
                    Próximo
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="additional-info">
                {/* Seção: Representante Legal */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Representante Legal</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="legal_representative_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Representante *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} />
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
                          <FormLabel>CPF do Representante *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="000.000.000-00" 
                              {...field}
                              onChange={(e) => {
                                handleCPFChange(e);
                              }}
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
                          <FormLabel>Cargo do Representante *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Diretor, Presidente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Seção: Endereço */}
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Endereço</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Endereço Completo *</FormLabel>
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
                          <FormLabel>Cidade *</FormLabel>
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
                          <FormLabel>Estado *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BRAZILIAN_STATES.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
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
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="00000-000" 
                              {...field}
                              onChange={(e) => {
                                handleCEPChange(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Seção: Telefones */}
                <div className="mt-8">
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
                                <FormLabel>Número *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="(00) 00000-0000" 
                                    {...phoneField}
                                    onChange={(e) => {
                                      handlePhoneChange(e, index);
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
                                <FormLabel>Tipo *</FormLabel>
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
                
                <div className="flex flex-col sm:flex-row justify-between mt-6 space-y-2 sm:space-y-0">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("basic-info")} className="w-full sm:w-auto">
                    Anterior
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("documents")} className="w-full sm:w-auto">
                    Próximo
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="documents">
                <div>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
                    <h2 className="text-xl font-semibold">Documentos</h2>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendDocument({ file: null, type: "contract", description: "", reference_date: "", expiration_date: "" })}
                      className="w-full sm:w-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Documento
                    </Button>
                  </div>
                  
                  <div className="mt-4">
                    {documentFields.length > 0 ? (
                      <div className="space-y-4">
                        {documentFields.map((field, index) => (
                          <div key={field.id} className="border rounded-md p-4 bg-gray-50">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium">Documento {index + 1}</h3>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeDocument(index)}
                              >
                                <Trash className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                              <div className="sm:col-span-2">
                                <FormLabel>Arquivo*</FormLabel>
                                <div className="mt-1">
                                  <div className="flex items-center justify-center border rounded-md p-2">
                                    <label className="cursor-pointer flex flex-col items-center space-y-2 w-full">
                                      <div className="w-full h-16 border-2 border-dashed rounded-md flex items-center justify-center px-2">
                                        <span className="text-sm text-gray-500 text-center truncate max-w-full">
                                          {documentFiles[index] ? documentFiles[index]?.name : "Selecionar arquivo"}
                                        </span>
                                      </div>
                                      <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => handleDocumentChange(e, index)}
                                      />
                                      <Button type="button" variant="outline" size="sm" className="w-full sm:w-auto">
                                        Escolher arquivo
                                      </Button>
                                    </label>
                                  </div>
                                </div>
                                {/* Error message for file */}
                                {!documentFiles[index] && form.formState.isSubmitted && (
                                  <p className="text-sm text-red-500 mt-1">Por favor, selecione um arquivo</p>
                                )}
                              </div>
                              
                              <FormField
                                control={form.control}
                                name={`documents.${index}.type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tipo*</FormLabel>
                                    <Select
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {DOCUMENT_TYPES.map((type) => (
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
                              
                              <FormField
                                control={form.control}
                                name={`documents.${index}.description`}
                                render={({ field }) => (
                                  <FormItem className="col-span-2">
                                    <FormLabel>Descrição*</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Descrição do documento" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`documents.${index}.reference_date`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Data de Referência</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name={`documents.${index}.expiration_date`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Data de Expiração</FormLabel>
                                    <FormControl>
                                      <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed rounded-md p-4 sm:p-8 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <AlertCircle className="h-8 w-8 mb-2" />
                          <p className="mb-2">Nenhum documento adicionado</p>
                          <p className="text-sm">Adicione documentos relevantes como contrato, certificado ANS, etc.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Display form-level error message for documents */}
                  {formErrors.documents && (
                    <div className="mt-4 p-4 border rounded-md bg-red-50 text-red-800">
                      <p className="text-sm flex items-start">
                        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                        <span>
                          {formErrors.documents.message || "Verifique os documentos anexados"}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="mt-4 p-4 border rounded-md bg-blue-50 text-blue-800">
                    <p className="text-sm flex items-start">
                      <InfoIcon className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                      <span>
                        Você pode adicionar documentos como contrato, certificados e autorizações diretamente na criação do plano.
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between mt-6 space-y-2 sm:space-y-0">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("additional-info")} className="w-full sm:w-auto">
                    Anterior
                  </Button>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      Cancelar
                    </Button>
                    
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        isEditing ? 'Salvar Alterações' : 'Criar Plano'
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  )
}
