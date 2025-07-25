"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MedicalSpecialtyForm } from "@/components/forms/medical-specialty-form";
import { specialtyService, CreateMedicalSpecialtyData } from "@/services/specialtyService";

export default function NewMedicalSpecialtyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: CreateMedicalSpecialtyData) => {
    setLoading(true);
    try {
      await specialtyService.create(data);

      toast({
        title: "Sucesso",
        description: "Especialidade médica criada com sucesso",
      });

      router.push("/admin/medical-specialties");
    } catch (error) {
      console.error("Erro ao criar especialidade:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a especialidade médica",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nova Especialidade Médica</h1>
          <p className="text-muted-foreground">
            Crie uma nova especialidade médica no sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Especialidade</CardTitle>
        </CardHeader>
        <CardContent>
          <MedicalSpecialtyForm
            onSubmit={handleSubmit}
            loading={loading}
            submitButtonText="Criar Especialidade"
            submitButtonIcon={<Save className="h-4 w-4 mr-2" />}
          />
        </CardContent>
      </Card>
    </div>
  );
} 