"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

import { 
  negotiationService, 
  CreateNegotiationDto
} from '../../services/negotiationService';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';

interface OpcaoEntidade {
  id: number;
  name: string;
  type: string;
}

interface OpcaoTuss {
  id: number;
  code: string;
  name: string;
}

interface ValoresFormulario {
  title: string;
  entity_type: string;
  entity_id: number;
  start_date: Date;
  end_date: Date;
  description?: string;
  notes?: string;
  items: {
    tuss_id: number;
    proposed_value: number;
    notes?: string;
  }[];
}

export default function PaginaCriarNegociacao() {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [opcoesEntidades, setOpcoesEntidades] = useState<OpcaoEntidade[]>([]);
  const [tipoEntidadeSelecionada, setTipoEntidadeSelecionada] = useState<string>('');
  const [opcoesTuss, setOpcoesTuss] = useState<OpcaoTuss[]>([]);
  
  const form = useForm<ValoresFormulario>({
    defaultValues: {
      title: '',
      entity_type: '',
      entity_id: 0,
      start_date: new Date(),
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      items: [{ tuss_id: 0, proposed_value: 0 }]
    }
  });

  // Carregar opções de entidades e TUSS
  useEffect(() => {
    // Para fins de demonstração, usaremos dados simulados
    setOpcoesEntidades([
      // Planos de Saúde
      { id: 1, name: 'Unimed', type: 'App\\Models\\HealthPlan' },
      { id: 2, name: 'Amil', type: 'App\\Models\\HealthPlan' },
      { id: 3, name: 'SulAmérica', type: 'App\\Models\\HealthPlan' },
      // Profissionais
      { id: 1, name: 'Dra. Ana Silva', type: 'App\\Models\\Professional' },
      { id: 2, name: 'Dr. Carlos Oliveira', type: 'App\\Models\\Professional' },
      // Clínicas
      { id: 1, name: 'Clínica São Lucas', type: 'App\\Models\\Clinic' },
      { id: 2, name: 'Centro Médico Santa Maria', type: 'App\\Models\\Clinic' },
    ]);
    
    // Simular busca de procedimentos TUSS
    setOpcoesTuss([
      { id: 1, code: '10101012', name: 'Consulta em consultório' },
      { id: 2, code: '10101020', name: 'Consulta em pronto socorro' },
      { id: 3, code: '20101236', name: 'Raio-X de tórax' },
      { id: 4, code: '31301271', name: 'Avaliação fisioterapêutica' },
      { id: 5, code: '40202615', name: 'Hemograma completo' },
    ]);
  }, []);

  const handleMudancaTipoEntidade = (valor: string) => {
    setTipoEntidadeSelecionada(valor);
    form.setValue('entity_id', 0);
  };

  const onSubmit = async (valores: ValoresFormulario) => {
    const valoresFormatados = {
      title: valores.title,
      description: valores.description,
      notes: valores.notes,
      start_date: format(valores.start_date, 'yyyy-MM-dd'),
      end_date: format(valores.end_date, 'yyyy-MM-dd'),
      entity_type: valores.entity_type,
      entity_id: valores.entity_id,
      status: 'draft',
      negotiable_type: valores.entity_type,
      negotiable_id: valores.entity_id,
      items: valores.items.map((item) => ({
        tuss_id: item.tuss_id,
        proposed_value: item.proposed_value,
        notes: item.notes
      }))
    };
    
    setCarregando(true);
    try {
      const response = await negotiationService.createNegotiation(valoresFormatados as unknown as CreateNegotiationDto);
      toast({
        title: "Sucesso",
        description: "Negociação criada com sucesso",
      });
      router.push(`/negotiations/${response.data.id}`);
    } catch (error) {
      console.error('Erro ao criar negociação:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar negociação",
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
    }
  };

  const adicionarItem = () => {
    const items = form.getValues('items');
    form.setValue('items', [...items, { tuss_id: 0, proposed_value: 0 }]);
  };

  const removerItem = (index: number) => {
    const items = form.getValues('items');
    if (items.length > 1) {
      form.setValue('items', items.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Navegação */}
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Link href="/dashboard" className="hover:underline">Painel</Link>
        <span>/</span>
        <Link href="/negotiations" className="hover:underline">Negociações</Link>
        <span>/</span>
        <span>Nova Negociação</span>
      </div>
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push('/negotiations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Nova Negociação</h1>
        </div>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações Gerais</h3>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da Negociação</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Tabela de Preços 2024 - Unimed" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="entity_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Entidade</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            handleMudancaTipoEntidade(value);
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo de entidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="App\Models\HealthPlan">Plano de Saúde</SelectItem>
                            <SelectItem value="App\Models\Professional">Profissional</SelectItem>
                            <SelectItem value="App\Models\Clinic">Clínica</SelectItem>
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
                        <FormLabel>Entidade</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          disabled={!tipoEntidadeSelecionada}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a entidade" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {opcoesEntidades
                              .filter(entity => entity.type === tipoEntidadeSelecionada)
                              .map(entity => (
                                <SelectItem key={entity.id} value={entity.id.toString()}>
                                  {entity.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data Inicial</FormLabel>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data Final</FormLabel>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição breve desta negociação"
                          className="resize-none"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações adicionais"
                          className="resize-none"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Itens da Negociação</h3>
                  <Button type="button" variant="outline" size="sm" onClick={adicionarItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Item
                  </Button>
                </div>
                
                {form.watch('items').map((item, index) => (
                  <div key={index} className="p-4 border rounded-md space-y-4">
                    <div className="flex justify-between">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {form.watch('items').length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removerItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.tuss_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Procedimento (TUSS)</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o procedimento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {opcoesTuss.map(tuss => (
                                  <SelectItem key={tuss.id} value={tuss.id.toString()}>
                                    {tuss.code} - {tuss.name}
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
                        name={`items.${index}.proposed_value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Proposto (R$)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name={`items.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Observações adicionais para este item"
                              className="resize-none"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mr-2"
                  onClick={() => router.push('/negotiations')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={carregando}>
                  {carregando ? 'Criando...' : 'Criar Negociação'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 