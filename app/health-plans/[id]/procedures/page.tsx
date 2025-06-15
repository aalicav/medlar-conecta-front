"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { DataTable } from "@/components/data-table/data-table"
import { toast } from "@/components/ui/use-toast"
import { fetchResourceById, updateResource } from "@/services/resource-service"
import { Loader2, ArrowLeft, Save, Plus, Search, X } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import api from "@/services/api-client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import debounce from 'lodash/debounce'

interface TussProcedure {
  id: number
  code: string
  name: string
  description: string
  price?: number
  is_active: boolean
}

interface PricingContract {
  id: number
  tuss_procedure_id: number
  price: number
  notes?: string
  is_active: boolean
  procedure: TussProcedure
}

interface HealthPlan {
  id: number
  name: string
}

export default function HealthPlanProceduresPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [healthPlan, setHealthPlan] = useState<HealthPlan | null>(null)
  const [procedures, setProcedures] = useState<PricingContract[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [skipContractUpdate, setSkipContractUpdate] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [modalSearchQuery, setModalSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<TussProcedure[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedProcedures, setSelectedProcedures] = useState<TussProcedure[]>([])
  const [newProcedures, setNewProcedures] = useState<TussProcedure[]>([])

  // Carregar dados do plano e procedimentos
  useEffect(() => {
    const loadData = async () => {
      if (!params.id) return;
      
      try {
        setIsLoading(true)
        
        // Carregar plano de saúde
        const healthPlanData = await fetchResourceById<{data: HealthPlan}>('health-plans', params.id as string)
        setHealthPlan(healthPlanData?.data)
        
        // Buscar procedimentos já negociados
        const negotiatedResponse = await api.get(`/health-plans/${params.id}/procedures`)
        const negotiatedProcedures = negotiatedResponse.data.data || []
        
        setProcedures(negotiatedProcedures)
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
  }, [params.id])

  const handlePriceChange = (procedureId: number, price: string) => {
    setProcedures(prev => prev.map(proc => {
      if (proc.tuss_procedure_id === procedureId) {
        return { ...proc, price: parseFloat(price) || 0 }
      }
      return proc
    }))
  }

  const handleNewProcedurePriceChange = (procedureId: number, price: string) => {
    setNewProcedures(prev => prev.map(proc => {
      if (proc.id === procedureId) {
        return { ...proc, price: parseFloat(price) || 0 }
      }
      return proc
    }))
  }

  const performSearch = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([])
      return
    }
    
    try {
      setIsSearching(true)
      const response = await api.get('/tuss', {
        params: {
          search: query,
          per_page: 20,
          is_active: true
        }
      })
      
      const results = response.data.data || []
      setSearchResults(results)
    } catch (error) {
      console.error('Erro ao buscar procedimentos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível buscar procedimentos",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }

  // Debounce da função de busca
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce(performSearch, 500),
    []
  )

  // Atualizar busca quando o termo mudar
  useEffect(() => {
    debouncedSearch(modalSearchQuery)
    
    // Cleanup function
    return () => {
      debouncedSearch.cancel()
    }
  }, [modalSearchQuery, debouncedSearch])

  const toggleProcedureSelection = (procedure: TussProcedure) => {
    const isSelected = selectedProcedures.some(p => p.id === procedure.id)
    
    if (isSelected) {
      setSelectedProcedures(prev => prev.filter(p => p.id !== procedure.id))
    } else {
      setSelectedProcedures(prev => [...prev, procedure])
    }
  }

  const handleAddSelectedProcedures = () => {
    // Filtrar procedimentos que já existem na lista atual
    const existingIds = [...procedures.map(p => p.tuss_procedure_id), ...newProcedures.map(p => p.id)]
    const filteredProcedures = selectedProcedures.filter(p => !existingIds.includes(p.id))
    
    // Adicionar os procedimentos com preço inicial 0
    const proceduresToAdd = filteredProcedures.map(p => ({
      ...p,
      price: 0
    }))
    
    setNewProcedures(prev => [...prev, ...proceduresToAdd])
    setSelectedProcedures([])
    setSearchResults([])
    setModalSearchQuery("")
    setIsAddDialogOpen(false)
  }

  const handleRemoveNewProcedure = (procedureId: number) => {
    setNewProcedures(prev => prev.filter(p => p.id !== procedureId))
  }

  const handleSave = async () => {
    if (!healthPlan) return

    setIsSaving(true)
    try {
      // Combinar procedimentos existentes e novos
      const existingProceduresToUpdate = procedures.map(proc => ({
        tuss_id: proc.tuss_procedure_id,
        value: proc.price,
        notes: proc.notes || ""
      }))
      
      const newProceduresToAdd = newProcedures
        .filter(proc => proc.price !== undefined && proc.price > 0)
        .map(proc => ({
          tuss_id: proc.id,
          value: proc.price || 0,
          notes: ""
        }))
      
      const allProcedures = [...existingProceduresToUpdate, ...newProceduresToAdd]
      
      if (allProcedures.length === 0) {
        toast({
          title: "Atenção",
          description: "Nenhum procedimento com valor definido para atualizar",
          variant: "default"
        })
        setIsSaving(false)
        return
      }

      await updateResource(
        `health-plans/${healthPlan.id}/procedures`,
        {
          procedures: allProcedures,
          skip_contract_update: skipContractUpdate
        },
        'PUT'
      )

      toast({
        title: "Sucesso",
        description: "Procedimentos atualizados com sucesso",
      })

      // Recarregar a página para mostrar os dados atualizados
      router.refresh()
    } catch (error) {
      console.error('Erro ao atualizar procedimentos:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os procedimentos",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const filteredProcedures = procedures.filter(proc => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      proc.procedure.name?.toLowerCase().includes(query) ||
      proc.procedure.code?.toLowerCase().includes(query)
    )
  })

  const columns: ColumnDef<PricingContract>[] = [
    {
      accessorKey: "procedure.code",
      header: "Código",
      size: 100,
    },
    {
      accessorKey: "procedure.name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="max-w-md truncate" title={row.original.procedure.name}>
          {row.original.procedure.name}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: "Valor (R$)",
      size: 150,
      cell: ({ row }) => (
        <Input
          type="number"
          min="0"
          step="0.01"
          value={row.original.price || ""}
          onChange={(e) => handlePriceChange(row.original.tuss_procedure_id, e.target.value)}
          placeholder="0,00"
          className="w-32"
        />
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
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 sm:items-center">
          <div className="flex-1">
            <Input
              placeholder="Filtrar procedimentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="skip-contract"
              checked={skipContractUpdate}
              onCheckedChange={setSkipContractUpdate}
            />
            <Label htmlFor="skip-contract">Pular atualização de contrato</Label>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Procedimento
          </Button>
        </div>

        {/* Procedimentos existentes negociados */}
        <Card>
          <CardHeader>
            <CardTitle>Procedimentos Negociados</CardTitle>
            <CardDescription>
              Procedimentos com valores já definidos para este plano de saúde
            </CardDescription>
          </CardHeader>
          <CardContent>
            {procedures.length > 0 ? (
              <DataTable
                columns={columns}
                data={filteredProcedures}
                pageCount={1}
                currentPage={1}
                pageSize={100}
                totalItems={filteredProcedures.length}
                isLoading={isLoading}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhum procedimento negociado encontrado. Adicione novos procedimentos usando o botão acima.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Novos procedimentos a serem adicionados */}
        {newProcedures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Novos Procedimentos</CardTitle>
              <CardDescription>
                Procedimentos a serem adicionados ao plano (não salvos)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {newProcedures.map((procedure) => (
                  <div key={procedure.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-mono">
                          {procedure.code}
                        </Badge>
                        <h4 className="font-medium">{procedure.name}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{procedure.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-36">
                        <Label htmlFor={`price-${procedure.id}`} className="sr-only">
                          Valor
                        </Label>
                        <Input
                          id={`price-${procedure.id}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={procedure.price || ""}
                          onChange={(e) => handleNewProcedurePriceChange(procedure.id, e.target.value)}
                          placeholder="0,00"
                          className="w-full"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveNewProcedure(procedure.id)}
                        title="Remover"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Diálogo para adicionar novos procedimentos */}
      <Dialog 
        open={isAddDialogOpen} 
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) {
            setModalSearchQuery("")
            setSearchResults([])
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Adicionar Procedimentos</DialogTitle>
          </DialogHeader>
          
          <div className="relative mt-2">
            <Input
              placeholder="Buscar procedimentos TUSS..."
              value={modalSearchQuery}
              onChange={(e) => setModalSearchQuery(e.target.value)}
              className="pr-10"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          <ScrollArea className="h-[300px] mt-4 rounded-md border p-4">
            {searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((procedure) => (
                  <div key={procedure.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`procedure-${procedure.id}`}
                      checked={selectedProcedures.some(p => p.id === procedure.id)}
                      onCheckedChange={() => toggleProcedureSelection(procedure)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`procedure-${procedure.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        <div className="flex gap-2 mb-1">
                          <Badge variant="outline" className="font-mono">
                            {procedure.code}
                          </Badge>
                          <span>{procedure.name}</span>
                        </div>
                      </Label>
                      <p className="text-xs text-muted-foreground">{procedure.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {isSearching
                    ? "Buscando procedimentos..."
                    : modalSearchQuery.length > 0
                      ? modalSearchQuery.length < 2 
                        ? "Digite pelo menos 2 caracteres para buscar" 
                        : "Nenhum procedimento encontrado. Tente termos diferentes."
                      : "Digite no campo de busca para encontrar procedimentos."}
                </p>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {selectedProcedures.length} procedimento(s) selecionado(s)
            </p>
            <Button
              onClick={handleAddSelectedProcedures}
              disabled={selectedProcedures.length === 0}
            >
              Adicionar Selecionados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 