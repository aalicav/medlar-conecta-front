"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit, Calendar, DollarSign, FileText, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { specialtyService, MedicalSpecialty } from "@/services/specialtyService";

interface MedicalSpecialtyDetailPageProps {
  params: {
    id: string;
  };
}

export default function MedicalSpecialtyDetailPage({ params }: MedicalSpecialtyDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
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
        setLoading(false);
      }
    };

    loadSpecialty();
  }, [params.id, router, toast]);

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
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
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold tracking-tight">{specialty.name}</h1>
            <p className="text-muted-foreground">
              Detalhes da especialidade médica
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/admin/medical-specialties/${specialty.id}/edit`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome</label>
              <p className="text-lg font-semibold">{specialty.name}</p>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Código TUSS</label>
              <p className="font-mono text-lg">{specialty.tuss_code}</p>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Badge variant={specialty.active ? "default" : "secondary"}>
                  {specialty.active ? "Ativa" : "Inativa"}
                </Badge>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Negociável</label>
              <div className="mt-1">
                <Badge variant={specialty.negotiable ? "default" : "outline"}>
                  {specialty.negotiable ? "Sim" : "Não"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Financeiras */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Informações Financeiras
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Preço Padrão</label>
              <p className="text-2xl font-bold text-green-600">
                {formatPrice(specialty.default_price)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Descrição TUSS */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Descrição TUSS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{specialty.tuss_description}</p>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Informações do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID</label>
                <p className="font-mono">{specialty.id}</p>
              </div>
              {specialty.created_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Criação</label>
                  <p>{formatDate(specialty.created_at)}</p>
                </div>
              )}
              {specialty.updated_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Última Atualização</label>
                  <p>{formatDate(specialty.updated_at)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 