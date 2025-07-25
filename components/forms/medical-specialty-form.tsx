"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { MedicalSpecialty } from "@/services/specialtyService";

// Schema de validação
const medicalSpecialtySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  tuss_code: z.string().min(1, "Código TUSS é obrigatório").max(20, "Código TUSS muito longo"),
  tuss_description: z.string().min(1, "Descrição TUSS é obrigatória"),
  default_price: z.number().min(0, "Preço deve ser maior ou igual a zero"),
  negotiable: z.boolean().default(true),
  active: z.boolean().default(true),
});

type MedicalSpecialtyFormValues = z.infer<typeof medicalSpecialtySchema>;

interface MedicalSpecialtyFormProps {
  initialData?: MedicalSpecialty;
  onSubmit: (data: MedicalSpecialtyFormValues) => Promise<void>;
  loading?: boolean;
  submitButtonText?: string;
  submitButtonIcon?: React.ReactNode;
}

export function MedicalSpecialtyForm({
  initialData,
  onSubmit,
  loading = false,
  submitButtonText = "Salvar",
  submitButtonIcon,
}: MedicalSpecialtyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MedicalSpecialtyFormValues>({
    resolver: zodResolver(medicalSpecialtySchema),
    defaultValues: {
      name: initialData?.name || "",
      tuss_code: initialData?.tuss_code || "",
      tuss_description: initialData?.tuss_description || "",
      default_price: initialData?.default_price || 0,
      negotiable: initialData?.negotiable ?? true,
      active: initialData?.active ?? true,
    },
  });

  const handleSubmit = async (data: MedicalSpecialtyFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Erro ao submeter formulário:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Especialidade</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Cardiologia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Código TUSS */}
          <FormField
            control={form.control}
            name="tuss_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código TUSS</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: 2.01.01.07-0" {...field} />
                </FormControl>
                <FormDescription>
                  Código único da especialidade no sistema TUSS
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Descrição TUSS */}
        <FormField
          control={form.control}
          name="tuss_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição TUSS</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descrição completa da especialidade conforme TUSS..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Descrição detalhada da especialidade conforme definido no sistema TUSS
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Preço Padrão */}
        <FormField
          control={form.control}
          name="default_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preço Padrão (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormDescription>
                Preço padrão para consultas desta especialidade
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Configurações */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Especialidade Ativa</FormLabel>
                      <FormDescription>
                        Especialidades inativas não aparecem nas listas de seleção
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="negotiable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Preço Negociável</FormLabel>
                      <FormDescription>
                        Permite que o preço seja negociado com convênios e profissionais
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botão de Submissão */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading || isSubmitting}
            className="min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                {submitButtonIcon}
                {submitButtonText}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
} 