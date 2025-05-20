"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, updateUser, getRoles, getPermissions, updateUserRoles, updateUserPermissions } from '../../userService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Save, ShieldAlert, Key, User } from 'lucide-react';

// Schema para atualização de dados do usuário
const userDataSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
});

// Schema para atualização de senha
const passwordSchema = z.object({
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
  password_confirmation: z.string().min(8, 'A confirmação de senha deve ter pelo menos 8 caracteres'),
}).refine(data => data.password === data.password_confirmation, {
  message: "As senhas não coincidem",
  path: ["password_confirmation"],
});

// Schema para roles e permissões
const rolesPermissionsSchema = z.object({
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
});

type PageProps = {
  params: {
    id: string;
  };
};

export default function EditUserPage({ params }: PageProps) {
  const [user, setUser] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();
  const userId = parseInt(params.id);

  // Lista de roles que não podem ser atribuídas
  const restrictedRoles = ['plan_admin', 'professional', 'clinic_admin'];

  // Formulário de dados do usuário
  const dataForm = useForm<z.infer<typeof userDataSchema>>({
    resolver: zodResolver(userDataSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  // Formulário de senha
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      password_confirmation: '',
    },
  });

  // Formulário de roles e permissões
  const rolesPermissionsForm = useForm<z.infer<typeof rolesPermissionsSchema>>({
    resolver: zodResolver(rolesPermissionsSchema),
    defaultValues: {
      roles: [],
      permissions: [],
    },
  });

  // Buscar dados do usuário, roles e permissões
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [userData, rolesData, permissionsData] = await Promise.all([
          getUser(userId),
          getRoles(),
          getPermissions()
        ]);
        
        const user = userData.data;
        setUser(user);
        
        // Preencher formulário de dados
        dataForm.reset({
          name: user.name,
          email: user.email,
        });
        
        // Preencher formulário de roles e permissões
        const userRoles = user.roles ? user.roles.map((r: any) => r.name) : [];
        const userPermissions = user.permissions ? user.permissions.map((p: any) => p.name) : [];
        
        rolesPermissionsForm.reset({
          roles: userRoles,
          permissions: userPermissions,
        });
        
        // Filtrar roles restritas
        const filteredRoles = rolesData.data.filter(
          (role: any) => !restrictedRoles.includes(role.name)
        );
        
        setRoles(filteredRoles);
        setPermissions(permissionsData.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do usuário.',
          variant: 'destructive',
        });
      } finally {
        setLoadingData(false);
      }
    };

    if (userId) {
      loadData();
    }
  }, [userId]);

  // Atualizar dados do usuário
  const onSubmitData = async (data: z.infer<typeof userDataSchema>) => {
    setLoading(true);
    try {
      await updateUser(userId, data);
      toast({
        title: 'Sucesso',
        description: 'Dados do usuário atualizados com sucesso!',
      });
      
      // Atualizar o estado local
      setUser({
        ...user,
        ...data,
      });
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      
      // Tentar extrair mensagem de erro da resposta
      const errorMessage = error.response?.data?.message || 
                          'Não foi possível atualizar os dados do usuário. Verifique os campos e tente novamente.';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar senha do usuário
  const onSubmitPassword = async (data: z.infer<typeof passwordSchema>) => {
    setLoading(true);
    try {
      await updateUser(userId, { password: data.password });
      toast({
        title: 'Sucesso',
        description: 'Senha atualizada com sucesso!',
      });
      
      // Limpar formulário
      passwordForm.reset({
        password: '',
        password_confirmation: '',
      });
    } catch (error: any) {
      console.error('Erro ao atualizar senha:', error);
      
      const errorMessage = error.response?.data?.message || 
                          'Não foi possível atualizar a senha. Tente novamente.';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Atualizar roles e permissões
  const onSubmitRolesPermissions = async (data: z.infer<typeof rolesPermissionsSchema>) => {
    setLoading(true);
    try {
      // Atualizar roles e permissões em chamadas separadas
      await Promise.all([
        updateUserRoles(userId, data.roles || []),
        updateUserPermissions(userId, data.permissions || [])
      ]);

      toast({
        title: 'Sucesso',
        description: 'Funções e permissões atualizadas com sucesso!',
      });
      
      // Buscar usuário atualizado
      const updatedUserData = await getUser(userId);
      setUser(updatedUserData.data);
    } catch (error: any) {
      console.error('Erro ao atualizar funções e permissões:', error);
      
      const errorMessage = error.response?.data?.message || 
                          'Não foi possível atualizar as funções e permissões.';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container py-6 flex justify-center items-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
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
          <h1 className="text-2xl font-bold">Editar Usuário</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">Usuário não encontrado</p>
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
        <h1 className="text-2xl font-bold">Editar Usuário</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar {user.name}</CardTitle>
          <CardDescription>
            Gerencie as informações, senha e permissões do usuário.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                <span>Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="password" className="gap-2">
                <Key className="h-4 w-4" />
                <span>Senha</span>
              </TabsTrigger>
              <TabsTrigger value="roles" className="gap-2">
                <ShieldAlert className="h-4 w-4" />
                <span>Funções e Permissões</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Tab: Perfil */}
            <TabsContent value="profile">
              <Form {...dataForm}>
                <form onSubmit={dataForm.handleSubmit(onSubmitData)} className="space-y-6 mt-4">
                  <FormField
                    control={dataForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={dataForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Este e-mail será usado para login no sistema.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={loading} className="gap-1">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Tab: Senha */}
            <TabsContent value="password">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6 mt-4">
                  <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Nova senha" {...field} />
                        </FormControl>
                        <FormDescription>
                          A senha deve ter pelo menos 8 caracteres.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="password_confirmation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nova Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirme a nova senha" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={loading} className="gap-1">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Atualizar Senha
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            {/* Tab: Funções e Permissões */}
            <TabsContent value="roles">
              <Form {...rolesPermissionsForm}>
                <form onSubmit={rolesPermissionsForm.handleSubmit(onSubmitRolesPermissions)} className="space-y-6 mt-4">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Funções (Roles)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {roles.map((role) => (
                        <FormField
                          key={role.id}
                          control={rolesPermissionsForm.control}
                          name="roles"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 border rounded-md">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role.name)}
                                  onCheckedChange={(checked) => {
                                    const values = field.value || [];
                                    if (checked) {
                                      field.onChange([...values, role.name]);
                                    } else {
                                      field.onChange(values.filter((value) => value !== role.name));
                                    }
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="cursor-pointer font-normal">
                                  {role.name}
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-3">Permissões Diretas</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Permissões específicas para este usuário, independente de suas funções.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {permissions.map((permission) => (
                        <FormField
                          key={permission.id}
                          control={rolesPermissionsForm.control}
                          name="permissions"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-2 border rounded-md">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(permission.name)}
                                  onCheckedChange={(checked) => {
                                    const values = field.value || [];
                                    if (checked) {
                                      field.onChange([...values, permission.name]);
                                    } else {
                                      field.onChange(values.filter((value) => value !== permission.name));
                                    }
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="cursor-pointer font-normal">
                                  {permission.name}
                                </FormLabel>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="gap-1">
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Salvar Funções e Permissões
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 