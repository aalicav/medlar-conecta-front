'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';

const billingRuleSchema = z.object({
  id: z.number().optional(),
  health_plan_id: z.number(),
  frequency: z.enum(['monthly', 'weekly', 'daily']),
  monthly_day: z.number().optional(),
  batch_size: z.number().optional(),
  payment_days: z.number().min(1, 'Prazo de pagamento é obrigatório'),
  notification_recipients: z.array(z.string()).optional(),
  notification_frequency: z.enum(['daily', 'weekly', 'monthly']),
  document_format: z.enum(['pdf', 'xml', 'json']),
  is_active: z.boolean(),
  generate_nfe: z.boolean().optional(),
  nfe_series: z.number().optional(),
  nfe_environment: z.number().optional(),
});

interface BillingRule {
  id: number;
  health_plan_id: number;
  frequency: 'monthly' | 'weekly' | 'daily';
  monthly_day?: number;
  batch_size?: number;
  payment_days: number;
  notification_recipients?: string[];
  notification_frequency: 'daily' | 'weekly' | 'monthly';
  document_format: 'pdf' | 'xml' | 'json';
  is_active: boolean;
  generate_nfe?: boolean;
  nfe_series?: number;
  nfe_environment?: number;
  created_at: string;
  updated_at: string;
  health_plan_name?: string;
}

interface HealthPlan {
  id: number;
  name: string;
}

type BillingRuleFormData = z.infer<typeof billingRuleSchema>;

