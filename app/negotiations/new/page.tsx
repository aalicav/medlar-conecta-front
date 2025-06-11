"use client"

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2,
  Calendar,
  Search,
  Loader2,
  ClipboardList,
  FileText,
  DollarSign,
  Info,
  ChevronDown,
  Check,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { specialtyService } from '@/services/specialtyService';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from "@/components/ui/badge";
import { Toaster } from '@/components/ui/toaster';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Separator } from '@/components/ui/separator';

interface OpcaoEntidade {
  id: number;
  name: string;
  type?: string;
}

interface Tuss {
  id: number;
  code: string;
  name?: string;
  description?: string;
}

interface OpcaoTuss {
  id: number;
  code: string;
  name: string;
  description?: string;
}

interface MedicalSpecialty {
  id: number;
  name: string;
}

interface CreateNegotiationResponse {
  data: {
    id: number;
    [key: string]: any;
  }
}

const formularioSchema = z.object({
  title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
  entity_type: z.string().min(1, 'Selecione o tipo de entidade'),
  entity_id: z.number().positive('Selecione uma entidade válida'),
  start_date: z.date(),
  end_date: z.date(),
  description: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      tuss_id: z.number().positive('Selecione um procedimento TUSS válido'),
      proposed_value: z.number().min(0.01, 'O valor deve ser maior que zero'),
      notes: z.string().optional(),
      medical_specialty_id: z.number().optional(),
    })
  ).min(1, 'Adicione pelo menos um item'),
});

type ValoresFormulario = z.infer<typeof formularioSchema>;

