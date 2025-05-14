import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react"
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
import { Loader2, Plus, Trash2, Check, User, Building2 } from "lucide-react"
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

// Modificar o schema do formulário
const formSchema = z.object({
  // Common fields
  documentType: z.enum(["cpf", "cnpj"], {
    required_error: "Tipo de documento é obrigatório",
  }),
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  email: z.string().email("Email inválido"),
  
  // Novo campo de endereços múltiplos
  addresses: z.array(addressSchema).min(1, "Pelo menos um endereço é necessário"),
  
  // Campos para profissionais (CPF)
  cpf: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  specialty: z.string().optional(),
  crm: z.string().optional(),
  bio: z.string().optional(),
  clinic_id: z.string().optional(),
  
  // Campos para estabelecimentos (CNPJ)
  cnpj: z.string().optional(),
  trading_name: z.string().optional(),
  foundation_date: z.string().optional(),
  business_hours: z.string().optional(),
  services: z.string().optional(),
  health_reg_number: z.string().optional(),
  
  // Documentos
  documents: z.array(documentSchema)
})
.superRefine((data, ctx) => {
  // Based on document type, validate required fields

  // Common validations for both types
  if (!data.name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Nome é obrigatório",
      path: ["name"]
    });
  }
  
  if (!data.email || !data.email.includes('@')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Email válido é obrigatório",
      path: ["email"]
    });
  }
  
  if (!data.phone || data.phone.replace(/\D/g, '').length < 10) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Telefone é obrigatório e deve ter pelo menos 10 dígitos",
      path: ["phone"]
    });
  }

  // Professional (CPF) specific validations
  if (data.documentType === "cpf") {
    if (!data.cpf || data.cpf.replace(/\D/g, '').length !== 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CPF válido é obrigatório",
        path: ["cpf"]
      });
    }
    
    if (!data.birth_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de nascimento é obrigatória",
        path: ["birth_date"]
      });
    }
    
    if (!data.gender) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Gênero é obrigatório",
        path: ["gender"]
      });
    }
    
    if (!data.specialty) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Especialidade é obrigatória",
        path: ["specialty"]
      });
    }
    
    if (!data.crm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CRM é obrigatório",
        path: ["crm"]
      });
    }
  } 
  // Establishment (CNPJ) specific validations
  else if (data.documentType === "cnpj") {
    if (!data.cnpj || data.cnpj.replace(/\D/g, '').length !== 14) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CNPJ válido é obrigatório",
        path: ["cnpj"]
      });
    }
    
    if (!data.trading_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Nome fantasia é obrigatório",
        path: ["trading_name"]
      });
    }
    
    if (!data.foundation_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de fundação é obrigatória",
        path: ["foundation_date"]
      });
    }
    
    if (!data.health_reg_number) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Registro sanitário é obrigatório",
        path: ["health_reg_number"]
      });
    }
  }
});

// Definir o tipo para os valores do formulário
type FormValues = z.infer<typeof formSchema>

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
const TypedFormField = FormField as any;

interface UnifiedFormProps {
  initialData?: Partial<FormValues>
  onSubmit: (data: FormValues) => Promise<void>
  isClinicAdmin?: boolean
  clinicId?: string
  entityId?: string
  activeTab?: string
  onTabChange?: (tab: string) => void
}

