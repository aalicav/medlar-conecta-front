'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  FileText, 
  Calendar, 
  Receipt,
  ChevronDown 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ReportButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

export default function ReportButton({ 
  variant = 'default',
  size = 'default', 
  showLabel = true 
}: ReportButtonProps) {
  const router = useRouter();
  
  const handleCreateReport = (type: string) => {
    router.push(`/reports/new?type=${type}`);
  };

  const handleViewReports = () => {
    router.push('/reports');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <FileText className="h-4 w-4 mr-2" />
          {showLabel && "Relatórios"}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Gerar Relatório</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleCreateReport('financial')}>
          <Receipt className="h-4 w-4 mr-2" />
          Financeiro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCreateReport('appointment')}>
          <Calendar className="h-4 w-4 mr-2" />
          Agendamentos
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleCreateReport('performance')}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Desempenho
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleViewReports}>
          <FileText className="h-4 w-4 mr-2" />
          Ver Todos os Relatórios
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 