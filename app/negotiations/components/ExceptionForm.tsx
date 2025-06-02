"use client"

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { negotiationService } from '@/services/negotiationService';

const formSchema = z.object({
  patient_id: z.number({
    required_error: "Selecione um paciente",
  }),
  tuss_id: z.number({
    required_error: "Selecione um procedimento TUSS",
  }),
  proposed_value: z.number({
    required_error: "Informe o valor proposto",
  }).min(0.01, "O valor deve ser maior que zero"),
  justification: z.string({
    required_error: "A justificativa é obrigatória",
  }).min(10, "A justificativa deve ter pelo menos 10 caracteres"),
});

interface ExceptionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof formSchema>) => void;
}

export function ExceptionForm({ open, onOpenChange, onSubmit }: ExceptionFormProps) {
  const [tussProcedures, setTussProcedures] = useState<Array<{ id: number; code: string; description: string; }>>([]);
  const [patients, setPatients] = useState<Array<{ id: number; name: string; }>>([]);
  const [searchTussTerm, setSearchTussTerm] = useState('');
  const [searchPatientTerm, setSearchPatientTerm] = useState('');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patient_id: 0,
      tuss_id: 0,
      proposed_value: 0,
      justification: '',
    },
  });

  useEffect(() => {
    const loadTussProcedures = async () => {
      try {
        const response = await negotiationService.getTussProcedures(searchTussTerm);
        if (response.success) {
          setTussProcedures(response.data);
        }
      } catch (error) {
        console.error('Error loading TUSS procedures:', error);
      }
    };

    if (searchTussTerm.length >= 2 || tussProcedures.length === 0) {
      loadTussProcedures();
    }
  }, [searchTussTerm]);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        const response = await negotiationService.searchPatients(searchPatientTerm);
        if (response.success) {
          setPatients(response.data);
        }
      } catch (error) {
        console.error('Error loading patients:', error);
      }
    };

    if (searchPatientTerm.length >= 2 || patients.length === 0) {
      loadPatients();
    }
  }, [searchPatientTerm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Negociação de Urgência</DialogTitle>
          <DialogDescription>
            Solicite uma exceção para atendimento urgente de procedimento não formalizado
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="patient_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Paciente</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? patients.find((patient) => patient.id === field.value)?.name
                            : "Selecione um paciente"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Busque pelo nome do paciente..." 
                          onValueChange={setSearchPatientTerm}
                        />
                        <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          {patients.map((patient) => (
                            <CommandItem
                              key={patient.id}
                              value={patient.name}
                              onSelect={() => {
                                form.setValue("patient_id", patient.id);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  patient.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {patient.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tuss_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Procedimento TUSS</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? tussProcedures.find((tuss) => tuss.id === field.value)?.description
                            : "Selecione um procedimento"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Busque por código ou descrição..." 
                          onValueChange={setSearchTussTerm}
                        />
                        <CommandEmpty>Nenhum procedimento encontrado.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-auto">
                          {tussProcedures.map((tuss) => (
                            <CommandItem
                              key={tuss.id}
                              value={tuss.code + tuss.description}
                              onSelect={() => {
                                form.setValue("tuss_id", tuss.id);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  tuss.id === field.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{tuss.code}</span>
                                <span className="text-sm text-muted-foreground">
                                  {tuss.description}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa da Urgência</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explique o motivo da urgência e necessidade da exceção..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">
                Solicitar Exceção
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 