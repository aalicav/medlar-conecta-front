"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getUsers, deleteUser, getRoles } from './userService';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Plus, Trash2, Edit, Eye, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/data-table/data-table";
import type { ColumnDef, SortingState } from "@tanstack/react-table";

// Define o tipo para os dados do usuário
interface User {
  id: number;
  name: string;
  email: string;
  roles: { id: number; name: string }[];
  [key: string]: any;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const router = useRouter();

  // Mapeamento de nomes técnicos para nomes amigáveis
  const roleDisplayNames: Record<string, string> = {
    'super_admin': 'Administrador Master',
    'admin': 'Administrador',
    'manager': 'Gerente',
    'editor': 'Editor',
    'user': 'Usuário Comum',
    'consultant': 'Consultor',
    'auditor': 'Auditor',
    'analyst': 'Analista',
    'supervisor': 'Supervisor',
    'coordinator': 'Coordenador',
    'support': 'Suporte',
    // Adicione mais mapeamentos conforme necessário
  };

  // Função para obter o nome de exibição de uma role
  const getRoleDisplayName = (roleName: string) => {
    return roleDisplayNames[roleName] || roleName;
  };

  // Função para buscar usuários com filtros
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        search: search || undefined,
        role: selectedRole || undefined,
        page,
        per_page: perPage
      };
      
      // Adicionar parâmetros de ordenação
      if (sorting.length > 0) {
        params.sort_by = sorting[0].id;
        params.sort_direction = sorting[0].desc ? 'desc' : 'asc';
      }
      
      const data = await getUsers(params);
      setUsers(data.data?.data || []);
      setTotalItems(data.total || data.meta?.total || data.data?.length || 0);
    } catch (e) {
      setError('Erro ao carregar usuários');
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Buscar roles disponíveis
  const fetchRoles = async () => {
    try {
      const data = await getRoles();
      
      // Garantir que roles seja sempre um array
      let rolesArray = [];
      if (Array.isArray(data?.data)) {
        rolesArray = data.data;
      } else if (Array.isArray(data)) {
        rolesArray = data;
      }
      
      setRoles(rolesArray);
    } catch (e) {
      console.error("Erro ao carregar roles:", e);
      setRoles([]); // Definir como array vazio em caso de erro
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [page, perPage, sorting]);

  // Quando os filtros mudam, voltamos para a página 1
  const handleFilter = () => {
    setPage(1);
    fetchUsers();
  };

  // Função para lidar com a alteração da role selecionada
  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    setPage(1);
    setTimeout(() => {
      fetchUsers();
    }, 0);
  };

  // Handler para alterações na paginação
  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPerPage(newPageSize);
  };

  // Handler para alterações na ordenação
  const handleSortingChange = (newSorting: SortingState) => {
    setSorting(newSorting);
  };

  // Handler para alterações no filtro da tabela
  const handleFilterChange = (columnId: string, value: string) => {
    if (columnId === 'name' || columnId === 'email') {
      setSearch(value);
      setPage(1);
      fetchUsers();
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      toast({
        title: "Sucesso",
        description: "Usuário excluído com sucesso.",
      });
      fetchUsers();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o usuário.",
        variant: "destructive"
      });
    }
  };

  const totalPages = Math.ceil(totalItems / perPage);

  // Definição das colunas da tabela
  const columns: ColumnDef<User>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Nome",
      cell: ({ row }) => (
        <div className="font-medium flex items-center gap-2">
          <UserRound className="h-4 w-4 text-muted-foreground" />
          {row.original.name}
        </div>
      ),
    },
    {
      id: "email",
      accessorKey: "email",
      header: "E-mail",
    },
    {
      id: "roles",
      header: "Funções",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.roles && row.original.roles.length > 0 ? (
            row.original.roles.map((role) => (
              <Badge key={role.id} variant="outline" className="mr-1">
                {getRoleDisplayName(role.name)}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">Nenhuma função</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <div className="flex justify-end items-center gap-2">
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0" 
            onClick={() => router.push(`/admin/users/${row.original.id}`)}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">Detalhes</span>
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0"
            onClick={() => router.push(`/admin/users/${row.original.id}/edit`)}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">Editar</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Excluir</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o usuário "{row.original.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleDelete(row.original.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ),
    },
  ];

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        <Button onClick={() => router.push('/admin/users/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Novo Usuário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Lista de todos os usuários cadastrados no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtro por role */}
          <div className="mb-6">
            <div className="w-full sm:w-[250px]">
              <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por função" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(roles) && roles.map((role: any) => (
                    <SelectItem key={role.id} value={role.name}>
                      {getRoleDisplayName(role.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DataTable Component */}
          <DataTable
            columns={columns}
            data={users}
            onPaginationChange={handlePaginationChange}
            onSortingChange={handleSortingChange}
            onFilterChange={handleFilterChange}
            currentPage={page}
            pageSize={perPage}
            pageCount={totalPages}
            totalItems={totalItems}
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
} 