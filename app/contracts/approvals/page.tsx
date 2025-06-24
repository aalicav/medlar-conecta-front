"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getContractsForApproval } from "@/services/contract-approvals";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EyeIcon, FilterIcon } from "lucide-react";
import { formatDate } from "@/app/utils/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/app/hooks/auth";

interface ContractApproval {
  id: number;
  contract_number: string;
  status: string;
  type: string;
  contractable_name: string;
  contractable_type: string;
  created_at: string;
  submitted_at: string;
}

export default function ContractApprovalsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [contracts, setContracts] = useState<ContractApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  
  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page: pagination.pageIndex + 1,
        per_page: pagination.pageSize,
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      if (typeFilter) {
        params.type = typeFilter;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await getContractsForApproval(params);
      
      if (response?.data?.data) {
        setContracts(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching contract approvals:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchContracts();
  }, [pagination.pageIndex, pagination.pageSize, statusFilter, typeFilter, searchTerm]);
  
  // Get user-appropriate status filter options
  const getStatusFilterOptions = () => {
    if (user?.role === 'legal') {
      return [
        { value: 'pending_approval', label: 'Aguardando Análise Jurídica' }
      ];
    } else if (user?.role === 'commercial_manager') {
      return [
        { value: 'pending_approval', label: 'Novos Contratos' },
        { value: 'legal_review', label: 'Aprovados pelo Jurídico' }
      ];
    } else if (user?.role === 'director') {
      return [
        { value: 'commercial_review', label: 'Aguardando Aprovação Final' }
      ];
    } else {
      // Admin or other roles can see all
      return [
        { value: 'pending_approval', label: 'Aguardando Análise Jurídica' },
        { value: 'legal_review', label: 'Aprovados pelo Jurídico' },
        { value: 'commercial_review', label: 'Aguardando Aprovação Final' }
      ];
    }
  };
  
  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'commercial_review':
        return 'success';
      case 'pending_approval':
        return 'default';
      case 'legal_review':
        return 'outline';
      default:
        return 'default';
    }
  };
  
  const statusLabels: Record<string, string> = {
    'pending_approval': 'Aguardando Análise Jurídica',
    'legal_review': 'Aprovado pelo Jurídico',
    'commercial_review': 'Aguardando Aprovação Final',
    'approved': 'Aprovado',
    'draft': 'Rascunho'
  };
  
  const columns: ColumnDef<ContractApproval>[] = [
    {
      accessorKey: "contract_number",
      header: "Contrato",
    },
    {
      accessorKey: "contractable_name",
      header: "Entidade",
    },
    {
      accessorKey: "type",
      header: "Tipo",
      cell: ({ row }) => {
        const type = row.getValue("type") as string;
        return (
          <span className="capitalize">
            {type === 'health_plan' 
              ? 'Operadora' 
              : type === 'clinic' 
                ? 'Estabelecimento' 
                : type === 'professional' 
                  ? 'Profissional' 
                  : type}
          </span>
        );
      },
    },
    {
      accessorKey: "submitted_at",
      header: "Data de Submissão",
      cell: ({ row }) => {
        const date = row.getValue("submitted_at") as string;
        return date ? <span>{formatDate(date, "dd/MM/yyyy")}</span> : "-";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant={statusBadgeVariant(status)}>
            {statusLabels[status] || status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const contract = row.original;
        
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/contracts/approvals/${contract.id}`)}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];
  
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Aprovação de Contratos</CardTitle>
          <CardDescription>
            Gerencie contratos que necessitam de aprovação no fluxo de trabalho.
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
                  
                  {getStatusFilterOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Select
                value={typeFilter}
                onValueChange={setTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  
                  <SelectItem value="health_plan">Operadora</SelectItem>
                  <SelectItem value="clinic">Estabelecimento</SelectItem>
                  <SelectItem value="professional">Profissional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar por número do contrato"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setStatusFilter("");
                  setTypeFilter("");
                  setSearchTerm("");
                }}
              >
                <FilterIcon className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
          
          <DataTable
            columns={columns}
            data={contracts}
            isLoading={loading}
            currentPage={pagination.pageIndex + 1}
            pageSize={pagination.pageSize}
            totalItems={contracts.length}
            pageCount={Math.ceil(contracts.length / pagination.pageSize)}
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
  );
} 