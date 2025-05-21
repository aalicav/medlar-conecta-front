"use client";

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Search, Plus, Trash2, Edit, Eye, ShieldCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "../users/components/Pagination";
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
import { deleteRole, getRoles } from '../users/userService';

export default function RolesAdminPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();

  // Função para buscar roles com filtros
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const params = {
        search: search || undefined,
        page,
        per_page: perPage
      };
      
      const data = await getRoles();
      setRoles(data.data);
      setTotalItems(data.total || data.data.length);
    } catch (e) {
      setError('Erro ao carregar funções');
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de funções.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [page, perPage]);

  // Quando os filtros mudam, voltamos para a página 1
  const handleFilter = () => {
    setPage(1);
    fetchRoles();
  };

  // Lista de roles que não podem ser excluídas
  const restrictedRoles = ['super_admin', 'plan_admin', 'professional', 'clinic_admin'];

  const handleDelete = async (id: number, roleName: string) => {
    // Verificar se é uma role restrita
    if (restrictedRoles.includes(roleName)) {
      toast({
        title: "Operação não permitida",
        description: `A função "${roleName}" é uma função do sistema e não pode ser excluída.`,
        variant: "destructive"
      });
      return;
    }

    try {
      await deleteRole(id);
      toast({
        title: "Sucesso",
        description: "Função excluída com sucesso.",
      });
      fetchRoles();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a função.",
        variant: "destructive"
      });
    }
  };

  const totalPages = Math.ceil(totalItems / perPage);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Funções</h1>
          <p className="text-muted-foreground">Gerencie as funções (roles) do sistema</p>
        </div>
        <Button onClick={() => router.push('/admin/roles/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nova Função
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funções</CardTitle>
          <CardDescription>Lista de todas as funções disponíveis no sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome"
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                />
              </div>
            </div>
            <Button variant="outline" onClick={handleFilter}>Filtrar</Button>
          </div>

          {/* Tabela de funções */}
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
                      <TableHead>Guard</TableHead>
                      <TableHead>Permissões</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhuma função encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      roles.map((role: any) => (
                        <TableRow key={role.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-primary" />
                              {role.name}
                              {restrictedRoles.includes(role.name) && (
                                <Badge variant="secondary" className="text-xs">Sistema</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{role.guard_name}</TableCell>
                          <TableCell>
                            {role.permissions ? (
                              <Badge variant="outline">{role.permissions.length} permissões</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">Sem permissões</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end items-center gap-2">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" 
                                onClick={() => router.push(`/admin/roles/${role.id}`)}>
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Detalhes</span>
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                                onClick={() => router.push(`/admin/roles/${role.id}/edit`)}
                                disabled={restrictedRoles.includes(role.name)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    disabled={restrictedRoles.includes(role.name)}>
                                    <Trash2 className="h-4 w-4" />
                                    <span className="sr-only">Excluir</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir a função "{role.name}"? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(role.id, role.name)}
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