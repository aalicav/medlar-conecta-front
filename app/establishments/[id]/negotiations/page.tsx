"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EstablishmentNegotiationTable } from "@/app/negotiations/components/EstablishmentNegotiationTable";
import { NegotiationForm } from "@/app/negotiations/components/NegotiationForm";
import { negotiationService } from "@/services/negotiationService";
import { toast } from "@/components/ui/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { NegotiationItem, CreateNegotiationDto, UpdateNegotiationDto, Negotiation, ApiResponse } from "@/types/negotiations";

interface NegotiationFormData {
  tuss_id: number;
  proposed_value: number;
  notes?: string;
}

export default function EstablishmentNegotiationsPage() {
  const params = useParams<{ id: string }>();
  const establishmentId = params?.id ? parseInt(params.id) : 0;
  const { hasPermission } = usePermissions();
  
  const [negotiations, setNegotiations] = useState<NegotiationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NegotiationItem | undefined>();

  useEffect(() => {
    if (establishmentId) {
      loadNegotiations();
    }
  }, [establishmentId]);

  const loadNegotiations = async () => {
    try {
      setIsLoading(true);
      const response = await negotiationService.getEstablishmentNegotiations(establishmentId);
      const negotiations = response.data.data;
      
      // Transform API response to NegotiationItem[]
      const items: NegotiationItem[] = negotiations.flatMap((negotiation: Negotiation) =>
        negotiation.items.map((item) => ({
          id: item.id,
          tuss: item.tuss,
          proposed_value: item.proposed_value,
          approved_value: item.approved_value,
          status: item.status,
          notes: item.notes,
          created_at: negotiation.created_at,
          updated_by: negotiation.created_by,
        }))
      );
      setNegotiations(items);
    } catch (error) {
      console.error("Error loading negotiations:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as negociações",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: NegotiationFormData) => {
    try {
      if (selectedItem) {
        const updateData: UpdateNegotiationDto = {
          items: [{
            id: selectedItem.id,
            tuss_id: formData.tuss_id,
            proposed_value: formData.proposed_value,
            notes: formData.notes,
          }],
        };
        await negotiationService.update(selectedItem.id, updateData);
      } else {
        const createData: CreateNegotiationDto = {
          establishment_id: establishmentId,
          items: [{
            tuss_id: formData.tuss_id,
            proposed_value: formData.proposed_value,
            notes: formData.notes,
          }],
        };
        await negotiationService.create(createData);
      }
      await loadNegotiations();
    } catch (error) {
      console.error("Error saving negotiation:", error);
      throw error;
    }
  };

  const handleEdit = (item: NegotiationItem) => {
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleView = (item: NegotiationItem) => {
    // TODO: Implement view details
    console.log("View item:", item);
  };

  const handleAddNew = () => {
    setSelectedItem(undefined);
    setShowForm(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Negociações</h1>
          <p className="text-muted-foreground">
            Gerenciar valores negociados para procedimentos TUSS
          </p>
        </div>
        {hasPermission("create negotiations") && (
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Negociação
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Valores Negociados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Carregando...</div>
          ) : (
            <EstablishmentNegotiationTable
              items={negotiations}
              onEdit={handleEdit}
              onView={handleView}
            />
          )}
        </CardContent>
      </Card>

      <NegotiationForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={handleSubmit}
        initialData={selectedItem}
      />
    </div>
  );
} 