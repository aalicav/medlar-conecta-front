"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  PlusCircle, 
  Search, 
  FileText, 
  Filter, 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Download,
  FileSignature
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { getContracts } from "@/services/contracts"

export default function ContractsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [contracts, setContracts] = useState([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  })
  const [filters, setFilters] = useState({
    type: "",
    status: "",
    signed: "",
    search: ""
  })

  useEffect(() => {
    fetchContracts()
  }, [filters, pagination.currentPage])

  const fetchContracts = async () => {
    setIsLoading(true)
    try {
      const response = await getContracts(
        pagination.currentPage,
        filters.type,
        filters.status,
        filters.signed === "true" ? true : filters.signed === "false" ? false : undefined,
        filters.search
      )
      
      if (response.status === 'success') {
        setContracts(response.data.data)
        setPagination({
          currentPage: response.data.current_page,
          totalPages: response.data.last_page,
          totalItems: response.data.total
        })
      } else {
        toast({
          title: "Erro ao carregar contratos",
          description: response.message || "Não foi possível carregar a lista de contratos.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch contracts:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Ocorreu um erro ao tentar carregar os contratos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setFilters(prev => ({ ...prev, search: e.target.value }))
    }
  }

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }))
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  const handlePagination = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }))
  }

  const renderStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pendente', variant: 'outline' },
      active: { label: 'Ativo', variant: 'success' },
      expired: { label: 'Expirado', variant: 'destructive' },
      cancelled: { label: 'Cancelado', variant: 'destructive' }
    }
    
    const statusInfo = statusMap[status] || { label: status, variant: 'secondary' }
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    )
  }

  const getContractTypeName = (type) => {
    const typeMap = {
      health_plan: 'Plano de Saúde',
      clinic: 'Estabelecimento',
      professional: 'Profissional'
    }
    
    return typeMap[type] || type
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR').format(date)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground">
            Gerencie contratos com planos de saúde, clínicas e profissionais
          </p>
        </div>
        <Button onClick={() => router.push('/contracts/new')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtre os contratos por tipo, status ou termo de busca
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Input 
                placeholder="Buscar por número ou entidade..." 
                className="w-full"
                onKeyDown={handleSearch}
              />
            </div>
            <div>
              <Select 
                value={filters.type} 
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de Contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health_plan">Plano de Saúde</SelectItem>
                  <SelectItem value="clinic">Estabelecimento</SelectItem>
                  <SelectItem value="professional">Profissional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select 
                value={filters.status} 
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="expired">Expirado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select 
                value={filters.signed} 
                onValueChange={(value) => handleFilterChange('signed', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Assinatura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Assinados</SelectItem>
                  <SelectItem value="false">Não Assinados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contratos</CardTitle>
          <CardDescription>
            Total de {pagination.totalItems} contratos encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium">Nenhum contrato encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Não existem contratos que correspondam aos filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº do Contrato</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assinado</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">
                        {contract.contract_number}
                      </TableCell>
                      <TableCell>
                        {getContractTypeName(contract.type)}
                      </TableCell>
                      <TableCell>
                        {contract.contractable?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {renderStatusBadge(contract.status)}
                      </TableCell>
                      <TableCell>
                        {contract.is_signed ? (
                          <Badge variant="success" className="flex items-center gap-1 w-fit">
                            <Check className="h-3 w-3" />
                            Assinado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <X className="h-3 w-3" />
                            Não assinado
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="mr-1 h-3 w-3" />
                            Início: {formatDate(contract.start_date)}
                          </div>
                          {contract.end_date && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="mr-1 h-3 w-3" />
                              Fim: {formatDate(contract.end_date)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <span className="sr-only">Abrir menu</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <circle cx="4" cy="12" r="1" />
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="20" cy="12" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => router.push(`/contracts/${contract.id}`)}>
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => router.push(`/contracts/${contract.id}/download`)}>
                              <Download className="mr-2 h-4 w-4" />
                              Baixar PDF
                            </DropdownMenuItem>
                            {!contract.is_signed && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => router.push(`/contracts/${contract.id}/edit`)}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => router.push(`/contracts/${contract.id}/sign`)}>
                                  <FileSignature className="mr-2 h-4 w-4" />
                                  Assinar
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePagination(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Anterior
              </Button>
              <div className="text-sm">
                Página {pagination.currentPage} de {pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePagination(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 