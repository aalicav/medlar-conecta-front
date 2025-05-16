"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2,
  Calendar,
  Search,
  Info,
  FileText,
  Loader2,
  DollarSign,
  User,
  ClipboardList,
  ChevronDown,
  Check
} from 'lucide-react';
import { format } from 'date-fns';

import { 
  negotiationService, 
  Negotiation,
  UpdateNegotiationDto, 
  NegotiationItem 
} from '../../../services/negotiationService';
import { apiClient } from '../../../services/apiClient';

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
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
} from "@/components/ui/command";

interface EntityOption {
  id: number;
  name: string;
  type: string;
}

interface TussOption {
  id: number;
  code: string;
  name: string;
}

interface FormValues {
  title: string;
  entity_type: string;
  entity_id: number;
  start_date: Date;
  end_date: Date;
  description?: string;
  notes?: string;
  items: {
    id?: number;
    tuss_id: number;
    proposed_value: number;
    notes?: string;
  }[];
}

export default function EditNegotiationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  // NOTA: Em versões futuras do Next.js, será necessário usar React.use(params) 
  // em vez do acesso direto a params.id
  const negotiationId = params.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [entityOptions, setEntityOptions] = useState<EntityOption[]>([]);
  const [selectedEntityType, setSelectedEntityType] = useState<string>('');
  const [tussOptions, setTussOptions] = useState<TussOption[]>([]);
  const [searchingTuss, setSearchingTuss] = useState(false);
  const [tussSearchTerm, setTussSearchTerm] = useState('');
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    defaultValues: {
      title: '',
      entity_type: '',
      entity_id: 0,
      start_date: new Date(),
      end_date: new Date(),
      items: [{ tuss_id: 0, proposed_value: 0 }]
    }
  });

  // Buscar negociação
  useEffect(() => {
    const fetchNegotiation = async () => {
      setLoading(true);
      try {
        const response = await negotiationService.getNegotiation(parseInt(negotiationId));
        setNegotiation(response.data);
        
        // Definir tipagem explícita para os itens
        const negotiationItems: NegotiationItem[] = response.data.items;
        
        // Configurar valores iniciais do formulário com tipagem explícita
        const items = negotiationItems.map((item: NegotiationItem) => ({
          id: item.id,
          tuss_id: item.tuss_id,
          proposed_value: item.proposed_value,
          notes: item.notes || undefined
        }));
        
        form.reset({
          title: response.data.title,
          entity_type: response.data.negotiable_type,
          entity_id: response.data.negotiable_id,
          start_date: new Date(response.data.start_date),
          end_date: new Date(response.data.end_date),
          description: response.data.description || undefined,
          notes: response.data.notes || undefined,
          items: items.length > 0 ? items : [{ tuss_id: 0, proposed_value: 0 }]
        });
        
        setSelectedEntityType(response.data.negotiable_type);
      } catch (error) {
        console.error('Erro ao buscar negociação:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da negociação",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNegotiation();
  }, [negotiationId, form, toast]);

  // Carregar opções de entidades e procedimentos TUSS
  useEffect(() => {
    // Buscar procedimentos TUSS iniciais
    const fetchTussProcedures = async () => {
      setSearchingTuss(true);
      try {
        const response = await negotiationService.getTussProcedures();
        if (response && response.success && Array.isArray(response.data)) {
          setTussOptions(response.data);
        } else {
          console.error('Formato de resposta inválido para procedimentos TUSS:', response);
          setTussOptions([]);
        }
      } catch (error) {
        console.error('Erro ao carregar procedimentos TUSS:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os procedimentos TUSS",
          variant: "destructive"
        });
      } finally {
        setSearchingTuss(false);
      }
    };
    
    fetchTussProcedures();
  }, [toast]);

  // Carregar entidades baseadas no tipo selecionado
  useEffect(() => {
    if (!selectedEntityType) return;
    
    const fetchEntities = async () => {
      setEntityOptions([]);
      
      try {
        // Definir o endpoint baseado no tipo de entidade
        let endpoint = '';
        
        if (selectedEntityType === 'App\\Models\\HealthPlan') {
          endpoint = '/health-plans';
        } else if (selectedEntityType === 'App\\Models\\Professional') {
          endpoint = '/professionals';
        } else if (selectedEntityType === 'App\\Models\\Clinic') {
          endpoint = '/clinics';
        } else {
          throw new Error('Tipo de entidade inválido');
        }
        
        const response = await apiClient.get(endpoint, { 
          params: { per_page: 50 }
        });
        
        // Extrair dados da resposta paginada
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          setEntityOptions(response.data.data);
        } else {
          console.error('Formato de resposta inválido para entidades:', response.data);
          setEntityOptions([]);
        }
      } catch (error) {
        console.error(`Erro ao carregar ${selectedEntityType}:`, error);
        toast({
          title: "Erro",
          description: `Não foi possível carregar as opções de entidade`,
          variant: "destructive"
        });
      }
    };
    
    fetchEntities();
  }, [selectedEntityType, toast]);

  const handleEntityTypeChange = (value: string) => {
    setSelectedEntityType(value);
    form.setValue('entity_id', 0);
  };
  
  const searchTussProcedures = async (term: string) => {
    setTussSearchTerm(term);
    if (term.length < 3) return;
    
    setSearchingTuss(true);
    try {
      const response = await negotiationService.getTussProcedures(term);
      if (response && response.success && Array.isArray(response.data)) {
        setTussOptions(response.data);
      } else {
        console.error('Formato de resposta inválido para procedimentos TUSS:', response);
        setTussOptions([]);
      }
    } catch (error) {
      console.error('Erro ao buscar procedimentos TUSS:', error);
    } finally {
      setSearchingTuss(false);
    }
  };

  // Implementar busca de entidades com debounce
  const [entitySearchTerm, setEntitySearchTerm] = useState('');
  const [searchingEntities, setSearchingEntities] = useState(false);
  
  const searchEntities = async (term: string) => {
    setEntitySearchTerm(term);
    if (!selectedEntityType || term.length < 2) return;
    
    setSearchingEntities(true);
    try {
      // Definir o endpoint baseado no tipo de entidade
      let endpoint = '';
      
      if (selectedEntityType === 'App\\Models\\HealthPlan') {
        endpoint = '/health-plans';
      } else if (selectedEntityType === 'App\\Models\\Professional') {
        endpoint = '/professionals';
      } else if (selectedEntityType === 'App\\Models\\Clinic') {
        endpoint = '/clinics';
      } else {
        throw new Error('Tipo de entidade inválido');
      }
      
      const response = await apiClient.get(endpoint, { 
        params: { search: term, per_page: 50 }
      });
      
      // Extrair dados da resposta paginada
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        setEntityOptions(response.data.data);
      } else {
        console.error('Formato de resposta inválido para entidades:', response.data);
        setEntityOptions([]);
      }
    } catch (error) {
      console.error(`Erro ao buscar ${selectedEntityType}:`, error);
    } finally {
      setSearchingEntities(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!negotiation) return;
    
    const formattedValues = {
      title: values.title,
      description: values.description,
      notes: values.notes,
      start_date: format(values.start_date, 'yyyy-MM-dd'),
      end_date: format(values.end_date, 'yyyy-MM-dd'),
      entity_type: values.entity_type,
      entity_id: values.entity_id,
      items: values.items.map((item) => ({
        id: item.id, // Pode ser undefined para novos itens
        tuss_id: item.tuss_id,
        proposed_value: item.proposed_value,
        notes: item.notes
      }))
    };
    
    setSaving(true);
    try {
      await negotiationService.updateNegotiation(negotiation.id, formattedValues as UpdateNegotiationDto);
      toast({
        title: "Sucesso",
        description: "Negociação atualizada com sucesso",
      });
      router.push(`/negotiations/${negotiation.id}`);
    } catch (error) {
      console.error('Erro ao atualizar negociação:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar a negociação",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addItem = () => {
    const items = form.getValues('items');
    form.setValue('items', [...items, { tuss_id: 0, proposed_value: 0 }]);
  };

  const removeItem = (index: number) => {
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

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[70vh] space-y-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-muted-foreground text-lg">Carregando dados da negociação...</p>
      </div>
    );
  }

  if (!negotiation) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">Painel</Link>
          <span>/</span>
          <Link href="/negotiations" className="hover:underline">Negociações</Link>
          <span>/</span>
          <span>Editar</span>
        </div>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6 flex flex-col items-center justify-center py-10">
            <Info className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Negociação não encontrada</h2>
            <p className="text-muted-foreground mb-4">Não foi possível encontrar a negociação solicitada.</p>
            <Button onClick={() => router.push('/negotiations')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para Negociações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Link href="/dashboard" className="hover:underline">Painel</Link>
        <span>/</span>
        <Link href="/negotiations" className="hover:underline">Negociações</Link>
        <span>/</span>
        <Link href={`/negotiations/${negotiation.id}`} className="hover:underline">{negotiation.title}</Link>
        <span>/</span>
        <span className="text-foreground font-medium">Editar</span>
      </div>
      
      {/* Header */}
      <div className="bg-card border rounded-lg p-6 shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push(`/negotiations/${negotiation.id}`)} className="mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Button>
            <div>
              <Badge variant="outline" className="mb-2">
                Rascunho
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight mb-1">{negotiation.title}</h1>
              <p className="text-muted-foreground">Faça as alterações necessárias na negociação</p>
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
                            handleEntityTypeChange(value);
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
                          {searchingEntities && (
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
                          disabled={!selectedEntityType}
                        >
                                {field.value && entityOptions.find((entity) => entity.id === field.value) ? (
                                  <div className="flex items-center">
                                    <span className="truncate max-w-[300px]">
                                      {entityOptions.find((entity) => entity.id === field.value)?.name}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">
                                    {!selectedEntityType ? "Selecione o tipo de entidade primeiro" : "Selecione a entidade"}
                                  </span>
                                )}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                              <Command>
                                <div className="flex items-center border-b px-3">
                                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                  <CommandInput
                                    placeholder="Buscar entidade..."
                                    className="h-9 flex-1 border-0 outline-none focus:ring-0"
                                    value={entitySearchTerm}
                                    onValueChange={(value) => searchEntities(value)}
                                    disabled={!selectedEntityType}
                                  />
                                  {searchingEntities && (
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />
                                  )}
                                </div>
                                <CommandEmpty className="py-6 text-center text-sm">
                                  <div className="mb-2">Nenhuma entidade encontrada</div>
                                  <div className="text-xs text-muted-foreground">Tente outros termos de busca</div>
                                </CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-auto">
                                  {entityOptions.length > 0 && (
                                    <div className="p-1 text-xs text-muted-foreground border-b mx-2">
                                      {entityOptions.length} entidade(s) encontrada(s)
                                    </div>
                                  )}
                                  {entityOptions.map((entity) => (
                                    <CommandItem
                                      key={entity.id}
                                      value={entity.id.toString()}
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
                    onClick={addItem}
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
                      onClick={addItem}
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
                            
                            {item.tuss_id > 0 && tussOptions.find(t => t.id === item.tuss_id) && (
                              <Badge variant="secondary" className="ml-3">
                                {tussOptions.find(t => t.id === item.tuss_id)?.code}
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
                          onClick={() => removeItem(index)}
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
                        
                        {item.tuss_id > 0 && tussOptions.find(t => t.id === item.tuss_id) && (
                          <div className="text-sm font-medium mt-2">
                            {tussOptions.find(t => t.id === item.tuss_id)?.name}
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
                                  {searchingTuss && (
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
                                        {field.value && tussOptions.find((tuss) => tuss.id === field.value) ? (
                                          <div className="flex items-center">
                                            <Badge variant="outline" className="mr-2 text-xs font-normal">
                                              {tussOptions.find((tuss) => tuss.id === field.value)?.code}
                                            </Badge>
                                            <span className="truncate max-w-[250px]">
                                              {tussOptions.find((tuss) => tuss.id === field.value)?.name}
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
                                        <div className="flex items-center border-b px-3">
                                          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                          <CommandInput
                                            placeholder="Buscar por código ou nome..."
                                            className="h-9 flex-1 border-0 outline-none focus:ring-0"
                                            value={tussSearchTerm}
                                            onValueChange={(value) => searchTussProcedures(value)}
                                          />
                                          {searchingTuss && (
                                            <Loader2 className="ml-2 h-4 w-4 animate-spin opacity-50" />
                                          )}
                                        </div>
                                        <CommandEmpty className="py-6 text-center text-sm">
                                          <div className="mb-2">Nenhum procedimento encontrado</div>
                                          <div className="text-xs text-muted-foreground">Tente outros termos</div>
                                        </CommandEmpty>
                                        <CommandGroup className="max-h-[300px] overflow-auto">
                                          {tussOptions.length > 0 && (
                                            <div className="p-1 text-xs text-muted-foreground border-b mx-2">
                                              {tussOptions.length} procedimento(s) encontrado(s)
                                            </div>
                                          )}
                                          {tussOptions.map((tuss) => (
                                            <CommandItem
                                              key={tuss.id}
                                              value={tuss.id.toString()}
                                              onSelect={() => {
                                                field.onChange(tuss.id);
                                              }}
                                              className="data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary"
                                            >
                                              <div className="flex items-center">
                                                <Badge 
                                                  variant="outline" 
                                                  className={`mr-2 text-xs ${field.value === tuss.id ? 'bg-primary/20 border-primary/30' : ''}`}
                                                >
                                                  {tuss.code}
                                                </Badge>
                                                <span className={field.value === tuss.id ? 'font-medium' : ''}>
                                                  {tuss.name}
                                                </span>
                                              </div>
                                              {field.value === tuss.id && (
                                                <Check className="ml-auto h-4 w-4 text-primary" />
                                              )}
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
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
                        
                        {item.id && (
                          <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                            ID do item: {item.id}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push(`/negotiations/${negotiation.id}`)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="bg-primary hover:bg-primary/90"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Alterações
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 