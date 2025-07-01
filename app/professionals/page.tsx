"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, UserPlus, Building, Users, X, MoreHorizontal } from "lucide-react"
import { DataTable } from "@/components/data-table/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/utils/format-date"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConditionalRender } from "@/components/conditional-render"
import { getUsers } from "../admin/users/userService"
import { fetchResource } from "@/services/resource-service"
import { Professional } from '@/types/professional'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import React from "react"

// Update interfaces for Laravel pagination
interface SimplePaginationMeta {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

interface ApiResponse<T> {
  data: T[]
  meta: SimplePaginationMeta
}

interface Clinic {
  id: number
  name: string
  type?: string
  cnpj: string
  status: string
  city: string
  state: string
}

interface TableRow {
  id: number
  name: string
  [key: string]: any
}

// Add types for pagination state
interface PaginationState {
  pageIndex: number
  pageSize: number
}

interface TableState {
  pagination: PaginationState
}

// Create a separate component for page content to use useSearchParams() inside Suspense
function ProfessionalsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams?.get('tab') || 'professionals'
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Estados para profissionais
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [professionalsMeta, setProfessionalsMeta] = useState<SimplePaginationMeta | null>(null)

  // Estados para estabelecimentos/clínicas
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [clinicsMeta, setClinicsMeta] = useState<SimplePaginationMeta | null>(null)

  useEffect(() => {
    if (tab === 'professionals') {
      fetchProfessionals(professionalsMeta?.current_page || 1)
    } else {
      fetchClinics(clinicsMeta?.current_page || 1)
    }
  }, [tab, searchTerm])

  // Função para buscar profissionais
  const fetchProfessionals = async (page = 1, perPage = 10) => {
    try {
      setLoading(true)
      const response = await fetchResource<ApiResponse<Professional>>('professionals', {
        page,
        search: searchTerm,
        per_page: perPage
      })
      
      if (response?.data) {
        const professionals = Array.isArray(response.data) ? response.data : []
        setProfessionals(professionals)
      }
      
      if (response?.meta) {
        const meta = {
          current_page: response.meta.current_page,
          last_page: response.meta.last_page,
          per_page: response.meta.per_page,
          total: response.meta.total
        }
        setProfessionalsMeta(meta)
      }
    } catch (error) {
      console.error("Error fetching professionals:", error)
    } finally {
      setLoading(false)
    }
  }

