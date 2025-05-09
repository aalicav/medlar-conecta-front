import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { apiClient } from '@/app/services/api-client';
import { usePermissions } from '@/app/hooks/usePermissions';

// Esquema do formulário
const esquemaNegociacaoExtemporanea = z.object({
  contract_id: z.string().min(1, { message: 'Contrato é obrigatório' }),
  tuss_id: z.string().min(1, { message: 'Procedimento TUSS é obrigatório' }),
  requested_value: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'O valor deve ser um número positivo'
  }),
  justification: z.string().min(10, { message: 'Forneça uma justificativa detalhada (mínimo 10 caracteres)' }),
  urgency_level: z.enum(['low', 'medium', 'high']).default('medium')
});

type FormularioValores = z.infer<typeof esquemaNegociacaoExtemporanea>;

export default function NovaNegociacaoExtemporanea() {
  const router = useRouter();
  const { toast } = useToast();
  const [estaEnviando, setEstaEnviando] = useState(false);
  const { hasPermission } = usePermissions();
  
  // Inicializar formulário com tipagem corrigida
  const form = useForm<FormularioValores>({
    resolver: zodResolver(esquemaNegociacaoExtemporanea) as any,
    defaultValues: {
      contract_id: '',
      tuss_id: '',
      requested_value: '',
      justification: '',
      urgency_level: 'medium',
    }
  });

  // Manipular envio do formulário
  const onSubmit = async (values: FormularioValores) => {
    if (!hasPermission('manage extemporaneous negotiations')) {
      toast({
        title: 'Permissão Negada',
        description: 'Você não tem permissão para criar negociações extemporâneas',
        variant: 'destructive',
      });
      return;
    }

    setEstaEnviando(true);
    
    try {
      // Converter valor string para número
      const valoresFormatados = {
        ...values,
        requested_value: parseFloat(values.requested_value),
      };
      
      // Enviar a negociação
      const response = await apiClient.post('/extemporaneous-negotiations', valoresFormatados);
      
      toast({
        title: 'Sucesso',
        description: 'Solicitação de negociação extemporânea criada com sucesso',
      });
      
      // Redirecionar para a lista de negociações
      router.push('/negotiations/extemporaneous');
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Falha ao criar negociação',
        variant: 'destructive',
      });
    } finally {
      setEstaEnviando(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Negociação Extemporânea</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
            <FormField
              control={form.control as any}
              name="contract_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrato</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contrato" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Opções de contrato seriam carregadas aqui */}
                        <SelectItem value="1">Contrato #12345</SelectItem>
                        <SelectItem value="2">Contrato #67890</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="tuss_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Procedimento (TUSS)</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um procedimento" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Opções de procedimentos TUSS seriam carregadas aqui */}
                        <SelectItem value="1">10101039 - Consulta médica</SelectItem>
                        <SelectItem value="2">40103110 - Raio-X de tórax</SelectItem>
                        <SelectItem value="3">50101012 - Consulta cardiológica</SelectItem>
                        <SelectItem value="4">40701220 - Ultrassonografia</SelectItem>
                        <SelectItem value="5">30101018 - Procedimento dermatológico</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="requested_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Solicitado (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="urgency_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível de Urgência</FormLabel>
                  <FormControl>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível de urgência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control as any}
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Forneça uma explicação detalhada para esta solicitação de negociação extemporânea"
                      rows={5}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <CardFooter className="flex justify-between px-0">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={estaEnviando}
              >
                {estaEnviando ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 