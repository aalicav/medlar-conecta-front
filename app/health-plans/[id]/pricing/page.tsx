"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Download, Upload, Plus, Search, X, FileText, CheckCircle, AlertCircle, Edit } from "lucide-react"
import { api } from "@/lib/api"
import { DataTable } from "@/components/data-table/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Loader2 } from "lucide-react"
import debounce from "lodash/debounce"
import { Combobox } from "@/components/ui/combobox"
import { useEstadosCidades } from "@/hooks/useEstadosCidades"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface HealthPlan {
  id: number
  name: string
  cnpj: string
  ans_code: string
}

interface TussProcedure {
  id: number
  code: string
  name: string
  description?: string
}

interface MedicalSpecialty {
  id: number
  name: string
  tuss_code: string
  tuss_description: string
  active: boolean
  negotiable: boolean
}

interface PricingItem {
  id: number
  tuss_procedure_id: number
  price: number
  notes?: string
  is_active: boolean
  start_date: string
  end_date?: string
  created_at: string
  updated_at: string
  medical_specialty_id?: number
  procedure: TussProcedure
  medical_specialty?: MedicalSpecialty
  state?: string
  city?: string
}

interface CsvRow {
  codigo_tuss: string
  descricao_procedimento: string
  valor: string
  observacoes?: string
}

interface Estado {
  sigla: string
  nome: string
  cidades: string[]
}

