"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Loader2, Search, FileText, Download, X, AlertTriangle, CheckCircle, Eye, Calendar, DollarSign, Building2, RefreshCw, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Plus, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"

interface NFe {
  id: number
  billing_rule_id: number
  entity_type: string
  entity_id: number
  reference_period_start: string
  reference_period_end: string
  items_count: number
  total_amount: string
  fees_amount: string
  taxes_amount: string
  net_amount: string
  billing_date: string
  due_date: string
  status: string
  payment_status: string
  invoice_number: string | null
  invoice_path: string | null
  created_by: number
  processing_notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  payment_received_at: string | null
  payment_method: string | null
  payment_reference: string | null
  payment_proof_path: string | null
  invoice_status: string | null
  invoice_generated_at: string | null
  invoice_sent_at: string | null
  invoice_xml_path: string | null
  invoice_pdf_path: string | null
  operator_viewed_at: string | null
  operator_approved_at: string | null
  operator_approval_user: string | null
  is_late: number
  days_late: number | null
  last_reminder_sent_at: string | null
  reminders_sent_count: number
  nfe_number: string
  nfe_key: string
  nfe_xml: string
  nfe_status: string
  nfe_protocol: string | null
  nfe_authorization_date: string
  nfe_cancellation_date: string | null
  nfe_cancellation_reason: string | null
  nfe_cancellation_protocol: string | null
  nfe_substitute_key: string | null
  health_plan_id: number | null
  contract_id: number | null
  health_plan: {
    id: number
    name: string
    cnpj: string
  } | null
}

interface SubstituteNFe {
  id: number
  nfe_number: string
  nfe_key: string
  total_amount: string
  created_at: string
}

interface Appointment {
  id: number
  scheduled_date: string
  status: string
  patient: {
    name: string
    cpf: string
  }
  provider: {
    name: string
    specialty: string
  }
  procedure: {
    code: string
    description: string
  }
  solicitation: {
    health_plan: {
      id: number
      name: string
    }
  }
  amount: number
}

interface PaginatedResponse {
  data: NFe[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export default function NFesPage() {
  const [nfes, setNfes] = useState<NFe[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedNFe, setSelectedNFe] = useState<NFe | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showSubstitutionDialog, setShowSubstitutionDialog] = useState(false)
  const [substituteNfes, setSubstituteNfes] = useState<SubstituteNFe[]>([])
  const [cancellationReason, setCancellationReason] = useState("")
  const [substituteNFeKey, setSubstituteNFeKey] = useState("")
  const [cancelling, setCancelling] = useState(false)
  
  // Estados para criação de NFe
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [creatingNFe, setCreatingNFe] = useState(false)
  
  // Estados para envio para SEFAZ
  const [sendingToSefaz, setSendingToSefaz] = useState(false)
  const [selectedNfesForSefaz, setSelectedNfesForSefaz] = useState<number[]>([])
  const [showSefazDialog, setShowSefazDialog] = useState(false)
  const [sefazResults, setSefazResults] = useState<any[]>([])
  
  // Estados para visualização de detalhes
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedNFeForDetails, setSelectedNFeForDetails] = useState<NFe | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [total, setTotal] = useState(0)
  const [from, setFrom] = useState(0)
  const [to, setTo] = useState(0)

  useEffect(() => {
    loadNFes()
  }, [currentPage, searchTerm])

