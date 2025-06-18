import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { createExtemporaneousNegotiation } from '@/services/extemporaneous-negotiations';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Combobox } from '@/components/ui/combobox';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/app/components/ui/loading-spinner';

interface Contract {
  id: number;
  contract_number: string;
}

interface TussItem {
  id: number;
  code: string;
  description: string;
}

interface ComboboxItem {
  value: string;
  label: string;
}

const formSchema = z.object({
  contract_id: z.number({
    required_error: 'Selecione um contrato',
  }),
  tuss_id: z.number({
    required_error: 'Selecione um procedimento',
  }),
  requested_value: z.number({
    required_error: 'Informe o valor solicitado',
  }).min(0, 'O valor deve ser maior que zero'),
  justification: z.string({
    required_error: 'Informe a justificativa',
  }).min(10, 'A justificativa deve ter pelo menos 10 caracteres'),
  urgency_level: z.enum(['low', 'medium', 'high'], {
    required_error: 'Selecione o nível de urgência',
  }),
});

type FormData = z.infer<typeof formSchema>;

export function NewExtemporaneousNegotiation() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      urgency_level: 'medium',
    },
  });

  const { data: contracts, isLoading: isLoadingContracts } = useQuery<Contract[]>({
    queryKey: ['contracts'],
    queryFn: async () => {
      const response = await api.get('/contracts');
      return response.data.data?.data ?? [];
    },
  });

  const { data: tuss, isLoading: isLoadingTuss } = useQuery<TussItem[]>({
    queryKey: ['tuss'],
    queryFn: async () => {
      const response = await api.get('/tuss');
      return response.data.data;
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      await createExtemporaneousNegotiation(data);
      toast({
        title: 'Sucesso',
        description: 'Negociação extemporânea criada com sucesso',
      });
      router.push('/negotiations/extemporaneous');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar negociação extemporânea',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingContracts || isLoadingTuss) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Negociação Extemporânea</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      {contracts?.map((contract) => (
                        <SelectItem key={contract.id} value={contract.id.toString()}>
                          {contract.contract_number}
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
              name="tuss_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procedimento</FormLabel>
                  <Combobox
                    options={tuss?.map((item): ComboboxItem => ({
                      value: item.id.toString(),
                      label: `${item.code} - ${item.description}`,
                    })) || []}
                    value={field.value?.toString() || ''}
                    onValueChange={(value: string) => field.onChange(Number(value))}
                    placeholder="Selecione um procedimento"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requested_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Solicitado</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
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
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urgency_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível de Urgência</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível de urgência" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Criando...' : 'Criar Negociação'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 