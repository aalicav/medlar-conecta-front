"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { Badge } from "@/components/ui/badge"
import { fetchResource, type QueryParams } from "@/services/resource-service"
import { Plus, FileText, Edit, CheckCircle, XCircle } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { formatDateTime } from "@/lib/utils"

interface Appointment {
  id: number
  professional_id: number
  professional_name: string
  clinic_id: number
  clinic_name: string
  patient_id: number
  patient_name: string
  health_plan_id: number
  health_plan_name: string
  tuss_id: number
  tuss_name: string
  status: string
  scheduled_for: string
  created_at: string
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [data, setData] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  })
  const [sorting, setSorting] = useState<{ column: string; direction: "asc" | "desc" }>({
    column: "scheduled_for",
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

      const response = await fetchResource<Appointment>("appointments", params)

      setData(response.data)
      setPagination({
        ...pagination,
        pageCount: response.meta.last_page,
        total: response.meta.total,
      })
    } catch (error) {
      console.error("Error fetching appointments:", error)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="warning">Pendente</Badge>
      case "confirmed":
        return <Badge variant="success">Confirmado</Badge>
      case "completed":
        return <Badge variant="success">Concluído</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelado</Badge>
      case "missed":
        return <Badge variant="destructive">Não Compareceu</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const columns: ColumnDef<Appointment>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="font-medium">#{row.getValue("id")}</div>,
      enableSorting: true,
      enableFiltering: true,
    },
    {
      accessorKey: "patient_name",
      header: "Paciente",
      enableSorting: true,
      enableFiltering: true,
    },
    {
      accessorKey: "professional_name",
      header: "Profissional",
      enableSorting: true,
      enableFiltering: true,
    },
    {
      accessorKey: "clinic_name",
      header: "Clínica",
      enableSorting: true,
      enableFiltering: true,
    },
    {
      accessorKey: "tuss_name",
      header: "Procedimento",
      enableSorting: true,
      enableFiltering: true,
    },
    {
      accessorKey: "scheduled_for",
      header: "Data/Hora",
      cell: ({ row }) => formatDateTime(row.getValue("scheduled_for")),
      enableSorting: true,
      enableFiltering: true,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
      enableSorting: true,
      enableFiltering: true,
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => {
        const appointment = row.original
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/appointments/${appointment.id}`)}
            >
              <FileText className="h-4 w-4" />
              <span className="sr-only">Ver detalhes</span>
            </Button>
            {appointment.status === "pending" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push(`/appointments/${appointment.id}/edit`)}
                >
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Editar</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-success"
                  onClick={() => console.log("Confirm appointment:", appointment.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="sr-only">Confirmar</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => console.log("Cancel appointment:", appointment.id)}
                >
                  <XCircle className="h-4 w-4" />
                  <span className="sr-only">Cancelar</span>
                </Button>
              </>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie os agendamentos de procedimentos médicos</p>
        </div>
        <Button onClick={() => router.push("/appointments/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
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
