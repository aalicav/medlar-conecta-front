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
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';

import { 
  negotiationService, 
  CreateNegotiationDto
} from '../../services/negotiationService';
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
import { toast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { Badge } from "@/components/ui/badge";

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
  const [carregandoEntidades, setCarregandoEntidades] = useState(false);
  const [carregandoTuss, setCarregandoTuss] = useState(false);
  const [opcoesEntidades, setOpcoesEntidades] = useState<OpcaoEntidade[]>([]);
  const [tipoEntidadeSelecionada, setTipoEntidadeSelecionada] = useState<string>('');
  const [opcoesTuss, setOpcoesTuss] = useState<OpcaoTuss[]>([]);
  const [termoPesquisaEntidade, setTermoPesquisaEntidade] = useState('');
  const [termoPesquisaTuss, setTermoPesquisaTuss] = useState('');
  
  // Usar refs para armazenar timeouts em vez de state
  const timeoutEntidadesRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutTussRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Buscar procedimentos TUSS com filtragem
  const buscarProcedimentosTuss = useCallback(async (termo: string = '') => {
    setCarregandoTuss(true);
    try {
      const response = await negotiationService.getTussProcedures(termo);
      console.log('Resposta da API TUSS:', response);
      
      // Verificar explicitamente o tipo da resposta
      if (response && typeof response === 'object') {
        // Verificar diferentes formatos de resposta
        let dadosTuss: any[] = [];
        
        if (response && 'data' in response && Array.isArray(response.data)) {
          // Formato com campo data diretamente
          dadosTuss = response.data;
        } else if (response && 'data' in response && response.data && 
                  typeof response.data === 'object' && 'data' in response.data && 
                  Array.isArray(response.data.data)) {
          // Formato com data aninhado
          dadosTuss = response.data.data;
        } else if (Array.isArray(response)) {
          // Formato como array direto
          dadosTuss = response;
        }
        
        if (dadosTuss.length > 0) {
          console.log('Dados encontrados:', dadosTuss.length, 'procedimentos TUSS');
          
          // Garantir o formato correto dos dados
          const procedimentos = dadosTuss.map((item: any) => ({
            id: typeof item.id === 'number' ? item.id : parseInt(item.id || '0'),
            code: item.code || '',
            name: item.name || (item.description || ''),
          }));
          
          console.log('Procedimentos TUSS formatados:', procedimentos);
          setOpcoesTuss(procedimentos);
        } else {
          console.log('Nenhum procedimento TUSS encontrado');
          setOpcoesTuss([]);
        }
      } else {
        console.error('Resposta da API TUSS em formato inválido:', response);
        setOpcoesTuss([]);
      }
    } catch (error) {
      console.error('Erro ao carregar procedimentos TUSS:', error);
      setOpcoesTuss([]);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os procedimentos TUSS",
        variant: "destructive"
      });
    } finally {
      setCarregandoTuss(false);
    }
  }, []);

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
      }
      
      if (endpoint) {
        const response = await apiClient.get(endpoint, { 
          params: { search: termo, per_page: 50 }
        });
        
        console.log(`Resposta da API ${endpoint}:`, response.data);
        
        // Verificar estrutura de resposta paginada
        let dadosEntidades: any[] = [];
        
        if (response.data && response.data.data) {
          // Resposta paginada (formato Laravel)
          dadosEntidades = response.data.data;
        } else if (Array.isArray(response.data)) {
          // Resposta direta em formato de array
          dadosEntidades = response.data;
        } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
          // Formato da API com success e data
          dadosEntidades = response.data.data;
        }
        
        if (dadosEntidades.length > 0) {
          console.log('Dados encontrados:', dadosEntidades.length, 'entidades');
          
          // Garantir que os dados estejam no formato correto
          const entidades = dadosEntidades.map((entidade: any) => ({
            id: Number(entidade.id) || 0,
            name: entidade.name || entidade.title || entidade.corporate_name || entidade.full_name || `Entidade ${entidade.id}`,
            type: tipo
          }));
          
          console.log('Entidades formatadas:', entidades);
          setOpcoesEntidades(entidades);
        } else {
          console.log('Nenhuma entidade encontrada');
          setOpcoesEntidades([]);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar entidades:', error);
      setOpcoesEntidades([]);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as entidades",
        variant: "destructive"
      });
    } finally {
      setCarregandoEntidades(false);
    }
  }, []);
  
  // Funções de debounce para busca
  const debounceEntidadeSearch = useCallback((tipo: string, termo: string) => {
    if (timeoutEntidadesRef.current) {
      clearTimeout(timeoutEntidadesRef.current);
    }
    
    timeoutEntidadesRef.current = setTimeout(() => {
      buscarEntidades(tipo, termo);
    }, 300);
  }, [buscarEntidades]);
  
  const debounceTussSearch = useCallback((termo: string) => {
    if (timeoutTussRef.current) {
      clearTimeout(timeoutTussRef.current);
    }
    
    timeoutTussRef.current = setTimeout(() => {
      buscarProcedimentosTuss(termo);
    }, 300);
  }, [buscarProcedimentosTuss]);
  
  // Carregar procedimentos TUSS iniciais
  useEffect(() => {
    buscarProcedimentosTuss();
    
    // Limpar timeouts ao desmontar o componente
    return () => {
      if (timeoutEntidadesRef.current) {
        clearTimeout(timeoutEntidadesRef.current);
      }
      if (timeoutTussRef.current) {
        clearTimeout(timeoutTussRef.current);
      }
    };
  }, [buscarProcedimentosTuss]);

  // Atualizar entidades quando mudar o tipo
  useEffect(() => {
    if (tipoEntidadeSelecionada) {
      buscarEntidades(tipoEntidadeSelecionada, '');
    }
  }, [tipoEntidadeSelecionada, buscarEntidades]);

  const handleMudancaTipoEntidade = (valor: string) => {
    setTipoEntidadeSelecionada(valor);
    form.setValue('entity_id', 0);
    setTermoPesquisaEntidade('');
  };
  
  const handlePesquisaEntidade = (e: React.ChangeEvent<HTMLInputElement>) => {
    const termo = e.target.value;
    setTermoPesquisaEntidade(termo);
    
    console.log('Iniciando busca de entidades com termo:', termo);
    
    // Cancelar timer anterior se existir
    if (timeoutEntidadesRef.current) {
      clearTimeout(timeoutEntidadesRef.current);
    }
    
    // Criar novo timer
    if (tipoEntidadeSelecionada) {
      timeoutEntidadesRef.current = setTimeout(() => {
        console.log('Executando busca de entidades com termo:', termo);
        buscarEntidades(tipoEntidadeSelecionada, termo);
      }, 300);
    }
  };
  
  const handlePesquisaTuss = (e: React.ChangeEvent<HTMLInputElement>) => {
    const termo = e.target.value;
    setTermoPesquisaTuss(termo);
    
    console.log('Iniciando busca de procedimentos TUSS com termo:', termo);
    
    // Cancelar timer anterior se existir
    if (timeoutTussRef.current) {
      clearTimeout(timeoutTussRef.current);
    }
    
    // Criar novo timer com timeout mais curto para testes
    timeoutTussRef.current = setTimeout(() => {
      console.log('Executando busca de procedimentos TUSS com termo:', termo);
      buscarProcedimentosTuss(termo);
    }, 300);
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

  // Adicionar antes da renderização do componente
  useEffect(() => {
    console.log('Estado atual das entidades:', opcoesEntidades);
  }, [opcoesEntidades]);

  useEffect(() => {
    console.log('Estado atual dos procedimentos TUSS:', opcoesTuss);
  }, [opcoesTuss]);

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
                        <div className="space-y-2">
                          {tipoEntidadeSelecionada && (
                            <div className="relative">
                              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Pesquisar entidade..."
                                className="pl-8"
                                value={termoPesquisaEntidade}
                                onChange={handlePesquisaEntidade}
                                disabled={!tipoEntidadeSelecionada || carregandoEntidades}
                              />
                            </div>
                          )}
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value?.toString()}
                            disabled={!tipoEntidadeSelecionada || carregandoEntidades}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={carregandoEntidades ? "Carregando..." : "Selecione a entidade"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {carregandoEntidades ? (
                                <div className="flex items-center justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span className="text-sm">Carregando...</span>
                                </div>
                              ) : opcoesEntidades.length === 0 ? (
                                <div className="p-2 text-center text-sm text-muted-foreground">
                                  Nenhuma entidade encontrada
                                </div>
                              ) : (
                                opcoesEntidades.map(entity => (
                                  <SelectItem key={entity.id} value={String(entity.id)}>
                                    {entity.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
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
                            <div className="space-y-2">
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Pesquisar procedimento..."
                                  className="pl-8"
                                  value={termoPesquisaTuss}
                                  onChange={handlePesquisaTuss}
                                  disabled={carregandoTuss}
                                />
                              </div>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString()}
                                disabled={carregandoTuss}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={carregandoTuss ? "Carregando..." : "Selecione o procedimento"} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {carregandoTuss ? (
                                    <div className="flex items-center justify-center p-2">
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      <span className="text-sm">Carregando...</span>
                                    </div>
                                  ) : opcoesTuss.length === 0 ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                      Nenhum procedimento encontrado
                                    </div>
                                  ) : (
                                    opcoesTuss.map(tuss => (
                                      <SelectItem key={tuss.id} value={String(tuss.id)}>
                                        {tuss.code} - {tuss.name}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
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
                  {carregando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : 'Criar Negociação'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 