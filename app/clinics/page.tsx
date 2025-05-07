"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Clock,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import api from "@/services/api-client"
import { applyCNPJMask } from "@/utils/masks"

// Tipos de status
const STATUS_BADGES = {
  pending: { label: "Pendente", variant: "warning", icon: Clock },
  approved: { label: "Aprovada", variant: "success", icon: Check },
  rejected: { label: "Rejeitada", variant: "destructive", icon: X },
}

// Interface para Clínica
interface Clinic {
  id: number
  name: string
  cnpj: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  city: string
  state: string
}

export default function ClinicsPage() {
  const router = useRouter()
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  
  // Função para buscar clínicas
  const fetchClinics = async (search = "", status: string | null = null) => {
    try {
      setLoading(true)
      
      let url = "/clinics"
      const params = new URLSearchParams()
      
      if (search) {
        params.append("search", search)
      }
      
      if (status) {
        params.append("status", status)
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await api.get(url)
      setClinics(response.data.data)
    } catch (error) {
      console.error("Erro ao buscar clínicas:", error)
      toast({
        title: "Erro ao carregar clínicas",
        description: "Não foi possível carregar a lista de clínicas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Buscar clínicas ao carregar a página
  useEffect(() => {
    fetchClinics(searchTerm, statusFilter)
  }, [searchTerm, statusFilter])
  
  // Função para filtrar por status
  const handleStatusFilter = (status: string | null) => {
    setStatusFilter(status)
  }
  
  // Função para aprovar clínica
  const handleApproveClinic = async (id: number) => {
    try {
      await api.put(`/clinics/${id}/approve`)
      
      toast({
        title: "Clínica aprovada",
        description: "A clínica foi aprovada com sucesso",
      })
      
      // Recarregar lista de clínicas
      fetchClinics(searchTerm, statusFilter)
    } catch (error) {
      console.error("Erro ao aprovar clínica:", error)
      toast({
        title: "Erro ao aprovar clínica",
        description: "Não foi possível aprovar a clínica",
        variant: "destructive",
      })
    }
  }
  
  // Função para rejeitar clínica
  const handleRejectClinic = async (id: number) => {
    try {
      await api.put(`/clinics/${id}/reject`)
      
      toast({
        title: "Clínica rejeitada",
        description: "A clínica foi rejeitada com sucesso",
      })
      
      // Recarregar lista de clínicas
      fetchClinics(searchTerm, statusFilter)
    } catch (error) {
      console.error("Erro ao rejeitar clínica:", error)
      toast({
        title: "Erro ao rejeitar clínica",
        description: "Não foi possível rejeitar a clínica",
        variant: "destructive",
      })
    }
  }
  
  // Renderizar skeleton enquanto carrega
  if (loading && clinics.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Clínicas</h1>
          <Button onClick={() => router.push("/clinics/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Clínica
          </Button>
        </div>
        
        <Card>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array(5).fill(0).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-9 w-9" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Clínicas</h1>
        <Button onClick={() => router.push("/clinics/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Clínica
        </Button>
      </div>
      
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ ou cidade..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={statusFilter === null ? "default" : "outline"}
                onClick={() => handleStatusFilter(null)}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                onClick={() => handleStatusFilter("pending")}
              >
                Pendentes
              </Button>
              <Button
                variant={statusFilter === "approved" ? "default" : "outline"}
                onClick={() => handleStatusFilter("approved")}
              >
                Aprovadas
              </Button>
              <Button
                variant={statusFilter === "rejected" ? "default" : "outline"}
                onClick={() => handleStatusFilter("rejected")}
              >
                Rejeitadas
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : clinics.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Nenhuma clínica encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinics.map((clinic) => {
                  const status = STATUS_BADGES[clinic.status]
                  const StatusIcon = status.icon
                  
                  return (
                    <TableRow key={clinic.id}>
                      <TableCell className="font-medium">{clinic.name}</TableCell>
                      <TableCell>{applyCNPJMask(clinic.cnpj)}</TableCell>
                      <TableCell>{clinic.city}, {clinic.state}</TableCell>
                      <TableCell>
                        <Badge variant={status.variant as any} className="flex w-fit items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(clinic.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <span className="sr-only">Abrir menu</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="h-5 w-5"
                              >
                                <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/clinics/${clinic.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/clinics/${clinic.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            
                            {clinic.status === "pending" && (
                              <>
                                <DropdownMenuItem onClick={() => handleApproveClinic(clinic.id)}>
                                  <Check className="mr-2 h-4 w-4 text-green-600" />
                                  Aprovar
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRejectClinic(clinic.id)}>
                                  <X className="mr-2 h-4 w-4 text-red-600" />
                                  Rejeitar
                                </DropdownMenuItem>
                              </>
                            )}
                            
                            {clinic.status === "rejected" && (
                              <DropdownMenuItem onClick={() => handleApproveClinic(clinic.id)}>
                                <Check className="mr-2 h-4 w-4 text-green-600" />
                                Aprovar
                              </DropdownMenuItem>
                            )}
                            
                            {clinic.status === "approved" && (
                              <DropdownMenuItem onClick={() => handleRejectClinic(clinic.id)}>
                                <X className="mr-2 h-4 w-4 text-red-600" />
                                Rejeitar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  )
} 