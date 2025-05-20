"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { getUsers, deleteUser, getRoles } from './userService';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "./components/Pagination";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Search, Plus, Trash2, Edit, Eye, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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

export default function UsersAdminPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();

  // Função para buscar usuários com filtros
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        role: selectedRole || undefined,
        page,
        per_page: perPage
      };
      
      const data = await getUsers(params);
      setUsers(data.data);
      setTotalItems(data.total || data.data.length);
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
      setRoles(data.data || []);
    } catch (e) {
      console.error("Erro ao carregar roles:", e);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [page, perPage]);

  // Quando os filtros mudam, voltamos para a página 1
  const handleFilter = () => {
    setPage(1);
    fetchUsers();
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
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email"
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                />
              </div>
            </div>
            <div className="w-full sm:w-auto min-w-[200px]">
              <Select value={selectedRole} onValueChange={(value) => {
                setSelectedRole(value);
                setPage(1);
                fetchUsers();
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Função / Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as funções</SelectItem>
                  {roles.map((role: any) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleFilter}>Filtrar</Button>
          </div>

          {/* Tabela de usuários */}
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center py-8 text-destructive gap-2">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Funções</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.roles?.map((role: any) => (
                                <Badge key={role.id} variant="outline" className="mr-1">
                                  {role.name}
                                </Badge>
                              ))}
                              {(!user.roles || user.roles.length === 0) && (
                                <span className="text-muted-foreground text-sm">Nenhuma função</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" 
                                      onClick={() => router.push(`/admin/users/${user.id}`)}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Detalhes</span>
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                                      onClick={() => router.push(`/admin/users/${user.id}/edit`)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Excluir</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o usuário "{user.name}"? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(user.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex justify-end mt-4">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 