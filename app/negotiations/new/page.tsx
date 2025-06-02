"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
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

import { 
  negotiationService, 
  CreateNegotiationDto
} from '../../../services/negotiationService';
import { apiClient } from '../../services/apiClient';

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
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { Badge } from "@/components/ui/badge";
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Toaster } from '@/components/ui/toaster';
import { getErrorMessage } from '../../services/types';

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

interface CreateNegotiationResponse {
  data: {
    id: number;
    [key: string]: any;
  }
}

// Schema para validação com Zod
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
    })
  ).min(1, 'Adicione pelo menos um item'),
});

type ValoresFormulario = z.infer<typeof formularioSchema>;

export default function PaginaCriarNegociacao() {
  const router = useRouter();
  const { toast } = useToast();
  const [carregando, setCarregando] = useState(false);
  const [carregandoEntidades, setCarregandoEntidades] = useState(false);
  const [carregandoTuss, setCarregandoTuss] = useState(false);
  const [opcoesEntidades, setOpcoesEntidades] = useState<OpcaoEntidade[]>([]);
  const [tipoEntidadeSelecionada, setTipoEntidadeSelecionada] = useState<string>('');
  const [opcoesTuss, setOpcoesTuss] = useState<OpcaoTuss[]>([]);
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
      items: [] // Inicializamos com array vazio, pois vamos preenchê-lo após carregar os procedimentos TUSS
    }
  });

  // Buscar procedimentos TUSS com filtragem
  const buscarProcedimentosTuss = useCallback(async (termo: string = '') => {
    if (carregandoTuss) return;
    
    setCarregandoTuss(true);
    try {
      const response = await negotiationService.getTussProcedures(termo);
      
      if (response?.data) {
        // Garantir que os dados estão no formato correto
        const novaOpcoesTuss: OpcaoTuss[] = response.data.map((tuss: any) => ({
          id: tuss.id,
          code: tuss.code || '',
          name: tuss.name || tuss.description || '',
          description: tuss.description || ''
        }));
        
        console.log('Procedimentos TUSS carregados:', novaOpcoesTuss);
        setOpcoesTuss(novaOpcoesTuss);
        
        // Se ainda não temos um procedimento padrão e temos opções disponíveis
        if (!procedimentoPadrao && novaOpcoesTuss.length > 0) {
          setProcedimentoPadrao(novaOpcoesTuss[0].id);
          
          // Se o formulário ainda não tem itens, adiciona o primeiro item
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
  }, [toast, procedimentoPadrao, form]);

  // Efeito para carregar procedimentos TUSS iniciais
  useEffect(() => {
    buscarProcedimentosTuss();
  }, []);

  // Debounce para pesquisa TUSS
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (termoPesquisaTuss.length >= 3) {
        buscarProcedimentosTuss(termoPesquisaTuss);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [termoPesquisaTuss]);

  // Buscar entidades com filtragem
  const buscarEntidades = useCallback(async (tipo: string, termo: string = '') => {
    if (!tipo) return;
    
    setCarregandoEntidades(true);
    setOpcoesEntidades([]);
    
    try {
      // Definir o endpoint baseado no tipo de entidade
      let endpoint = '';
      
      if (tipo === 'App\\Models\\HealthPlan') {
        endpoint = '/health-plans';
      } else if (tipo === 'App\\Models\\Professional') {
        endpoint = '/professionals';
      } else if (tipo === 'App\\Models\\Clinic') {
        endpoint = '/clinics';
      } else {
        throw new Error('Tipo de entidade inválido');
      }
      
        const response = await apiClient.get(endpoint, { 
          params: { search: termo, per_page: 50 }
        });
        
      // Extrair dados da resposta paginada
      if (response.data?.data && response.data?.data && Array.isArray(response.data?.data)) {
        setOpcoesEntidades(response.data.data);
        } else {
        console.error('Formato de resposta inválido para entidades:', response.data);
          setOpcoesEntidades([]);
      }
    } catch (error) {
      console.error(`Erro ao carregar ${tipo}:`, error);
      setOpcoesEntidades([]);
      toast({
        title: "Erro",
        description: `Não foi possível carregar as opções de entidade`,
        variant: "destructive"
      });
    } finally {
      setCarregandoEntidades(false);
    }
  }, [toast]);

  const handleMudancaTipoEntidade = (valor: string) => {
    setTipoEntidadeSelecionada(valor);
    buscarEntidades(valor);
  };

  const onSubmit = async (valores: ValoresFormulario) => {
    // Formatação de dados de acordo com o backend
    const dadosNegociacao: CreateNegotiationDto = {
      title: valores.title,
      entity_type: valores.entity_type,
      entity_id: valores.entity_id,
      start_date: format(valores.start_date, 'yyyy-MM-dd'),
      end_date: format(valores.end_date, 'yyyy-MM-dd'),
      description: valores.description || '',
      notes: valores.notes || '',
      items: valores.items.map(item => ({
        tuss_id: item.tuss_id,
        proposed_value: item.proposed_value,
        notes: item.notes || ''
      }))
    };
    
    setCarregando(true);
    try {
      const response = await apiClient.post<CreateNegotiationResponse>('/negotiations', {
        ...dadosNegociacao,
        negotiable_type: valores.entity_type, // Adicionando o campo correto
        negotiable_id: valores.entity_id, // Adicionando o campo correto
        status: 'draft' // Definindo o status inicial
      });
      
      toast({
        title: "Sucesso",
        description: "Negociação criada com sucesso",
      });
      
      router.push(`/negotiations/${response.data.data.id}`);
    } catch (error) {
      console.error('Erro ao criar negociação:', error);
      
      // Use translated error message
      const errorMessage = getErrorMessage(error);
      
      toast({
        title: "Erro",
        description: errorMessage || "Falha ao criar negociação. Verifique os dados e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
    }
  };

  const adicionarItem = () => {
    const items = form.getValues('items');
    // Adiciona novo item com o procedimento padrão pré-selecionado
    form.setValue('items', [...items, { 
      tuss_id: procedimentoPadrao || (opcoesTuss.length > 0 ? opcoesTuss[0].id : 0), 
      proposed_value: 0 
    }]);
  };

  const removerItem = (index: number) => {
    const items = form.getValues('items');
    if (items.length > 1) {
      form.setValue('items', items.filter((_, i) => i !== index));
    } else {
      toast({
        title: "Aviso",
        description: "A negociação deve ter pelo menos um item",
      });
    }
  };
  
  // Formatar valor de moeda
  const formatCurrency = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return 'R$ 0,00';
    
    // Converter para número se for string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Formatar com estilo brasileiro (vírgula como separador decimal)
    return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
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
      <div className="bg-card border rounded-lg p-6 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/negotiations')} className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
            <div>
              <Badge variant="outline" className="mb-2">
                Nova
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight mb-1">Nova Negociação</h1>
              <p className="text-muted-foreground">Preencha os dados para criar uma nova negociação</p>
            </div>
          </div>
        </div>
      </div>
      
      <Card className="bg-card shadow-sm">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Informações Gerais
                </h3>
                
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
                        <FormLabel className="flex items-center justify-between">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1.5 text-primary" />
                            Entidade
                            </div>
                          {carregandoEntidades && (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          )}
                        </FormLabel>
                        <div>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between h-10 font-normal"
                                disabled={!tipoEntidadeSelecionada}
                              >
                                {field.value && opcoesEntidades.find((entity) => entity.id === field.value) ? (
                                  <div className="flex items-center">
                                    <span className="truncate max-w-[300px]">
                                      {opcoesEntidades.find((entity) => entity.id === field.value)?.name}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">
                                    {!tipoEntidadeSelecionada ? "Selecione o tipo de entidade primeiro" : "Selecione a entidade"}
                                  </span>
                                )}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                              <Command>
                                  <CommandInput
                                    placeholder="Buscar entidade..."
                                    value={termoPesquisaEntidade}
                                    onValueChange={(value) => {
                                      setTermoPesquisaEntidade(value);
                                    // Buscar no servidor apenas se o termo tiver 2+ caracteres ou não tivermos dados
                                    if (value.length >= 2 || opcoesEntidades.length === 0) {
                                      buscarEntidades(tipoEntidadeSelecionada, value);
                                    }
                                    }}
                                    disabled={!tipoEntidadeSelecionada}
                                  />
                                <CommandList>
                                  <CommandEmpty>
                                    <div className="py-6 text-center text-sm">
                                  <div className="mb-2">Nenhuma entidade encontrada</div>
                                  <div className="text-xs text-muted-foreground">Tente outros termos de busca</div>
                                    </div>
                                </CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-auto">
                                    {carregandoEntidades && (
                                      <div className="flex justify-center items-center py-4">
                                        <Loader2 className="h-6 w-6 animate-spin opacity-50" />
                                      </div>
                                    )}
                                    {opcoesEntidades.length > 0 && !carregandoEntidades && (
                                    <div className="p-1 text-xs text-muted-foreground border-b mx-2">
                                      {opcoesEntidades.length} entidade(s) encontrada(s)
                                </div>
                                  )}
                                  {opcoesEntidades.map((entity) => (
                                    <CommandItem
                                      key={entity.id}
                                        value={entity.name}
                                      onSelect={() => {
                                        field.onChange(entity.id);
                                      }}
                                      className="data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                                    >
                                      <div className="flex items-center">
                                        <span className={field.value === entity.id ? 'font-medium' : ''}>
                                    {entity.name}
                                        </span>
                                      </div>
                                      {field.value === entity.id && (
                                        <Check className="ml-auto h-4 w-4 text-primary" />
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
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
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Itens da Negociação
                    <Badge variant="outline" className="ml-2">
                      {form.watch('items').length} {form.watch('items').length === 1 ? 'item' : 'itens'}
                    </Badge>
                  </h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={adicionarItem}
                    className="bg-primary/10 hover:bg-primary/20 text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Item
                  </Button>
                </div>
                
                {form.watch('items').length === 0 ? (
                  <div className="p-12 border border-dashed rounded-md flex flex-col items-center justify-center text-muted-foreground">
                    <ClipboardList className="h-12 w-12 mb-4 opacity-40" />
                    <p className="mb-4">Nenhum item adicionado à negociação</p>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      onClick={adicionarItem}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Primeiro Item
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                {form.watch('items').map((item, index) => (
                      <div 
                        key={index} 
                        className="p-5 border rounded-md space-y-4 bg-card shadow-sm hover:shadow-md transition-shadow relative"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Badge variant="outline" className="px-3 py-1 rounded-md">
                              Item {index + 1}
                            </Badge>
                            
                            {item.tuss_id > 0 && opcoesTuss.find(t => t.id === item.tuss_id) && (
                              <Badge variant="secondary" className="ml-3">
                                {opcoesTuss.find(t => t.id === item.tuss_id)?.code}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {item.proposed_value > 0 && (
                              <Badge variant="default" className="font-mono">
                                {formatCurrency(item.proposed_value)}
                              </Badge>
                            )}
                            
                      {form.watch('items').length > 1 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removerItem(index)}
                                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remover item</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                      )}
                    </div>
                        </div>
                        
                        {item.tuss_id > 0 && opcoesTuss.find(t => t.id === item.tuss_id) && (
                          <div className="flex flex-col mt-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {opcoesTuss.find(t => t.id === item.tuss_id)?.code}
                              </Badge>
                              <span className="text-sm font-medium">
                                TUSS
                              </span>
                            </div>
                            <div className="text-sm mt-1">
                              {opcoesTuss.find(t => t.id === item.tuss_id)?.description}
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.tuss_id`}
                        render={({ field }) => (
                          <FormItem>
                                <FormLabel className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <FileText className="h-4 w-4 mr-1.5 text-primary" />
                                    Procedimento TUSS
                              </div>
                                  {carregandoTuss && (
                                    <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                                  )}
                                </FormLabel>
                                <div>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between h-10 font-normal"
                                      >
                                        {field.value && opcoesTuss.find((tuss) => tuss.id === field.value) ? (
                                          <div className="flex items-center">
                                            <Badge variant="outline" className="mr-2 text-xs font-normal">
                                              {opcoesTuss.find((tuss) => tuss.id === field.value)?.code}
                                            </Badge>
                                            <span className="truncate max-w-[250px]">
                                              {opcoesTuss.find((tuss) => tuss.id === field.value)?.description}
                                            </span>
                                    </div>
                                  ) : (
                                          <span className="text-muted-foreground">Selecione um procedimento</span>
                                        )}
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                      <Command>
                                          <CommandInput
                                            placeholder="Buscar por código ou nome..."
                                            value={termoPesquisaTuss}
                                            onValueChange={(value) => {
                                              setTermoPesquisaTuss(value);
                                            if (opcoesTuss.length === 0 || value.length >= 3) {
                                              buscarProcedimentosTuss(value);
                                            }
                                            }}
                                          />
                                        <CommandList>
                                          <CommandEmpty>
                                            <div className="py-6 text-center text-sm">
                                          <div className="mb-2">Nenhum procedimento encontrado</div>
                                          <div className="text-xs text-muted-foreground">
                                            Tente outros termos ou códigos TUSS
                                              </div>
                                          </div>
                                        </CommandEmpty>
                                        <CommandGroup className="max-h-[300px] overflow-auto">
                                            {carregandoTuss && (
                                              <div className="flex justify-center items-center py-4">
                                                <Loader2 className="h-6 w-6 animate-spin opacity-50" />
                                              </div>
                                            )}
                                            {!carregandoTuss && opcoesTuss.length === 0 && (
                                              <div className="p-4 text-center text-sm text-muted-foreground">
                                                Nenhum procedimento encontrado
                                              </div>
                                            )}
                                            {!carregandoTuss && opcoesTuss.length > 0 && (
                                              <>
                                                <div className="p-1 text-xs text-muted-foreground border-b mx-2">
                                                  {opcoesTuss.length} procedimento(s) encontrado(s)
                                                </div>
                                                {opcoesTuss.map((tuss) => (
                                                  <CommandItem
                                                    key={tuss.id}
                                                    value={`${tuss.code} ${tuss.name}`}
                                                    onSelect={() => {
                                                      field.onChange(tuss.id);
                                                    }}
                                                    className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                                                  >
                                                    <div className="flex flex-col w-full">
                                                      <div className="flex items-center">
                                                        <Badge 
                                                          variant="outline" 
                                                          className={`mr-2 text-xs font-bold ${field.value === tuss.id ? 'bg-primary/20 text-primary border-primary' : ''}`}
                                                        >
                                                          {tuss.code}
                                                        </Badge>
                                                        <span className={`${field.value === tuss.id ? 'font-medium text-primary' : ''} flex-1 text-sm`}>
                                                          {tuss.name}
                                                        </span>
                                                      </div>
                                                      {tuss.description && (
                                                        <span className="text-xs text-muted-foreground mt-1">
                                                          {tuss.description}
                                                        </span>
                                                      )}
                                                    </div>
                                                    {field.value === tuss.id && (
                                                      <Check className="ml-auto h-4 w-4 flex-shrink-0 text-primary" />
                                                    )}
                                                  </CommandItem>
                                                ))}
                                              </>
                                            )}
                                        </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`items.${index}.proposed_value`}
                        render={({ field }) => (
                          <FormItem>
                                <FormLabel className="flex items-center">
                                  <DollarSign className="h-4 w-4 mr-1.5 text-primary" />
                                  Valor Proposto
                                </FormLabel>
                            <FormControl>
                                  <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                      className="pl-8"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                value={field.value || ''}
                              />
                                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center text-muted-foreground">
                                      R$
                                    </div>
                                  </div>
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
                              <FormLabel className="flex items-center">
                                <Info className="h-4 w-4 mr-1.5 text-primary" />
                                Observações
                              </FormLabel>
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
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/negotiations')}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={carregando}
                  className="bg-primary hover:bg-primary/90"
                >
                  {carregando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Criar Negociação
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