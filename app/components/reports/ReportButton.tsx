'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Download, 
  Clock, 
  ChevronDown,
  Settings
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
import { ReportConfig } from '@/types/report';

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
  const [reportConfig, setReportConfig] = useState<ReportConfig | null>(null);
  
  useEffect(() => {
    fetchReportConfig();
  }, []);

  const fetchReportConfig = async () => {
    try {
      const response = await fetch('/api/reports/config');
      const data = await response.json();
      if (data.success) {
        setReportConfig(data.data);
      }
    } catch (error) {
      console.error('Error fetching report config:', error);
    }
  };

  const handleCreateReport = (type: string) => {
    router.push(`/reports/new?type=${type}`);
  };

  const handleViewReports = () => {
    router.push('/reports');
  };

  const handleScheduledReports = () => {
    router.push('/reports/scheduled');
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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Gerar Relatório</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {reportConfig && Object.entries(reportConfig.types).map(([key, type]) => (
          <DropdownMenuItem key={key} onClick={() => handleCreateReport(key)}>
            <FileText className="h-4 w-4 mr-2" />
            {type.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleViewReports}>
          <Download className="h-4 w-4 mr-2" />
          Relatórios Gerados
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleScheduledReports}>
          <Clock className="h-4 w-4 mr-2" />
          Relatórios Agendados
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 