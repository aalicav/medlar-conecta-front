'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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

// Schema de validação com Zod
const formSchema = z.object({
  name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  email: z.string().email({ message: 'E-mail inválido' }),
  password: z.string().min(8, { message: 'Senha deve ter pelo menos 8 caracteres' }),
  password_confirmation: z.string(),
  phone: z.string().optional().or(z.literal('')),
  entity_type: z.string().optional().or(z.literal('')),
  entity_id: z.string().optional().or(z.literal('')),
  is_active: z.boolean().default(true),
  roles: z.array(z.string()).optional(),
  profile_photo: z.any().optional(),
}).refine(data => data.password === data.password_confirmation, {
  message: 'As senhas não coincidem',
  path: ['password_confirmation'],
});

type FormValues = z.infer<typeof formSchema>;

export default function NewUserPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<UserRole[]>([]);
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
        toast({
          title: 'Erro',
          description: 'Falha ao carregar os papéis disponíveis',
          variant: 'destructive',
        });
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
    } else {
      setPhotoFile(null);
      setPhotoPreview('');
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
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'profile_photo' && key !== 'roles' && key !== 'password_confirmation') {
          formData.append(key, value as string);
        }
      });

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
      const response = await api.post('/api/users', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast({
          title: 'Sucesso',
          description: 'Usuário criado com sucesso',
        });
        router.push('/dashboard/users');
      } else {
        toast({
          title: 'Erro',
          description: response.data.message || 'Falha ao criar usuário',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      const errorMsg = error.response?.data?.message || 'Falha ao criar usuário';
      toast({
        title: 'Erro',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Novo Usuário</CardTitle>
          <CardDescription>
            Preencha o formulário para criar um novo usuário
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
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password_confirmation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
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
                          
                          <SelectItem value="clinic">Clínica</SelectItem>
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
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="mb-2"
                  />
                  {photoPreview && (
                    <div className="mt-2">
                      <p className="text-sm mb-1">Prévia:</p>
                      <img
                        src={photoPreview}
                        alt="Prévia da foto de perfil"
                        className="h-20 w-20 object-cover rounded-full"
                      />
                    </div>
                  )}
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
                  onClick={() => router.push('/dashboard/users')}
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