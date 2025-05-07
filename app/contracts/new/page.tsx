"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Scroll, Eye, Check, ChevronsUpDown } from "lucide-react"
import { 
  getContractTemplates, 
  getPlaceholders,
  ContractTemplate
} from "@/services/contract-templates"
import { 
  generateContract, 
  previewContract,
  searchEntities,
  getEntityData,
  Entity
} from "../../services/contracts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useToast } from "@/components/ui/use-toast"
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { useDebounce } from "@/app/hooks/use-debounce"

// Define the schema for the contract form
const contractFormSchema = z.object({
  template_id: z.string().min(1, "Selecione um template"),
  entity_type: z.enum(["health_plan", "clinic", "professional"], {
    required_error: "Selecione um tipo de entidade",
  }),
  contractable_id: z.string().min(1, "Selecione uma entidade"),
  start_date: z.date({
    required_error: "Selecione a data de início",
  }),
  end_date: z.date().optional(),
  template_data: z.record(z.string()),
})

type ContractFormValues = z.infer<typeof contractFormSchema>

export default function NewContractPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingEntities, setIsLoadingEntities] = useState(false)
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [entities, setEntities] = useState<Array<{id: number, name: string}>>([])
  const [placeholders, setPlaceholders] = useState<{
    common: Record<string, string>;
    entity: Record<string, string>;
  }>({
    common: {},
    entity: {}
  })
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<Entity[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  
  // Initialize form
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      template_id: "",
      entity_type: "health_plan",
      contractable_id: "",
      template_data: {},
    },
  })
  
  const entityType = form.watch("entity_type")
  const templateId = form.watch("template_id")
  const contractableId = form.watch("contractable_id")
  
  // Load templates on initial render
  useEffect(() => {
    fetchTemplates()
  }, [])
  
  // Update selected template when template ID changes
  useEffect(() => {
    if (templateId && templates.length > 0) {
      const template = templates.find(t => t.id.toString() === templateId)
      if (template) {
        setSelectedTemplate(template)
      }
    } else {
      setSelectedTemplate(null)
    }
  }, [templateId, templates])
  
  // Effect for entity type change
  useEffect(() => {
    if (entityType) {
      // Reset entity selection when type changes
      form.setValue("contractable_id", "")
      setSearchResults([])
      setSearchQuery("")
    }
  }, [entityType, form])
  
  // Effect for search query
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2 && entityType) {
      fetchEntities(debouncedSearchQuery)
    }
  }, [debouncedSearchQuery, entityType])
  
  // Effect for entity selection
  useEffect(() => {
    if (contractableId && entityType) {
      fetchEntityData(parseInt(contractableId))
    }
  }, [contractableId, entityType])
  
  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await getContractTemplates(1, undefined, true)
      if (response.status === 'success') {
        setTemplates(response.data.data)
      } else {
        toast({
          title: "Erro ao carregar templates",
          description: response.message || "Não foi possível carregar os templates de contrato.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Ocorreu um erro ao tentar carregar os templates de contrato.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchEntities = async (query: string) => {
    if (!entityType || query.length < 2) return;
    
    setIsLoadingEntities(true);
    try {
      console.log("Searching for:", entityType, query);
      const response = await searchEntities(entityType as any, query);
      console.log("Search response:", response);
      
      if (response && response.status === 'success' && Array.isArray(response.data)) {
        console.log("Setting search results:", response.data);
        setSearchResults(response.data);
        
        if (response.data.length === 0) {
          toast({
            title: "Nenhum resultado encontrado",
            description: `Não foram encontrados resultados para "${query}"`,
            variant: "destructive",
          });
        }
      } else {
        setSearchResults([]);
        toast({
          title: "Erro ao buscar entidades",
          description: "Formato de resposta inesperado",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`Failed to search ${entityType}:`, error);
      setSearchResults([]);
      toast({
        title: "Erro ao buscar entidades",
        description: `Erro ao buscar ${entityType === 'health_plan' ? 'planos de saúde' : entityType === 'clinic' ? 'clínicas' : 'profissionais'}.`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingEntities(false);
    }
  };
  
  const fetchEntityData = async (entityId: number) => {
    try {
      const response = await getEntityData(entityType as any, entityId);
      if (response.status === 'success') {
        // Auto-fill template fields with entity data
        const templateData = response.data.template_data;
        form.setValue('template_data', {
          ...form.getValues('template_data'),
          ...templateData
        });
        
        toast({
          title: "Dados preenchidos",
          description: "Os dados da entidade foram preenchidos automaticamente.",
        });
      }
    } catch (error) {
      console.error("Failed to fetch entity data:", error);
      toast({
        title: "Erro ao obter dados",
        description: "Não foi possível obter os dados da entidade selecionada.",
        variant: "destructive",
      });
    }
  };
  
  const fetchPlaceholders = async (type: string) => {
    try {
      const response = await getPlaceholders(type as any)
      if (response.status === 'success') {
        setPlaceholders(response.data)
        
        // Initialize template_data with empty values for all placeholders
        const initialData: Record<string, string> = {}
        Object.keys(response.data.common).forEach(key => {
          initialData[key] = ''
        })
        Object.keys(response.data.entity).forEach(key => {
          initialData[key] = ''
        })
        
        form.setValue('template_data', initialData)
      }
    } catch (error) {
      console.error("Failed to fetch placeholders:", error)
    }
  }
  
  const handlePreview = async () => {
    if (!templateId) {
      toast({
        title: "Template não selecionado",
        description: "Selecione um template para visualizar o preview.",
        variant: "destructive",
      })
      return
    }
    
    try {
      const formData = form.getValues()
      const response = await previewContract(
        parseInt(formData.template_id),
        formData.template_data
      )
      
      if (response.status === 'success') {
        setPreviewHtml(response.data.content)
        setIsPreviewDialogOpen(true)
      } else {
        toast({
          title: "Erro ao gerar preview",
          description: response.message || "Não foi possível gerar o preview do contrato.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to generate preview:", error)
      toast({
        title: "Erro no preview",
        description: "Ocorreu um erro ao tentar gerar o preview do contrato.",
        variant: "destructive",
      })
    }
  }
  
  const onSubmit = async (data: ContractFormValues) => {
    setIsSubmitting(true)
    
    try {
      // Convert the form data to the format expected by the API
      const contractData = {
        template_id: parseInt(data.template_id),
        contractable_id: parseInt(data.contractable_id),
        contractable_type: `App\\Models\\${data.entity_type === 'health_plan' ? 'HealthPlan' : data.entity_type === 'clinic' ? 'Clinic' : 'Professional'}`,
        start_date: data.start_date.toISOString().split('T')[0],
        end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : undefined,
        template_data: data.template_data
      }
      
      const response = await generateContract(contractData)
      
      if (response.status === 'success') {
        toast({
          title: "Contrato gerado",
          description: "O contrato foi gerado com sucesso.",
        })
        router.push(`/contracts/${response.data.id}`)
      } else {
        toast({
          title: "Erro ao gerar contrato",
          description: response.message || "Não foi possível gerar o contrato.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to generate contract:", error)
      toast({
        title: "Erro ao gerar contrato",
        description: "Ocorreu um erro ao tentar gerar o contrato.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/contracts')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Novo Contrato
            </h1>
            <p className="text-muted-foreground">
              Crie um novo contrato a partir de um template
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isLoading || isSubmitting || !templateId}
          >
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </Button>
          <Button
            type="submit"
            form="contract-form"
            disabled={isLoading || isSubmitting}
          >
            <Scroll className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Gerando...' : 'Gerar Contrato'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <Form {...form}>
          <form id="contract-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Selecione o template e a entidade para o contrato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="template_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template de Contrato</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um template" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem
                                key={template.id}
                                value={template.id.toString()}
                              >
                                {template.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Escolha um template para gerar o contrato
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="entity_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Entidade</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="health_plan">Plano de Saúde</SelectItem>
                            <SelectItem value="clinic">Clínica</SelectItem>
                            <SelectItem value="professional">Profissional</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Tipo de entidade para o contrato
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="contractable_id"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Entidade</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between",
                                  !field.value && "text-muted-foreground"
                                )}
                                disabled={!entityType}
                              >
                                {field.value && searchResults.find(entity => entity.id.toString() === field.value)
                                  ? searchResults.find(entity => entity.id.toString() === field.value)?.name
                                  : "Selecione ou busque uma entidade"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="p-0">
                            <Command>
                              <CommandInput 
                                placeholder={`Buscar ${entityType === 'health_plan' ? 'plano de saúde' : entityType === 'clinic' ? 'clínica' : 'profissional'}`}
                                value={searchQuery}
                                onValueChange={(value) => {
                                  setSearchQuery(value);
                                  console.log("Search query changed:", value);
                                }}
                              />
                              {isLoadingEntities ? (
                                <div className="py-6 text-center text-sm">Buscando...</div>
                              ) : (
                                <>
                                  <CommandEmpty>Nenhuma entidade encontrada.</CommandEmpty>
                                  <CommandGroup>
                                    {searchResults && searchResults.length > 0 ? (
                                      searchResults.map((entity) => {
                                        console.log("Rendering entity:", entity);
                                        return (
                                          <CommandItem
                                            key={entity.id}
                                            value={entity.id.toString()}
                                            onSelect={(value) => {
                                              console.log("Selected entity:", entity, "value:", value);
                                              form.setValue("contractable_id", value);
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                entity.id.toString() === field.value
                                                  ? "opacity-100"
                                                  : "opacity-0"
                                              )}
                                            />
                                            {entity.name}
                                            {entity.email && (
                                              <span className="ml-2 text-muted-foreground">
                                                ({entity.email})
                                              </span>
                                            )}
                                          </CommandItem>
                                        );
                                      })
                                    ) : searchQuery.length >= 2 ? (
                                      <div className="py-6 text-center text-sm">Nenhum resultado encontrado.</div>
                                    ) : (
                                      <div className="py-6 text-center text-sm">Digite pelo menos 2 caracteres para pesquisar.</div>
                                    )}
                                  </CommandGroup>
                                </>
                              )}
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          {entityType === 'health_plan'
                            ? 'Busque e selecione o plano de saúde para o contrato'
                            : entityType === 'clinic'
                            ? 'Busque e selecione a clínica para o contrato'
                            : 'Busque e selecione o profissional para o contrato'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Início</FormLabel>
                        <DatePicker
                          date={field.value ?? new Date()}
                          setDate={field.onChange}
                        />
                        <FormDescription>
                          Data de início da vigência do contrato
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Término (opcional)</FormLabel>
                        <DatePicker
                          date={field.value ?? undefined}
                          setDate={(date) => {
                            console.log("Setting end date:", date);
                            field.onChange(date);
                          }}
                        />
                        <FormDescription>
                          Data de término da vigência do contrato (deixe em branco para contrato sem data de término)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Contrato</CardTitle>
                  <CardDescription>
                    Preencha as informações necessárias para o contrato
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="common">
                    <TabsList className="mb-4">
                      <TabsTrigger value="common">Dados Comuns</TabsTrigger>
                      <TabsTrigger value="entity">
                        Dados de {entityType === 'health_plan'
                          ? 'Plano de Saúde'
                          : entityType === 'clinic'
                          ? 'Clínica'
                          : 'Profissional'}
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="common" className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {Object.entries(placeholders.common).map(([key, description]) => (
                          <FormField
                            key={key}
                            control={form.control}
                            name={`template_data.${key}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{description}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                  Placeholder: <code>{`{{${key}}}`}</code>
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="entity" className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        {Object.entries(placeholders.entity).map(([key, description]) => (
                          <FormField
                            key={key}
                            control={form.control}
                            name={`template_data.${key}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{description}</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormDescription>
                                  Placeholder: <code>{`{{${key}}}`}</code>
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </form>
        </Form>
      )}
      
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do Contrato</DialogTitle>
            <DialogDescription>
              Visualização do contrato com os dados preenchidos
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 border rounded-md bg-white prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsPreviewDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 