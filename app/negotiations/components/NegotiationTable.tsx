"use client"

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { NegotiationItem, NegotiationStatus } from '@/types/negotiations';

interface NegotiationTableProps {
  items: NegotiationItem[];
  onApprove: (itemId: number) => void;
  onReject: (itemId: number) => void;
  onEdit: (item: NegotiationItem) => void;
}

export function NegotiationTable({ items, onApprove, onReject, onEdit }: NegotiationTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código TUSS</TableHead>
            <TableHead>Descrição do Procedimento</TableHead>
            <TableHead>Valor Negociado</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Última Atualização</TableHead>
            <TableHead>Inserido Por</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.tuss.code}</TableCell>
              <TableCell>{item.tuss.description}</TableCell>
              <TableCell>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(item.proposed_value)}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={item.status === 'approved' ? 'success' : 
                          item.status === 'rejected' ? 'destructive' : 
                          'secondary'}
                >
                  {item.status === 'pending' ? 'Pendente' :
                   item.status === 'approved' ? 'Aprovado' :
                   item.status === 'rejected' ? 'Rejeitado' : 'Desconhecido'}
                </Badge>
              </TableCell>
              <TableCell>{format(new Date(item.updated_at), 'dd/MM/yyyy HH:mm')}</TableCell>
              <TableCell>{item.creator?.name}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      Editar
                    </DropdownMenuItem>
                    {item.status === 'pending' && (
                      <>
                        <DropdownMenuItem onClick={() => onApprove(item.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Aprovar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onReject(item.id)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Rejeitar
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 