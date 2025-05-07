'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
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
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/app/services/api-client';

// Tipos para os dados do usuário
interface UserRole {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  entity_type?: string;
  entity_id?: number;
  is_active: boolean;
  profile_photo?: string;
  profile_photo_url?: string;
  roles: string[];
  created_at?: string;
  updated_at?: string;
}

interface PageProps {
  params: {
    id: string;
  };
}

export default function UserDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = params;
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allRoles, setAllRoles] = useState<UserRole[]>([]);
  const [showAssignRole, setShowAssignRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/users/${id}`);
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        toast({
          title: 'Erro',
          description: 'Falha ao buscar dados do usuário',
          variant: 'destructive',
        });
        router.push('/dashboard/users');
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao buscar dados do usuário',
        variant: 'destructive',
      });
      router.push('/dashboard/users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/api/users/roles');
      if (response.data.success) {
        setAllRoles(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar papéis:', error);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchRoles();
  }, [id]);

  const handleToggleStatus = async () => {
    try {
      const response = await api.patch(`/api/users/${id}/toggle-status`);
      if (response.data.success) {
        toast({
          title: 'Sucesso',
          description: response.data.message,
        });
        fetchUser();
      } else {
        toast({
          title: 'Erro',
          description: response.data.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao alterar status do usuário',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await api.delete(`/api/users/${id}`);
      if (response.data.success) {
        toast({
          title: 'Sucesso',
          description: 'Usuário excluído com sucesso',
        });
        router.push('/dashboard/users');
      } else {
        toast({
          title: 'Erro',
          description: response.data.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir usuário',
        variant: 'destructive',
      });
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRole) return;

    try {
      const response = await api.post(`/api/users/${id}/roles`, {
        role: selectedRole
      });
      
      if (response.data.success) {
        toast({
          title: 'Sucesso',
          description: 'Papel atribuído com sucesso',
        });
        setShowAssignRole(false);
        setSelectedRole('');
        fetchUser();
      } else {
        toast({
          title: 'Erro',
          description: response.data.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao atribuir papel:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atribuir papel ao usuário',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveRole = async (role: string) => {
    try {
      const response = await api.delete(`/api/users/${id}/roles`, {
        data: { role }
      });
      
      if (response.data.success) {
        toast({
          title: 'Sucesso',
          description: 'Papel removido com sucesso',
        });
        fetchUser();
      } else {
        toast({
          title: 'Erro',
          description: response.data.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Erro ao remover papel:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover papel do usuário',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[400px]">
        <div className="text-center">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p>Usuário não encontrado.</p>
            <Button 
              className="mt-4" 
              onClick={() => router.push('/dashboard/users')}
            >
              Voltar para a lista
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableRoles = allRoles.filter(
    role => !user.roles.includes(role.name)
  );

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Detalhes do Usuário</CardTitle>
            <CardDescription>
              Visualize e gerencie as informações do usuário
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/users')}
            >
              Voltar
            </Button>
            <Button onClick={() => router.push(`/dashboard/users/${id}/edit`)}>
              Editar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Ações</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleToggleStatus}>
                  {user.is_active ? 'Desativar Usuário' : 'Ativar Usuário'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowAssignRole(true)}>
                  Atribuir Novo Papel
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-red-500"
                    >
                      Excluir Usuário
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteUser} className="bg-red-500 hover:bg-red-600">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/3 flex flex-col items-center">
              <div className="relative w-48 h-48 rounded-full overflow-hidden border border-gray-200">
                {user.profile_photo_url ? (
                  <Image
                    src={user.profile_photo_url}
                    alt={user.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-4xl text-gray-400">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="mt-4 text-center">
                <Badge
                  variant={user.is_active ? "default" : "destructive"}
                  className="px-3 py-1 text-sm"
                >
                  {user.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>

            <div className="md:w-2/3">
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-gray-500 mb-4">{user.email}</p>

              {user.phone && (
                <p className="mb-2">
                  <span className="font-medium">Telefone:</span> {user.phone}
                </p>
              )}

              {user.entity_type && (
                <p className="mb-2">
                  <span className="font-medium">Tipo de Entidade:</span> {user.entity_type}
                </p>
              )}

              {user.entity_id && (
                <p className="mb-2">
                  <span className="font-medium">ID da Entidade:</span> {user.entity_id}
                </p>
              )}

              <div className="mt-6">
                <h4 className="text-lg font-medium mb-2">Papéis</h4>
                <div className="flex flex-wrap gap-2">
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((role) => (
                      <div key={role} className="flex items-center gap-1">
                        <Badge className="px-2 py-1">{role}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => handleRemoveRole(role)}
                          title="Remover papel"
                        >
                          ×
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Nenhum papel atribuído</p>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-medium mb-2">Informações Adicionais</h4>
                <p className="mb-1">
                  <span className="font-medium">Criado em:</span>{' '}
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                </p>
                <p className="mb-1">
                  <span className="font-medium">Última atualização:</span>{' '}
                  {user.updated_at ? new Date(user.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
                </p>
                <p className="mb-1">
                  <span className="font-medium">ID:</span> {user.id}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para atribuir papel */}
      <AlertDialog open={showAssignRole} onOpenChange={setShowAssignRole}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atribuir Novo Papel</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione um papel para atribuir ao usuário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <select
              className="w-full p-2 border rounded"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="">Selecione um papel</option>
              {availableRoles.map(role => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAssignRole} disabled={!selectedRole}>
              Atribuir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 