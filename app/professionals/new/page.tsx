"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, Plus, Trash, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import api from "@/services/api-client"
import { formatCPF, formatPhone, formatCEP, applyCNPJMask, applyCPFMask, applyPhoneMask, applyCEPMask, unmask } from "@/utils/masks"
import { useCallback } from "react"
import { Label } from "@/components/ui/label"
import { debounce } from "lodash"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Estados brasileiros
const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", 
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

// Tipos de telefone
const PHONE_TYPES = [
  { value: "mobile", label: "Celular" },
  { value: "landline", label: "Fixo" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "fax", label: "Fax" }
]

// Tipos de profissionais
const PROFESSIONAL_TYPES = [
  { value: "medico", label: "Médico" },
  { value: "enfermeiro", label: "Enfermeiro" },
  { value: "fisioterapeuta", label: "Fisioterapeuta" },
  { value: "psicologo", label: "Psicólogo" },
  { value: "nutricionista", label: "Nutricionista" },
  { value: "fonoaudiologo", label: "Fonoaudiólogo" },
  { value: "terapeuta_ocupacional", label: "Terapeuta Ocupacional" },
  { value: "dentista", label: "Dentista" },
  { value: "outro", label: "Outro" }
]

// Tipos de conselho
const COUNCIL_TYPES = [
  { value: "CRM", label: "CRM (Conselho Regional de Medicina)" },
  { value: "COREN", label: "COREN (Conselho Regional de Enfermagem)" },
  { value: "CREFITO", label: "CREFITO (Conselho Regional de Fisioterapia)" },
  { value: "CRP", label: "CRP (Conselho Regional de Psicologia)" },
  { value: "CRN", label: "CRN (Conselho Regional de Nutrição)" },
  { value: "CRFa", label: "CRFa (Conselho Regional de Fonoaudiologia)" },
  { value: "CREFONO", label: "CREFONO (Conselho Regional de Fonoaudiologia)" },
  { value: "CREFITO-TO", label: "CREFITO-TO (Terapia Ocupacional)" },
  { value: "CRO", label: "CRO (Conselho Regional de Odontologia)" },
  { value: "OUTRO", label: "Outro" }
]

// Tipos de documentos
const DOCUMENT_TYPES = [
  { value: "cpf", label: "CPF" },
  { value: "rg", label: "RG" },
  { value: "cnh", label: "CNH" },
  { value: "certidao_nascimento", label: "Certidão de Nascimento" },
  { value: "carteira_conselho", label: "Carteira do Conselho" },
  { value: "diploma", label: "Diploma" },
  { value: "especializacao", label: "Certificado de Especialização" },
  { value: "comprovante_residencia", label: "Comprovante de Residência" },
  { value: "certificado_curso", label: "Certificado de Curso" },
  { value: "outro", label: "Outro" }
]

// Schema de validação usando zod
const professionalFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z.string().min(11, "CPF inválido").max(14),
  birth_date: z.string().min(1, "Data de nascimento é obrigatória"),
  gender: z.string().optional(),
  professional_type: z.string().min(1, "Tipo de profissional é obrigatório"),
  council_type: z.string().min(1, "Tipo de conselho é obrigatório"),
  council_number: z.string().min(1, "Número de registro é obrigatório"),
  council_state: z.string().min(1, "Estado do conselho é obrigatório"),
  specialty: z.string().optional(),
  clinic_id: z.string().optional(),
  address: z.string().min(5, "Endereço é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "Selecione um estado válido"),
  postal_code: z.string().min(8, "CEP inválido").max(9),
  phones: z.array(
    z.object({
      number: z.string().min(8, "Número inválido"),
      type: z.string().min(1, "Tipo obrigatório")
    })
  ).min(1, "Pelo menos um telefone é obrigatório"),
  photo: z.any().optional()
})

type ProfessionalFormValues = z.infer<typeof professionalFormSchema>

