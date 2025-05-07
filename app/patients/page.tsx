"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { fetchResource, type QueryParams } from "@/services/resource-service"
import { Plus, FileText, Edit, Trash2, Phone, Mail } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"

interface Patient {
  id: number
  name: string
  email: string
  cpf: string
  birth_date: string
  gender: string
  health_plan_id: number | null
  health_card_number: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  created_at: string
  updated_at: string
  health_plan?: {
    id: number
    name: string
  }
  age?: number
}

export default function PatientsPage() {
  const router = useRouter()
  const [data, setData] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  })
  const [sorting, setSorting] = useState<{ column: string; direction: "asc" | "desc" }>({
    column: "created_at",
    direction: "desc",
  })
  const [filters, setFilters] = useState<Record<string, string>>({})

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const params: QueryParams = {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
        sort_by: sorting.column,
        sort_order: sorting.direction,
        filters,
      }

      const response = await fetchResource<Patient[]>("patients", params)

      setData(response.data)
      setPagination({
        ...pagination,
        pageCount: response.meta?.last_page || 0,
        total: response.meta?.total || 0,
      })
    } catch (error) {
      console.error("Error fetching patients:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.pageIndex, pagination.pageSize, sorting, filters])

  const handlePaginationChange = (page: number, pageSize: number) => {
    setPagination({
      ...pagination,
      pageIndex: page - 1,
      pageSize,
    })
  }

  const handleSortingChange = (column: string, direction: "asc" | "desc") => {
    setSorting({ column, direction })
  }

  const handleFilterChange = (columnId: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [columnId]: value,
    }))
    setPagination({
      ...pagination,
      pageIndex: 0,
    })
  }

  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
      enableSorting: true,
    },
    {
      accessorKey: "email",
      header: "E-mail",
      cell: ({ row }) => (
        <div className="flex items-center">
          <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
          <span>{row.getValue("email")}</span>
        </div>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "gender",
      header: "Gênero",
      cell: ({ row }) => {
        const gender = row.getValue("gender") as string
        return (
          <div>
            {gender === "male" ? "Masculino" : gender === "female" ? "Feminino" : "Outro"}
          </div>
        )
      },
      enableSorting: true,
    },
    {
      accessorKey: "age",
      header: "Idade",
      cell: ({ row }) => <div>{row.original.age || "N/A"}</div>,
      enableSorting: false,
    },
    {
      id: "health_plan",
      header: "Plano de Saúde",
      cell: ({ row }) => {
        const healthPlan = row.original.health_plan
        return (
          <div>{healthPlan ? healthPlan.name : "Sem plano"}</div>
        )
      },
      enableSorting: false,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const patient = row.original
        return (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/patients/${patient.id}`)}>
              <FileText className="h-4 w-4" />
              <span className="sr-only">Ver detalhes</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/patients/${patient.id}/edit`)}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => console.log("Delete patient:", patient.id)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Excluir</span>
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-muted-foreground">Gerencie os pacientes cadastrados no sistema</p>
        </div>
        <Button onClick={() => router.push("/patients/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Paciente
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={data}
        onPaginationChange={handlePaginationChange}
        onSortingChange={(sorting) => {
          if (sorting.length > 0) {
            handleSortingChange(sorting[0].id, sorting[0].desc ? "desc" : "asc")
          }
        }}
        onFilterChange={handleFilterChange}
        pageCount={pagination.pageCount}
        currentPage={pagination.pageIndex + 1}
        pageSize={pagination.pageSize}
        totalItems={pagination.total}
        isLoading={isLoading}
      />
    </div>
  )
} 