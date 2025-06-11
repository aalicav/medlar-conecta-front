"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { NegotiationItem } from "@/types/negotiations";
import { specialtyService } from "@/services/specialtyService";
import { negotiationService } from "@/services/negotiationService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  FileText,
  ChevronDown,
  Search,
  Check,
  User,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TussOption {
  id: number;
  code: string;
  name: string;
  description?: string;
}

const negotiationFormSchema = z.object({
  tuss_id: z.number({
    required_error: "Selecione um procedimento TUSS",
  }),
  proposed_value: z.number({
    required_error: "Informe o valor proposto",
  }).min(0, "O valor deve ser maior que zero"),
  notes: z.string().optional(),
  medical_specialty_id: z.number().optional(),
});

type NegotiationFormValues = z.infer<typeof negotiationFormSchema>;

interface NegotiationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: NegotiationFormValues) => Promise<void>;
  initialData?: NegotiationItem;
}

interface MedicalSpecialty {
  id: number;
  name: string;
  default_price: number;
}

export function NegotiationForm({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: NegotiationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [specialties, setSpecialties] = useState<MedicalSpecialty[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);
  const [tussOptions, setTussOptions] = useState<TussOption[]>([]);
  const [tussSearchTerm, setTussSearchTerm] = useState("");
  const [searchingTuss, setSearchingTuss] = useState(false);

  const form = useForm<NegotiationFormValues>({
    resolver: zodResolver(negotiationFormSchema),
    defaultValues: {
      tuss_id: initialData?.tuss?.id,
      proposed_value: typeof initialData?.proposed_value === 'string' 
        ? parseFloat(initialData.proposed_value) 
        : initialData?.proposed_value,
      notes: initialData?.notes || undefined,
      medical_specialty_id: initialData?.medical_specialty?.id,
    },
  });

  // Carregar especialidades médicas quando necessário
  const loadSpecialties = async () => {
    if (loadingSpecialties) return;
    
    setLoadingSpecialties(true);
    try {
      const response = await specialtyService.list();
      setSpecialties(response);
    } catch (error) {
      console.error("Erro ao carregar especialidades:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as especialidades médicas",
        variant: "destructive",
      });
    } finally {
      setLoadingSpecialties(false);
    }
  };

  const searchTussProcedures = async (term: string) => {
    setTussSearchTerm(term);
    if (term.length < 3) return;
    
    setSearchingTuss(true);
    try {
      const response = await negotiationService.getTussProcedures(term);
      if (response.data) {
        setTussOptions(response.data as TussOption[]);
      }
    } catch (error) {
      console.error("Erro ao buscar procedimentos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível buscar os procedimentos",
        variant: "destructive",
      });
    } finally {
      setSearchingTuss(false);
    }
  };

  const handleSubmit = async (data: NegotiationFormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
      toast({
        title: "Sucesso",
        description: initialData 
          ? "Negociação atualizada com sucesso"
          : "Negociação criada com sucesso",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Erro ao salvar negociação:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a negociação",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Negociação" : "Nova Negociação"}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Edite os valores e detalhes da negociação'
              : 'Adicione um novo procedimento TUSS e seu valor negociado'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tuss_id"
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
                                  // Carregar especialidades se o código for 10101012
                                  if (tuss.code === '10101012') {
                                    loadSpecialties();
                                  }
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

            {/* Campo de especialidade médica quando TUSS é 10101012 */}
            {tussOptions.find(t => t.id === form.watch('tuss_id'))?.code === '10101012' && (
              <FormField
                control={form.control}
                name="medical_specialty_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <User className="h-4 w-4 mr-1.5 text-primary" />
                      Especialidade Médica
                    </FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                      disabled={loadingSpecialties}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a especialidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {specialties.map((specialty) => (
                          <SelectItem
                            key={specialty.id}
                            value={specialty.id.toString()}
                          >
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
              name="proposed_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Proposto</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
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
                      placeholder="Observações sobre a negociação..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 