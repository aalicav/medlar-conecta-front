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
import { TussSearch } from "@/components/tuss-search";
import { toast } from "@/components/ui/use-toast";
import { NegotiationItem } from "@/types/negotiations";
import { specialtyService } from "@/services/specialtyService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [selectedTussCode, setSelectedTussCode] = useState<string>("");
  const [specialties, setSpecialties] = useState<MedicalSpecialty[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);

  const form = useForm<NegotiationFormValues>({
    resolver: zodResolver(negotiationFormSchema),
    defaultValues: {
      tuss_id: initialData?.tuss.id,
      proposed_value: initialData?.proposed_value,
      notes: initialData?.notes,
      medical_specialty_id: initialData?.medical_specialty?.id,
    },
  });

  // Carregar especialidades médicas quando necessário
  useEffect(() => {
    const loadSpecialties = async () => {
      if (selectedTussCode === "10101012" && !loadingSpecialties) {
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
      }
    };

    loadSpecialties();
  }, [selectedTussCode, loadingSpecialties]);

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
        variant: "success",
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
                  <FormLabel>Procedimento TUSS</FormLabel>
                  <FormControl>
                    <TussSearch
                      onSelect={(tuss) => {
                        field.onChange(tuss.id);
                        setSelectedTussCode(tuss.code);
                      }}
                      defaultValue={initialData?.tuss}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedTussCode === "10101012" && (
              <FormField
                control={form.control}
                name="medical_specialty_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidade Médica</FormLabel>
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