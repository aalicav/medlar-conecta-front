"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from '@tiptap/extension-text-align'
import { 
  getContractTemplate, 
  updateContractTemplate, 
  getPlaceholders,
  deleteContractTemplate,
  createContractTemplate
} from "@/services/contract-templates"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Bold, Italic, List, ListOrdered, Heading2, Undo, Redo, AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { ContractEditor } from "@/components/ContractEditor"
import { TEMPLATE_MODELS } from "@/app/services/contract-templates"

interface PlaceholderInfo {
  key: string;
  description: string;
}

export default function EditTemplateFormPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  const isCreating = id === "new"
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    entity_type: "health_plan" as "health_plan" | "clinic" | "professional",
    content: "",
    is_active: true
  })
  const [placeholders, setPlaceholders] = useState<{
    common: Record<string, string>;
    entity: Record<string, string>;
  }>({
    common: {},
    entity: {}
  })
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: form.content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      setForm(prev => ({ ...prev, content: html }))
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch placeholders based on entity type
        const placeholdersResponse = await getPlaceholders(form.entity_type)
        if (placeholdersResponse.status === 'success') {
          setPlaceholders(placeholdersResponse.data)
        }

        // If editing an existing template, fetch its data
        if (!isCreating) {
          const templateResponse = await getContractTemplate(parseInt(id))
          if (templateResponse.status === 'success') {
            const templateData = {
              name: templateResponse.data.name,
              entity_type: templateResponse.data.entity_type,
              content: templateResponse.data.content,
              is_active: templateResponse.data.is_active
            }
            setForm(templateData)
            
            // Update editor content when template data is loaded
            if (editor) {
              editor.commands.setContent(templateData.content)
            }
          } else {
            toast({
              title: "Erro ao carregar template",
              description: "Não foi possível carregar os detalhes do template.",
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast({
          title: "Erro ao carregar dados",
          description: "Ocorreu um erro ao tentar carregar as informações necessárias.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id, isCreating, form.entity_type, editor])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setForm((prev) => ({ ...prev, is_active: checked }))
  }

  const handleEntityTypeChange = async (value: string) => {
    const entityType = value as "health_plan" | "clinic" | "professional"
    setForm((prev) => ({ ...prev, entity_type: entityType }))
    
    try {
      const response = await getPlaceholders(entityType)
      if (response.status === 'success') {
        setPlaceholders(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch placeholders:", error)
    }
  }

  const insertPlaceholder = (placeholder: string) => {
    if (editor) {
      editor.chain().focus().insertContent(`{{${placeholder}}}`).run()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const formData = {
        name: form.name,
        entity_type: form.entity_type,
        content: form.content,
        is_active: form.is_active
      }
      
      if (isCreating) {
        // Create new template
        const response = await createContractTemplate(formData)
        
        if (response.status === 'success') {
          toast({
            title: "Template criado",
            description: "O template de contrato foi criado com sucesso.",
          })
          router.push(`/contract-templates/${response.data.id}`)
        } else {
          toast({
            title: "Erro ao criar",
            description: response.message || "Não foi possível criar o template.",
            variant: "destructive",
          })
        }
      } else {
        // Update existing template
        const response = await updateContractTemplate(parseInt(id), formData)
        
        if (response.status === 'success') {
          toast({
            title: "Template atualizado",
            description: "O template de contrato foi atualizado com sucesso.",
          })
          router.push(`/contract-templates/${id}`)
        } else {
          toast({
            title: "Erro ao atualizar",
            description: response.message || "Não foi possível atualizar o template.",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Failed to save template:", error)
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao tentar salvar o template.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      const response = await deleteContractTemplate(parseInt(id))
      
      if (response.status === 'success') {
        toast({
          title: "Template excluído",
          description: "O template de contrato foi excluído com sucesso.",
        })
        router.push('/contract-templates')
      } else {
        toast({
          title: "Erro ao excluir",
          description: response.message || "Não foi possível excluir o template.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete template:", error)
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao tentar excluir o template.",
        variant: "destructive",
      })
    }
    setIsDeleteDialogOpen(false)
  }

  const confirmDelete = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleChange = (newContent: string) => {
    setForm((prev) => ({
      ...prev,
      content: newContent,
    }));
  };

  const loadTemplateModel = () => {
    if (form.entity_type in TEMPLATE_MODELS) {
      setForm((prev) => ({
        ...prev,
        content: TEMPLATE_MODELS[prev.entity_type],
      }));
      toast({
        title: "Modelo carregado",
        description: "O modelo padrão foi carregado com sucesso.",
      });
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível carregar o modelo padrão.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(isCreating ? '/contract-templates' : `/contract-templates/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isLoading ? (
                <Skeleton className="h-9 w-48" />
              ) : isCreating ? (
                "Novo Template de Contrato"
              ) : (
                `Editar: ${form.name}`
              )}
            </h1>
            <p className="text-muted-foreground">
              {isCreating ? "Criar um novo template de contrato" : "Atualizar informações do template"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isCreating && (
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          )}
          <Button type="submit" form="template-form" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
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
        <form id="template-form" onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Template</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Nome descritivo do template"
                    value={form.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="entity_type">Tipo de Entidade</Label>
                  <Select
                    value={form.entity_type}
                    onValueChange={handleEntityTypeChange}
                    disabled={!isCreating}
                  >
                    <SelectTrigger id="entity_type" name="entity_type">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health_plan">Plano de Saúde</SelectItem>
                      <SelectItem value="clinic">Estabelecimento</SelectItem>
                      <SelectItem value="professional">Profissional</SelectItem>
                    </SelectContent>
                  </Select>
                  {!isCreating && (
                    <p className="text-xs text-muted-foreground mt-1">
                      O tipo de entidade não pode ser alterado após a criação
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="is_active">Template Ativo</Label>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-6">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Conteúdo do Template</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="content">Conteúdo HTML</Label>
                  <ContractEditor 
                    initialContent={form.content}
                    onChange={handleChange}
                  />
                  {form.content === "" && (
                    <div className="flex justify-end">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={loadTemplateModel}
                      >
                        Carregar Modelo Padrão
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Placeholders Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Placeholders Comuns</h3>
                    <div className="space-y-2">
                      {Object.entries(placeholders.common).map(([key, description]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-2 text-sm border rounded-md cursor-pointer hover:bg-gray-50"
                          onClick={() => insertPlaceholder(key)}
                        >
                          <code>{key}</code>
                          <span className="text-xs text-muted-foreground">{description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Placeholders de {form.entity_type === 'health_plan' ? 'Plano de Saúde' : form.entity_type === 'clinic' ? 'Estabelecimento' : 'Profissional'}</h3>
                    <div className="space-y-2">
                      {Object.entries(placeholders.entity).map(([key, description]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-2 text-sm border rounded-md cursor-pointer hover:bg-gray-50"
                          onClick={() => insertPlaceholder(key)}
                        >
                          <code>{key}</code>
                          <span className="text-xs text-muted-foreground">{description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Clique em um placeholder para inseri-lo no template
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação de Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este template de contrato? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 