const buscarEntidades = async (tipo: string, termo: string = '') => {
  if (!tipo) return [];
  
  try {
    let endpoint = '';
    if (tipo === 'App\\Models\\Professional') {
      endpoint = '/professionals';
    } else if (tipo === 'App\\Models\\Clinic') {
      endpoint = '/clinics';
    } else {
      return [];
    }

    const response = await api.get(endpoint, { 
      params: { search: termo } 
    });
    
    if (response?.data?.data) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Erro ao buscar entidades:', error);
    return [];
  }
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function PaginaCriarNegociacao() {
  const router = useRouter();
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(false);
  const [carregandoEntidades, setCarregandoEntidades] = useState(false);
  const [carregandoTuss, setCarregandoTuss] = useState(false);
  const [carregandoEspecialidades, setCarregandoEspecialidades] = useState(false);
  const [opcoesEntidades, setOpcoesEntidades] = useState<OpcaoEntidade[]>([]);
  const [tipoEntidadeSelecionada, setTipoEntidadeSelecionada] = useState<string>('');
  const [opcoesTuss, setOpcoesTuss] = useState<OpcaoTuss[]>([]);
  const [opcoesEspecialidades, setOpcoesEspecialidades] = useState<MedicalSpecialty[]>([]);
  const [procedimentoPadrao, setProcedimentoPadrao] = useState<number | null>(null);
  const [termoPesquisaEntidade, setTermoPesquisaEntidade] = useState('');
  const [termoPesquisaTuss, setTermoPesquisaTuss] = useState('');

  const form = useForm<ValoresFormulario>({
    resolver: zodResolver(formularioSchema),
    defaultValues: {
      title: '',
      entity_type: '',
      entity_id: 0,
      start_date: new Date(),
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      items: []
    }
  });

  // Carregar especialidades médicas
  const carregarEspecialidades = useCallback(async () => {
    if (carregandoEspecialidades) return;
    
    setCarregandoEspecialidades(true);
    try {
      const response = await specialtyService.list();
      setOpcoesEspecialidades(response);
    } catch (error) {
      console.error('Erro ao carregar especialidades:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as especialidades médicas",
        variant: "destructive"
      });
    } finally {
      setCarregandoEspecialidades(false);
    }
  }, [carregandoEspecialidades, toast]);

  // Efeito para carregar especialidades quando necessário
  useEffect(() => {
    carregarEspecialidades();
  }, [carregarEspecialidades]);

  // Buscar procedimentos TUSS com filtragem
  const buscarProcedimentosTuss = useCallback(async (termo: string = '') => {
    if (carregandoTuss) return;
    
    setCarregandoTuss(true);
    try {
      const response = await api.get<{data: OpcaoTuss[]}>('/tuss', { 
        params: { search: termo } 
      });
      
      if (response?.data?.data) {
        const novaOpcoesTuss: OpcaoTuss[] = response.data.data.map((tuss: any) => ({
          id: tuss.id,
          code: tuss.code || '',
          name: tuss.name || tuss.description || '',
          description: tuss.description || ''
        }));
        
        setOpcoesTuss(novaOpcoesTuss);
        
        if (!procedimentoPadrao && novaOpcoesTuss.length > 0) {
          setProcedimentoPadrao(novaOpcoesTuss[0].id);
          
          const itensAtuais = form.getValues('items');
          if (itensAtuais.length === 0) {
            form.setValue('items', [{ 
              tuss_id: novaOpcoesTuss[0].id, 
              proposed_value: 0 
            }]);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar procedimentos TUSS:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os procedimentos TUSS",
        variant: "destructive"
      });
    } finally {
      setCarregandoTuss(false);
    }
  }, [carregandoTuss, form, procedimentoPadrao, toast]);

  // Efeito para carregar procedimentos TUSS iniciais
  useEffect(() => {
    buscarProcedimentosTuss();
  }, [buscarProcedimentosTuss]);

  // Debounce para pesquisa TUSS
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (termoPesquisaTuss.length >= 3) {
        buscarProcedimentosTuss(termoPesquisaTuss);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [termoPesquisaTuss, buscarProcedimentosTuss]);

  const handleMudancaTipoEntidade = async (valor: string) => {
    setTipoEntidadeSelecionada(valor);
    form.setValue('entity_type', valor);
    
    const entidades = await buscarEntidades(valor);
    setOpcoesEntidades(entidades);
  };

  const adicionarItem = () => {
    const items = form.getValues('items');
    form.setValue('items', [...items, { 
      tuss_id: procedimentoPadrao || (opcoesTuss.length > 0 ? opcoesTuss[0].id : 0), 
      proposed_value: 0 
    }]);
  };

  const removerItem = (index: number) => {
    const items = form.getValues('items');
    if (items.length > 1) {
      form.setValue('items', items.filter((_, i) => i !== index));
    }
  };

  const onSubmit = async (valores: ValoresFormulario) => {
    setCarregando(true);
    try {
      const response = await api.post('/negotiations', {
        ...valores,
        start_date: format(valores.start_date, 'yyyy-MM-dd'),
        end_date: format(valores.end_date, 'yyyy-MM-dd'),
        status: 'draft'
      });
      
      toast({
        title: "Sucesso",
        description: "Negociação criada com sucesso"
      });
      
      router.push(`/negotiations/${response.data.data.id}`);
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Link href="/dashboard" className="hover:underline">Painel</Link>
        <span>/</span>
        <Link href="/negotiations" className="hover:underline">Negociações</Link>
        <span>/</span>
        <span>Nova Negociação</span>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Campos básicos */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Título da negociação" />
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
                          onValueChange={handleMudancaTipoEntidade}
                          value={field.value}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
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
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a entidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {opcoesEntidades.map((entidade) => (
                              <SelectItem key={entidade.id} value={entidade.id.toString()}>
                                {entidade.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Itens da negociação */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Itens</h3>
                  <Button type="button" onClick={adicionarItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Item
                  </Button>
                </div>

                {form.watch('items').map((item, index) => {
                  const tussSelected = opcoesTuss.find(t => t.id === item.tuss_id);
                  const isTuss10101012 = tussSelected?.code === '10101012';

                  return (
                    <div key={index} className="p-4 border rounded-lg space-y-4">
                      <div className="flex justify-between items-center">
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
                              <FormLabel>Procedimento TUSS</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString()}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o procedimento" />
                                </SelectTrigger>
                                <SelectContent>
                                  {opcoesTuss.map((tuss) => (
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
                              <FormLabel>Valor Proposto</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {isTuss10101012 && (
                          <FormField
                            control={form.control}
                            name={`items.${index}.medical_specialty_id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Especialidade Médica</FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  value={field.value?.toString()}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a especialidade" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {opcoesEspecialidades.map((specialty) => (
                                      <SelectItem key={specialty.id} value={specialty.id.toString()}>
                                        {specialty.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name={`items.${index}.notes`}
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel>Observações</FormLabel>
                              <FormControl>
                                <Textarea {...field} placeholder="Observações sobre este item" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/negotiations')}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={carregando}>
                  {carregando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Toaster />
    </div>
  );
} 