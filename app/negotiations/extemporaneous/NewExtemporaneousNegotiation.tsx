import { useState, useEffect } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { createExtemporaneousNegotiation, getExtemporaneousNegotiation } from '@/services/extemporaneous-negotiations';

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

interface NegociacaoExtemporaneaProps {
  negotiationId?: string;
  isEditing?: boolean;
}

export default function FormularioNegociacaoExtemporanea({ negotiationId, isEditing = false }: NegociacaoExtemporaneaProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [estaEnviando, setEstaEnviando] = useState(false);
  const [estaCarregando, setEstaCarregando] = useState(isEditing);
  const [erro, setErro] = useState<string | null>(null);
  const [contratos, setContratos] = useState<Array<{id: string, numero: string}>>([]);
  const [procedimentos, setProcedimentos] = useState<Array<{id: string, codigo: string, descricao: string}>>([]);
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

  // Carregar dados para edição
  useEffect(() => {
    const carregarNegociacao = async () => {
      if (!isEditing || !negotiationId) return;
      
      setEstaCarregando(true);
      setErro(null);
      
      try {
        const response = await getExtemporaneousNegotiation(Number(negotiationId));
        const dadosNegociacao = response.data.data;
        
        // Preencher o formulário com os dados da negociação
        form.reset({
          contract_id: dadosNegociacao.contract_id.toString(),
          tuss_id: dadosNegociacao.tuss_id.toString(),
          requested_value: dadosNegociacao.requested_value.toString(),
          justification: dadosNegociacao.justification,
          urgency_level: dadosNegociacao.urgency_level || 'medium',
        });
      } catch (error: any) {
        setErro(error.response?.data?.message || 'Erro ao carregar dados da negociação');
        console.error('Erro ao carregar negociação:', error);
      } finally {
        setEstaCarregando(false);
      }
    };

    carregarNegociacao();
  }, [isEditing, negotiationId, form]);

  // Carregar dados de contratos e procedimentos TUSS
  useEffect(() => {
    // Simulação - em ambiente real, estes dados seriam carregados da API
    setContratos([
      { id: '1', numero: '12345' },
      { id: '2', numero: '67890' },
      { id: '3', numero: '24680' },
      { id: '4', numero: '13579' },
    ]);
    
    setProcedimentos([
      { id: '1', codigo: '10101039', descricao: 'Consulta médica' },
      { id: '2', codigo: '40103110', descricao: 'Raio-X de tórax' },
      { id: '3', codigo: '50101012', descricao: 'Consulta cardiológica' },
      { id: '4', codigo: '40701220', descricao: 'Ultrassonografia' },
      { id: '5', codigo: '30101018', descricao: 'Procedimento dermatológico' },
    ]);
  }, []);

  // Manipular envio do formulário
  const onSubmit = async (values: FormularioValores) => {
    const permissaoNecessaria = isEditing ? 'edit extemporaneous negotiations' : 'manage extemporaneous negotiations';
    
    if (!hasPermission(permissaoNecessaria)) {
      toast({
        title: 'Permissão Negada',
        description: `Você não tem permissão para ${isEditing ? 'editar' : 'criar'} negociações extemporâneas`,
        variant: 'destructive',
      });
      return;
    }

    setEstaEnviando(true);
    setErro(null);
    
    try {
      // Converter valor string para número
      const valoresFormatados = {
        ...values,
        requested_value: parseFloat(values.requested_value),
      };
      
      if (isEditing && negotiationId) {
        // Atualizar negociação existente
        await apiClient.put(`/extemporaneous-negotiations/${negotiationId}`, valoresFormatados);
        toast({
          title: 'Sucesso',
          description: 'Negociação extemporânea atualizada com sucesso',
        });
      } else {
        // Criar nova negociação
        await createExtemporaneousNegotiation(valoresFormatados as any);
        toast({
          title: 'Sucesso',
          description: 'Solicitação de negociação extemporânea criada com sucesso',
        });
      }
      
      // Redirecionar para a lista de negociações
      router.push('/negotiations/extemporaneous');
    } catch (error: any) {
      const mensagemErro = error.response?.data?.message || `Falha ao ${isEditing ? 'atualizar' : 'criar'} negociação`;
      setErro(mensagemErro);
      toast({
        title: 'Erro',
        description: mensagemErro,
        variant: 'destructive',
      });
    } finally {
      setEstaEnviando(false);
    }
  };

  if (estaCarregando) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center items-center min-h-[300px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando dados da negociação...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar Negociação Extemporânea' : 'Nova Negociação Extemporânea'}</CardTitle>
      </CardHeader>
      <CardContent>
        {erro && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}
        
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
                      value={field.value}
                      disabled={isEditing && negotiationId && form.getValues().contract_id !== ''}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um contrato" />
                      </SelectTrigger>
                      <SelectContent>
                        {contratos.map(contrato => (
                          <SelectItem key={contrato.id} value={contrato.id}>
                            Contrato #{contrato.numero}
                          </SelectItem>
                        ))}
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
                      value={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um procedimento" />
                      </SelectTrigger>
                      <SelectContent>
                        {procedimentos.map(proc => (
                          <SelectItem key={proc.id} value={proc.id}>
                            {proc.codigo} - {proc.descricao}
                          </SelectItem>
                        ))}
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
                      value={field.value}
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
                {estaEnviando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Atualizando...' : 'Enviando...'}
                  </>
                ) : (
                  isEditing ? 'Atualizar Negociação' : 'Enviar Solicitação'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 