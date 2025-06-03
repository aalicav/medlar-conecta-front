"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlusCircle, Search, UserPlus, Building, Users, X } from "lucide-react"
import { DataTable } from "@/components/data-table/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/utils/format-date"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConditionalRender } from "@/components/conditional-render"
import { getUsers } from "../admin/users/userService"
import { fetchResource } from "@/services/resource-service"

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

interface Professional {
  id: number
  name: string
  specialty?: string
  council_type?: string
  council_number?: string
  council_state?: string
  status: string
  created_at: string
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

  // Colunas para a tabela de profissionais
  const professionalColumns = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }: { row: { original: Professional } }) => {
        const professional = row.original
        return (
          <div>
            <div>{professional.name}</div>
            <div className="text-xs text-muted-foreground">
              {professional.specialty}
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "council_number",
      header: "Registro",
      cell: ({ row }: { row: { original: Professional } }) => {
        const professional = row.original
        return (
          <div>
            {professional.council_type}-{professional.council_number}/{professional.council_state}
          </div>
        )
      }
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: TableRow } }) => {
        const status = row.original.status
        
        switch (status) {
          case 'active':
            return <Badge variant="success">Ativo</Badge>
          case 'pending':
            return <Badge variant="warning">Pendente</Badge>
          case 'inactive':
            return <Badge variant="destructive">Inativo</Badge>
          default:
            return <Badge variant="outline">{status}</Badge>
        }
      }
    },
    {
      accessorKey: "created_at",
      header: "Data de Cadastro",
      cell: ({ row }: { row: { original: TableRow } }) => formatDate(row.original.created_at)
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: Professional } }) => {
        const professional = row.original
        return (
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/professionals/${professional.id}?type=professional`)}
          >
            Ver detalhes
          </Button>
        )
      }
    }
  ]

  // Colunas para a tabela de clínicas/estabelecimentos
  const clinicColumns = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }: { row: { original: Clinic } }) => {
        const clinic = row.original
        return (
          <div>
            <div>{clinic.name}</div>
            <div className="text-xs text-muted-foreground">
              {clinic.type || 'Estabelecimento'}
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: "cnpj",
      header: "CNPJ",
      cell: ({ row }: { row: { original: Clinic } }) => row.original.cnpj
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: { original: TableRow } }) => {
        const status = row.original.status
        
        switch (status) {
          case 'active':
            return <Badge variant="success">Ativo</Badge>
          case 'pending':
            return <Badge variant="warning">Pendente</Badge>
          case 'inactive':
            return <Badge variant="destructive">Inativo</Badge>
          default:
            return <Badge variant="outline">{status}</Badge>
        }
      }
    },
    {
      accessorKey: "city",
      header: "Cidade/UF",
      cell: ({ row }: { row: { original: Clinic } }) => `${row.original.city}/${row.original.state}`
    },
    {
      id: "actions",
      cell: ({ row }: { row: { original: Clinic } }) => {
        const clinic = row.original
        return (
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/professionals/${clinic.id}?type=clinic`)}
          >
            Ver detalhes
          </Button>
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
        <h1 className="text-3xl font-bold">Cadastros</h1>
        
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
          <CardTitle>Pesquisar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar por nome, registro, CNPJ..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
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
              <CardTitle>
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
              <CardTitle>
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