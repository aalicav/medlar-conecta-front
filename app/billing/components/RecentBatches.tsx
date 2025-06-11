'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/format';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface BatchItem {
  id: number;
  description: string;
  total_amount: number;
  tuss_code: string;
  tuss_description: string;
  professional: {
    name: string;
    specialty: string;
  };
  patient: {
    name: string;
    document: string;
  };
  patient_journey: {
    scheduled_at: string;
    pre_confirmation: boolean;
    patient_confirmed: boolean;
    professional_confirmed: boolean;
    guide_status: string;
    patient_attended: boolean;
  };
}

interface Batch {
  id: number;
  reference_period: {
    start: string;
    end: string;
  };
  billing_date: string;
  due_date: string;
  total_amount: number;
  items_count: number;
  status: string;
  payment_status: string;
  operator: string;
  items: BatchItem[];
}

interface RecentBatchesProps {
  batches: Batch[] | null;
}

function Row({ batch }: { batch: Batch }) {
  const [open, setOpen] = useState(false);

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const statusMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
      processing: "outline"
    };
    return statusMap[status] || "outline";
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell>{batch.operator}</TableCell>
        <TableCell>
          {format(new Date(batch.billing_date), 'dd/MM/yyyy')}
        </TableCell>
        <TableCell>
          {format(new Date(batch.due_date), 'dd/MM/yyyy')}
        </TableCell>
        <TableCell className="text-right">{formatCurrency(batch.total_amount)}</TableCell>
        <TableCell className="text-center">{batch.items_count}</TableCell>
        <TableCell>
          <Badge 
            variant={getStatusVariant(batch.payment_status)}
          >
            {batch.payment_status.toUpperCase()}
          </Badge>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={7} className="p-0">
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleContent>
              <div className="p-4">
                <h4 className="text-sm font-medium mb-4">
                  Detalhes dos Atendimentos
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Status da Jornada</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="text-sm">
                            {item.patient.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.patient.document}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.professional.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.professional.specialty}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.tuss_description}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Código: {item.tuss_code}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge
                              variant={item.patient_journey.patient_attended ? "default" : "destructive"}
                            >
                              {item.patient_journey.patient_attended ? "Realizado" : "Faltou"}
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                              Guia: {item.patient_journey.guide_status}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Confirmações: {[
                                item.patient_journey.pre_confirmation && "Prévia",
                                item.patient_journey.patient_confirmed && "Paciente",
                                item.patient_journey.professional_confirmed && "Profissional"
                              ].filter(Boolean).join(", ")}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.total_amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TableCell>
      </TableRow>
    </>
  );
}

export function RecentBatches({ batches }: RecentBatchesProps) {
  if (!batches?.length) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground text-center">
          Nenhum lote de faturamento encontrado
        </p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Operadora</TableHead>
            <TableHead>Data Faturamento</TableHead>
            <TableHead>Vencimento</TableHead>
            <TableHead className="text-right">Valor Total</TableHead>
            <TableHead className="text-center">Itens</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <Row key={batch.id} batch={batch} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 