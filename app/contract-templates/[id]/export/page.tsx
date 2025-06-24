"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  FileDown, 
  Eye, 
  FileText,
  FileArchiveIcon
} from "lucide-react"
import { 
  getContractTemplate, 
  getPlaceholders,
  exportTemplateToDocx,
  exportTemplateToPdf,
  previewContractTemplate,
  ContractTemplate
} from "@/services/contract-templates"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function ExportTemplatePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { id } = params
  
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [template, setTemplate] = useState<ContractTemplate | null>(null)
  const [placeholders, setPlaceholders] = useState<{
    common: Record<string, string>;
    entity: Record<string, string>;
  }>({
    common: {},
    entity: {}
  })
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [previewContent, setPreviewContent] = useState<string>("")
  const [previewLoading, setPreviewLoading] = useState(false)
  const [negotiations, setNegotiations] = useState<any[]>([])
  const [selectedNegotiationId, setSelectedNegotiationId] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch template details
        const templateResponse = await getContractTemplate(parseInt(id))
        if (templateResponse.status === 'success') {
          setTemplate(templateResponse.data)
          
          // Fetch available negotiations for this entity type
          try {
            // This would be a real API call in production
            const entityType = templateResponse.data.entity_type;
            const negotiationsResponse = await fetch(`/api/negotiations?entity_type=${entityType}`)
            const negotiationsData = await negotiationsResponse.json()
            if (negotiationsData.status === 'success') {
              setNegotiations(negotiationsData.data)
            }
          } catch (error) {
            console.error("Failed to fetch negotiations:", error)
          }
          
          // Fetch available placeholders based on entity type
          const placeholdersResponse = await getPlaceholders(templateResponse.data.entity_type)
          if (placeholdersResponse.status === 'success') {
            setPlaceholders(placeholdersResponse.data)
            
            // Initialize form data with empty values for each placeholder
            const initialData: Record<string, string> = {}
            Object.keys(placeholdersResponse.data.common).forEach(key => {
              initialData[key] = ""
            })
            Object.keys(placeholdersResponse.data.entity).forEach(key => {
              initialData[key] = ""
            })
            setFormData(initialData)
          }
        } else {
          toast({
            title: "Erro ao carregar template",
            description: "Não foi possível carregar os detalhes do template.",
            variant: "destructive",
          })
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
  }, [id])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string
  ) => {
    setFormData((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const handleNegotiationChange = (value: string) => {
    setSelectedNegotiationId(value === "" ? null : value)
  }

  const generatePreview = async () => {
    setPreviewLoading(true)
    try {
      // Include negotiation ID if one is selected
      const requestData: any = { data: formData }
      if (selectedNegotiationId) {
        requestData.negotiation_id = selectedNegotiationId
      }
      
      const response = await previewContractTemplate(parseInt(id), requestData)
      if (response.status === 'success') {
        setPreviewContent(response.data.content)
      } else {
        toast({
          title: "Erro ao gerar prévia",
          description: "Não foi possível gerar a prévia do documento.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to generate preview:", error)
      toast({
        title: "Erro ao gerar prévia",
        description: "Ocorreu um erro ao tentar gerar a prévia do documento.",
        variant: "destructive",
      })
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleExport = async (format: 'docx' | 'pdf') => {
    setIsProcessing(true)
    try {
      let blob: Blob
      let filename: string
      
      // Include negotiation ID if one is selected
      const requestData: any = { data: formData }
      if (selectedNegotiationId) {
        requestData.negotiation_id = selectedNegotiationId
      }
      
      if (format === 'docx') {
        blob = await exportTemplateToDocx(parseInt(id), requestData)
        filename = `${template?.name || 'template'}-${new Date().toISOString().split('T')[0]}.docx`
      } else {
        blob = await exportTemplateToPdf(parseInt(id), requestData)
        filename = `${template?.name || 'template'}-${new Date().toISOString().split('T')[0]}.pdf`
      }
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob)
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      
      // Clean up
      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast({
        title: "Exportação concluída",
        description: `O template foi exportado como ${format.toUpperCase()} com sucesso.`,
      })
    } catch (error) {
      console.error(`Failed to export as ${format}:`, error)
      toast({
        title: "Erro na exportação",
        description: `Ocorreu um erro ao tentar exportar o documento como ${format.toUpperCase()}.`,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
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
          <Button variant="ghost" size="icon" onClick={() => router.push(`/contract-templates/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isLoading ? <Skeleton className="h-9 w-48" /> : `Exportar: ${template?.name}`}
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
          <Button 
            variant="outline" 
            onClick={() => handleExport('docx')}
            disabled={isProcessing}
          >
            <FileText className="mr-2 h-4 w-4" />
            {isProcessing ? 'Exportando...' : 'Exportar DOCX'}
          </Button>
          <Button 
            variant="default" 
            onClick={() => handleExport('pdf')}
            disabled={isProcessing}
          >
            <FileArchiveIcon className="mr-2 h-4 w-4" />
            {isProcessing ? 'Exportando...' : 'Exportar PDF'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Dados para o Documento</CardTitle>
              <CardDescription>
                Preencha os dados que serão utilizados no documento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.keys(placeholders.common).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Informações Gerais</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {Object.entries(placeholders.common).map(([key, description]) => (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key}>{description}</Label>
                          <Input
                            id={key}
                            value={formData[key] || ""}
                            onChange={(e) => handleInputChange(e, key)}
                            placeholder={description}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <Separator />
                
                {/* Negotiation selection */}
                {negotiations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Negociação</h3>
                    <div className="space-y-2">
                      <Label htmlFor="negotiation">Selecione uma negociação para incluir tabela de procedimentos</Label>
                      <Select
                        value={selectedNegotiationId || ""}
                        onValueChange={handleNegotiationChange}
                      >
                        <SelectTrigger id="negotiation" className="w-full">
                          <SelectValue placeholder="Selecione uma negociação" />
                        </SelectTrigger>
                        <SelectContent>
                          {negotiations.map((negotiation) => (
                            <SelectItem key={negotiation.id} value={negotiation.id.toString()}>
                              {negotiation.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Selecionar uma negociação incluirá a tabela de procedimentos no contrato
                      </p>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                {Object.keys(placeholders.entity).length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">
                      Informações de {getEntityTypeLabel(template?.entity_type || '')}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {Object.entries(placeholders.entity).map(([key, description]) => (
                        <div key={key} className="space-y-2">
                          <Label htmlFor={key}>{description}</Label>
                          <Input
                            id={key}
                            value={formData[key] || ""}
                            onChange={(e) => handleInputChange(e, key)}
                            placeholder={description}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="pt-4">
                  <Button onClick={generatePreview} disabled={previewLoading}>
                    <Eye className="mr-2 h-4 w-4" />
                    {previewLoading ? 'Gerando...' : 'Visualizar Prévia'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Prévia do Documento</CardTitle>
              <CardDescription>
                Visualização do documento com os dados preenchidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {previewLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : previewContent ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div 
                    className="border p-6 rounded-md bg-white dark:bg-gray-950 min-h-[400px] max-h-[600px] overflow-auto"
                    dangerouslySetInnerHTML={{ __html: previewContent }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileDown className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Nenhuma prévia gerada</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Preencha os dados à esquerda e clique em "Visualizar Prévia" para gerar uma 
                    visualização do documento.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}