// Export the form as a forwarded ref component
export const ProfessionalForm = forwardRef(function ProfessionalForm({
  initialData,
  onSubmit: submitCallback,
  isClinicAdmin,
  clinicId,
  entityId,
  activeTab = "basic-info",
  onTabChange
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

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      documentType: initialData?.documentType || "cpf",
      name: initialData?.name || "",
      phone: initialData?.phone ? applyPhoneMask(initialData.phone) : "",
      email: initialData?.email || "",
      addresses: initialData?.addresses?.length
        ? initialData.addresses.map(addr => ({
            ...addr,
            postal_code: addr.postal_code ? applyCEPMask(addr.postal_code) : "",
            is_main: addr.is_main === undefined ? false : addr.is_main
          }))
        : [
            {
              street: "",
              number: "",
              complement: "",
              district: "",
              city: "",
              state: "",
              postal_code: "",
              is_main: true
            }
          ],
      
      // Professional fields
      cpf: initialData?.cpf || "",
      birth_date: initialData?.birth_date || "",
      gender: initialData?.gender || undefined,
      specialty: initialData?.specialty || "",
      crm: initialData?.crm || "",
      bio: initialData?.bio || "",
      clinic_id: isClinicAdmin ? clinicId : initialData?.clinic_id || "",
      
      // Establishment fields
      cnpj: initialData?.cnpj || "",
      trading_name: initialData?.trading_name || "",
      foundation_date: initialData?.foundation_date || "",
      business_hours: initialData?.business_hours || "",
      services: initialData?.services || "",
      health_reg_number: initialData?.health_reg_number || "",
      
      // Documents
      documents: initialData?.documents || [],
    },
  })
  
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

  // Update documentType state when form value changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "documentType") {
        setDocumentType(value.documentType as "cpf" | "cnpj");
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

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
    if (!documentTypes?.length) {
      return true; // Nothing to validate
    }

    const requiredTypes = documentTypes.filter(dt => dt.is_required);
    if (requiredTypes.length === 0) {
      return true; // No required documents
    }

    const currentDocs = form.getValues("documents") || [];
    
    let validationFailed = false;
    let failureMessages = [];
    
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
      } else if (requiredType.expiration_alert_days) {
        // If there is a document, check expiration date if needed
        if (!doc.expiration_date) {
          const errorMsg = `O documento "${requiredType.name}" requer data de expiração`;
          failureMessages.push(errorMsg);
          validationFailed = true;
        } else {
          // Check if the date is valid and in the future
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
      
      toast({
        title: "Documentos Obrigatórios",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    }
    
    return true;
  }, [documentTypes, form, toast]);

  useEffect(() => {
    const fetchClinics = async () => {
      if (isClinicAdmin) {
        // Se for admin da clínica, não precisa buscar clínicas
        setClinics([{ id: clinicId ?? '', name: "Minha Clínica" }])
        return
      }

      setLoadingClinics(true)
      try {
        const response = await fetch("/api/clinics")
        const data = await response.json()
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

  // Add required documents that haven't been added yet
  useEffect(() => {
    if (documentTypes?.length && documentFields.length === 0) {
      // Filter only required document types
      const requiredDocsTypes = documentTypes
        .filter(dt => dt.is_required);
      
      // Add empty required documents
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

  // Add error handler for form submission
  const handleFormSubmitError = (errors: FieldErrors<FormValues>) => {
    console.error("Form validation errors:", errors);
    
    // Show toast with error
    toast({
      title: "Erro de validação",
      description: "Por favor, verifique os campos destacados",
      variant: "destructive"
    });
    
    // If we're on a tab with errors, stay there
    // Otherwise, find the first tab with errors and navigate to it
    const basicInfoHasErrors = hasErrorsInTab(errors, "basic-info");
    const additionalInfoHasErrors = hasErrorsInTab(errors, "additional-info");
    const documentsHasErrors = hasErrorsInTab(errors, "documents");
    
    if (activeTab === "basic-info" && basicInfoHasErrors) {
      return; // Stay on current tab
    }
    
    if (activeTab === "additional-info" && additionalInfoHasErrors) {
      return; // Stay on current tab
    }
    
    if (activeTab === "documents" && documentsHasErrors) {
      return; // Stay on current tab
    }
    
    // Navigate to tab with errors
    if (basicInfoHasErrors) {
      onTabChange?.("basic-info");
    } else if (additionalInfoHasErrors) {
      onTabChange?.("additional-info");
    } else if (documentsHasErrors) {
      onTabChange?.("documents");
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
          errors.phone || 
          errors.cpf || 
          errors.cnpj || 
          errors.addresses
        );
      case "additional-info":
        return documentType === "cpf" 
          ? !!(errors.birth_date || errors.gender || errors.specialty || errors.crm || errors.bio) 
          : !!(errors.trading_name || errors.foundation_date || errors.health_reg_number || errors.business_hours || errors.services);
      case "documents":
        return !!errors.documents;
      default:
        return false;
    }
  };

  // Form submission handler
  const onFormSubmit = async (data: FormValues) => {
    try {
      setLoading(true);
      
      // Validate required documents
      if (!validateRequiredDocuments()) {
        setLoading(false);
        return;
      }
      
      // Call the onSubmit function from props with the enhanced data
      await submitCallback(data);
      
      toast({
        title: "Sucesso",
        description: entityId 
          ? "Profissional atualizado com sucesso" 
          : "Profissional cadastrado com sucesso",
        variant: "success"
      });
      
      // Remove localStorage data on successful submission
      localStorage.removeItem(FORM_STORAGE_KEY);
      
      router.push('/professionals');
      
    } catch (error: any) {
      console.error("Erro ao enviar formulário:", error);
      
      toast({
        title: "Erro",
        description: entityId
          ? "Não foi possível atualizar o profissional"
          : "Não foi possível cadastrar o profissional",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Update the handleSubmit function to handle documents
  const handleSubmit = async (data: FormValues) => {
    setLoading(true);
    
    try {
      // Validate required documents
      if (!validateRequiredDocuments()) {
        setLoading(false);
        return;
      }
      
      // Call the onSubmit function from props with the enhanced data
      await submitCallback(data);
      
      toast({
        title: "Sucesso",
        description: data.documentType === "cpf" 
          ? "Profissional salvo com sucesso" 
          : "Estabelecimento salvo com sucesso",
      });
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      
      toast({
        title: "Erro",
        description: data.documentType === "cpf"
          ? "Não foi possível salvar o profissional"
          : "Não foi possível salvar o estabelecimento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Função para lidar com erros do formulário - navigate to tab with errors
  const handleFormError = (errors: any) => {
    console.log("Form errors:", errors);
    
    if (Object.keys(errors).length > 0) {
      let tabToFocus = "basic-info";
      
      const basicInfoFields = ["name", "cpf", "cnpj", "email", "trading_name", "birth_date", "foundation_date", "gender"];
      const additionalInfoFields = ["addresses", "phone", "specialty", "crm", "bio", "clinic_id", "business_hours", "services", "health_reg_number"];
      const documentFields = ["documents"];
      
      // Check which tab has errors
      const hasBasicInfoErrors = Object.keys(errors).some(field => basicInfoFields.includes(field));
      const hasAdditionalInfoErrors = Object.keys(errors).some(field => additionalInfoFields.includes(field));
      const hasDocumentErrors = Object.keys(errors).some(field => documentFields.includes(field)) || 
                               (errors.documents && errors.documents.some((doc: any) => doc));
      
      if (hasDocumentErrors) {
        tabToFocus = "documents";
      } else if (hasAdditionalInfoErrors) {
        tabToFocus = "additional-info";
      } else if (hasBasicInfoErrors) {
        tabToFocus = "basic-info";
      }
      
      // Change to the tab with errors
      if (onTabChange) {
        onTabChange(tabToFocus);
      }
    }
  };

  // Handle document file change
  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = validateDocument(file);
      if (!validation.isValid && validation.error) {
        toast({
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
      
      toast({
        title: "Sucesso",
        description: "Documento adicionado com sucesso",
        variant: "success"
      });
    }
  };

  // Handle document type change
  const handleDocumentTypeChange = (value: "cpf" | "cnpj") => {
    setDocumentType(value);
    
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
      form.setValue("crm", "");
      form.setValue("bio", "");
    }
    
    // Clear documents since they're different for each type
    form.setValue("documents", []);
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
    return documentFields.map((field, index) => {
      const currentTypeId = form.getValues(`documents.${index}.type_id`);
      const currentDocType = documentTypes?.find(dt => dt.id === currentTypeId);
      const hasExistingFile = !!form.getValues(`documents.${index}.file_url`);
      
      return (
        <div key={field.id} className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-end gap-4">
            <TypedFormField
              control={form.control}
              name={`documents.${index}.type_id` as any}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>
                    Tipo de Documento
                    {currentDocType?.is_required && <span className="text-red-500">*</span>}
                  </FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(value) => handleDocumentItemTypeChange(value, index)}
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
            name={`documents.${index}.file` as any}
            render={({ field }) => (
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
            name={`documents.${index}.expiration_date` as any}
            render={({ field }) => (
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
            name={`documents.${index}.observation` as any}
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
    });
  };

  // Add these new functions to handle tab navigation with validation
  // Add before the return statement in the ProfessionalForm component
  
  // Validate the current tab before proceeding
  const validateTab = async (currentTab: string, nextTab: string) => {
    if (currentTab === "basic-info") {
      // Always validate document type first
      const docTypeValid = await form.trigger("documentType");
      if (!docTypeValid) {
        return false;
      }
      
      // Validate basic info fields based on document type
      const commonFields = ["name", "email"];
      const cpfFields = ["cpf", "birth_date", "gender"];
      const cnpjFields = ["cnpj", "trading_name", "foundation_date"];
      
      const fieldsToValidate = [
        "documentType", 
        ...commonFields,
        ...(documentType === "cpf" ? cpfFields : cnpjFields)
      ];
      
      return await form.trigger(fieldsToValidate as any);
    } 
    else if (currentTab === "additional-info") {
      // Validate additional info fields
      const commonFields = ["phone"];
      const cpfFields = ["specialty", "crm"];
      const cnpjFields = ["health_reg_number"];
      
      const fieldsToValidate = [
        ...commonFields,
        ...(documentType === "cpf" ? cpfFields : cnpjFields)
      ];
      
      return await form.trigger(fieldsToValidate as any);
    }
    
    return true;
  };
  
  // Add a new state to track if form progression has started
  const [formProgressed, setFormProgressed] = useState(false);
  
  // Update handleNextTab to set formProgressed when moving from basic-info
  const handleNextTab = async (currentTab: string, nextTab: string) => {
    const isValid = await validateTab(currentTab, nextTab);
    
    if (isValid) {
      if (currentTab === "basic-info") {
        setFormProgressed(true);
      }
      onTabChange?.(nextTab);
    } else {
      toast({
        title: "Erro de validação",
        description: "Por favor, preencha todos os campos obrigatórios antes de continuar.",
        variant: "destructive"
      });
    }
  };

  // Adicionar botão para novo endereço
  const handleAddAddress = () => {
    appendAddress({
      street: "",
      number: "",
      complement: "",
      district: "",
      city: "",
      state: "",
      postal_code: "",
      is_main: false
    });
  };

  // Expose form methods to parent component
  useImperativeHandle(ref, () => ({
    validateTab,
    getForm: () => form
  }), [form]);

  // Add key for localStorage
  const FORM_STORAGE_KEY = `professional-form-${entityId || 'new'}`;

  // Inside the ProfessionalForm component
  // Add state for navigation confirmation dialog
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [navigationPath, setNavigationPath] = useState<string | null>(null);

  // Add function to handle navigation attempt
  const handleNavigation = (path: string) => {
    const formHasChanges = Object.keys(form.formState.dirtyFields).length > 0;
    
    if (formHasChanges) {
      setNavigationPath(path);
      setShowExitDialog(true);
    } else {
      router.push(path);
    }
  };

  // Add function to handle confirmed exit
  const handleConfirmExit = () => {
    localStorage.removeItem(FORM_STORAGE_KEY);
    if (navigationPath) {
      router.push(navigationPath);
    } else {
      router.back();
    }
    setShowExitDialog(false);
  };

  // Inside the component, add these useEffect hooks for localStorage persistence
  useEffect(() => {
    // Load form data from localStorage on mount
    const savedFormData = localStorage.getItem(FORM_STORAGE_KEY);
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        // Only load data if we don't already have initialData
        if (!initialData) {
          // Don't reset form if there's initialData (editing)
          form.reset(parsedData);
          // Set the document type from loaded data
          if (parsedData.documentType) {
            setDocumentType(parsedData.documentType);
          }
        }
      } catch (error) {
        console.error("Error parsing saved form data:", error);
        // If error parsing, remove invalid data
        localStorage.removeItem(FORM_STORAGE_KEY);
      }
    }
  }, [form, FORM_STORAGE_KEY, initialData]);

  // Save form data to localStorage on form change
  useEffect(() => {
    // Watch for form changes and save to localStorage
    const subscription = form.watch((data) => {
      if (Object.keys(form.formState.dirtyFields).length > 0) {
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(data));
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form, FORM_STORAGE_KEY]);

  // Inside component
  const [cidadesDoEstado, setCidadesDoEstado] = useState<string[]>([]);

  // Define the memoized function to update cities based on selected state
  const atualizarCidadesPorEstado = useCallback((uf: string) => {
    if (!uf) {
      setCidadesDoEstado([]);
      return;
    }

    // Find the state in the data
    const estadoEncontrado = estadosCidadesData.estados.find(
      estado => estado.sigla === uf
    );

    if (estadoEncontrado) {
      setCidadesDoEstado(estadoEncontrado.cidades);
    } else {
      setCidadesDoEstado([]);
    }
  }, []);

  // Fix the document type change handler for specific document items
  const handleDocumentItemTypeChange = (value: string, index: number) => {
    const typeId = parseInt(value);
    const docType = documentTypes?.find(dt => dt.id === typeId);
    
    if (docType) {
      form.setValue(`documents.${index}.type_id` as any, typeId);
    }
  };

  // Add CEP change handler
  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    const maskedValue = applyCEPMask(value);
    form.setValue(`addresses.${index}.postal_code` as any, maskedValue, { shouldValidate: true });
    
    // Fetch address by CEP if it has 8 digits
    if (unmask(maskedValue).length === 8) {
      fetchAddressByCEP(unmask(maskedValue), index);
    }
  };

  // Add CEP lookup function
  const fetchAddressByCEP = async (cep: string, index: number) => {
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
      
      // Fill address fields with returned data
      form.setValue(`addresses.${index}.street` as any, data.logradouro);
      form.setValue(`addresses.${index}.district` as any, data.bairro);
      form.setValue(`addresses.${index}.state` as any, data.uf);
      
      // Update cities for the state
      atualizarCidadesPorEstado(data.uf);
      
      // Set city
      form.setValue(`addresses.${index}.city` as any, data.localidade);
      
      toast({
        title: "Endereço preenchido",
        description: "Os dados de endereço foram preenchidos automaticamente",
        variant: "success"
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

  // Update the effect to initialize cities when state changes
  useEffect(() => {
    // Process addresses if they exist
    const addresses = form.getValues("addresses");
    if (addresses && addresses.length > 0) {
      addresses.forEach((address, index) => {
        if (address.state) {
          atualizarCidadesPorEstado(address.state);
        }
      });
    }
    
    // Listen for changes in addresses
    const subscription = form.watch((formValues) => {
      if (formValues && formValues.addresses) {
        formValues.addresses.forEach((address: any, index: number) => {
          if (address && address.state) {
            atualizarCidadesPorEstado(address.state);
          }
        });
      }
    });
    
    // Clean up subscription
    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [form, atualizarCidadesPorEstado]);

  // Update the TypedFormField component interface
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

  function TypedFormField<T extends FieldPath<FormValues>>({
    name,
    control,
    render,
  }: TypedFormFieldProps<T>) {
    return (
      <FormField
        control={control as any}
        name={name}
        render={render as any}
      />
    );
  }

  // Also fix document fields where we use "as any"
  interface TypedDocumentFieldProps {
    name: string;
    control: Control<FormValues>;
    render: (props: {
      field: ControllerRenderProps<FormValues, any>;
      fieldState: {
        invalid: boolean;
        isTouched: boolean;
        isDirty: boolean;
        error?: FieldError;
      };
    }) => React.ReactElement;
  }

  function TypedDocumentField({
    name,
    control,
    render,
  }: TypedDocumentFieldProps) {
    return (
      <FormField
        control={control as any}
        name={name as any}
        render={render as any}
      />
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-muted/50">
        <CardTitle>
          {documentType === "cpf" ? "Novo Profissional" : "Novo Estabelecimento"}
          {activeTab !== "basic-info" && (
            <Badge className="ml-2 bg-primary/10 text-primary border-primary/20">
              {documentType === "cpf" ? (
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" /> CPF
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> CNPJ
                </div>
              )}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onFormSubmit, handleFormSubmitError)} className="space-y-6">
              {/* Type selection - only in first tab */}
              {activeTab === "basic-info" && (
                <TypedFormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem className="space-y-3 mb-6 p-4 bg-muted/30 rounded-lg">
                      <FormLabel className="text-lg font-semibold">
                        Tipo de Cadastro<span className="text-red-500">*</span>
                        {formProgressed && (
                          <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                            Não modificável
                          </Badge>
                        )}
                      </FormLabel>
                      <FormDescription>
                        {formProgressed 
                          ? "O tipo de cadastro não pode ser alterado após o preenchimento dos dados básicos" 
                          : "Selecione o tipo de entidade que você está cadastrando"}
                      </FormDescription>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value: "cpf" | "cnpj") => {
                            field.onChange(value);
                            handleDocumentTypeChange(value);
                          }}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="cpf" id="cpf" disabled={formProgressed} />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer" htmlFor="cpf">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-2" />
                                <span>Profissional (CPF)</span>
                              </div>
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="cnpj" id="cnpj" disabled={formProgressed} />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer" htmlFor="cnpj">
                              <div className="flex items-center">
                                <Building2 className="h-4 w-4 mr-2" />
                                <span>Estabelecimento/Clínica (CNPJ)</span>
                              </div>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Basic Info Tab */}
              {activeTab === "basic-info" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TypedFormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {documentType === "cpf" ? "Nome Completo" : "Razão Social"}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={documentType === "cpf" 
                                ? "Digite o nome completo" 
                                : "Digite a razão social"} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {documentType === "cpf" ? (
                      <TypedFormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CPF<span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Digite o CPF (apenas números)" 
                                {...field} 
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const maskedValue = applyCPFMask(value);
                                  field.onChange(maskedValue);
                                }}
                                maxLength={14}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <TypedFormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ<span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Digite o CNPJ (apenas números)" 
                                {...field} 
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const maskedValue = applyCNPJMask(value);
                                  field.onChange(maskedValue);
                                }}
                                maxLength={18}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <TypedFormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email<span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Digite o email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {documentType === "cnpj" && (
                      <TypedFormField
                        control={form.control}
                        name="trading_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Fantasia<span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input placeholder="Digite o nome fantasia" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {documentType === "cpf" ? (
                      <>
                        <TypedFormField
                          control={form.control}
                          name="birth_date"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data de Nascimento<span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <TypedFormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Gênero<span className="text-red-500">*</span></FormLabel>
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
                      </>
                    ) : (
                      <TypedFormField
                        control={form.control}
                        name="foundation_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Fundação<span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                      disabled={loading}
                    >
                      Limpar
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => handleNextTab("basic-info", "additional-info")}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}

              {/* Additional Info Tab */}
              {activeTab === "additional-info" && (
                <div className="space-y-4">
                  {/* Summary of basic info */}
                  <div className="bg-muted/20 p-3 rounded-lg mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Informações Básicas:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Nome:</span> {form.getValues('name')}
                      </div>
                      <div>
                        <span className="font-medium">
                          {documentType === "cpf" ? "CPF:" : "CNPJ:"}
                        </span> {documentType === "cpf" ? form.getValues('cpf') : form.getValues('cnpj')}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {form.getValues('email')}
                      </div>
                      {documentType === "cpf" && (
                        <>
                          <div>
                            <span className="font-medium">Data Nasc.:</span> {form.getValues('birth_date')}
                          </div>
                        </>
                      )}
                      {documentType === "cnpj" && (
                        <>
                          <div>
                            <span className="font-medium">Nome Fantasia:</span> {form.getValues('trading_name')}
                          </div>
                          <div>
                            <span className="font-medium">Data Fund.:</span> {form.getValues('foundation_date')}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
              
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TypedFormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone<span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Digite o telefone" 
                              {...field} 
                              onChange={(e) => {
                                const value = e.target.value;
                                const maskedValue = applyPhoneMask(value);
                                field.onChange(maskedValue);
                              }}
                              maxLength={15}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Endereços */}
                    <div className="space-y-4 mt-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Endereços</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddAddress}
                          className="bg-blue-50 hover:bg-blue-100 border-blue-200"
                        >
                          <Plus className="w-4 h-4 mr-2 text-blue-500" />
                          Adicionar Endereço
                        </Button>
                      </div>
                      
                      {addressFields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-md space-y-4">
                          <div className="flex justify-between">
                            <h4 className="font-medium">Endereço {index + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (addressFields.length > 1) {
                                  removeAddress(index);
                                } else {
                                  toast({
                                    title: "Erro",
                                    description: "É necessário pelo menos um endereço",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              disabled={addressFields.length <= 1}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TypedFormField
                              control={form.control}
                              name={`addresses.${index}.street` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Rua<span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="Digite a rua" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <TypedFormField
                              control={form.control}
                              name={`addresses.${index}.number` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Número<span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="Digite o número" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <TypedFormField
                              control={form.control}
                              name={`addresses.${index}.complement` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Complemento</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Digite o complemento" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <TypedFormField
                              control={form.control}
                              name={`addresses.${index}.district` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Bairro<span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input placeholder="Digite o bairro" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <TypedFormField
                              control={form.control}
                              name={`addresses.${index}.city` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Cidade<span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Select
                                      value={field.value}
                                      onValueChange={(value) => form.setValue(`addresses.${index}.city` as any, value)}
                                      disabled={!form.getValues(`addresses.${index}.state`) || cidadesDoEstado.length === 0}
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
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <TypedFormField
                              control={form.control}
                              name={`addresses.${index}.state` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Estado<span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Select
                                      value={field.value}
                                      onValueChange={(value) => {
                                        form.setValue(`addresses.${index}.state` as any, value);
                                        form.setValue(`addresses.${index}.city` as any, "");
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
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <TypedFormField
                              control={form.control}
                              name={`addresses.${index}.postal_code` as const}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CEP<span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      onChange={(e) => handleCEPChange(e, index)}
                                      placeholder="00000-000"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <TypedFormField
                              control={form.control}
                              name={`addresses.${index}.is_main` as const}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-4">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={(checked) => {
                                        // Se estiver marcando como principal, desmarca os outros
                                        if (checked) {
                                          const formValues = form.getValues();
                                          formValues.addresses.forEach((_, i) => {
                                            if (i !== index) {
                                              form.setValue(`addresses.${i}.is_main`, false);
                                            }
                                          });
                                        }
                                        field.onChange(checked);
                                      }}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>Endereço Principal</FormLabel>
                                    <FormDescription>
                                      Marque esta opção se este for o endereço principal
                                    </FormDescription>
                                  </div>
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Professional or establishment specific fields */}
                    {documentType === "cpf" ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <TypedFormField
                            control={form.control}
                            name="specialty"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Especialidade<span className="text-red-500">*</span></FormLabel>
                                <Select
                                  disabled={loadingSpecialties}
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione uma especialidade" />
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
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <TypedFormField
                            control={form.control}
                            name="crm"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CRM<span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input placeholder="Digite o CRM" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <TypedFormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Biografia</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Digite a biografia do profissional"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {!isClinicAdmin && (
                          <TypedFormField
                            control={form.control}
                            name="clinic_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Clínica</FormLabel>
                                <Select
                                  disabled={loadingClinics}
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione uma clínica" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {clinics.map((clinic) => (
                                      <SelectItem key={clinic.id} value={clinic.id}>
                                        {clinic.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <TypedFormField
                          control={form.control}
                          name="health_reg_number"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Registro Sanitário<span className="text-red-500">*</span></FormLabel>
                              <FormControl>
                                <Input placeholder="Digite o número de registro" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <TypedFormField
                          control={form.control}
                          name="business_hours"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Horário de Funcionamento</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Descreva os horários de funcionamento"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <TypedFormField
                          control={form.control}
                          name="services"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Serviços Oferecidos</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Descreva os serviços oferecidos"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <div className="flex justify-between space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onTabChange?.("basic-info")}
                        disabled={loading}
                      >
                        Voltar
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => handleNextTab("additional-info", "documents")}
                      >
                        Próximo
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents Tab */}
              {activeTab === "documents" && (
                <div className="space-y-6">
                  {/* Summary of basic info */}
                  <div className="bg-muted/20 p-3 rounded-lg mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Resumo do Cadastro:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">Nome:</span> {form.getValues('name')}
                      </div>
                      <div>
                        <span className="font-medium">
                          {documentType === "cpf" ? "CPF:" : "CNPJ:"}
                        </span> {documentType === "cpf" ? form.getValues('cpf') : form.getValues('cnpj')}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {form.getValues('email')}
                      </div>
                      <div>
                        <span className="font-medium">Telefone:</span> {form.getValues('phone')}
                      </div>
                      {documentType === "cpf" && (
                        <>
                          <div>
                            <span className="font-medium">Especialidade:</span> {specialties.find(s => s.id === form.getValues('specialty'))?.name || form.getValues('specialty')}
                          </div>
                          <div>
                            <span className="font-medium">CRM:</span> {form.getValues('crm')}
                          </div>
                        </>
                      )}
                      {documentType === "cnpj" && (
                        <>
                          <div>
                            <span className="font-medium">Nome Fantasia:</span> {form.getValues('trading_name')}
                          </div>
                          <div>
                            <span className="font-medium">Reg. Sanitário:</span> {form.getValues('health_reg_number')}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <Badge className="bg-purple-500">Documentos</Badge>
                        Documentação {documentType === "cpf" ? "do Profissional" : "do Estabelecimento"}
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
                    
                    <div className="space-y-4">
                      {renderDocuments()}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 mt-8 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleNavigation('/professionals')}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                    
                    <Button 
                      type="submit" 
                      disabled={loading}
                    >
                      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {entityId ? "Atualizar" : "Cadastrar"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>
      </CardContent>
      
      {/* Exit confirmation dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Há alterações não salvas que serão perdidas se você sair.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmExit}>
              Sim, descartar alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}) 