  const loadNFes = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
        search: searchTerm,
      })

      const response = await api.get(`/billing/nfe?${params}`)

      if (response.data) {
        const data: PaginatedResponse = response.data
        setNfes(data.data || [])
        setCurrentPage(data.current_page)
        setLastPage(data.last_page)
        setPerPage(data.per_page)
        setTotal(data.total)
        setFrom(data.from)
        setTo(data.to)
      }
    } catch (error) {
      toast.error("Erro ao carregar NFes")
    } finally {
      setLoading(false)
    }
  }

  const loadEligibleAppointments = async () => {
    try {
      setLoadingAppointments(true)
      const response = await api.get('/appointments/eligible-for-nfe')
      
      if (response.data) {
        setAppointments(response.data.data || [])
      }
    } catch (error) {
      toast.error("Erro ao carregar agendamentos elegíveis")
    } finally {
      setLoadingAppointments(false)
    }
  }

  const handleCreateNFe = async () => {
    if (!selectedAppointment) {
      toast.error("Selecione um agendamento")
      return
    }

    try {
      setCreatingNFe(true)
      const response = await api.post(`/appointments/${selectedAppointment.id}/generate-nfe`)
      
      if (response.data) {
        toast.success("NFe criada com sucesso!")
        setShowCreateDialog(false)
        setSelectedAppointment(null)
        await loadNFes()
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erro ao criar NFe"
      toast.error(errorMessage)
    } finally {
      setCreatingNFe(false)
    }
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      issued: { label: "Emitida", variant: "default" as const },
      authorized: { label: "Autorizada", variant: "default" as const },
      cancelled: { label: "Cancelada", variant: "destructive" as const },
      cancelled_by_substitution: { label: "Cancelada por Substituição", variant: "destructive" as const },
      pending: { label: "Pendente", variant: "secondary" as const },
      error: { label: "Erro", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const handleSendToSefaz = async (nfeId: number) => {
    try {
      setSendingToSefaz(true)
      const response = await api.post(`/billing/nfe/${nfeId}/send-to-sefaz`)
      
      if (response.data) {
        toast.success("NFe enviada para SEFAZ com sucesso!")
        await loadNFes()
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erro ao enviar NFe para SEFAZ"
      toast.error(errorMessage)
    } finally {
      setSendingToSefaz(false)
    }
  }

  const handleSendToSefazFromMenu = async (nfeId: number) => {
    if (sendingToSefaz) return // Prevent multiple clicks
    
    try {
      setSendingToSefaz(true)
      const response = await api.post(`/billing/nfe/${nfeId}/send-to-sefaz`)
      
      if (response.data) {
        toast.success("NFe enviada para SEFAZ com sucesso!")
        await loadNFes()
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erro ao enviar NFe para SEFAZ"
      toast.error(errorMessage)
    } finally {
      setSendingToSefaz(false)
    }
  }

  const handleSendMultipleToSefaz = async () => {
    if (selectedNfesForSefaz.length === 0) {
      toast.error("Selecione pelo menos uma NFe para enviar")
      return
    }

    try {
      setSendingToSefaz(true)
      const response = await api.post('/billing/nfe/send-multiple-to-sefaz', {
        nfe_ids: selectedNfesForSefaz
      })
      
      if (response.data) {
        setSefazResults(response.data.results || [])
        setShowSefazDialog(true)
        setSelectedNfesForSefaz([])
        await loadNFes()
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erro ao enviar NFes para SEFAZ"
      toast.error(errorMessage)
    } finally {
      setSendingToSefaz(false)
    }
  }

  const handleSelectNfeForSefaz = (nfeId: number) => {
    setSelectedNfesForSefaz(prev => 
      prev.includes(nfeId) 
        ? prev.filter(id => id !== nfeId)
        : [...prev, nfeId]
    )
  }

  const handleViewDetails = (nfe: NFe) => {
    setSelectedNFeForDetails(nfe)
    setShowDetailsDialog(true)
  }

  const handleCancelNFe = async () => {
    if (!selectedNFe || !cancellationReason.trim()) {
      toast.error("Informe o motivo do cancelamento")
      return
    }

    try {
      setCancelling(true)
      const response = await api.post(`/billing/nfe/${selectedNFe.id}/cancel`, {
        reason: cancellationReason
      })

      if (response.data && response.data.success) {
        toast.success("NFe cancelada com sucesso!")
        setShowCancelDialog(false)
        setCancellationReason("")
        setSelectedNFe(null)
        await loadNFes()
      } else {
        toast.error(response.data?.error || "Erro ao cancelar NFe")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao cancelar NFe")
    } finally {
      setCancelling(false)
    }
  }

  const handleCancelBySubstitution = async () => {
    if (!selectedNFe || !substituteNFeKey.trim()) {
      toast.error("Informe a chave da NFe substituta")
      return
    }

    try {
      setCancelling(true)
      const response = await api.post(`/billing/nfe/${selectedNFe.id}/cancel-by-substitution`, {
        substitute_nfe_key: substituteNFeKey,
        reason: "Cancelamento por substituição - NFe duplicada"
      })

      if (response.data && response.data.success) {
        toast.success("NFe cancelada por substituição com sucesso!")
        setShowSubstitutionDialog(false)
        setSubstituteNFeKey("")
        setSelectedNFe(null)
        await loadNFes()
      } else {
        toast.error(response.data?.error || "Erro ao cancelar NFe por substituição")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao cancelar NFe por substituição")
    } finally {
      setCancelling(false)
    }
  }

  const handleFindSubstitutes = async (nfe: NFe) => {
    try {
      const response = await api.get(`/billing/nfe/${nfe.id}/substitute-nfes`)

      if (response.data) {
        setSubstituteNfes(response.data.substitute_nfes || [])
        setSelectedNFe(nfe)
        setShowSubstitutionDialog(true)
      }
    } catch (error) {
      toast.error("Erro ao buscar NFes substitutas")
    }
  }

  const handleDownloadXML = async (nfe: NFe) => {
    try {
      const response = await api.get(`/billing/nfe/${nfe.id}/xml`, {
        responseType: 'blob'
      })

      const blob = new Blob([response.data], { type: 'application/xml' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `NFe_${nfe.nfe_number}.xml`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.error("Erro ao baixar XML")
    }
  }

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderPagination = () => {
    if (lastPage <= 1) return null

    const pages = []
    const startPage = Math.max(1, currentPage - 2)
    const endPage = Math.min(lastPage, currentPage + 2)

    // First page
    if (startPage > 1) {
      pages.push(
        <Button
          key={1}
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(1)}
        >
          1
        </Button>
      )
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="px-2">
            ...
          </span>
        )
      }
    }

    // Middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Button>
      )
    }

    // Last page
    if (endPage < lastPage) {
      if (endPage < lastPage - 1) {
        pages.push(
          <span key="ellipsis2" className="px-2">
            ...
          </span>
        )
      }
      pages.push(
        <Button
          key={lastPage}
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(lastPage)}
        >
          {lastPage}
        </Button>
      )
    }

    return (
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {from} a {to} de {total} resultados
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center space-x-1">
            {pages}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === lastPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(lastPage)}
            disabled={currentPage === lastPage}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notas Fiscais Eletrônicas</h1>
          <p className="text-muted-foreground">
            Gerencie as NFes emitidas pelo sistema
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => {
              setShowCreateDialog(true)
              loadEligibleAppointments()
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Criar NFe
          </Button>
          {selectedNfesForSefaz.length > 0 && (
            <Button 
              onClick={handleSendMultipleToSefaz}
              disabled={sendingToSefaz}
              variant="secondary"
            >
              {sendingToSefaz ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Enviar {selectedNfesForSefaz.length} para SEFAZ
                </>
              )}
            </Button>
          )}
          <Button onClick={loadNFes} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de NFes</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as NFes emitidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, chave ou plano de saúde..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={selectedNfesForSefaz.length === nfes.filter(n => n.nfe_status === 'pending').length && nfes.filter(n => n.nfe_status === 'pending').length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNfesForSefaz(nfes.filter(n => n.nfe_status === 'pending').map(n => n.id))
                            } else {
                              setSelectedNfesForSefaz([])
                            }
                          }}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead>Plano de Saúde</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data de Emissão</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nfes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "Nenhuma NFe encontrada para a busca" : "Nenhuma NFe encontrada"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      nfes.map((nfe) => (
                        <TableRow key={nfe.id}>
                          <TableCell>
                            {nfe.nfe_status === 'pending' && (
                              <input
                                type="checkbox"
                                checked={selectedNfesForSefaz.includes(nfe.id)}
                                onChange={() => handleSelectNfeForSefaz(nfe.id)}
                                className="rounded"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{nfe.nfe_number}</div>
                              <div className="text-sm text-muted-foreground">
                                {nfe.nfe_key.substring(0, 20)}...
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {nfe.health_plan?.name || 'N/A'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {nfe.health_plan?.cnpj || 'N/A'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(nfe.total_amount)}
                          </TableCell>
                          <TableCell>{getStatusBadge(nfe.nfe_status)}</TableCell>
                          <TableCell>{formatDate(nfe.created_at)}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  
                                  <DropdownMenuItem onClick={() => handleViewDetails(nfe)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver Detalhes
                                  </DropdownMenuItem>
                                  
                                  <DropdownMenuItem onClick={() => handleDownloadXML(nfe)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Baixar XML
                                  </DropdownMenuItem>
                                  
                                  {nfe.nfe_status === 'pending' && (
                                    <DropdownMenuItem 
                                      onClick={() => handleSendToSefazFromMenu(nfe.id)}
                                      disabled={sendingToSefaz}
                                    >
                                      {sendingToSefaz ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <FileText className="mr-2 h-4 w-4" />
                                      )}
                                      {sendingToSefaz ? 'Enviando...' : 'Enviar para SEFAZ'}
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {(nfe.nfe_status === "issued" || nfe.nfe_status === "authorized") && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedNFe(nfe)
                                        setShowCancelDialog(true)
                                      }}>
                                        <X className="mr-2 h-4 w-4" />
                                        Cancelar NFe
                                      </DropdownMenuItem>
                                      
                                      <DropdownMenuItem onClick={() => handleFindSubstitutes(nfe)}>
                                        <AlertTriangle className="mr-2 h-4 w-4" />
                                        Substituir por outra NFe
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  
                                  {nfe.nfe_status === "cancelled" && (
                                    <DropdownMenuItem disabled>
                                      <X className="mr-2 h-4 w-4" />
                                      NFe Cancelada
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {renderPagination()}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Cancelamento */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar NFe</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar a NFe {selectedNFe?.nfe_number}?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo do Cancelamento</Label>
              <Input
                id="reason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Informe o motivo do cancelamento"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCancelNFe} disabled={cancelling}>
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Cancelamento por Substituição */}
      <Dialog open={showSubstitutionDialog} onOpenChange={setShowSubstitutionDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cancelamento por Substituição</DialogTitle>
            <DialogDescription>
              Cancelar NFe {selectedNFe?.nfe_number} por substituição por uma NFe duplicada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="substitute_key">Chave da NFe Substituta</Label>
              <Input
                id="substitute_key"
                value={substituteNFeKey}
                onChange={(e) => setSubstituteNFeKey(e.target.value)}
                placeholder="Digite a chave da NFe substituta"
              />
            </div>

            {substituteNfes.length > 0 && (
              <div className="space-y-2">
                <Label>NFes Substitutas Disponíveis</Label>
                <div className="border rounded-md p-4 space-y-2">
                  {substituteNfes.map((substitute) => (
                    <div
                      key={substitute.id}
                      className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50"
                      onClick={() => setSubstituteNFeKey(substitute.nfe_key)}
                    >
                      <div>
                        <div className="font-medium">{substitute.nfe_number}</div>
                        <div className="text-sm text-muted-foreground">
                          {substitute.nfe_key}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(substitute.total_amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(substitute.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubstitutionDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCancelBySubstitution} disabled={cancelling}>
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento por Substituição"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Criação de NFe */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Nova NFe</DialogTitle>
            <DialogDescription>
              Selecione um agendamento elegível para gerar uma nota fiscal eletrônica
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {loadingAppointments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Carregando agendamentos...</span>
              </div>
            ) : appointments.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum agendamento elegível encontrado para geração de NFe.
                  Verifique se existem agendamentos concluídos sem NFe associada.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <Label>Agendamentos Elegíveis</Label>
                <div className="border rounded-md max-h-96 overflow-y-auto">
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedAppointment?.id === appointment.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedAppointment(appointment)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <div>
                              <div className="font-medium">#{appointment.id}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(appointment.scheduled_date).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">{appointment.patient.name}</div>
                              <div className="text-sm text-muted-foreground">
                                CPF: {appointment.patient.cpf}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">{appointment.provider.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {appointment.provider.specialty}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">{appointment.procedure.description}</div>
                              <div className="text-sm text-muted-foreground">
                                Código: {appointment.procedure.code}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">{appointment.solicitation.health_plan.name}</div>
                              <div className="text-sm text-muted-foreground">
                                Plano de Saúde
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-lg">
                            {formatCurrency(appointment.amount)}
                          </div>
                          <Badge variant="secondary">{appointment.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateNFe} 
              disabled={!selectedAppointment || creatingNFe}
            >
              {creatingNFe ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando NFe...
                </>
              ) : (
                "Criar NFe"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Resultados SEFAZ */}
      <Dialog open={showSefazDialog} onOpenChange={setShowSefazDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Resultados do Envio para SEFAZ</DialogTitle>
            <DialogDescription>
              Resultado do processamento das NFes enviadas para SEFAZ
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {sefazResults.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nenhum resultado disponível
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {sefazResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-md ${
                      result.status === 'success' 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          NFe #{result.nfe_number}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {result.message}
                        </div>
                        {result.protocol && (
                          <div className="text-sm text-blue-600">
                            Protocolo: {result.protocol}
                          </div>
                        )}
                      </div>
                      <div>
                        {result.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowSefazDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes da NFe */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da NFe #{selectedNFeForDetails?.nfe_number}</DialogTitle>
            <DialogDescription>
              Informações detalhadas da nota fiscal eletrônica
            </DialogDescription>
          </DialogHeader>
          
          {selectedNFeForDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Número da NFe</Label>
                  <p className="text-sm text-muted-foreground">{selectedNFeForDetails.nfe_number}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedNFeForDetails.nfe_status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Chave da NFe</Label>
                  <p className="text-sm text-muted-foreground font-mono">{selectedNFeForDetails.nfe_key}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Valor Total</Label>
                  <p className="text-sm font-medium">{formatCurrency(selectedNFeForDetails.total_amount)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Plano de Saúde</Label>
                  <p className="text-sm text-muted-foreground">{selectedNFeForDetails.health_plan?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">CNPJ do Plano</Label>
                  <p className="text-sm text-muted-foreground">{selectedNFeForDetails.health_plan?.cnpj || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Data de Criação</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedNFeForDetails.created_at)}</p>
                </div>
                {selectedNFeForDetails.nfe_authorization_date && (
                  <div>
                    <Label className="text-sm font-medium">Data de Autorização</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedNFeForDetails.nfe_authorization_date)}</p>
                  </div>
                )}
                {selectedNFeForDetails.nfe_protocol && (
                  <div>
                    <Label className="text-sm font-medium">Protocolo</Label>
                    <p className="text-sm text-muted-foreground font-mono">{selectedNFeForDetails.nfe_protocol}</p>
                  </div>
                )}
                {selectedNFeForDetails.nfe_cancellation_date && (
                  <div>
                    <Label className="text-sm font-medium">Data de Cancelamento</Label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedNFeForDetails.nfe_cancellation_date)}</p>
                  </div>
                )}
                {selectedNFeForDetails.nfe_cancellation_reason && (
                  <div>
                    <Label className="text-sm font-medium">Motivo do Cancelamento</Label>
                    <p className="text-sm text-muted-foreground">{selectedNFeForDetails.nfe_cancellation_reason}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Fechar
            </Button>
            {selectedNFeForDetails && (
              <Button onClick={() => handleDownloadXML(selectedNFeForDetails)}>
                <Download className="mr-2 h-4 w-4" />
                Baixar XML
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 