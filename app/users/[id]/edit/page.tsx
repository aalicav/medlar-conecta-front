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
  CardFooter,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
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

// Schema de validação com Zod (para edição)
const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  email: z.string().email({ message: 'E-mail inválido' }),
  password: z.string().min(8, { message: 'Senha deve ter pelo menos 8 caracteres' }).optional().or(z.literal('')),
  password_confirmation: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  entity_type: z.string().optional().or(z.literal('')),
  entity_id: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  roles: z.array(z.string()).optional(),
  profile_photo: z.any().optional(),
}).refine(data => !data.password || data.password === data.password_confirmation, {
  message: 'As senhas não coincidem',
  path: ['password_confirmation'],
});

type FormValues = z.infer<typeof formSchema>;

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditUserPage({ params }: PageProps) {
  const router = useRouter();
  const { id } = params;
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Inicializar o formulário com react-hook-form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      phone: '',
      entity_type: '',
      entity_id: '',
      is_active: true,
      roles: [],
      profile_photo: undefined,
    },
  });

  // Carregar os dados do usuário
  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/api/users/${id}`);
        if (response.data.success) {
          const userData = response.data.data as User;
          setUser(userData);
          
          // Preencher o formulário com os dados existentes
          form.reset({
            name: userData.name || '',
            email: userData.email || '',
            password: '',
            password_confirmation: '',
            phone: userData.phone || '',
            entity_type: userData.entity_type || '',
            entity_id: userData.entity_id?.toString() || '',
            is_active: userData.is_active,
          });

          // Definir os papéis selecionados
          if (userData.roles && Array.isArray(userData.roles)) {
            setSelectedRoles(userData.roles);
          }

          // Definir foto de perfil
          if (userData.profile_photo_url) {
            setPhotoPreview(userData.profile_photo_url);
          }
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

    fetchUser();
  }, [id, form, router]);

  // Carregar os papéis disponíveis
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get('/api/users/roles');
        if (response.data.success) {
          setRoles(response.data.data);
        }
      } catch (error) {
        console.error('Erro ao buscar papéis:', error);
      }
    };

    fetchRoles();
  }, []);

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

  // Lidar com seleção de papéis
  const handleRoleToggle = (roleName: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleName)) {
        return prev.filter(name => name !== roleName);
      } else {
        return [...prev, roleName];
      }
    });
  };

  // Enviar o formulário
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Preparar os dados do formulário
      const formData = new FormData();
      
      // Adicionar apenas campos que foram preenchidos
      if (data.name) formData.append('name', data.name);
      if (data.email) formData.append('email', data.email);
      if (data.password) formData.append('password', data.password);
      if (data.phone) formData.append('phone', data.phone);
      if (data.entity_type) formData.append('entity_type', data.entity_type);
      if (data.entity_id) formData.append('entity_id', data.entity_id);
      
      // Valores booleanos precisam ser sempre enviados
      formData.append('is_active', data.is_active ? 'true' : 'false');

      // Adicionar a foto do perfil se houver
      if (photoFile) {
        formData.append('profile_photo', photoFile);
      }

      // Adicionar os papéis selecionados
      if (selectedRoles.length > 0) {
        selectedRoles.forEach(roleName => {
          formData.append('roles[]', roleName);
        });
      }

      // Enviar a requisição
      const response = await api.post(`/api/users/${id}?_method=PUT`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast({
          title: 'Sucesso',
          description: 'Usuário atualizado com sucesso',
        });
        router.push(`/dashboard/users/${id}`);
      } else {
        toast({
          title: 'Erro',
          description: response.data.message || 'Falha ao atualizar usuário',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      const errorMsg = error.response?.data?.message || 'Falha ao atualizar usuário';
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

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Editar Usuário</CardTitle>
          <CardDescription>
            Atualize as informações do usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha (opcional)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormDescription>
                        Deixe em branco para manter a senha atual
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password_confirmation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
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

                <FormField
                  control={form.control}
                  name="entity_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Entidade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de entidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          
                          <SelectItem value="clinic">Estabelecimento</SelectItem>
                          <SelectItem value="professional">Profissional</SelectItem>
                          <SelectItem value="health_plan">Plano de Saúde</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="entity_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID da Entidade</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="ID da entidade relacionada" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Usuário Ativo</FormLabel>
                        <FormDescription>
                          O usuário poderá fazer login e acessar o sistema
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormLabel>Foto de Perfil</FormLabel>
                <div className="mt-2">
                  {photoPreview && (
                    <div className="mb-3">
                      <p className="text-sm mb-1">Foto atual:</p>
                      <div className="relative h-20 w-20 overflow-hidden rounded-full border border-gray-200">
                        <Image
                          src={photoPreview}
                          alt="Foto de perfil"
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
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

              <div>
                <FormLabel>Papéis</FormLabel>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoles.includes(role.name)}
                        onCheckedChange={() => handleRoleToggle(role.name)}
                      />
                      <label
                        htmlFor={`role-${role.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {role.name}
                      </label>
                    </div>
                  ))}
                </div>
                {roles.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Nenhum papel disponível.
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dashboard/users/${id}`)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 