  // Função para buscar estabelecimentos/clínicas
  const fetchClinics = async (page = 1, perPage = 10) => {
    try {
      setLoading(true)
      const response = await fetchResource<ApiResponse<Clinic>>('clinics', {
        page,
        search: searchTerm,
        per_page: perPage
      })
      
      if (response?.data) {
        const clinics = Array.isArray(response.data) ? response.data : []
        setClinics(clinics)
      }
      
      if (response?.meta) {
        const meta = {
          current_page: response.meta.current_page,
          last_page: response.meta.last_page,
          per_page: response.meta.per_page,
          total: response.meta.total
        }
        setClinicsMeta(meta)
      }
    } catch (error) {
      console.error("Error fetching clinics:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Ativo</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'inactive':
        return <Badge variant="destructive">Inativo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Função para aprovar documentação
  const handleApproveDocuments = async (professionalId: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/professionals/${professionalId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          approved: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          // Se houver erros de validação, mostra cada erro
          Object.entries(data.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) {
              messages.forEach(message => {
                toast.error(`${field}: ${message}`)
              })
            }
          })
        } else {
          toast.error(data.message || 'Erro ao aprovar documentação')
        }
        return
      }

      toast.success('Documentação aprovada com sucesso')
      // Recarregar a lista de profissionais
      fetchProfessionals(professionalsMeta?.current_page || 1)
    } catch (error) {
      console.error('Erro ao aprovar documentação:', error)
      toast.error('Erro ao aprovar documentação')
    }
  }

  // Colunas para a tabela de profissionais
  const professionalColumns = [
    {
      accessorKey: "name",
      header: "Profissional",
      cell: ({ row }: { row: { original: Professional } }) => {
        const professional = row.original
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {professional.avatar ? (
                <img
                  src={professional.avatar}
                  alt={professional.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {professional.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {professional.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {professional.email || (professional as any)?.user?.email || "Email não informado"}
              </p>
              {professional.phone && (
                <p className="text-xs text-gray-400 truncate">
                  {professional.phone}
                </p>
              )}
              {!professional.phone && professional.phones && professional.phones.length > 0 && (
                <p className="text-xs text-gray-400 truncate">
                  {professional.phones[0].formatted_number || professional.phones[0].number}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "document",
      header: "Documento",
      cell: ({ row }: { row: { original: Professional } }) => {
        const professional = row.original
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {professional.document}
            </div>
            <div className="text-xs text-gray-500">
              {professional.documentType === 'cpf' ? 'CPF' : 'CNPJ'}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: Professional } }) => {
        const status = row.original.status
        
        let badge, icon, description
        
        switch (status) {
          case 'active':
            badge = <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
            icon = "🟢"
            description = "Profissional ativo no sistema"
            break
          case 'inactive':
            badge = <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Inativo</Badge>
            icon = "🔴"
            description = "Profissional inativo"
            break
          default:
            badge = <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>
            icon = "🟡"
            description = "Aguardando aprovação"
        }
        
        return (
          <div className="flex items-center space-x-2">
            <span className="text-lg">{icon}</span>
            <div>
              {badge}
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "location",
      header: "Localização",
      cell: ({ row }: { row: { original: Professional } }) => {
        const professional = row.original
        if (!professional.city && !professional.state) {
          return <span className="text-gray-400 text-sm">Não informado</span>
        }
        return (
          <div className="space-y-1">
            {professional.city && (
              <div className="text-sm font-medium">{professional.city}</div>
            )}
            {professional.state && (
              <div className="text-xs text-gray-500">{professional.state}</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "Cadastro",
      cell: ({ row }: { row: { original: Professional } }) => {
        const date = new Date(row.original.created_at)
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {formatDate(date.toISOString())}
            </div>
            <div className="text-xs text-gray-500">
              {date.toLocaleDateString('pt-BR')}
            </div>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }: { row: { original: Professional } }) => (
        <div className="flex gap-2">
          <ConditionalRender requiredRoles={['super_admin', 'admin', 'director']}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => router.push(`/professionals/${row.original.id}/edit`)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <span>✏️</span>
                    <span>Editar</span>
                  </div>
                </DropdownMenuItem>
                
                {row.original.status === 'pending' && (
                  <>
                    <DropdownMenuItem
                      onClick={() => router.push(`/professionals/${row.original.id}/documents`)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <span>📄</span>
                        <span>Ver Documentação</span>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      onClick={() => handleApproveDocuments(row.original.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <span>✅</span>
                        <span>Aprovar Documentação</span>
                      </div>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem
                      onClick={() => router.push(`/professionals/${row.original.id}/contract`)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <span>📋</span>
                        <span>Gerenciar Contrato</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
                
                <DropdownMenuItem
                  onClick={() => router.push(`/professionals/${row.original.id}?type=${row.original.documentType === 'cpf' ? 'professional' : 'clinic'}`)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <span>👁️</span>
                    <span>Ver Detalhes</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </ConditionalRender>
        </div>
      ),
    }
  ]

  // Colunas para a tabela de clínicas/estabelecimentos
  const clinicColumns = [
    {
      accessorKey: "name",
      header: "Estabelecimento",
      cell: ({ row }: { row: { original: Clinic } }) => {
        const clinic = row.original
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                <Building className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {clinic.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {clinic.type || 'Estabelecimento de Saúde'}
              </p>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "cnpj",
      header: "CNPJ",
      cell: ({ row }: { row: { original: Clinic } }) => {
        const cnpj = row.original.cnpj
        // Formatar CNPJ se necessário
        const formattedCnpj = cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
        return (
          <div className="space-y-1">
            <div className="text-sm font-mono font-medium">
              {formattedCnpj}
            </div>
            <div className="text-xs text-gray-500">
              CNPJ
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: TableRow } }) => {
        const status = row.original.status
        
        let badge, icon, description
        
        switch (status) {
          case 'active':
            badge = <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Ativo</Badge>
            icon = "🟢"
            description = "Estabelecimento ativo"
            break
          case 'inactive':
            badge = <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100">Inativo</Badge>
            icon = "🔴"
            description = "Estabelecimento inativo"
            break
          default:
            badge = <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendente</Badge>
            icon = "🟡"
            description = "Aguardando aprovação"
        }
        
        return (
          <div className="flex items-center space-x-2">
            <span className="text-lg">{icon}</span>
            <div>
              {badge}
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "city",
      header: "Localização",
      cell: ({ row }: { row: { original: Clinic } }) => {
        const clinic = row.original
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {clinic.city}
            </div>
            <div className="text-xs text-gray-500">
              {clinic.state}
            </div>
          </div>
        )
      }
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }: { row: { original: Clinic } }) => {
        const clinic = row.original
        return (
          <div className="flex gap-2">
            <ConditionalRender requiredRoles={['super_admin', 'admin', 'director']}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => router.push(`/professionals/${clinic.id}?type=clinic`)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <span>👁️</span>
                      <span>Ver Detalhes</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push(`/professionals/${clinic.id}/edit?type=clinic`)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center space-x-2">
                      <span>✏️</span>
                      <span>Editar</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </ConditionalRender>
          </div>
        )
      }
    }
  ]

  // Handler para mudança de aba
  const handleTabChange = (value: string) => {
    router.push(`/professionals?tab=${value}`)
  }

  // Handler para mudança de página dos profissionais
  const handleProfessionalsPageChange = (page: number) => {
    fetchProfessionals(page)
  }

  // Handler para mudança de página das clínicas
  const handleClinicsPageChange = (page: number) => {
    fetchClinics(page)
  }

  // Adicionar handlers para mudança de tamanho da página
  const handleProfessionalsPageSizeChange = (newSize: number) => {
    fetchProfessionals(1, newSize)
  }

  const handleClinicsPageSizeChange = (newSize: number) => {
    fetchClinics(1, newSize)
  }

  // Limpar pesquisa
  const clearSearch = () => {
    setSearchTerm("")
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Cadastros</h1>
            <p className="text-gray-500">Gerencie profissionais e estabelecimentos</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <ConditionalRender requiredRoles={['super_admin', 'admin', 'director', 'operational', 'network_manager']}>
            <Button onClick={() => router.push("/professionals/new")} className="flex items-center gap-1">
              <UserPlus className="h-4 w-4" />
              Novo Profissional
            </Button>
          </ConditionalRender>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pesquisar Cadastros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar por nome, documento, email, CNPJ..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-gray-100"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="professionals" className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            Profissionais
          </TabsTrigger>
          <TabsTrigger value="clinics" className="flex items-center gap-1">
            <Building className="h-4 w-4" />
            Estabelecimentos
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="professionals" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Profissionais ({professionalsMeta?.total || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={professionalColumns}
                data={professionals}
                isLoading={loading}
                pageCount={tab === 'professionals' ? professionalsMeta?.last_page : clinicsMeta?.last_page}
                currentPage={tab === 'professionals' ? professionalsMeta?.current_page : clinicsMeta?.current_page}
                pageSize={tab === 'professionals' ? professionalsMeta?.per_page : clinicsMeta?.per_page}
                totalItems={tab === 'professionals' ? professionalsMeta?.total : clinicsMeta?.total}
                onPaginationChange={(page: number, size: number) => {
                  if (size !== professionalsMeta?.per_page) {
                    handleProfessionalsPageSizeChange(size)
                  } else {
                    handleProfessionalsPageChange(page + 1)
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clinics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Estabelecimentos ({clinicsMeta?.total || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={clinicColumns}
                data={clinics}
                isLoading={loading}
                pageCount={clinicsMeta?.last_page || 1}
               currentPage={clinicsMeta?.current_page}
                pageSize={clinicsMeta?.per_page || 10}
                totalItems={clinicsMeta?.total}
                onPaginationChange={(page: number, size: number) => {
                  if (size !== clinicsMeta?.per_page) {
                    handleClinicsPageSizeChange(size)
                  } else {
                    handleClinicsPageChange(page + 1)
                  }
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Main component with Suspense
export default function ProfessionalsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Carregando...</div>}>
      <ProfessionalsContent />
    </Suspense>
  )
} 