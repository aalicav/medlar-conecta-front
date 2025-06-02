import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatDate } from "@/lib/utils";
import { EyeIcon, PencilIcon, AlertCircle, CheckCircle } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/components/ui/use-toast";
import { NegotiationItem, NegotiationStatus } from "@/types/negotiations";

interface EstablishmentNegotiationTableProps {
  items: NegotiationItem[];
  onEdit: (item: NegotiationItem) => void;
  onView: (item: NegotiationItem) => void;
}

export function EstablishmentNegotiationTable({
  items,
  onEdit,
  onView,
}: EstablishmentNegotiationTableProps) {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("edit negotiations");

  const getStatusBadge = (status: NegotiationStatus) => {
    const variants = {
      pending: "default",
      approved: "success",
      rejected: "destructive",
    } as const;

    const labels = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status === "approved" && <CheckCircle className="w-4 h-4 mr-1" />}
        {status === "rejected" && <AlertCircle className="w-4 h-4 mr-1" />}
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código TUSS</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="text-right">Valor Proposto</TableHead>
            <TableHead className="text-right">Valor Aprovado</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Última Atualização</TableHead>
            <TableHead>Atualizado por</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.tuss.code}</TableCell>
              <TableCell>{item.tuss.description}</TableCell>
              <TableCell className="text-right">
                {formatMoney(item.proposed_value)}
              </TableCell>
              <TableCell className="text-right">
                {item.approved_value ? formatMoney(item.approved_value) : "-"}
              </TableCell>
              <TableCell>{getStatusBadge(item.status)}</TableCell>
              <TableCell>{formatDate(new Date(item.created_at))}</TableCell>
              <TableCell>{item.updated_by.name}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(item)}
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  {canEdit && item.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                    >
                      <PencilIcon className="h-4 w-4" />
                      Editar
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 