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
import { Loader2, Search, Plus, Edit, Trash2, Eye, MoreHorizontal, Stethoscope, DollarSign, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"

interface MedicalSpecialty {
  id: number
  name: string
  tuss_code: string
  tuss_description: string
  active: boolean
  created_at: string
  updated_at: string
}

interface SpecialtyStats {
  total: number
  active: number
  recent_additions: number
}

export default function MedicalSpecialtiesPage() {
  const [specialties, setSpecialties] = useState<MedicalSpecialty[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState<SpecialtyStats | null>(null)
  
  // Estados para CRUD
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedSpecialty, setSelectedSpecialty] = useState<MedicalSpecialty | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    active: true
  })
  const [submitting, setSubmitting] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadSpecialties()
    loadStats()
  }, [currentPage, searchTerm])

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        loadSpecialties()
      } else {
        setCurrentPage(1) // Reset to first page when searching
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Reload when perPage changes
  useEffect(() => {
    setCurrentPage(1) // Reset to first page when changing perPage
    loadSpecialties()
  }, [perPage])

  const loadSpecialties = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
      })

      // Add search parameter if not empty
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim())
      }

      const response = await api.get(`/medical-specialties?${params}`)

      if (response.data?.success) {
        const data = response.data.data
        setSpecialties(data.data || [])
        setCurrentPage(data.current_page)
        setLastPage(data.last_page)
        setPerPage(data.per_page)
        setTotal(data.total)
      }
    } catch (error) {
      toast.error("Erro ao carregar especialidades médicas")
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await api.get('/medical-specialties/statistics')
      if (response.data?.success) {
        setStats(response.data.data)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const handleCreate = async () => {
    try {
      setSubmitting(true)
      const response = await api.post('/medical-specialties', formData)
      
      if (response.data?.success) {
        toast.success("Especialidade médica criada com sucesso!")
        setShowCreateDialog(false)
        resetForm()
        await loadSpecialties()
        await loadStats()
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erro ao criar especialidade médica"
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedSpecialty) return

    try {
      setSubmitting(true)
      const response = await api.put(`/medical-specialties/${selectedSpecialty.id}`, formData)
      
      if (response.data?.success) {
        toast.success("Especialidade médica atualizada com sucesso!")
        setShowEditDialog(false)
        resetForm()
        await loadSpecialties()
        await loadStats()
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erro ao atualizar especialidade médica"
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedSpecialty) return

    try {
      setSubmitting(true)
      const response = await api.delete(`/medical-specialties/${selectedSpecialty.id}`)
      
      if (response.data?.success) {
        toast.success("Especialidade médica excluída com sucesso!")
        setShowDeleteDialog(false)
        await loadSpecialties()
        await loadStats()
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erro ao excluir especialidade médica"
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (specialty: MedicalSpecialty) => {
    try {
      const response = await api.patch(`/medical-specialties/${specialty.id}/toggle-active`)
      
      if (response.data?.success) {
        toast.success(response.data.message)
        await loadSpecialties()
        await loadStats()
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Erro ao alterar status"
      toast.error(errorMessage)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      active: true
    })
    setSelectedSpecialty(null)
  }

  const openEditDialog = (specialty: MedicalSpecialty) => {
    setSelectedSpecialty(specialty)
    setFormData({
      name: specialty.name,
      active: specialty.active
    })
    setShowEditDialog(true)
  }

  const openDeleteDialog = (specialty: MedicalSpecialty) => {
    setSelectedSpecialty(specialty)
    setShowDeleteDialog(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Especialidades Médicas</h1>
          <p className="text-muted-foreground">
            Gerencie as especialidades médicas do sistema
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Especialidade
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ativas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recent_additions}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Especialidades</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as especialidades médicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, código TUSS ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="per-page" className="text-sm">Itens por página:</Label>
              <Select value={perPage.toString()} onValueChange={(value) => setPerPage(parseInt(value))}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
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
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {specialties.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "Nenhuma especialidade encontrada para a busca" : "Nenhuma especialidade encontrada"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      specialties.map((specialty) => (
                        <TableRow key={specialty.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{specialty.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {specialty.tuss_description}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={specialty.active ? "default" : "secondary"}>
                              {specialty.active ? "Ativa" : "Inativa"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(specialty.created_at)}</TableCell>
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
                                
                                <DropdownMenuItem onClick={() => openEditDialog(specialty)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                
                                <DropdownMenuItem onClick={() => handleToggleActive(specialty)}>
                                  {specialty.active ? (
                                    <>
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Desativar
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Ativar
                                    </>
                                  )}
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(specialty)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {lastPage > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * perPage) + 1} a {Math.min(currentPage * perPage, total)} de {total} resultados
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                        const page = Math.max(1, Math.min(lastPage - 4, currentPage - 2)) + i
                        return (
                          <Button
                            key={page}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8"
                          >
                            {page}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === lastPage}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Especialidade Médica</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova especialidade médica
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da especialidade"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="active">Ativa</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Especialidade"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Especialidade Médica</DialogTitle>
            <DialogDescription>
              Atualize os dados da especialidade médica
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Nome</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da especialidade"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="edit_active">Ativa</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar Especialidade"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a especialidade médica "{selectedSpecialty?.name}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              A exclusão de uma especialidade médica pode afetar os preços e negociações associados.
            </AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={submitting} variant="destructive">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Confirmar Exclusão"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 