export default function HealthPlanPricingPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const healthPlanId = params?.id as string
  const { getEstados, getCidadesByEstado } = useEstadosCidades()
  
  const [healthPlan, setHealthPlan] = useState<HealthPlan | null>(null)
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<CsvRow[]>([])
  const [isProcessingCsv, setIsProcessingCsv] = useState(false)
  
  // Form states for individual item
  const [selectedTuss, setSelectedTuss] = useState<TussProcedure | null>(null)
  const [tussSearchValue, setTussSearchValue] = useState("")
  const [tussOptions, setTussOptions] = useState<TussProcedure[]>([])
  const [isLoadingTuss, setIsLoadingTuss] = useState(false)
  const [price, setPrice] = useState("")
  const [notes, setNotes] = useState("")
  
  // Medical specialty states
  const [selectedSpecialty, setSelectedSpecialty] = useState<MedicalSpecialty | null>(null)
  const [specialtyOptions, setSpecialtyOptions] = useState<MedicalSpecialty[]>([])
  const [isLoadingSpecialties, setIsLoadingSpecialties] = useState(false)

  // New states for bulk editing
  const [isEditing, setIsEditing] = useState(false)
  const [editingItems, setEditingItems] = useState<Map<number, { price: string; notes: string }>>(new Map())

  // Estado e cidade states
  const [selectedState, setSelectedState] = useState<string>("")
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [availableCities, setAvailableCities] = useState<string[]>([])

  // Carregar cidades quando estado for selecionado
  useEffect(() => {
    if (selectedState) {
      const cities = getCidadesByEstado(selectedState)
      setAvailableCities(cities)
      setSelectedCity("") // Reset cidade quando estado muda
    } else {
      setAvailableCities([])
      setSelectedCity("")
    }
  }, [selectedState])
  
  // Carregar dados do plano e valores
  useEffect(() => {
    const loadData = async () => {
      if (!healthPlanId) return
      
      try {
        setIsLoading(true)
        
        // Carregar plano de saúde
        const healthPlanResponse = await api.get(`/health-plans/${healthPlanId}`)
        setHealthPlan(healthPlanResponse.data.data)
        
        // Buscar valores já cadastrados
        const pricingResponse = await api.get(`/health-plans/${healthPlanId}/procedures`)
        const pricingData = pricingResponse.data.data || []
        setPricingItems(pricingData)
        
        // Carregar especialidades médicas
        await loadMedicalSpecialties()
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do plano de saúde",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [healthPlanId, toast])

  // Carregar TUSS padrão para consulta
  useEffect(() => {
    const loadDefaultTuss = async () => {
      try {
        // Buscar e definir o TUSS padrão para consulta (10101012)
        const consultationTussResponse = await api.get('/tuss', {
          params: { search: '10101012', per_page: 1 }
        })
        
        if (consultationTussResponse?.data?.data?.length > 0) {
          const consultationTuss = consultationTussResponse.data.data[0]
          setSelectedTuss(consultationTuss)
          setTussSearchValue(`${consultationTuss.code} - ${consultationTuss.name}`)
        }
      } catch (error) {
        console.error('Erro ao carregar TUSS padrão:', error)
      }
    }

    loadDefaultTuss()
  }, [])

  // Função para buscar TUSS
  const searchTuss = async (searchTerm: string) => {
    if (searchTerm.length < 3) return
    
    setIsLoadingTuss(true)
    try {
      const response = await api.get('/tuss', {
        params: { search: searchTerm, per_page: 20 }
      })
      
      if (response?.data?.data) {
        setTussOptions(response.data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar TUSS:', error)
      toast({
        title: "Erro",
        description: "Não foi possível buscar os procedimentos TUSS",
        variant: "destructive"
      })
    } finally {
      setIsLoadingTuss(false)
    }
  }

  // Função para carregar especialidades médicas
  const loadMedicalSpecialties = async () => {
    setIsLoadingSpecialties(true)
    try {
      const params: any = { 
        active: true, 
        per_page: 100 
      }
      
      const response = await api.get('/medical-specialties', { params })
      
      if (response?.data?.data?.data) {
        setSpecialtyOptions(response.data.data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar especialidades:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as especialidades médicas",
        variant: "destructive"
      })
    } finally {
      setIsLoadingSpecialties(false)
    }
  }

  // Buscar especialidades médicas com debounce
  const buscarEspecialidadesComDebounce = debounce(async (termo: string) => {
    setIsLoadingSpecialties(true)
    try {
      const params: { active?: boolean; search?: string; per_page?: number } = { 
        active: true,
        per_page: 50
      }
      
      // Se há um termo de busca, adicionar ao parâmetro search
      if (termo && termo.length >= 2) {
        params.search = termo
      }
      
      const response = await api.get('/medical-specialties', { params })
      
      // Tratar diferentes formatos de resposta
      let especialidades: MedicalSpecialty[] = []
      if (response?.data?.data?.data && Array.isArray(response.data.data.data)) {
        especialidades = response.data.data.data
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        especialidades = response.data.data
      } else if (response?.data && Array.isArray(response.data)) {
        especialidades = response.data
      }
      
      setSpecialtyOptions(especialidades)
    } catch (error) {
      console.error('Erro ao buscar especialidades:', error)
      toast({
        title: "Erro",
        description: "Não foi possível buscar as especialidades médicas",
        variant: "destructive"
      })
    } finally {
      setIsLoadingSpecialties(false)
    }
  }, 300)

  // Debounce para busca de TUSS
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (tussSearchValue.length >= 3) {
        searchTuss(tussSearchValue)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [tussSearchValue])

  // Reset form when dialog opens
  useEffect(() => {
    if (isAddDialogOpen) {
      // Reset form fields
      setPrice("")
      setNotes("")
      setSelectedSpecialty(null)
      setSelectedState("")
      setSelectedCity("")
      
      // Set default TUSS for consultation
      if (selectedTuss) {
        setTussSearchValue(`${selectedTuss.code} - ${selectedTuss.name}`)
      }
    }
  }, [isAddDialogOpen, selectedTuss])

  // Reload specialties when dialog opens
  useEffect(() => {
    if (isAddDialogOpen) {
      setSelectedSpecialty(null)
      loadMedicalSpecialties()
    }
  }, [isAddDialogOpen])

  const handleAddItem = async () => {
    console.log(selectedTuss, price, selectedSpecialty)
    if (!selectedTuss || !price || parseFloat(price) <= 0 || !selectedSpecialty) {
      toast({
        title: "Atenção",
        description: "Selecione uma especialidade médica e informe um valor válido",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      const newItem = {
        tuss_procedure_id: selectedTuss.id,
        price: parseFloat(price),
        notes: notes || "",
        medical_specialty_id: selectedSpecialty?.id || null,
        state: selectedState || null,
        city: selectedCity || null
      }

      await api.post(`/health-plans/${healthPlanId}/procedures`, newItem)

      toast({
        title: "Sucesso",
        description: "Valor adicionado com sucesso",
      })

      // Limpar formulário
      setSelectedTuss(null)
      setTussSearchValue("")
      setPrice("")
      setNotes("")
      setSelectedSpecialty(null)
      setSelectedState("")
      setSelectedCity("")
      setIsAddDialogOpen(false)

      // Recarregar dados
      const pricingResponse = await api.get(`/health-plans/${healthPlanId}/procedures`)
      setPricingItems(pricingResponse.data.data || [])
    } catch (error: any) {
      console.error('Erro ao adicionar valor:', error)
      
      // Extrair mensagem de erro do backend
      let errorMessage = "Não foi possível adicionar o valor"
      
      if (error?.response?.data?.message) {
        const backendMessage = error.response.data.message
        
        // Traduzir mensagens específicas do backend
        if (backendMessage.includes("Procedure already exists")) {
          errorMessage = "Já existe um valor cadastrado para esta especialidade médica neste plano de saúde"
        } else if (backendMessage.includes("already exists")) {
          errorMessage = "Esta especialidade já está cadastrada para este plano de saúde"
        } else {
          // Usar a mensagem do backend se não for uma das mensagens conhecidas
          errorMessage = backendMessage
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/templates/health-plan-pricing-template.csv'
    link.download = 'modelo-valores-plano-saude.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV válido",
        variant: "destructive"
      })
      return
    }

    setCsvFile(file)
    parseCsvFile(file)
  }

  const parseCsvFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      const rows: CsvRow[] = []
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim())
          if (values.length >= 3) {
            rows.push({
              codigo_tuss: values[0],
              descricao_procedimento: values[1],
              valor: values[2],
              observacoes: values[3] || ""
            })
          }
        }
      }
      
      setCsvPreview(rows)
    }
    reader.readAsText(file)
  }

  const handleImportCsv = async () => {
    if (!csvFile) {
      toast({
        title: "Atenção",
        description: "Selecione um arquivo CSV para importar",
        variant: "destructive"
      })
      return
    }

    setIsProcessingCsv(true)
    try {
      const formData = new FormData()
      formData.append('file', csvFile)

      const response = await api.post(`/health-plans/${healthPlanId}/procedures/import-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const result = response.data.data
      
      toast({
        title: "Sucesso",
        description: `${result.imported} valores importados com sucesso`,
      })

      if (result.errors && result.errors.length > 0) {
        console.warn('Erros na importação:', result.errors)
      }

      // Limpar e fechar
      setCsvFile(null)
      setCsvPreview([])
      setIsImportDialogOpen(false)

      // Recarregar dados
      const pricingResponse = await api.get(`/health-plans/${healthPlanId}/procedures`)
      setPricingItems(pricingResponse.data.data || [])
    } catch (error: any) {
      console.error('Erro ao importar CSV:', error)
      
      // Extrair mensagem de erro do backend
      let errorMessage = "Não foi possível importar os valores"
      
      if (error?.response?.data?.message) {
        const backendMessage = error.response.data.message
        
        // Traduzir mensagens específicas do backend
        if (backendMessage.includes("Procedure already exists")) {
          errorMessage = "Alguns valores já existem para este plano de saúde. Verifique os dados e tente novamente."
        } else if (backendMessage.includes("already exists")) {
          errorMessage = "Algumas especialidades já estão cadastradas para este plano de saúde"
        } else {
          // Usar a mensagem do backend se não for uma das mensagens conhecidas
          errorMessage = backendMessage
        }
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsProcessingCsv(false)
    }
  }

  const handlePriceChange = async (itemId: number, newPrice: string) => {
    const price = parseFloat(newPrice) || 0
    if (price <= 0) return

    try {
      const item = pricingItems.find(p => p.id === itemId)
      if (!item) return

      await api.put(`/health-plans/${healthPlanId}/procedures/${itemId}`, {
        price: price,
        notes: item.notes || ""
      })

      // Atualizar localmente
      setPricingItems(prev => prev.map(p => 
        p.id === itemId ? { ...p, price } : p
      ))

      toast({
        title: "Sucesso",
        description: "Valor atualizado com sucesso",
      })
    } catch (error) {
      console.error('Erro ao atualizar valor:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o valor",
        variant: "destructive"
      })
    }
  }

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Tem certeza que deseja excluir este valor?')) return

    try {
      await api.delete(`/health-plans/${healthPlanId}/procedures/${itemId}`)

      // Remover localmente
      setPricingItems(prev => prev.filter(p => p.id !== itemId))

      toast({
        title: "Sucesso",
        description: "Valor excluído com sucesso",
      })
    } catch (error) {
      console.error('Erro ao excluir valor:', error)
      toast({
        title: "Erro",
        description: "Não foi possível excluir o valor",
        variant: "destructive"
      })
    }
  }

  const handleExportCsv = async () => {
    try {
      const response = await api.get(`/health-plans/${healthPlanId}/procedures/export-csv`)
      const { download_url } = response.data.data
      
      // Criar link para download
      const link = document.createElement('a')
      link.href = download_url
      link.download = `valores_plano_${healthPlanId}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Sucesso",
        description: "Arquivo CSV exportado com sucesso",
      })
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
      toast({
        title: "Erro",
        description: "Não foi possível exportar o arquivo CSV",
        variant: "destructive"
      })
    }
  }

  const handleBulkSave = async () => {
    const itemsToUpdate = Array.from(editingItems.entries()).map(([id, data]) => ({
      id,
      price: parseFloat(data.price) || 0,
      notes: data.notes
    })).filter(item => item.price > 0)

    if (itemsToUpdate.length === 0) {
      toast({
        title: "Atenção",
        description: "Nenhum valor válido para atualizar",
        variant: "destructive"
      })
      return
    }

    try {
      await api.post(`/health-plans/${healthPlanId}/procedures/bulk-update`, {
        procedures: itemsToUpdate
      })

      // Atualizar localmente
      setPricingItems(prev => prev.map(p => {
        const update = editingItems.get(p.id)
        if (update) {
          return { ...p, price: parseFloat(update.price) || p.price, notes: update.notes }
        }
        return p
      }))

      setEditingItems(new Map())
      setIsEditing(false)

      toast({
        title: "Sucesso",
        description: `${itemsToUpdate.length} valores atualizados com sucesso`,
      })
    } catch (error) {
      console.error('Erro ao atualizar valores:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os valores",
        variant: "destructive"
      })
    }
  }

  const handleEditItem = (itemId: number, field: 'price' | 'notes', value: string) => {
    const current = editingItems.get(itemId) || { price: '', notes: '' }
    setEditingItems(new Map(editingItems.set(itemId, { ...current, [field]: value })))
  }

  const filteredItems = pricingItems.filter(item => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch = (
        item.procedure.name?.toLowerCase().includes(query) ||
        item.procedure.code?.toLowerCase().includes(query) ||
        item.medical_specialty?.name?.toLowerCase().includes(query) ||
        item.state?.toLowerCase().includes(query) ||
        item.city?.toLowerCase().includes(query)
      )
      if (!matchesSearch) return false
    }
    
    return true
  })

  const columns: ColumnDef<PricingItem>[] = [
    {
      accessorKey: "procedure.code",
      header: "Código TUSS",
      size: 120,
    },
    {
      accessorKey: "procedure.name",
      header: "Procedimento",
      cell: ({ row }) => (
        <div className="max-w-md truncate" title={row.original.procedure.name}>
          {row.original.procedure.name}
        </div>
      ),
    },
    {
      accessorKey: "medical_specialty.name",
      header: "Especialidade",
      size: 150,
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.medical_specialty?.name || '-'}>
          {row.original.medical_specialty?.name || '-'}
        </div>
      ),
    },
    {
      accessorKey: "state",
      header: "Estado",
      size: 100,
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.state || '-'}>
          {row.original.state || '-'}
        </div>
      ),
    },
    {
      accessorKey: "city",
      header: "Cidade",
      size: 150,
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.original.city || '-'}>
          {row.original.city || '-'}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Valor (R$)",
      size: 150,
      cell: ({ row }) => {
        const editingData = editingItems.get(row.original.id)
        const displayValue = editingData?.price || row.original.price || ""
        
        return (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={displayValue}
            onChange={(e) => handleEditItem(row.original.id, 'price', e.target.value)}
            placeholder="0,00"
            className="w-32"
            disabled={!isEditing}
          />
        )
      },
    },
    {
      accessorKey: "notes",
      header: "Observações",
      cell: ({ row }) => {
        const editingData = editingItems.get(row.original.id)
        const displayValue = editingData?.notes || row.original.notes || ""
        
        return isEditing ? (
          <Input
            value={displayValue}
            onChange={(e) => handleEditItem(row.original.id, 'notes', e.target.value)}
            placeholder="Observações..."
            className="max-w-xs"
          />
        ) : (
          <div className="max-w-xs truncate" title={displayValue}>
            {displayValue || "-"}
          </div>
        )
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      size: 100,
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Ativo" : "Inativo"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      size: 100,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const current = editingItems.get(row.original.id)
                if (current) {
                  handlePriceChange(row.original.id, current.price)
                  setEditingItems(new Map(editingItems.delete(row.original.id) ? editingItems : editingItems))
                }
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteItem(row.original.id)}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!healthPlan) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Plano de saúde não encontrado</h2>
        <p className="text-muted-foreground mt-2">O plano solicitado não foi encontrado ou foi removido</p>
        <Button onClick={() => router.push("/health-plans")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para lista
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.push(`/health-plans/${healthPlanId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold mt-2">Tabela de Valores</h1>
          <p className="text-muted-foreground">
            Plano: {healthPlan.name} - CNPJ: {healthPlan.cnpj}
          </p>
        </div>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Valores Cadastrados</TabsTrigger>
          <TabsTrigger value="import">Importar CSV</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Valores dos Procedimentos</CardTitle>
                  <CardDescription>
                    Gerencie os valores cobrados para cada procedimento TUSS
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadTemplate} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Modelo
                  </Button>
                  <Button onClick={handleExportCsv} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  {isEditing ? (
                    <>
                      <Button onClick={handleBulkSave} variant="default">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsEditing(false)
                          setEditingItems(new Map())
                        }} 
                        variant="outline"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar em Lote
                    </Button>
                  )}
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Valor
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Adicionar Valor</DialogTitle>
                        <DialogDescription>
                          Adicione um novo valor para consulta médica com especialidade
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Procedimento TUSS</Label>
                          <div className="p-3 bg-gray-50 rounded-md border">
                            <div className="font-medium">{selectedTuss?.code || '10101012'}</div>
                            <div className="text-sm text-gray-600">{selectedTuss?.name || 'Consulta em Clínica Médica'}</div>
                          </div>
                        </div>
                        
                        <div>
                          <Label>Especialidade Médica</Label>
                          <Combobox
                            options={specialtyOptions.map(specialty => ({
                              value: specialty.id.toString(),
                              label: specialty.name
                            }))}
                            value={selectedSpecialty?.id?.toString() || ""}
                            onValueChange={(value) => {
                              const specialty = specialtyOptions.find(s => s.id === parseInt(value))
                              setSelectedSpecialty(specialty || null)
                            }}
                            placeholder="Pesquise pelo nome da especialidade"
                            onSearch={buscarEspecialidadesComDebounce}
                            loading={isLoadingSpecialties}
                            emptyText="Digite para buscar especialidades médicas"
                          />
                          {isLoadingSpecialties && (
                            <div className="flex items-center mt-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span className="text-sm text-gray-500">Carregando especialidades...</span>
                            </div>
                          )}
                          {!isLoadingSpecialties && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {specialtyOptions.length} especialidade(s) encontrada(s)
                            </div>
                          )}
                          {selectedSpecialty && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-md">
                              <div className="text-sm font-medium">{selectedSpecialty.name}</div>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <Label>Valor (R$)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0,00"
                          />
                        </div>
                        
                        <div>
                          <Label>Observações</Label>
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Observações opcionais..."
                            rows={3}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Estado</Label>
                            <Select value={selectedState} onValueChange={setSelectedState}>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o estado" />
                              </SelectTrigger>
                              <SelectContent>
                                {getEstados().map((estado: Estado) => (
                                  <SelectItem key={estado.sigla} value={estado.sigla}>
                                    {estado.sigla} - {estado.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>Cidade</Label>
                            <Select value={selectedCity} onValueChange={setSelectedCity} disabled={!selectedState}>
                              <SelectTrigger>
                                <SelectValue placeholder={selectedState ? "Selecione a cidade" : "Selecione o estado primeiro"} />
                              </SelectTrigger>
                              <SelectContent>
                                {availableCities.map((cidade) => (
                                  <SelectItem key={cidade} value={cidade}>
                                    {cidade}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button onClick={handleAddItem} disabled={isSaving} className="flex-1">
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4 mr-2" />
                            )}
                            Adicionar
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsAddDialogOpen(false)}
                            disabled={isSaving}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar procedimento ou especialidade..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {searchQuery && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("")
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {filteredItems.length} de {pricingItems.length} itens
                    </span>
                  </div>
                )}
              </div>
              
              {filteredItems.length > 0 ? (
                <DataTable
                  columns={columns}
                  data={filteredItems}
                  pageCount={1}
                  currentPage={1}
                  pageSize={100}
                  totalItems={filteredItems.length}
                  isLoading={isLoading}
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum valor cadastrado encontrado.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adicione valores individualmente ou importe um arquivo CSV.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Importar Valores via CSV</CardTitle>
              <CardDescription>
                Faça upload de um arquivo CSV com os valores dos procedimentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Button onClick={handleDownloadTemplate} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Modelo CSV
                </Button>
                <div className="text-sm text-muted-foreground">
                  O arquivo deve conter as colunas: código_tuss, descricao_procedimento, valor, observacoes
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Clique para selecionar um arquivo CSV ou arraste aqui
                  </p>
                </label>
              </div>

              {csvPreview.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Prévia do arquivo ({csvPreview.length} itens)</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCsvFile(null)
                        setCsvPreview([])
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Limpar
                    </Button>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border rounded-md">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Código TUSS</th>
                          <th className="p-2 text-left">Procedimento</th>
                          <th className="p-2 text-left">Valor</th>
                          <th className="p-2 text-left">Observações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvPreview.slice(0, 10).map((row, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">{row.codigo_tuss}</td>
                            <td className="p-2">{row.descricao_procedimento}</td>
                            <td className="p-2">R$ {row.valor}</td>
                            <td className="p-2">{row.observacoes || "-"}</td>
                          </tr>
                        ))}
                        {csvPreview.length > 10 && (
                          <tr>
                            <td colSpan={4} className="p-2 text-center text-gray-500">
                              ... e mais {csvPreview.length - 10} itens
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <Button 
                    onClick={handleImportCsv} 
                    disabled={isProcessingCsv}
                    className="w-full"
                  >
                    {isProcessingCsv ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Importar {csvPreview.length} Valores
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 