"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, deleteUser } from '../userService';
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
import { ArrowLeft, Edit, Loader2, Trash2, User } from 'lucide-react';
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

type PageProps = {
  params: {
    id: string;
  };
};

export default function UserDetailsPage({ params }: PageProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const userId = parseInt(params.id);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUser(userId);
        setUser(response.data);
      } catch (err) {
        setError('Não foi possível carregar os dados do usuário.');
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do usuário.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleDelete = async () => {
    try {
      await deleteUser(userId);
      toast({
        title: 'Sucesso',
        description: 'Usuário excluído com sucesso.',
      });
      router.push('/admin/users');
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o usuário.',
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

  if (error || !user) {
    return (
      <div className="container py-6">
        <div className="flex items-center space-x-2 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/admin/users')}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Usuário</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">{error || 'Usuário não encontrado'}</p>
            <Button 
              variant="outline" 
              onClick={() => router.push('/admin/users')}
              className="mt-4"
            >
              Voltar para a lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/admin/users')}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Detalhes do Usuário</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex justify-center">
              <div className="bg-primary/10 text-primary p-4 rounded-full">
                <User className="h-12 w-12" />
              </div>
            </div>
            <CardTitle className="text-center mt-4">{user.name}</CardTitle>
            <CardDescription className="text-center">{user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">ID</h3>
                <p>{user.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Data de Criação</h3>
                <p>{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Data de Atualização</h3>
                <p>{new Date(user.updated_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => router.push(`/admin/users/${userId}/edit`)}
              className="gap-1"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-1">
                  <Trash2 className="h-4 w-4" />
                  Excluir
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
            <CardTitle>Funções e Permissões</CardTitle>
            <CardDescription>
              Funções e permissões atribuídas a este usuário.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Funções (Roles)</h3>
              <div className="flex flex-wrap gap-2">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role: any) => (
                    <Badge key={role.id} variant="secondary">
                      {role.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">Nenhuma função atribuída</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Permissões Diretas</h3>
              <div className="flex flex-wrap gap-2">
                {user.permissions && user.permissions.length > 0 ? (
                  user.permissions.map((permission: any) => (
                    <Badge key={permission.id} variant="outline">
                      {permission.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">Nenhuma permissão direta atribuída</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Todas as Permissões</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Inclui permissões herdadas das funções do usuário
              </p>
              <div className="flex flex-wrap gap-2 border p-4 rounded-md max-h-[200px] overflow-y-auto">
                {user.allPermissions ? (
                  Object.keys(user.allPermissions).map((permission: string) => (
                    <Badge key={permission} variant="outline">
                      {permission}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground">Nenhuma permissão</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button 
              onClick={() => router.push(`/admin/users/${userId}/edit`)} 
              className="gap-1"
            >
              <Edit className="h-4 w-4" />
              Gerenciar Funções e Permissões
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
} 