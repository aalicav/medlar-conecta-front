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
  const [loading, setLoading] = useState(false);

  const formatValue = (value: string | number): number => {
    return typeof value === 'string' ? parseFloat(value) : value;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Código TUSS</TableHead>
          <TableHead>Procedimento</TableHead>
          <TableHead>Especialidade</TableHead>
          <TableHead className="text-right">Valor Proposto</TableHead>
          <TableHead className="text-right">Valor Aprovado</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              <Badge variant="outline" className="h-5 text-xs">
                {item.tuss?.code}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="font-medium">{item.tuss?.name}</div>
              <div className="text-xs text-muted-foreground truncate max-w-[400px]">
                {item.tuss?.description}
              </div>
            </TableCell>
            <TableCell>
              {item.medical_specialty ? (
                <Badge variant="outline" className="text-xs">
                  {item.medical_specialty.name}
                </Badge>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatMoney(formatValue(item.proposed_value))}
            </TableCell>
            <TableCell className="text-right font-medium">
              {item.approved_value ? formatMoney(formatValue(item.approved_value)) : "-"}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  item.status === "approved"
                    ? "default"
                    : item.status === "rejected"
                    ? "destructive"
                    : item.status === "counter_offered"
                    ? "secondary"
                    : "outline"
                }
              >
                {item.status === "approved"
                  ? "Aprovado"
                  : item.status === "rejected"
                  ? "Rejeitado"
                  : item.status === "counter_offered"
                  ? "Contra-proposta"
                  : "Pendente"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onView(item)}
                  title="Visualizar"
                >
                  <EyeIcon className="h-4 w-4" />
                </Button>
                {hasPermission("negotiations.update") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(item)}
                    title="Editar"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
} 