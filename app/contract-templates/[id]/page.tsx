"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Edit, 
  FileDown, 
  Trash2, 
  BadgeCheck, 
  BadgeX,   
  Copy
} from "lucide-react"
import { 
  getContractTemplate, 
  ContractTemplate,
  deleteContractTemplate
} from "@/services/contract-templates"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function ContractTemplateDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  
  const [isLoading, setIsLoading] = useState(true)
  const [template, setTemplate] = useState<ContractTemplate | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    const fetchTemplate = async () => {
      setIsLoading(true)
      try {
        const response = await getContractTemplate(parseInt(id))
        
        if (response.status === 'success') {
          setTemplate(response.data)
        } else {
          toast({
            title: "Erro ao carregar template",
            description: "Não foi possível carregar os detalhes do template.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Failed to fetch template:", error)
        toast({
          title: "Erro ao carregar template",
          description: "Ocorreu um erro ao tentar carregar o template.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchTemplate()
  }, [id])

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiado!",
      description: "O conteúdo do template foi copiado para a área de transferência.",
    })
  }

  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'health_plan':
        return 'Plano de Saúde'
      case 'clinic':
        return 'Estabelecimento'
      case 'professional':
        return 'Profissional'
      default:
        return type
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push('/contract-templates')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isLoading ? <Skeleton className="h-9 w-48" /> : template?.name}
            </h1>
            <p className="text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-5 w-64" />
              ) : (
                `Template para ${getEntityTypeLabel(template?.entity_type || '')}`
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/contract-templates/${id}/export`)}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" onClick={() => router.push(`/contract-templates/${id}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : template ? (
        <Tabs defaultValue="preview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="preview">Visualização</TabsTrigger>
            <TabsTrigger value="content">Conteúdo</TabsTrigger>
            <TabsTrigger value="placeholders">Placeholders</TabsTrigger>
            <TabsTrigger value="info">Informações</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Prévia do Template</CardTitle>
                <CardDescription>
                  Visualização do template com placeholders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div 
                    className="border p-6 rounded-md bg-white dark:bg-gray-950"
                    dangerouslySetInnerHTML={{ __html: template.content }}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Conteúdo do Template</CardTitle>
                  <CardDescription>
                    Conteúdo HTML do template
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => copyToClipboard(template.content)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="rounded-md bg-gray-100 p-4 overflow-auto max-h-96 dark:bg-gray-950">
                    <code className="text-sm">{template.content}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="placeholders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Placeholders Disponíveis</CardTitle>
                <CardDescription>
                  Variáveis que podem ser usadas neste template
                </CardDescription>
              </CardHeader>
              <CardContent>
                {template.placeholders && template.placeholders.length > 0 ? (
                  <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    {Array.isArray(template.placeholders) ? template.placeholders.map((placeholder, index) => (
                      <div key={index} className="flex items-center p-2 border rounded-md">
                        <code className="text-sm flex-1">{placeholder}</code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => copyToClipboard(`{{${placeholder}}}`)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )) : (
                      <div className="col-span-full text-center p-4 text-muted-foreground">
                        Formato de placeholders inválido
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-4 text-muted-foreground">
                    Não há placeholders disponíveis para este template
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Template</CardTitle>
                <CardDescription>
                  Detalhes sobre o template de contrato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">ID</dt>
                    <dd className="text-sm">{template.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Nome</dt>
                    <dd className="text-sm">{template.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Tipo de Entidade</dt>
                    <dd className="text-sm">{getEntityTypeLabel(template.entity_type)}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd className="text-sm">
                      {template.is_active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <BadgeCheck className="mr-1 h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <BadgeX className="mr-1 h-3 w-3" />
                          Inativo
                        </Badge>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Data de Criação</dt>
                    <dd className="text-sm">
                      {new Date(template.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Última Atualização</dt>
                    <dd className="text-sm">
                      {new Date(template.updated_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-xl font-semibold mb-2">Template não encontrado</h3>
            <p className="text-muted-foreground mb-4">
              O template solicitado não foi encontrado ou não está disponível.
            </p>
            <Button onClick={() => router.push('/contract-templates')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Templates
            </Button>
          </CardContent>
        </Card>
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