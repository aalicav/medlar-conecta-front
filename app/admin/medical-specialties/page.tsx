"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash2, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { specialtyService, MedicalSpecialty } from "@/services/specialtyService";

export default function MedicalSpecialtiesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [specialties, setSpecialties] = useState<MedicalSpecialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredSpecialties, setFilteredSpecialties] = useState<MedicalSpecialty[]>([]);

  // Carregar especialidades
  const loadSpecialties = async () => {
    setLoading(true);
    try {
      const data = await specialtyService.list();
      setSpecialties(data);
      setFilteredSpecialties(data);
    } catch (error) {
      console.error("Erro ao carregar especialidades:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as especialidades médicas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSpecialties();
  }, []);

  // Filtrar especialidades por termo de busca
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredSpecialties(specialties);
    } else {
      const filtered = specialties.filter(
        (specialty) =>
          specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          specialty.tuss_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          specialty.tuss_description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSpecialties(filtered);
    }
  }, [searchTerm, specialties]);

  // Excluir especialidade
  const handleDelete = async (id: number) => {
    try {
      await specialtyService.delete(id);
      toast({
        title: "Sucesso",
        description: "Especialidade excluída com sucesso",
      });
      loadSpecialties(); // Recarregar lista
    } catch (error) {
      console.error("Erro ao excluir especialidade:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a especialidade",
        variant: "destructive",
      });
    }
  };

  // Formatar preço
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Especialidades Médicas</h1>
          <p className="text-muted-foreground">
            Gerencie as especialidades médicas do sistema
          </p>
        </div>
        <Button onClick={() => router.push("/admin/medical-specialties/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Especialidade
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Especialidades</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código TUSS ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Código TUSS</TableHead>
                    <TableHead>Descrição TUSS</TableHead>
                    <TableHead>Preço Padrão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Negociável</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSpecialties.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "Nenhuma especialidade encontrada" : "Nenhuma especialidade cadastrada"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSpecialties.map((specialty) => (
                      <TableRow key={specialty.id}>
                        <TableCell className="font-medium">{specialty.name}</TableCell>
                        <TableCell className="font-mono text-sm">{specialty.tuss_code}</TableCell>
                        <TableCell className="max-w-xs truncate" title={specialty.tuss_description}>
                          {specialty.tuss_description}
                        </TableCell>
                        <TableCell>{formatPrice(specialty.default_price)}</TableCell>
                        <TableCell>
                          <Badge variant={specialty.active ? "default" : "secondary"}>
                            {specialty.active ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={specialty.negotiable ? "default" : "outline"}>
                            {specialty.negotiable ? "Sim" : "Não"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/medical-specialties/${specialty.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/medical-specialties/${specialty.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir a especialidade "{specialty.name}"?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(specialty.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 