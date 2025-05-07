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

// Schema de validação usando zod
const clinicFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cnpj: z.string().min(14, "CNPJ inválido").max(18),
  description: z.string().optional(),
  cnes: z.string().optional(),
  technical_director: z.string().min(3, "Nome do diretor técnico é obrigatório"),
  technical_director_document: z.string().min(3, "Documento do diretor técnico é obrigatório"),
  technical_director_professional_id: z.string().min(2, "ID profissional do diretor técnico é obrigatório"),
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
  logo: z.any().optional()
})

type ClinicFormValues = z.infer<typeof clinicFormSchema>

interface Clinic {
  id: number;
  name: string;
  cnpj: string;
  description: string | null;
  cnes: string | null;
  technical_director: string;
  technical_director_document: string;
  technical_director_professional_id: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  status: string;
  logo: string | null;
  phones: {
    id: number;
    number: string;
    type: string;
  }[];
}

export default function EditClinicPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("basic")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  
  // Inicializar formulário
  const form = useForm<ClinicFormValues>({
    resolver: zodResolver(clinicFormSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      description: "",
      cnes: "",
      technical_director: "",
      technical_director_document: "",
      technical_director_professional_id: "",
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
  
  // Buscar dados da clínica
  useEffect(() => {
    async function fetchClinic() {
      try {
        setIsFetching(true)
        const response = await api.get(`/clinics/${params.id}`)
        setClinic(response.data.data)
        
        // Popular formulário com dados da clínica
        form.reset({
          name: response.data.data.name,
          cnpj: applyCNPJMask(response.data.data.cnpj),
          description: response.data.data.description || "",
          cnes: response.data.data.cnes || "",
          technical_director: response.data.data.technical_director,
          technical_director_document: response.data.data.technical_director_document,
          technical_director_professional_id: response.data.data.technical_director_professional_id,
          address: response.data.data.address,
          city: response.data.data.city,
          state: response.data.data.state,
          postal_code: formatCEP(response.data.data.postal_code),
          phones: response.data.data.phones.map((phone: any) => ({
            number: formatPhone(phone.number),
            type: phone.type
          }))
        })
        
        // Configurar preview do logo
        if (response.data.data.logo) {
          const rawLogo = response.data.data.logo as string;
          const logoUrl = rawLogo.startsWith('http')
            ? rawLogo
            : `${process.env.NEXT_PUBLIC_API_URL || ''}${rawLogo}`;
          setLogoPreview(logoUrl);
        }
      } catch (error) {
        console.error("Erro ao buscar clínica:", error)
        toast({
          title: "Erro ao buscar clínica",
          description: "Não foi possível carregar os dados da clínica",
          variant: "destructive"
        })
      } finally {
        setIsFetching(false)
      }
    }
    
    fetchClinic()
  }, [params.id])
  
  // Função para tratar upload do logo
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
      
      // Criar preview da imagem
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // Função para tratar máscaras
  const handleCnpjMask = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    value = applyCNPJMask(value)
    
    // Set the formatted value directly to the input event target
    e.target.value = value
    form.setValue("cnpj", value)
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
  const onSubmit: SubmitHandler<ClinicFormValues> = async (data) => {
    setIsLoading(true)
    
    try {
      // Criar FormData para envio dos dados
      const formData = new FormData()
      
      // Usar método PUT para atualização
      formData.append("_method", "PUT")
      
      // Adicionar campos de texto
      formData.append("name", data.name)
      formData.append("cnpj", data.cnpj.replace(/\D/g, ''))
      formData.append("description", data.description || "")
      formData.append("cnes", data.cnes || "")
      formData.append("technical_director", data.technical_director)
      formData.append("technical_director_document", data.technical_director_document)
      formData.append("technical_director_professional_id", data.technical_director_professional_id)
      formData.append("address", data.address)
      formData.append("city", data.city)
      formData.append("state", data.state)
      formData.append("postal_code", data.postal_code.replace(/\D/g, ''))
      
      // Adicionar logo se houver
      if (logoFile) {
        formData.append("logo", logoFile)
      }
      
      // Adicionar telefones
      if (data.phones && data.phones.length > 0) {
        data.phones.forEach((phone, index) => {
          formData.append(`phones[${index}][number]`, phone.number.replace(/\D/g, ''))
          formData.append(`phones[${index}][type]`, phone.type)
        })
      }
      
      // Enviar requisição para a API
      const response = await api.post(`/clinics/${params.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      
      toast({
        title: "Clínica atualizada com sucesso",
        description: "As informações da clínica foram atualizadas com sucesso"
      })
      
      // Redirecionar para a página de detalhes
      router.push(`/clinics/${params.id}`)
    } catch (error: any) {
      console.error("Erro ao atualizar clínica:", error)
      
      toast({
        title: "Erro ao atualizar clínica",
        description: error.response?.data?.message || "Ocorreu um erro ao atualizar a clínica",
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
            onClick={() => router.push(`/clinics/${params.id}`)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Clínica</h1>
            <p className="text-muted-foreground">
              {clinic?.name} - {clinic?.cnpj}
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
                  <CardDescription>Edite as informações básicas da clínica</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Clínica *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da clínica" {...field} />
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
                                handleCnpjMask(e);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="cnes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNES</FormLabel>
                          <FormControl>
                            <Input placeholder="Cadastro Nacional de Estabelecimentos de Saúde" {...field} />
                          </FormControl>
                          <FormDescription>
                            Número de registro no CNES (opcional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="md:col-span-2">
                      <FormLabel>Logo</FormLabel>
                      <div className="mt-1 flex items-center space-x-4">
                        <div className="border rounded-md p-4 flex flex-col items-center">
                          {logoPreview ? (
                            <div className="w-32 h-32 relative">
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="w-32 h-32 border-2 border-dashed rounded-md flex items-center justify-center">
                              <span className="text-sm text-gray-500">Selecionar logo</span>
                            </div>
                          )}
                          <input
                            type="file"
                            id="logo"
                            className="hidden"
                            accept="image/*"
                            onChange={handleLogoChange}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-2"
                            onClick={() => document.getElementById("logo")?.click()}
                          >
                            {logoPreview ? "Alterar imagem" : "Escolher imagem"}
                          </Button>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">
                            Upload do logotipo da clínica. Tamanho máximo de 2MB.
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Formatos suportados: JPG, PNG, GIF
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Descrição detalhada da clínica"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Uma breve descrição sobre a clínica (opcional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Diretor Técnico</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="technical_director"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Diretor Técnico *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome completo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="technical_director_document"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Documento do Diretor *</FormLabel>
                            <FormControl>
                              <Input placeholder="CRM, CPF, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="technical_director_professional_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Profissional *</FormLabel>
                            <FormControl>
                              <Input placeholder="Identificação profissional" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between border-t pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/clinics/${params.id}`)}
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
                  <CardDescription>Edite os contatos e o endereço da clínica</CardDescription>
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
                      onClick={() => router.push(`/clinics/${params.id}`)}
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