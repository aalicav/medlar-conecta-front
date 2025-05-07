"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Eye } from "lucide-react"
import { 
  getContract, 
  regenerateContract,
  previewContract
} from "@/services/contracts"
import { getPlaceholders } from "@/services/contract-templates"
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
import { Label } from "@/components/ui/label"

// Define the schema for the contract edit form
const contractEditSchema = z.object({
  start_date: z.date({
    required_error: "Selecione a data de início",
  }),
  end_date: z.date().optional(),
  template_data: z.record(z.string()),
})

type ContractEditValues = z.infer<typeof contractEditSchema>

export default function EditContractPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const { id } = params
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [contract, setContract] = useState<any>(null)
  const [placeholders, setPlaceholders] = useState<{
    common: Record<string, string>;
    entity: Record<string, string>;
  }>({
    common: {},
    entity: {}
  })
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false)
  
  // Initialize form
  const form = useForm<ContractEditValues>({
    resolver: zodResolver(contractEditSchema),
    defaultValues: {
      template_data: {},
    },
  })
  
  // Load contract data on initial render
  useEffect(() => {
    fetchContract()
  }, [id])
  
  const fetchContract = async () => {
    setIsLoading(true)
    try {
      const response = await getContract(parseInt(id))
      if (response.status === 'success') {
        setContract(response.data)
        
        // If contract is signed, redirect to details page
        if (response.data.is_signed) {
          toast({
            title: "Contrato já assinado",
            description: "Não é possível editar um contrato que já foi assinado.",
            variant: "destructive",
          })
          router.push(`/contracts/${id}`)
          return
        }
        
        // Fetch placeholders based on contract type
        fetchPlaceholders(response.data.type)
        
        // Set form default values
        form.setValue('start_date', new Date(response.data.start_date))
        if (response.data.end_date) {
          form.setValue('end_date', new Date(response.data.end_date))
        }
        form.setValue('template_data', response.data.template_data || {})
      } else {
        toast({
          title: "Erro ao carregar contrato",
          description: response.message || "Não foi possível carregar os detalhes do contrato.",
          variant: "destructive",
        })
        router.push('/contracts')
      }
    } catch (error) {
      console.error("Failed to fetch contract:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Ocorreu um erro ao tentar carregar as informações do contrato.",
        variant: "destructive",
      })
      router.push('/contracts')
    } finally {
      setIsLoading(false)
    }
  }
  
  const fetchPlaceholders = async (type: string) => {
    try {
      const response = await getPlaceholders(type as any)
      if (response.status === 'success') {
        setPlaceholders(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch placeholders:", error)
    }
  }
  
  const handlePreview = async () => {
    try {
      const formData = form.getValues()
      const response = await previewContract(
        contract.template_id,
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
  
  const onSubmit = async (data: ContractEditValues) => {
    setIsSubmitting(true)
    
    try {
      // Convert the form data to the format expected by the API
      const contractData = {
        start_date: data.start_date.toISOString().split('T')[0],
        end_date: data.end_date ? data.end_date.toISOString().split('T')[0] : undefined,
        template_data: data.template_data
      }
      
      const response = await regenerateContract(parseInt(id), contractData)
      
      if (response.status === 'success') {
        toast({
          title: "Contrato atualizado",
          description: "O contrato foi atualizado com sucesso.",
        })
        router.push(`/contracts/${id}`)
      } else {
        toast({
          title: "Erro ao atualizar contrato",
          description: response.message || "Não foi possível atualizar o contrato.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update contract:", error)
      toast({
        title: "Erro ao atualizar contrato",
        description: "Ocorreu um erro ao tentar atualizar o contrato.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const getContractTypeName = (type) => {
    const typeMap = {
      health_plan: 'Plano de Saúde',
      clinic: 'Clínica',
      professional: 'Profissional'
    }
    
    return typeMap[type] || type
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/contracts/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isLoading ? (
                <Skeleton className="h-9 w-48" />
              ) : (
                `Editar Contrato ${contract.contract_number}`
              )}
            </h1>
            <p className="text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-5 w-64 mt-1" />
              ) : (
                `Atualizar dados do contrato com ${contract.contractable?.name || 'entidade'}`
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePreview}
            disabled={isLoading || isSubmitting}
          >
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </Button>
          <Button
            type="submit"
            form="contract-form"
            disabled={isLoading || isSubmitting}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
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
                <CardTitle>Informações do Contrato</CardTitle>
                <CardDescription>
                  Detalhes do contrato para {getContractTypeName(contract?.type)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium">Número do Contrato</Label>
                    <div className="h-10 px-3 py-2 border rounded-md bg-muted">
                      {contract?.contract_number}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      O número do contrato não pode ser alterado
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Entidade</Label>
                    <div className="h-10 px-3 py-2 border rounded-md bg-muted">
                      {contract?.contractable?.name || 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      A entidade vinculada não pode ser alterada
                    </p>
                  </div>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Início</FormLabel>
                        <DatePicker
                          date={field.value}
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
                          date={field.value}
                          setDate={field.onChange}
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
                      Dados de {contract?.type === 'health_plan'
                        ? 'Plano de Saúde'
                        : contract?.type === 'clinic'
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
              <CardFooter>
                <p className="text-sm text-muted-foreground">
                  Ao salvar as alterações, um novo PDF do contrato será gerado com as informações atualizadas.
                </p>
              </CardFooter>
            </Card>
          </form>
        </Form>
      )}
      
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview do Contrato</DialogTitle>
            <DialogDescription>
              Visualização do contrato com os dados atualizados
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