export default function BillingRulesPage() {
  const [rules, setRules] = useState<BillingRule[]>([]);
  const [healthPlans, setHealthPlans] = useState<HealthPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedRule, setSelectedRule] = useState<BillingRule | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedHealthPlan, setSelectedHealthPlan] = useState<number | null>(null);
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BillingRuleFormData>({
    resolver: zodResolver(billingRuleSchema),
    defaultValues: {
      health_plan_id: 0,
      frequency: 'monthly',
      payment_days: 30,
      notification_frequency: 'daily',
      document_format: 'pdf',
      is_active: true,
      notification_recipients: [],
    },
  });

  const fetchRules = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (selectedHealthPlan) {
        params.health_plan_id = selectedHealthPlan;
      }
      
      const response = await api.get('/billing-rules', { params });
      
      if (response.data.success) {
        // A API retorna dados paginados, então precisamos acessar response.data.data.data
        const rulesData = response.data.data.data || response.data.data || [];
        
        // Adicionar nomes dos planos de saúde aos dados
        const rulesWithNames = rulesData.map((rule: BillingRule) => {
          const healthPlan = healthPlans.find(plan => plan.id === rule.health_plan_id);
          return {
            ...rule,
            health_plan_name: healthPlan?.name || 'Plano não encontrado',
          };
        });
        setRules(rulesWithNames);
      } else {
        setRules([]);
        toast({
          title: 'Aviso',
          description: 'Nenhuma regra de faturamento encontrada',
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar regras:', error);
      
      let errorMessage = 'Não foi possível carregar as regras de faturamento';
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Você não tem permissão para acessar este recurso.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Recurso não encontrado.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthPlans = async () => {
    try {
      const response = await api.get('/health-plans');
      const healthPlansData = Array.isArray(response.data?.data) ? response.data?.data : 
                             Array.isArray(response.data) ? response.data : [];
      setHealthPlans(healthPlansData);
      
      if (healthPlansData.length === 0) {
        toast({
          title: 'Aviso',
          description: 'Nenhum plano de saúde encontrado',
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('Erro ao carregar planos de saúde:', error);
      
      let errorMessage = 'Não foi possível carregar os planos de saúde';
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Você não tem permissão para acessar este recurso.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Recurso não encontrado.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      setHealthPlans([]);
    }
  };

  useEffect(() => {
    fetchHealthPlans();
  }, []);

  useEffect(() => {
    if (healthPlans.length > 0) {
      fetchRules();
    }
  }, [selectedHealthPlan, healthPlans]);

  const onSubmit = async (data: BillingRuleFormData) => {
    try {
      setSubmitting(true);
      
      const payload = {
        health_plan_id: data.health_plan_id,
        frequency: data.frequency,
        monthly_day: data.monthly_day,
        batch_size: data.batch_size,
        payment_days: data.payment_days,
        notification_recipients: data.notification_recipients || [],
        notification_frequency: data.notification_frequency,
        document_format: data.document_format,
        is_active: data.is_active,
        generate_nfe: data.generate_nfe || false,
        nfe_series: data.nfe_series,
        nfe_environment: data.nfe_environment,
      };

      if (selectedRule) {
        // Update existing rule
        const response = await api.put(`/billing-rules/${selectedRule.id}`, payload);
        
        if (response.data.success) {
          toast({
            title: 'Sucesso',
            description: 'Regra de faturamento atualizada com sucesso!',
            variant: 'default',
          });
        } else {
          throw new Error(response.data.message || 'Erro ao atualizar regra');
        }
      } else {
        // Create new rule
        const response = await api.post('/billing-rules', payload);
        
        if (response.data.success) {
          toast({
            title: 'Sucesso',
            description: 'Regra de faturamento criada com sucesso!',
            variant: 'default',
          });
        } else {
          throw new Error(response.data.message || 'Erro ao criar regra');
        }
      }
      
      // Reset form and refresh data
      setShowForm(false);
      setSelectedRule(null);
      form.reset({
        health_plan_id: 0,
        frequency: 'monthly',
        payment_days: 30,
        notification_frequency: 'daily',
        document_format: 'pdf',
        is_active: true,
        notification_recipients: [],
      });
      fetchRules();
      
    } catch (error: any) {
      console.error('Erro ao salvar regra:', error);
      
      let errorMessage = 'Não foi possível salvar a regra de faturamento';
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Você não tem permissão para realizar esta ação.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Dados inválidos. Verifique as informações e tente novamente.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return;

    try {
      const response = await api.delete(`/billing-rules/${id}`);
      if (response.data.success) {
        toast({
          title: 'Sucesso',
          description: 'Regra de faturamento excluída com sucesso',
        });
        fetchRules();
      } else {
        throw new Error(response.data.message || 'Erro ao excluir regra');
      }
    } catch (error: any) {
      console.error('Erro ao excluir regra:', error);
      
      let errorMessage = 'Não foi possível excluir a regra de faturamento';
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Sessão expirada. Faça login novamente.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Você não tem permissão para acessar este recurso.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Recurso não encontrado.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const frequencyMap: Record<BillingRule['frequency'], string> = {
    monthly: 'Mensal',
    weekly: 'Semanal',
    daily: 'Diário',
  };

  const columns = [
    {
      accessorKey: 'health_plan_name',
      header: 'Plano de Saúde',
    },
    {
      accessorKey: 'frequency',
      header: 'Frequência',
      cell: ({ row }: { row: { original: BillingRule } }) => {
        return frequencyMap[row.original.frequency];
      },
    },
    {
      accessorKey: 'payment_days',
      header: 'Prazo de Pagamento',
      cell: ({ row }: any) => `${row.original.payment_days} dias`,
    },
    {
      accessorKey: 'document_format',
      header: 'Formato',
      cell: ({ row }: any) => row.original.document_format.toUpperCase(),
    },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }: { row: { original: BillingRule } }) => (
        <Badge variant={row.original.is_active ? 'default' : 'destructive'}>
          {row.original.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }: { row: { original: BillingRule } }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedRule(row.original);
              form.reset(row.original);
              setShowForm(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Regras de Faturamento</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Label>Plano de Saúde:</Label>
            <Select
              value={selectedHealthPlan?.toString()}
              onValueChange={(value) => setSelectedHealthPlan(value ? Number(value) : null)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os planos" />
              </SelectTrigger>
              <SelectContent>
                {healthPlans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => {
            setSelectedRule(null);
            form.reset({
              health_plan_id: 0,
              frequency: 'monthly',
              payment_days: 30,
              notification_frequency: 'daily',
              document_format: 'pdf',
              is_active: true,
              notification_recipients: [],
            });
            setShowForm(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rules}
        isLoading={loading}
      />

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRule ? 'Editar Regra' : 'Nova Regra'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
              console.error('Erros de validação:', errors);
              toast({
                title: 'Erro de Validação',
                description: 'Por favor, corrija os campos destacados',
                variant: 'destructive',
              });
            })} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="health_plan_id">Plano de Saúde</Label>
                  <Select
                    value={form.watch('health_plan_id')?.toString() || ''}
                    onValueChange={(value) => form.setValue('health_plan_id', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano de saúde" />
                    </SelectTrigger>
                    <SelectContent>
                      {healthPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.health_plan_id && (
                    <p className="text-sm text-red-500">{form.formState.errors.health_plan_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência</Label>
                  <Select
                    value={form.watch('frequency')}
                    onValueChange={(value) => form.setValue('frequency', value as 'monthly' | 'weekly' | 'daily')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.frequency && (
                    <p className="text-sm text-red-500">{form.formState.errors.frequency.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_days">Prazo de Pagamento (dias)</Label>
                  <Input
                    {...form.register('payment_days', { valueAsNumber: true })}
                    type="number"
                    placeholder="30"
                  />
                  {form.formState.errors.payment_days && (
                    <p className="text-sm text-red-500">{form.formState.errors.payment_days.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification_frequency">Frequência de Notificação</Label>
                  <Select
                    value={form.watch('notification_frequency')}
                    onValueChange={(value) => form.setValue('notification_frequency', value as 'daily' | 'weekly' | 'monthly')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.notification_frequency && (
                    <p className="text-sm text-red-500">{form.formState.errors.notification_frequency.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_format">Formato do Documento</Label>
                  <Select
                    value={form.watch('document_format')}
                    onValueChange={(value) => form.setValue('document_format', value as 'pdf' | 'xml' | 'json')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.document_format && (
                    <p className="text-sm text-red-500">{form.formState.errors.document_format.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={form.watch('is_active')}
                  onCheckedChange={(checked) => form.setValue('is_active', checked as boolean)}
                />
                <Label htmlFor="is_active">Regra ativa</Label>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={submitting}>
                  {selectedRule ? 'Atualizar' : 'Criar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedRule(null);
                    form.reset({
                      health_plan_id: 0,
                      frequency: 'monthly',
                      payment_days: 30,
                      notification_frequency: 'daily',
                      document_format: 'pdf',
                      is_active: true,
                      notification_recipients: [],
                    });
                  }}
                >
                  Cancelar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 