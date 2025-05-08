"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray, SubmitHandler } from "react-hook-form"
import { z } from "zod"
import { ArrowLeft, Plus, Trash, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/services/api-client"
import { formatCPF, formatPhone, formatCEP, applyCNPJMask, applyCPFMask, applyPhoneMask, applyCEPMask, unmask } from "@/utils/masks"

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

interface Professional {
  id: number;
  name: string;
  cpf: string;
  birth_date: string;
  gender: string | null;
  professional_type: string;
  council_type: string;
  council_number: string;
  council_state: string;
  specialty: string | null;
  clinic_id: number | null;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  status: string;
  photo: string | null;
  phones: {
    id: number;
    number: string;
    type: string;
  }[];
  clinic?: {
    id: number;
    name: string;
  };
}

export default function EditProfessionalPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [clinics, setClinics] = useState<{id: number, name: string}[]>([])
  
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
  const { fields: phoneFields, append: appendPhone, remove: removePhone, replace: replacePhones } = useFieldArray({
    control: form.control,
    name: "phones"
  })

  // Debugging form values
  useEffect(() => {
    const subscription = form.watch((value) => {
      console.log("Form values changed:", value);
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
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
  
  // Buscar dados do profissional
  useEffect(() => {
    async function fetchProfessional() {
      try {
        setIsFetching(true)
        const response = await api.get(`/professionals/${params.id}`)
        
        // Log para debug
        console.log("API Response:", response.data)
        
        if (!response.data || !response.data.data) {
          throw new Error("Resposta da API inválida")
        }
        
        const professionalData = response.data.data
        
        // Fix photo URL if exists
        if (professionalData.photo && professionalData.photo.includes('/storage/') && !professionalData.photo.includes('/storage/app/public/')) {
          professionalData.photo = professionalData.photo.replace('/storage/', '/storage/app/public/')
          console.log("Photo URL fixed:", professionalData.photo)
        }
        
        setProfessional(professionalData)
        
        // Popular formulário com dados do profissional
        const formattedPhones = Array.isArray(professionalData.phones) 
          ? professionalData.phones.map((phone: any) => ({
              number: applyPhoneMask(phone.number),
              type: phone.type
            }))
          : [{ number: "", type: "mobile" }]
          
        const formData = {
          name: professionalData.name || "",
          cpf: professionalData.cpf ? applyCPFMask(professionalData.cpf) : "",
          birth_date: professionalData.birth_date ? new Date(professionalData.birth_date).toISOString().split('T')[0] : "",
          gender: professionalData.gender || "",
          professional_type: professionalData.professional_type || "",
          council_type: professionalData.council_type || "",
          council_number: professionalData.council_number || "",
          council_state: professionalData.council_state || "",
          specialty: professionalData.specialty || "",
          clinic_id: professionalData.clinic_id ? String(professionalData.clinic_id) : "",
          address: professionalData.address || "",
          city: professionalData.city || "",
          state: professionalData.state || "",
          postal_code: professionalData.postal_code ? applyCEPMask(professionalData.postal_code) : "",
          phones: formattedPhones
        }
        
        console.log("Formulário será populado com:", formData)
        
        // Reset do formulário com os dados
        form.reset(formData)
        
        // Configurar preview da foto
        if (professionalData.photo) {
          const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          let photoUrl = professionalData.photo;
          
          if (photoUrl.startsWith('http')) {
            // URL já é completa
          } else if (photoUrl.includes('/storage/')) {
            // Inserir app/public após storage/
            photoUrl = photoUrl.replace('/storage/', '/storage/app/public/');
            photoUrl = `${baseApiUrl}${photoUrl}`;
          } else {
            // Outro formato de URL
            photoUrl = `${baseApiUrl}${photoUrl}`;
          }
          
          console.log("Preview da foto:", photoUrl);
          setPhotoPreview(photoUrl);
        }
      } catch (error) {
        console.error("Erro ao buscar profissional:", error)
        toast({
          title: "Erro ao buscar profissional",
          description: "Não foi possível carregar os dados do profissional",
          variant: "destructive"
        })
      } finally {
        setIsFetching(false)
      }
    }
    
    fetchProfessional()
  }, [params.id, form])
  
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
      console.log("Dados do formulário para envio:", data)
      
      // Criar FormData para envio dos dados
      const formData = new FormData()
      
      // Usar método PUT para atualização
      formData.append("_method", "PUT")
      
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
      } else {
        // Enviar null explicitamente quando não há clínica selecionada
        formData.append("clinic_id", "")
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
      
      // Log para debug
      for (const pair of formData.entries()) {
        console.log(`${pair[0]}: ${pair[1]}`)
      }
      
      // Enviar requisição para a API
      const response = await api.post(`/professionals/${params.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      
      console.log("Resposta de atualização:", response.data)
      
      toast({
        title: "Profissional atualizado com sucesso",
        description: "As informações do profissional foram atualizadas com sucesso"
      })
      
      // Redirecionar para a página de detalhes
      router.push(`/professionals/${params.id}`)
    } catch (error: any) {
      console.error("Erro ao atualizar profissional:", error)
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Ocorreu um erro ao atualizar o profissional"
      
      toast({
        title: "Erro ao atualizar profissional",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  // Renderizar skeleton durante o carregamento
  if (isFetching) {
    return (
      <div className="space-y-6">
        <div className="flex items-center">
          <Skeleton className="h-10 w-10 mr-4" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full md:col-span-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/professionals/${params.id}`)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Profissional</h1>
            <p className="text-muted-foreground">
              {professional?.name} - {professional?.professional_type}
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
              <TabsTrigger value="contacts">Contatos e Endereço</TabsTrigger>
            </TabsList>
            
            <Card>
              <TabsContent value="basic" className="space-y-6">
                <CardHeader>
                  <CardTitle>Informações Básicas</CardTitle>
                  <CardDescription>Edite as informações básicas do profissional</CardDescription>
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
                            value={field.value}
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
                            value={field.value}
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
                            value={field.value}
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
                              value={field.value}
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
                            value={field.value}
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
                                onError={(e) => {
                                  console.error("Error loading photo:", e);
                                  const img = e.target as HTMLImageElement;
                                  // Try with API URL if not already starting with http
                                  if (!img.src.startsWith('http')) {
                                    img.src = `${process.env.NEXT_PUBLIC_API_URL || ''}${photoPreview}`;
                                  } else if (img.src.includes('/storage/') && !img.src.includes('/storage/app/public/')) {
                                    // Try inserting app/public after storage/
                                    img.src = img.src.replace('/storage/', '/storage/app/public/');
                                  } else {
                                    // If that fails too, show a placeholder
                                    img.onerror = null; // Prevent infinite recursion
                                    img.src = 'https://via.placeholder.com/150?text=Foto+indisponível';
                                  }
                                }}
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
                    onClick={() => router.push(`/professionals/${params.id}`)}
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
                  <CardDescription>Edite os contatos e o endereço do profissional</CardDescription>
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
                              value={field.value}
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
                                  value={field.value}
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
                      onClick={() => router.push(`/professionals/${params.id}`)}
                    >
                      Cancelar
                    </Button>
                  </div>
                  
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Atualizando...
                      </>
                    ) : (
                      'Salvar Alterações'
                    )}
                  </Button>
                </CardFooter>
              </TabsContent>
            </Card>
          </Tabs>
        </form>
      </Form>
    </div>
  )
} 