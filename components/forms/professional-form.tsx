import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react"
import { useForm, useFieldArray } from "react-hook-form"
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

// Create a unified schema that handles both professional and establishment
const formSchema = z.object({
  // Common fields
  documentType: z.enum(["cpf", "cnpj"], {
    required_error: "Tipo de documento é obrigatório",
  }),
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(10, "Telefone deve ter pelo menos 10 dígitos"),
  email: z.string().email("Email inválido"),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  
  // Conditional professional fields
  cpf: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  specialty: z.string().optional(),
  crm: z.string().optional(),
  bio: z.string().optional(),
  clinic_id: z.string().optional(),
  
  // Conditional establishment fields
  cnpj: z.string().optional(),
  trading_name: z.string().optional(),
  foundation_date: z.string().optional(),
  business_hours: z.string().optional(),
  services: z.string().optional(),
  health_reg_number: z.string().optional(),
  
  // Documents
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

type FormValues = z.infer<typeof formSchema>

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
  onSubmit,
  isClinicAdmin,
  clinicId,
  entityId,
  activeTab = "basic-info",
  onTabChange
}: UnifiedFormProps, ref) {
  const { toast } = useToast()
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
    resolver: zodResolver(formSchema),
    defaultValues: {
      documentType: initialData?.documentType || "cpf",
      name: initialData?.name || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      zip_code: initialData?.zip_code || "",
      
      // Professional fields
      cpf: initialData?.cpf || "",
      birth_date: initialData?.birth_date || "",
      gender: initialData?.gender || "other",
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
      await onSubmit(data);
      
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
      const additionalInfoFields = ["address", "city", "state", "zip_code", "phone", "specialty", "crm", "bio", "clinic_id", "business_hours", "services", "health_reg_number"];
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
  
  // Handle form submission error
  const handleFormSubmitError = (errors: any) => {
    console.log('Form validation errors:', errors);
    
    // Navigate to the tab with errors
    handleFormError(errors);
    
    // Toast with error message
    toast({
      title: "Erro de validação",
      description: "Verifique os campos destacados em vermelho",
      variant: "destructive"
    });
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
  const handleDocumentTypeChange = (value: string, index: number) => {
    const typeId = parseInt(value);
    const docType = documentTypes?.find(dt => dt.id === typeId);
    
    if (docType) {
      form.setValue(`documents.${index}.type_id` as any, typeId);
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
    return documentFields.map((field, index) => {
      const currentTypeId = form.getValues(`documents.${index}.type_id`);
      const currentDocType = documentTypes?.find(dt => dt.id === currentTypeId);
      const hasExistingFile = !!form.getValues(`documents.${index}.file_url`);
      
      return (
        <div key={field.id} className="space-y-4 p-4 border rounded-lg">
          <div className="flex items-end gap-4">
            <FormField
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

          <FormField
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

          <FormField
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

          <FormField
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

  // Expose form methods to parent component
  useImperativeHandle(ref, () => ({
    validateTab,
    getForm: () => form
  }), [form]);

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
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit, handleFormSubmitError)} className="space-y-6">
              {/* Type selection - only in first tab */}
              {activeTab === "basic-info" && (
                <FormField
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
                          onValueChange={(value) => {
                            field.onChange(value);
                            setDocumentType(value as "cpf" | "cnpj");
                          }}
                          defaultValue={field.value}
                          className="flex flex-row space-x-1 p-1 bg-muted rounded-lg"
                          disabled={formProgressed}
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0 w-1/2">
                            <FormControl>
                              <RadioGroupItem value="cpf" className="sr-only peer" />
                            </FormControl>
                            <FormLabel className="w-full h-full py-2 px-4 rounded-md peer-data-[state=checked]:bg-white peer-data-[state=checked]:shadow-sm cursor-pointer transition-all flex justify-center items-center gap-2 font-normal">
                              <User className="h-4 w-4" /> Profissional (CPF)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0 w-1/2">
                            <FormControl>
                              <RadioGroupItem value="cnpj" className="sr-only peer" />
                            </FormControl>
                            <FormLabel className="w-full h-full py-2 px-4 rounded-md peer-data-[state=checked]:bg-white peer-data-[state=checked]:shadow-sm cursor-pointer transition-all flex justify-center items-center gap-2 font-normal">
                              <Building2 className="h-4 w-4" /> Estabelecimento (CNPJ)
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
                    <FormField
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
                      <FormField
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
                      <FormField
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

                    <FormField
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
                      <FormField
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
                        <FormField
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

                        <FormField
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
                      <FormField
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
                    <FormField
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

                    <FormField
                      control={form.control}
                      name="zip_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Digite o CEP" 
                              {...field} 
                              onChange={(e) => {
                                const value = e.target.value;
                                const maskedValue = applyCEPMask(value);
                                field.onChange(maskedValue);
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

                  {/* Professional or establishment specific fields */}
                  {documentType === "cpf" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
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

                        <FormField
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

                      <FormField
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
                        <FormField
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
                      <FormField
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

                      <FormField
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

                      <FormField
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

                  <div className="flex justify-between space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onTabChange?.("additional-info")}
                      disabled={loading}
                    >
                      Voltar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Salvar
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}) 