export default function CreateProfessionalPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")
  const [isLoading, setIsLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [clinics, setClinics] = useState<{id: number, name: string}[]>([])
  const [procedures, setProcedures] = useState<{tuss_id: number, value: number, notes?: string}[]>([])
  const [specialties, setSpecialties] = useState<{name: string, description?: string}[]>([{ name: "", description: "" }])
  const [documents, setDocuments] = useState<{file: File, type: string, description?: string}[]>([])
  const [showProceduresTab, setShowProceduresTab] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Inicializar formulário
  const form = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalFormSchema),
    defaultValues: {
      name: "",
      cpf: "",
      birth_date: "",
      gender: "",
      professional_type: "",
      council_type: "",
      council_number: "",
      council_state: "",
      specialty: "",
      clinic_id: "",
      address: "",
      city: "",
      state: "",
      postal_code: "",
      phones: [{ number: "", type: "mobile" }]
    }
  })
  
  // Field array para telefones
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control: form.control,
    name: "phones"
  })

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 3) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await api.get(`/tuss?search=${encodeURIComponent(query)}`);
        setSearchResults(response.data.data);
      } catch (error) {
        console.error("Erro ao buscar procedimentos:", error);
        toast({
          title: "Erro na busca",
          description: "Não foi possível buscar os procedimentos TUSS",
          variant: "destructive"
        });
      } finally {
        setIsSearching(false);
      }
    }, 500),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const addProcedure = (procedure: any) => {
    if (!procedures.some(p => p.tuss_id === procedure.id)) {
      setProcedures([...procedures, {
        tuss_id: procedure.id,
        value: 0,
        notes: ''
      }]);
      setSearchQuery('');
      setSearchResults([]);
    } else {
      toast({
        title: "Procedimento já adicionado",
        description: "Este procedimento já está na lista",
        variant: "destructive"
      });
    }
  };

  const removeProcedure = (tussId: number) => {
    setProcedures(procedures.filter(p => p.tuss_id !== tussId));
  };

  // Buscar clínicas disponíveis
  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const response = await api.get('/clinics', {
          params: {
            status: 'approved',
            per_page: 100
          }
        });
        
        if (response.data && response.data.data) {
          setClinics(response.data.data.map((clinic: any) => ({
            id: clinic.id,
            name: clinic.name
          })));
        }
      } catch (error) {
        console.error('Erro ao buscar clínicas:', error);
      }
    };
    
    fetchClinics();
  }, []);
  
  // Função para tratar upload da foto
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setPhotoFile(file)
      
      // Criar preview da imagem
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // Função para tratar máscaras
  const handleCpfMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    value = applyCPFMask(value)
    
    // Set the formatted value directly to the input event target
    e.target.value = value
    form.setValue("cpf", value)
  }
  
  const handlePhoneMask = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    let value = e.target.value
    value = applyPhoneMask(value)
    
    // Set the formatted value directly to the input event target
    e.target.value = value
    form.setValue(`phones.${index}.number`, value)
  }
  
  const handleCepMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    value = applyCEPMask(value)
    
    // Set the formatted value directly to the input event target
    e.target.value = value
    form.setValue("postal_code", value)
  }
  
  // Função para buscar CEP
  const fetchAddressByCep = async (cep: string) => {
    if (cep.length < 8) return
    
    // Remove caracteres não numéricos
    const cepNumbers = cep.replace(/\D/g, '')
    
    if (cepNumbers.length !== 8) return
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`)
      const data = await response.json()
      
      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "O CEP informado não foi encontrado",
          variant: "destructive"
        })
        return
      }
      
      form.setValue("address", `${data.logradouro}, ${data.bairro}`)
      form.setValue("city", data.localidade)
      form.setValue("state", data.uf)
      
      toast({
        title: "CEP encontrado",
        description: "Endereço preenchido automaticamente",
      })
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: "Ocorreu um erro ao buscar o CEP",
        variant: "destructive"
      })
    }
  }
  
  // Função para enviar o formulário
  const onSubmit: SubmitHandler<ProfessionalFormValues> = async (data) => {
    setIsLoading(true)
    
    try {
      // Criar FormData para envio dos dados
      const formData = new FormData()
      
      // Adicionar campos de texto
      formData.append("name", data.name)
      formData.append("cpf", unmask(data.cpf))
      formData.append("birth_date", data.birth_date)
      
      if (data.gender) {
        formData.append("gender", data.gender)
      }
      
      formData.append("professional_type", data.professional_type)
      formData.append("council_type", data.council_type)
      formData.append("council_number", data.council_number)
      formData.append("council_state", data.council_state)
      
      if (data.specialty) {
        formData.append("specialty", data.specialty)
      }
      
      if (data.clinic_id) {
        formData.append("clinic_id", data.clinic_id)
      }
      
      formData.append("address", data.address)
      formData.append("city", data.city)
      formData.append("state", data.state)
      formData.append("postal_code", unmask(data.postal_code))
      
      // Adicionar foto se houver
      if (photoFile) {
        formData.append("photo", photoFile)
      }
      
      // Adicionar telefones
      if (data.phones && data.phones.length > 0) {
        data.phones.forEach((phone, index) => {
          formData.append(`phones[${index}][number]`, unmask(phone.number))
          formData.append(`phones[${index}][type]`, phone.type)
        })
      }
      
      // Adicionar especialidades
      if (specialties.length > 0) {
        // Filtrar especialidades vazias
        const validSpecialties = specialties.filter(s => s.name.trim() !== '');
        
        validSpecialties.forEach((specialty, index) => {
          formData.append(`specialties[${index}][name]`, specialty.name)
          if (specialty.description) {
            formData.append(`specialties[${index}][description]`, specialty.description)
          }
        })
      }
      
      // Adicionar procedimentos (se existirem)
      if (procedures.length > 0) {
        procedures.forEach((procedure, index) => {
          formData.append(`procedures[${index}][tuss_id]`, procedure.tuss_id.toString())
          formData.append(`procedures[${index}][value]`, procedure.value.toString())
          if (procedure.notes) {
            formData.append(`procedures[${index}][notes]`, procedure.notes)
          }
        })
      }
      
      // Adicionar documentos (se existirem)
      if (documents.length > 0) {
        documents.forEach((doc, index) => {
          formData.append(`documents[${index}][file]`, doc.file)
          formData.append(`documents[${index}][type]`, doc.type)
          if (doc.description) {
            formData.append(`documents[${index}][description]`, doc.description)
          }
        })
      }
      
      // Enviar requisição para a API
      const response = await api.post("/professionals", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      
      toast({
        title: "Profissional cadastrado com sucesso",
        description: "O profissional foi cadastrado no sistema"
      })
      
      // Redirecionar para a lista de profissionais
      router.push("/professionals")
    } catch (error: any) {
      console.error("Erro ao cadastrar profissional:", error)
      
      toast({
        title: "Erro ao cadastrar profissional",
        description: error.response?.data?.message || "Ocorreu um erro ao cadastrar o profissional",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleNewProcedurePriceChange = (procedureId: number, price: string) => {
    setProcedures(prev => prev.map(proc => {
      if (proc.tuss_id === procedureId) {
        return { ...proc, value: parseFloat(price) || 0 }
      }
      return proc
    }))
  }

  // Adicionar especialidade
  const addSpecialty = () => {
    setSpecialties([...specialties, { name: '', description: '' }]);
  };

  // Remover especialidade
  const removeSpecialty = (index: number) => {
    const updatedSpecialties = [...specialties];
    updatedSpecialties.splice(index, 1);
    setSpecialties(updatedSpecialties);
  };

  // Atualizar especialidade
  const updateSpecialty = (index: number, field: string, value: string) => {
    const updatedSpecialties = [...specialties];
    updatedSpecialties[index] = { 
      ...updatedSpecialties[index], 
      [field]: value 
    };
    setSpecialties(updatedSpecialties);
  };

  // Adicionar documento
  const addDocument = (file: File, type: string, description?: string) => {
    setDocuments([...documents, { file, type, description }]);
  };

  // Remover documento
  const removeDocument = (index: number) => {
    const updatedDocuments = [...documents];
    updatedDocuments.splice(index, 1);
    setDocuments(updatedDocuments);
  };

  // Processar seleção de documento
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.size > 10 * 1024 * 1024) { // 10MB max
        toast({
          title: "Arquivo muito grande",
          description: "O documento deve ter no máximo 10MB",
          variant: "destructive"
        });
        return;
      }
      
      // Abrir modal ou atualizar estado temporário
      setTempDocument({
        file,
        fileName: file.name,
        type: "",
        description: ""
      });
      setShowDocumentModal(true);
    }
  };
  
  // Estado temporário para o documento sendo adicionado
  const [tempDocument, setTempDocument] = useState<{
    file: File | null;
    fileName: string;
    type: string;
    description: string;
  }>({
    file: null,
    fileName: "",
    type: "",
    description: ""
  });
  
  // Estado para controlar o modal de documento
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  
  // Confirmar adição de documento
  const confirmAddDocument = () => {
    if (tempDocument.file && tempDocument.type) {
      addDocument(
        tempDocument.file,
        tempDocument.type,
        tempDocument.description || undefined
      );
      setShowDocumentModal(false);
      setTempDocument({
        file: null,
        fileName: "",
        type: "",
        description: ""
      });
      
      // Limpar o input file
      const fileInput = document.getElementById('document-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } else {
      toast({
        title: "Dados incompletos",
        description: "Tipo de documento é obrigatório",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/professionals")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novo Profissional</h1>
            <p className="text-muted-foreground">
              Cadastre um novo profissional no sistema
            </p>
          </div>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs 
            defaultValue="basic" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="contacts">Contatos e Endereço</TabsTrigger>
              <TabsTrigger value="specialties">Especialidades e Documentos</TabsTrigger>
            </TabsList>
            
            <Card>
              <TabsContent value="basic" className="space-y-6">
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Preencha as informações básicas do profissional</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Completo *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo do profissional" {...field} />
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
                          <FormLabel>CPF *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="000.000.000-00" 
                              {...field}
                              onChange={(e) => {
                                handleCpfMask(e);
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
                          <FormLabel>Data de Nascimento *</FormLabel>
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
                          <FormLabel>Gênero</FormLabel>
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
                              <SelectItem value="masculino">Masculino</SelectItem>
                              <SelectItem value="feminino">Feminino</SelectItem>
                              <SelectItem value="outro">Outro</SelectItem>
                              <SelectItem value="prefiro_nao_informar">Prefiro não informar</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="professional_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Profissional *</FormLabel>
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
                              {PROFESSIONAL_TYPES.map(type => (
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
                      name="specialty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Especialidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Especialidade do profissional" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="council_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Conselho *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o conselho" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {COUNCIL_TYPES.map(type => (
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
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="council_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número do Registro *</FormLabel>
                            <FormControl>
                              <Input placeholder="Número do registro profissional" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="council_state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado do Conselho *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="UF" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {BRAZILIAN_STATES.map(state => (
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
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="clinic_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Clínica (opcional)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a clínica (opcional)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clinics.map(clinic => (
                                <SelectItem key={clinic.id} value={String(clinic.id)}>
                                  {clinic.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Vinculado a uma clínica? Selecione-a aqui.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="md:col-span-2">
                      <FormLabel>Foto</FormLabel>
                      <div className="mt-1 flex items-center space-x-4">
                        <div className="border rounded-md p-4 flex flex-col items-center">
                          {photoPreview ? (
                            <div className="w-32 h-32 relative rounded-full overflow-hidden">
                              <img
                                src={photoPreview}
                                alt="Photo preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-32 h-32 border-2 border-dashed rounded-full flex items-center justify-center">
                              <span className="text-sm text-gray-500">Selecionar foto</span>
                            </div>
                          )}
                          <input
                            type="file"
                            id="photo"
                            className="hidden"
                            accept="image/*"
                            onChange={handlePhotoChange}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-2"
                            onClick={() => document.getElementById("photo")?.click()}
                          >
                            {photoPreview ? "Alterar foto" : "Escolher foto"}
                          </Button>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">
                            Upload da foto do profissional. Tamanho máximo de 2MB.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Formatos suportados: JPG, PNG, GIF
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between border-t pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/professionals")}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("contacts")}
                  >
                    Próximo
                  </Button>
                </CardFooter>
              </TabsContent>
              
              <TabsContent value="contacts" className="space-y-6">
                <CardHeader>
                  <CardTitle>Contatos e Endereço</CardTitle>
                  <CardDescription>Preencha os contatos e o endereço do profissional</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Endereço */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Endereço</h3>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                      <FormField
                        control={form.control}
                        name="postal_code"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>CEP *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="00000-000"
                                {...field}
                                onChange={(e) => {
                                  handleCepMask(e);
                                }}
                                onBlur={() => fetchAddressByCep(field.value)}
                              />
                            </FormControl>
                            <FormDescription>
                              Digite o CEP para preenchimento automático
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-4">
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
                          <FormItem className="md:col-span-3">
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
                          <FormItem className="md:col-span-3">
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
                    </div>
                  </div>
                  
                  {/* Telefones */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Telefones</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendPhone({ number: "", type: "mobile" })}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar telefone
                      </Button>
                    </div>
                    
                    {phoneFields.map((field, index) => (
                      <div key={field.id} className="flex items-start space-x-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                          <FormField
                            control={form.control}
                            name={`phones.${index}.number`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Número *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="(00) 00000-0000"
                                    {...field}
                                    onChange={(e) => {
                                      handlePhoneMask(e, index);
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
                        </div>
                        
                        {phoneFields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-8"
                            onClick={() => removePhone(index)}
                          >
                            <Trash className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between border-t pt-6">
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("basic")}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/professionals")}
                    >
                      Cancelar
                    </Button>
                  </div>
                  
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      'Cadastrar Profissional'
                    )}
                  </Button>
                </CardFooter>
              </TabsContent>
              
              <TabsContent value="specialties" className="space-y-6">
                <CardHeader>
                  <CardTitle>Especialidades</CardTitle>
                  <CardDescription>Cadastre as especialidades do profissional</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Especialidades</h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSpecialty}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Especialidade
                      </Button>
                    </div>
                    
                    {specialties.map((specialty, index) => (
                      <div key={index} className="grid gap-4 border rounded-md p-4">
                        <div className="grid gap-2">
                          <Label>Nome da Especialidade *</Label>
                          <Input 
                            value={specialty.name} 
                            onChange={(e) => updateSpecialty(index, 'name', e.target.value)}
                            placeholder="Ex: Cardiologia, Ortopedia, etc."
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Descrição</Label>
                          <Input 
                            value={specialty.description || ''} 
                            onChange={(e) => updateSpecialty(index, 'description', e.target.value)}
                            placeholder="Descrição ou observações sobre a especialidade"
                          />
                        </div>
                        {specialties.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 justify-self-end"
                            onClick={() => removeSpecialty(index)}
                          >
                            <Trash className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="border-t mt-6 pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Procedimentos</h3>
                    </div>
                    
                    <div className="mt-4 space-y-4">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label htmlFor="procedure-search">Buscar Procedimento TUSS</Label>
                          <div className="relative">
                            <Input
                              id="procedure-search"
                              placeholder="Digite o nome ou código do procedimento"
                              value={searchQuery}
                              onChange={handleSearch}
                            />
                            {isSearching && (
                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {searchResults.length > 0 && (
                        <div className="border rounded-md overflow-hidden">
                          <ul className="max-h-60 overflow-auto">
                            {searchResults.map((procedure) => (
                              <li 
                                key={procedure.id} 
                                className="p-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                                onClick={() => addProcedure(procedure)}
                              >
                                <p className="font-medium">{procedure.code} - {procedure.name}</p>
                                <p className="text-sm text-muted-foreground">{procedure.description?.substring(0, 100)}...</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {procedures.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-sm font-medium mb-2">Procedimentos Adicionados</h4>
                          <ul className="space-y-3">
                            {procedures.map((procedure, index) => (
                              <li key={procedure.tuss_id} className="border rounded-md p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium">
                                      {searchResults.find(p => p.id === procedure.tuss_id)?.name || `Procedimento #${procedure.tuss_id}`}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {searchResults.find(p => p.id === procedure.tuss_id)?.code || "Código não disponível"}
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500"
                                    onClick={() => removeProcedure(procedure.tuss_id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="mt-2">
                                  <Label htmlFor={`procedure-price-${procedure.tuss_id}`}>Valor (R$)</Label>
                                  <Input
                                    id={`procedure-price-${procedure.tuss_id}`}
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={procedure.value}
                                    onChange={(e) => handleNewProcedurePriceChange(procedure.tuss_id, e.target.value)}
                                    className="mt-1"
                                  />
                                </div>
                                <div className="mt-2">
                                  <Label htmlFor={`procedure-notes-${procedure.tuss_id}`}>Observações</Label>
                                  <Input
                                    id={`procedure-notes-${procedure.tuss_id}`}
                                    placeholder="Observações sobre o procedimento"
                                    value={procedure.notes || ''}
                                    onChange={(e) => {
                                      setProcedures(prev => prev.map(p => {
                                        if (p.tuss_id === procedure.tuss_id) {
                                          return { ...p, notes: e.target.value }
                                        }
                                        return p
                                      }))
                                    }}
                                    className="mt-1"
                                  />
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border-t mt-6 pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Documentos</h3>
                      <div>
                        <label htmlFor="document-file">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("document-file")?.click()}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Documento
                          </Button>
                        </label>
                        <input
                          type="file"
                          id="document-file"
                          className="hidden"
                          onChange={handleDocumentChange}
                        />
                      </div>
                    </div>
                    
                    {documents.length > 0 ? (
                      <div className="mt-4">
                        <ul className="space-y-3">
                          {documents.map((doc, index) => (
                            <li key={index} className="border rounded-md p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm truncate max-w-xs">
                                    {doc.file.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {doc.type}
                                  </p>
                                  {doc.description && (
                                    <p className="text-xs mt-1">{doc.description}</p>
                                  )}
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500"
                                  onClick={() => removeDocument(index)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="mt-4 p-4 border border-dashed rounded-md text-center text-muted-foreground">
                        <p>Nenhum documento adicionado</p>
                        <p className="text-sm mt-1">
                          Clique em "Adicionar Documento" para anexar documentos do profissional
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between border-t pt-6">
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("contacts")}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/professionals")}
                    >
                      Cancelar
                    </Button>
                  </div>
                  
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      'Cadastrar Profissional'
                    )}
                  </Button>
                </CardFooter>
              </TabsContent>
            </Card>
          </Tabs>
        </form>
      </Form>
      
      {/* Modal para adicionar documentos */}
      <Dialog open={showDocumentModal} onOpenChange={setShowDocumentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Documento</DialogTitle>
            <DialogDescription>
              Preencha as informações sobre o documento selecionado
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>Arquivo Selecionado</Label>
              <p className="text-sm truncate">{tempDocument.fileName}</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="document-type">Tipo de Documento *</Label>
              <Select
                value={tempDocument.type}
                onValueChange={(value) => setTempDocument({...tempDocument, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="document-description">Descrição (opcional)</Label>
              <Input
                id="document-description"
                placeholder="Descrição ou observações sobre o documento"
                value={tempDocument.description}
                onChange={(e) => setTempDocument({...tempDocument, description: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDocumentModal(false);
                setTempDocument({
                  file: null,
                  fileName: "",
                  type: "",
                  description: ""
                });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={confirmAddDocument}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 