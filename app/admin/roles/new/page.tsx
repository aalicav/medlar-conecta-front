"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createRole, getPermissions } from '../roleService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';

// Schema de validação para formulário de role
const roleFormSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres')
    .refine((name) => !['super_admin', 'plan_admin', 'professional', 'clinic_admin'].includes(name.toLowerCase()), {
      message: 'Este nome de função é reservado para uso do sistema',
    }),
  guard_name: z.string().default('api'),
  permissions: z.array(z.string()).optional(),
});

type RoleFormData = z.infer<typeof roleFormSchema>;

export default function NewRolePage() {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const router = useRouter();

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      guard_name: 'api',
      permissions: [],
    },
  });

  // Buscar permissões disponíveis
  useEffect(() => {
    async function loadData() {
      setLoadingData(true);
      try {
        const permissionsData = await getPermissions();
        setPermissions(permissionsData.data || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as permissões.',
          variant: 'destructive',
        });
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  const onSubmit = async (data: RoleFormData) => {
    setLoading(true);
    try {
      await createRole(data);
      toast({
        title: 'Sucesso',
        description: 'Função criada com sucesso!',
      });
      router.push('/admin/roles');
    } catch (error: any) {
      console.error('Erro ao criar função:', error);
      
      const errorMessage = error.response?.data?.message || 
                          'Não foi possível criar a função. Verifique os dados e tente novamente.';
      
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
          onClick={() => router.push('/admin/roles')}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Adicionar Nova Função</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Função</CardTitle>
          <CardDescription>
            Preencha os campos abaixo para criar uma nova função e atribuir permissões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingData ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Função</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: editor, manager" {...field} />
                      </FormControl>
                      <FormDescription>
                        O nome deve ser único e descrever o propósito desta função no sistema.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <h3 className="text-lg font-medium mb-2">Permissões</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Selecione as permissões que serão atribuídas a esta função.
                  </p>
                  
                  <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {permissions.map((permission) => (
                        <FormField
                          key={permission.id}
                          control={form.control}
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
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => router.push('/admin/roles')}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="gap-1"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
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