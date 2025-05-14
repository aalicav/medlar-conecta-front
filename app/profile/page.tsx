'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { apiClient } from '@/app/services/apiClient';

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

// Schema de validação com Zod para o perfil
const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  email: z.string().email({ message: 'E-mail inválido' }),
  phone: z.string().optional().or(z.literal('')),
  profile_photo: z.any().optional(),
});

// Schema de validação com Zod para a senha
const passwordFormSchema = z.object({
  current_password: z.string().min(1, { message: 'Senha atual é obrigatória' }),
  password: z.string().min(8, { message: 'Nova senha deve ter pelo menos 8 caracteres' }),
  password_confirmation: z.string().min(8, { message: 'Confirme a nova senha' }),
}).refine(data => data.password === data.password_confirmation, {
  message: 'As senhas não coincidem',
  path: ['password_confirmation'],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // Inicializar o formulário de perfil com react-hook-form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      profile_photo: undefined,
    },
  });
  
  // Inicializar o formulário de senha com react-hook-form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  });

  // Carregar os dados do usuário logado
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/user/profile');
        if (response.data.success) {
          const userData = response.data.data as User;
          setUser(userData);
          
          // Preencher o formulário com os dados existentes
          profileForm.reset({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
          });

          // Definir foto de perfil
          if (userData.profile_photo_url) {
            setPhotoPreview(userData.profile_photo_url);
          }
        } else {
          toast({
            title: 'Erro',
            description: 'Falha ao buscar dados do perfil',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao buscar dados do perfil',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [profileForm]);

  // Lidar com o upload de imagem
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setPhotoPreview(reader.result.toString());
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Enviar formulário de perfil
  const onSubmitProfile = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Preparar os dados do formulário
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      if (data.phone) formData.append('phone', data.phone);
      
      // Adicionar foto de perfil se houver
      if (photoFile) {
        formData.append('profile_photo', photoFile);
      }

      // Enviar requisição
      const response = await apiClient.post('/api/user/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast({
          title: 'Sucesso',
          description: 'Perfil atualizado com sucesso',
        });
        // Recarregar os dados do perfil
        const profileResponse = await apiClient.get('/api/user/profile');
        if (profileResponse.data.success) {
          setUser(profileResponse.data.data);
          if (profileResponse.data.data.profile_photo_url) {
            setPhotoPreview(profileResponse.data.data.profile_photo_url);
          }
        }
      } else {
        toast({
          title: 'Erro',
          description: response.data.message || 'Falha ao atualizar perfil',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      const errorMsg = error.response?.data?.message || 'Falha ao atualizar perfil';
      toast({
        title: 'Erro',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enviar formulário de senha
  const onSubmitPassword = async (data: PasswordFormValues) => {
    setIsSubmitting(true);
    
    try {
      const response = await apiClient.post('/api/user/change-password', {
        current_password: data.current_password,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      if (response.data.success) {
        toast({
          title: 'Sucesso',
          description: 'Senha alterada com sucesso',
        });
        // Limpar o formulário de senha
        passwordForm.reset({
          current_password: '',
          password: '',
          password_confirmation: '',
        });
      } else {
        toast({
          title: 'Erro',
          description: response.data.message || 'Falha ao alterar senha',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      const errorMsg = error.response?.data?.message || 'Falha ao alterar senha';
      toast({
        title: 'Erro',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
            <p>Erro ao carregar informações do perfil.</p>
            <Button 
              className="mt-4" 
              onClick={() => router.push('/dashboard')}
            >
              Voltar para o dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Meu Perfil</CardTitle>
          <CardDescription>
            Visualize e gerencie suas informações pessoais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info">
            <TabsList className="mb-6">
              <TabsTrigger value="info">Informações Pessoais</TabsTrigger>
              <TabsTrigger value="security">Segurança</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 flex flex-col items-center">
                  <div className="relative w-48 h-48 rounded-full overflow-hidden border border-gray-200">
                    {photoPreview ? (
                      <Image
                        src={photoPreview}
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
                  
                  <div className="mt-4 space-y-1 text-center">
                    <p className="text-sm text-gray-500">
                      Cadastrado em: {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Última atualização: {user.updated_at ? new Date(user.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="md:w-2/3">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                      <FormField
                        control={profileForm.control}
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
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@exemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(00) 00000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div>
                        <FormLabel>Foto de Perfil</FormLabel>
                        <div className="mt-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoChange}
                            className="mb-2"
                          />
                          <FormDescription>
                            Adicione uma nova foto ou deixe em branco para manter a atual
                          </FormDescription>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                          {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="security">
              <div className="max-w-xl mx-auto">
                <h3 className="text-lg font-medium mb-4">Alterar Senha</h3>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="current_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha Atual</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nova Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormDescription>
                            Sua senha deve ter pelo menos 8 caracteres
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
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Alterando...' : 'Alterar Senha'}
                      </Button>
                    </div>
                  </form>
                </Form>
                
                <Separator className="my-8" />
                
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Papéis de Acesso</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {user.roles && user.roles.length > 0 ? (
                      user.roles.map((role) => (
                        <Badge key={role} className="px-3 py-1">
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-gray-500">Nenhum papel atribuído</p>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Os papéis definem o que você pode acessar e editar no sistema. Para solicitar alterações, entre em contato com um administrador.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 