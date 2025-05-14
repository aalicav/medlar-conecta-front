import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api-client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { EntityDocumentType } from "@/hooks/useEntityDocumentTypes";

interface EntityDocumentTypeFormData {
  entity_type: string;
  name: string;
  code: string;
  description?: string;
  is_required: boolean;
  is_active: boolean;
  expiration_alert_days?: number;
}

export function EntityDocumentTypes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<EntityDocumentType | null>(null);
  const queryClient = useQueryClient();

  const { data: documentTypes, isLoading } = useQuery<EntityDocumentType[]>({
    queryKey: ["entity-document-types"],
    queryFn: async () => {
      const { data } = await api.get("/entity-document-types");
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: EntityDocumentTypeFormData) => {
      const { data } = await api.post("/entity-document-types", formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-document-types"] });
      setIsDialogOpen(false);
      toast({
        title: "Sucesso",
        description: "Tipo de documento criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao criar tipo de documento.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      formData,
    }: {
      id: number;
      formData: Partial<EntityDocumentTypeFormData>;
    }) => {
      const { data } = await api.put(`/entity-document-types/${id}`, formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-document-types"] });
      setIsDialogOpen(false);
      setEditingType(null);
      toast({
        title: "Sucesso",
        description: "Tipo de documento atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar tipo de documento.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/entity-document-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entity-document-types"] });
      toast({
        title: "Sucesso",
        description: "Tipo de documento excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: error.response?.data?.message || "Erro ao excluir tipo de documento.",
        variant: "destructive",
      });
    },
  });

  const [formState, setFormState] = useState<EntityDocumentTypeFormData>({
    entity_type: editingType?.entity_type || '',
    name: editingType?.name || '',
    code: editingType?.code || '',
    description: editingType?.description || '',
    is_required: editingType?.is_required || false,
    is_active: editingType?.is_active || true,
    expiration_alert_days: editingType?.expiration_alert_days || undefined,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingType) {
      updateMutation.mutate({ id: editingType.id, formData: formState });
    } else {
      createMutation.mutate(formState);
    }
  };

  const handleEdit = (type: any) => {
    setEditingType(type);
    setFormState({
      entity_type: type.entity_type,
      name: type.name,
      code: type.code,
      description: type.description,
      is_required: type.is_required,
      is_active: type.is_active,
      expiration_alert_days: type.expiration_alert_days,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este tipo de documento?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tipos de Documentos</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Tipo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType ? "Editar Tipo de Documento" : "Novo Tipo de Documento"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entity_type">Tipo de Entidade</Label>
                <Input
                  id="entity_type"
                  name="entity_type"
                  value={formState.entity_type}
                  onChange={e => setFormState(prev => ({ ...prev, entity_type: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  name="name"
                  value={formState.name}
                  onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  name="code"
                  value={formState.code}
                  onChange={e => setFormState(prev => ({ ...prev, code: e.target.value }))}
                  required
                  disabled={!!editingType}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  name="description"
                  value={formState.description}
                  onChange={e => setFormState(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration_alert_days">Dias para Alerta de Expiração</Label>
                <Input
                  id="expiration_alert_days"
                  name="expiration_alert_days"
                  type="number"
                  min="1"
                  value={formState.expiration_alert_days?.toString() || ""}
                  onChange={e => setFormState(prev => ({ ...prev, expiration_alert_days: e.target.value ? parseInt(e.target.value) : undefined }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_required"
                  name="is_required"
                  checked={formState.is_required}
                  onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, is_required: checked }))}
                />
                <Label htmlFor="is_required">Obrigatório</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  name="is_active"
                  checked={formState.is_active}
                  onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingType(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingType ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>Carregando...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo de Entidade</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Obrigatório</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Dias para Alerta</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documentTypes?.map((type: any) => (
              <TableRow key={type.id}>
                <TableCell>{type.entity_type}</TableCell>
                <TableCell>{type.name}</TableCell>
                <TableCell>{type.code}</TableCell>
                <TableCell>{type.is_required ? "Sim" : "Não"}</TableCell>
                <TableCell>{type.is_active ? "Sim" : "Não"}</TableCell>
                <TableCell>{type.expiration_alert_days || "-"}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(type)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(type.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
} 