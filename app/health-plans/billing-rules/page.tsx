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

const billingRuleSchema = z.object({
  id: z.number().optional(),
  health_plan_id: z.number(),
  contract_id: z.number(),
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'batch', 'individual']),
  monthly_day: z.number().optional(),
  batch_size: z.number().optional(),
  payment_days: z.number(),
  notification_recipients: z.array(z.string()),
  notification_frequency: z.enum(['daily', 'weekly', 'biweekly']),
  document_format: z.enum(['pdf', 'csv', 'xml']),
  is_active: z.boolean(),
});

interface BillingRule {
  id: number;
  health_plan_id: number;
  contract_id: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'batch' | 'individual';
  monthly_day?: number;
  batch_size?: number;
  payment_days: number;
  notification_recipients: string[];
  notification_frequency: 'daily' | 'weekly' | 'biweekly';
  document_format: 'pdf' | 'csv' | 'xml';
  is_active: boolean;
  health_plan_name?: string;
  contract_number?: string;
}

interface HealthPlan {
  id: number;
  name: string;
  contracts: {
    id: number;
    number: string;
    start_date: string;
    end_date: string;
  }[];
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

  const form = useForm<BillingRuleFormData>({
    resolver: zodResolver(billingRuleSchema),
    defaultValues: {
      is_active: true,
      notification_recipients: [],
    },
  });

  const fetchRules = async () => {
    try {
      const params: any = {};
      if (selectedHealthPlan) {
        params.health_plan_id = selectedHealthPlan;
      }
      const response = await api.get('/billing-rules', { params });
      setRules(response.data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as regras de faturamento',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthPlans = async () => {
    try {
      const response = await api.get('/health-plans');
      setHealthPlans(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os planos de saúde',
        variant: 'destructive',
      });
      setHealthPlans([]);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchHealthPlans();
  }, [selectedHealthPlan]);

  const onSubmit = async (data: BillingRuleFormData) => {
    try {
      if (selectedRule) {
        await api.put(`/billing-rules/${selectedRule.id}`, data);
        toast({
          title: 'Sucesso',
          description: 'Regra de faturamento atualizada com sucesso',
        });
      } else {
        await api.post('/billing-rules', data);
        toast({
          title: 'Sucesso',
          description: 'Regra de faturamento criada com sucesso',
        });
      }
      setShowForm(false);
      fetchRules();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a regra de faturamento',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta regra?')) return;

    try {
      await api.delete(`/billing-rules/${id}`);
      toast({
        title: 'Sucesso',
        description: 'Regra de faturamento excluída com sucesso',
      });
      fetchRules();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a regra de faturamento',
        variant: 'destructive',
      });
    }
  };

  const frequencyMap: Record<BillingRule['frequency'], string> = {
    daily: 'Diário',
    weekly: 'Semanal',
    biweekly: 'Quinzenal',
    monthly: 'Mensal',
    batch: 'Por Lote',
    individual: 'Por Consulta',
  };

  const columns = [
    {
      accessorKey: 'health_plan_name',
      header: 'Plano de Saúde',
    },
    {
      accessorKey: 'contract_number',
      header: 'Contrato',
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
                <SelectValue placeholder="Selecione um plano" />
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="health_plan_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plano de Saúde</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um plano" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(healthPlans) && healthPlans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id.toString()}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contract_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contrato</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um contrato" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(healthPlans) && healthPlans
                            .find((plan) => plan.id === form.watch('health_plan_id'))
                            ?.contracts?.map((contract) => (
                              <SelectItem
                                key={contract.id}
                                value={contract.id.toString()}
                              >
                                {contract.number}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequência de Faturamento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="biweekly">Quinzenal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="batch">Por Lote</SelectItem>
                          <SelectItem value="individual">Por Consulta</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('frequency') === 'monthly' && (
                  <FormField
                    control={form.control}
                    name="monthly_day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dia do Mês</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={31}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch('frequency') === 'batch' && (
                  <FormField
                    control={form.control}
                    name="batch_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tamanho do Lote</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="payment_days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo de Pagamento (dias)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="document_format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Formato do Documento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o formato" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="xml">XML</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notification_frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequência de Notificações</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="biweekly">Quinzenal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit">
                  {selectedRule ? 'Atualizar' : 'Criar'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 