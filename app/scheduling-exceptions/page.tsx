"use client"

import { useState, useEffect } from "react"
import { getSchedulingExceptions } from "@/services/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "@/components/data-table/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EyeIcon } from "lucide-react"
import { formatDate } from "@/app/utils/format"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DatePicker } from "@/components/ui/date-picker"
import { parseISO } from "date-fns"

// Define o tipo para uma exceção de agendamento
interface SchedulingException {
  id: number
  solicitation_id: number
  provider_name: string
  provider_price: number
  recommended_provider_price: number | null
  justification: string
  requested_by: number
  requester_name: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  approved_at?: string
  rejected_at?: string
}

export default function SchedulingExceptionsPage() {
  const router = useRouter()
  const [exceptions, setExceptions] = useState<SchedulingException[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [dateFilter, setDateFilter] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  
  const fetchExceptions = async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
      }
      
      if (statusFilter) {
        params.status = statusFilter
      }
      
      if (dateFilter) {
        params.date = formatDate(dateFilter, "yyyy-MM-dd")
      }
      
      if (searchTerm) {
        params.search = searchTerm
      }
      
      const response = await getSchedulingExceptions(params)
      
      if (response?.data?.data) {
        setExceptions(response.data.data)
      }
    } catch (error) {
      console.error("Error fetching scheduling exceptions:", error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchExceptions()
  }, [pagination.pageIndex, pagination.pageSize, statusFilter, dateFilter, searchTerm])
  
  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success'
      case 'rejected':
        return 'destructive'
      default:
        return 'default'
    }
  }
  
  const columns: ColumnDef<SchedulingException>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <span>#{row.getValue("id")}</span>,
    },
    {
      accessorKey: "solicitation_id",
      header: "Solicitação",
      cell: ({ row }) => <span>#{row.getValue("solicitation_id")}</span>,
    },
    {
      accessorKey: "provider_name",
      header: "Prestador",
    },
    {
      accessorKey: "provider_price",
      header: "Valor",
      cell: ({ row }) => <span>R$ {Number(row.getValue("provider_price")).toFixed(2)}</span>,
    },
    {
      accessorKey: "requester_name",
      header: "Solicitado por",
    },
    {
      accessorKey: "created_at",
      header: "Data",
      cell: ({ row }) => <span>{formatDate(parseISO(row.getValue("created_at")), "dd/MM/yyyy HH:mm")}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={statusBadgeVariant(status)}>
            {status === 'pending' ? 'Pendente' : status === 'approved' ? 'Aprovada' : 'Rejeitada'}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const exception = row.original
        
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/scheduling-exceptions/${exception.id}`)}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
  ]
  
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Exceções de Agendamento</CardTitle>
          <CardDescription>
            Gerencie solicitações de exceção para agendamentos com prestadores de maior valor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="approved">Aprovadas</SelectItem>
                  <SelectItem value="rejected">Rejeitadas</SelectItem>
                  
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <DatePicker
                date={dateFilter}
                setDate={(date) => setDateFilter(date)}
                placeholder="Filtrar por data"
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por prestador ou solicitante"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter("pending")
                  setDateFilter(null)
                  setSearchTerm("")
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
          
          <DataTable
            columns={columns}
            data={exceptions}
            isLoading={loading}
            currentPage={pagination.pageIndex + 1}
            pageSize={pagination.pageSize}
            totalItems={exceptions.length}
            pageCount={Math.ceil(exceptions.length / pagination.pageSize)}
            onPaginationChange={(page, pageSize) => {
              setPagination({
                pageIndex: page - 1,
                pageSize,
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
} 