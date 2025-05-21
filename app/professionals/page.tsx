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

// Create a separate component for page content to use useSearchParams() inside Suspense
function ProfessionalsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'professionals'
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Estados para profissionais
  const [professionals, setProfessionals] = useState([])
  const [totalProfessionals, setTotalProfessionals] = useState(0)
  const [professionalsCurrentPage, setProfessionalsCurrentPage] = useState(1)
  const [professionalsTotalPages, setProfessionalsTotalPages] = useState(1)

  // Estados para estabelecimentos/clínicas
  const [clinics, setClinics] = useState([])
  const [totalClinics, setTotalClinics] = useState(0)
  const [clinicsCurrentPage, setClinicsCurrentPage] = useState(1)
  const [clinicsTotalPages, setClinicsTotalPages] = useState(1)

  useEffect(() => {
    // Para carregar dados de ambas as abas
    fetchProfessionals()
    fetchClinics()
  }, [professionalsCurrentPage, clinicsCurrentPage, searchTerm])

  // Função para buscar profissionais
  const fetchProfessionals = async () => {
    try {
      setLoading(true)
      const response = await fetchResource<Professional>('professionals', {
        page: professionalsCurrentPage,
        search: searchTerm
      })
      
      setProfessionals(response.data)
      setTotalProfessionals(response.meta.total)
      setProfessionalsTotalPages(response.meta.last_page)
    } catch (error) {
      console.error("Error fetching professionals:", error)
    } finally {
      setLoading(false)
    }
  }

  // Função para buscar estabelecimentos/clínicas
  const fetchClinics = async () => {
    try {
      setLoading(true)
      const response = await getUsers('clinics', {
        page: clinicsCurrentPage,
        limit: 10,
        search: searchTerm
      })
      
      setClinics(response.data)
      setTotalClinics(response.meta.total)
      setClinicsTotalPages(response.meta.last_page)
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
      cell: ({ row }) => {
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
      cell: ({ row }) => {
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
      cell: ({ row }) => {
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
      cell: ({ row }) => formatDate(row.original.created_at)
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const professional = row.original
        return (
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/professionals/${professional.id}`)}
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
      cell: ({ row }) => {
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
      cell: ({ row }) => row.original.cnpj
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
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
      cell: ({ row }) => `${row.original.city}/${row.original.state}`
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const clinic = row.original
        return (
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/clinics/${clinic.id}`)}
          >
            Ver detalhes
          </Button>
        )
      }
    }
  ]

  // Handler para mudança de aba
  const handleTabChange = (value) => {
    router.push(`/professionals?tab=${value}`)
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
              <CardTitle>Profissionais ({totalProfessionals})</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={professionalColumns}
                data={professionals}
                loading={loading}
                pagination={{
                  currentPage: professionalsCurrentPage,
                  totalPages: professionalsTotalPages,
                  onPageChange: setProfessionalsCurrentPage
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clinics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Estabelecimentos ({totalClinics})</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={clinicColumns}
                data={clinics}
                loading={loading}
                pagination={{
                  currentPage: clinicsCurrentPage,
                  totalPages: clinicsTotalPages,
                  onPageChange: setClinicsCurrentPage
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