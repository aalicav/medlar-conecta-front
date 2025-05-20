"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRole, deleteRole } from '../roleService';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Edit, Loader2, Trash2, ShieldCheck, Users } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type PageProps = {
  params: {
    id: string;
  };
};

export default function RoleDetailsPage({ params }: PageProps) {
  const [role, setRole] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const roleId = parseInt(params.id);
  
  // Lista de roles que não podem ser excluídas
  const restrictedRoles = ['super_admin', 'plan_admin', 'professional', 'clinic_admin'];

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const response = await getRole(roleId);
        setRole(response.data);
      } catch (err) {
        setError('Não foi possível carregar os dados da função.');
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados da função.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (roleId) {
      fetchRole();
    }
  }, [roleId]);

  const handleDelete = async () => {
    // Verificar se é uma role restrita
    if (role && restrictedRoles.includes(role.name)) {
      toast({
        title: "Operação não permitida",
        description: `A função "${role.name}" é uma função do sistema e não pode ser excluída.`,
        variant: "destructive"
      });
      return;
    }

    try {
      await deleteRole(roleId);
      toast({
        title: 'Sucesso',
        description: 'Função excluída com sucesso.',
      });
      router.push('/admin/roles');
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a função.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="container py-6 flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="container py-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/admin/roles')}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Detalhes da Função</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">{error || 'Função não encontrada'}</p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin/roles')}
              className="mt-4"
            >
              Voltar para a lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isRestrictedRole = restrictedRoles.includes(role.name);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/admin/roles')}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Detalhes da Função</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-center">
              <div className="bg-primary/10 text-primary p-4 rounded-full">
                <ShieldCheck className="h-12 w-12" />
              </div>
            </div>
            <CardTitle className="text-center mt-4 flex items-center justify-center gap-2">
              {role.name}
              {isRestrictedRole && (
                <Badge variant="secondary">Sistema</Badge>
              )}
            </CardTitle>
            <CardDescription className="text-center">{role.guard_name || 'api'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">ID</h3>
                <p>{role.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Data de Criação</h3>
                <p>{role.created_at ? new Date(role.created_at).toLocaleDateString('pt-BR') : 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Data de Atualização</h3>
                <p>{role.updated_at ? new Date(role.updated_at).toLocaleDateString('pt-BR') : 'N/A'}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Permissões</h3>
                <p className="font-bold">{role.permissions ? role.permissions.length : 0} permissões atribuídas</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Usuários</h3>
                <p className="font-bold">{role.users_count || 0} usuários com esta função</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => router.push(`/admin/roles/${roleId}/edit`)}
              className="gap-1"
              disabled={isRestrictedRole}
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="gap-1"
                  disabled={isRestrictedRole}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
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
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Permissões</CardTitle>
            <CardDescription>
              Permissões atribuídas a esta função.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
              {role.permissions && role.permissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {role.permissions.map((permission: any) => (
                    <Badge key={permission.id} variant="outline" className="p-2 justify-start">
                      {permission.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma permissão atribuída a esta função
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button 
              onClick={() => router.push(`/admin/roles/${roleId}/edit`)} 
              className="gap-1"
              disabled={isRestrictedRole}
            >
              <Edit className="h-4 w-4" />
              Gerenciar Permissões
            </Button>
          </CardFooter>
        </Card>

        {/* Card para mostrar usuários que têm esta função */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Usuários com esta função
              </CardTitle>
              <CardDescription>
                Usuários que possuem esta função atribuída.
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push(`/admin/roles/${roleId}/users`)}
            >
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {role.users && role.users.length > 0 ? (
                  role.users.slice(0, 5).map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                        >
                          Ver detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4 text-muted-foreground">
                      Nenhum usuário com esta função
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 