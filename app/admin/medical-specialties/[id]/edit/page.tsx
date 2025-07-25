"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MedicalSpecialtyForm } from "@/components/forms/medical-specialty-form";
import { specialtyService, MedicalSpecialty, UpdateMedicalSpecialtyData } from "@/services/specialtyService";

interface EditMedicalSpecialtyPageProps {
  params: {
    id: string;
  };
}

export default function EditMedicalSpecialtyPage({ params }: EditMedicalSpecialtyPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [specialty, setSpecialty] = useState<MedicalSpecialty | null>(null);

  // Carregar dados da especialidade
  useEffect(() => {
    const loadSpecialty = async () => {
      try {
        const data = await specialtyService.getById(parseInt(params.id));
        setSpecialty(data);
      } catch (error) {
        console.error("Erro ao carregar especialidade:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados da especialidade",
          variant: "destructive",
        });
        router.push("/admin/medical-specialties");
      } finally {
        setLoadingData(false);
      }
    };

    loadSpecialty();
  }, [params.id, router, toast]);

  const handleSubmit = async (data: UpdateMedicalSpecialtyData) => {
    setLoading(true);
    try {
      await specialtyService.update(parseInt(params.id), data);

      toast({
        title: "Sucesso",
        description: "Especialidade médica atualizada com sucesso",
      });

      router.push("/admin/medical-specialties");
    } catch (error) {
      console.error("Erro ao atualizar especialidade:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a especialidade médica",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!specialty) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Especialidade não encontrada</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold tracking-tight">Editar Especialidade Médica</h1>
          <p className="text-muted-foreground">
            Edite as informações da especialidade "{specialty.name}"
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Especialidade</CardTitle>
        </CardHeader>
        <CardContent>
          <MedicalSpecialtyForm
            initialData={specialty}
            onSubmit={handleSubmit}
            loading={loading}
            submitButtonText="Salvar Alterações"
            submitButtonIcon={<Save className="h-4 w-4 mr-2" />}
          />
        </CardContent>
      </Card>
    </div>
  );
} 