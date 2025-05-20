"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createUser, getRoles } from '../userService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, User } from 'lucide-react';

// Schema de validação para formulário de usuário
const userFormSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.string().min(1, 'Selecione uma função'),
});

type UserFormData = z.infer<typeof userFormSchema>;

export default function NewUserPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const router = useRouter();

  // Lista de roles que não podem ser atribuídas
  const restrictedRoles = ['plan_admin', 'professional', 'clinic_admin'];

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

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: '',
    },
  });

  // Buscar roles disponíveis
  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      try {
        const rolesData = await getRoles();
        
        // Filtrar roles restritas
        const filteredRoles = rolesData.data.filter(
          (role: any) => !restrictedRoles.includes(role.name)
        );
        
        setRoles(filteredRoles);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as funções.',
          variant: 'destructive',
        });
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    try {
      // Converter o único role em um array para manter compatibilidade com o backend
      const formattedData = {
        ...data,
        roles: [data.role]
      };
      
      await createUser(formattedData);
      toast({
        title: 'Sucesso',
        description: 'Usuário criado com sucesso! Um e-mail foi enviado com as instruções de acesso.',
      });
      router.push('/admin/users');
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      // Tentar extrair mensagem de erro da resposta
      const errorMessage = error.response?.data?.message || 
                          'Não foi possível criar o usuário. Verifique os dados e tente novamente.';
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold">Adicionar Novo Usuário</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
          <CardDescription>
            Preencha os campos abaixo para criar um novo usuário. Se não for informada uma senha, 
            uma senha será gerada automaticamente e enviada para o e-mail informado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <FormDescription>
                        Este e-mail será usado para enviar as informações de acesso e para login no sistema.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha (opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Senha" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Se não informada, uma senha será gerada automaticamente.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Função</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma função" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.name}>
                              {getRoleDisplayName(role.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Selecione uma função para definir as permissões deste usuário no sistema.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2 mt-6">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => router.push('/admin/users')}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="gap-1"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Salvar
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 