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

interface Clinic {
  id: number
  name: string
  cnes?: string
  status: string
}

export default function ClinicProceduresPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [clinic, setClinic] = useState<Clinic | null>(null)
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

  // Carregar dados da clínica e procedimentos
  useEffect(() => {
    const loadData = async () => {
      if (!params.id) return;
      
      try {
        setIsLoading(true)
        
        // Carregar clínica
        const clinicData = await fetchResourceById<{data: Clinic}>('clinics', params.id as string)
        setClinic(clinicData?.data)
        
        // Buscar procedimentos já negociados
        try {
          const negotiatedResponse = await api.get(`/clinics/${params.id}/procedures`)
          const negotiatedProcedures = negotiatedResponse.data.data || []
          setProcedures(negotiatedProcedures)
        } catch (error: any) {
          if (error.response?.status === 404) {
            // Se a API ainda não estiver implementada, iniciamos com array vazio
            setProcedures([])
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da clínica",
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
    if (!clinic) return

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
        `clinics/${clinic.id}/procedures`,
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

  if (!clinic) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Clínica não encontrada</h2>
        <p className="text-muted-foreground mt-2">A clínica solicitada não foi encontrada ou foi removida</p>
        <Button onClick={() => router.push("/clinics")} className="mt-4">
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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Procedimentos</h1>
            <p className="text-muted-foreground">
              Gerenciar procedimentos da clínica: <span className="font-medium">{clinic.name}</span>
              {clinic.cnes && <span className="block text-sm">CNES: {clinic.cnes}</span>}
            </p>
          </div>
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
            <CardTitle>Procedimentos da Clínica</CardTitle>
            <CardDescription>
              Procedimentos com valores já definidos para esta clínica
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
                  Nenhum procedimento encontrado. Adicione novos procedimentos usando o botão acima.
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
                Procedimentos a serem adicionados (definir valor antes de salvar)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {newProcedures.map((procedure) => (
                  <div
                    key={procedure.id}
                    className="flex flex-wrap justify-between items-center gap-2 border p-3 rounded-md"
                  >
                    <div className="flex-1 min-w-[200px]">
                      <div className="font-medium">{procedure.name}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="shrink-0">{procedure.code}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={procedure.price || ""}
                        onChange={(e) => handleNewProcedurePriceChange(procedure.id, e.target.value)}
                        placeholder="Valor (R$)"
                        className="w-32"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveNewProcedure(procedure.id)}
                        className="text-red-500"
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

      {/* Dialog para adicionar novos procedimentos */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Procedimentos</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Buscar procedimento TUSS por código ou nome..."
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
              />
              <Button variant="ghost" size="icon" className="shrink-0">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="h-[300px] pr-4">
              {isSearching ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  {searchResults.map((procedure) => (
                    <div
                      key={procedure.id}
                      className="flex items-start gap-2 border p-3 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`procedure-${procedure.id}`}
                        checked={selectedProcedures.some(p => p.id === procedure.id)}
                        onCheckedChange={() => toggleProcedureSelection(procedure)}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={`procedure-${procedure.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {procedure.name}
                        </label>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{procedure.code}</Badge>
                          <span className="text-xs text-muted-foreground">{procedure.description?.substring(0, 100)}...</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : modalSearchQuery.length > 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum procedimento encontrado para "{modalSearchQuery}"
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Digite pelo menos 2 caracteres para buscar um procedimento
                </div>
              )}
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button
              onClick={handleAddSelectedProcedures}
              disabled={selectedProcedures.length === 0}
              className="w-full sm:w-auto"
            >
              Adicionar {selectedProcedures.length > 0 ? `(${selectedProcedures.length})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 