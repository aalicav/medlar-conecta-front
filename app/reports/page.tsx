'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { FileText, Download, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Report {
  id: number;
  name: string;
  type: string;
  description: string;
  created_at: string;
  is_scheduled: boolean;
  schedule_frequency?: string;
  is_public: boolean;
  generations: {
    id: number;
    status: string;
    completed_at: string;
  }[];
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [filters, setFilters] = useState({
    type: '',
    is_scheduled: '',
    created_by: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.is_scheduled) queryParams.append('is_scheduled', filters.is_scheduled);
      if (filters.created_by) queryParams.append('created_by', filters.created_by);

      const response = await fetch(`/api/reports?${queryParams.toString()}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setReports(data.data.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (generationId: number) => {
    try {
      const response = await fetch(`/api/reports/generations/${generationId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${generationId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'processing':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <Button onClick={() => router.push('/reports/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Relatório
        </Button>
      </div>

      <Card className="p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <Select
            value={filters.type}
            onValueChange={(value) => setFilters({ ...filters, type: value })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo de Relatório" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financial">Financeiro</SelectItem>
              <SelectItem value="appointment">Agendamentos</SelectItem>
              <SelectItem value="performance">Desempenho</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.is_scheduled}
            onValueChange={(value) => setFilters({ ...filters, is_scheduled: value })}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Agendamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Agendados</SelectItem>
              <SelectItem value="false">Não Agendados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agendamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => {
              const lastGeneration = report.generations[0];
              return (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>
                    {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                  </TableCell>
                  <TableCell>
                    {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {lastGeneration && (
                      <span className={getStatusColor(lastGeneration.status)}>
                        {lastGeneration.status.charAt(0).toUpperCase() + lastGeneration.status.slice(1)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {report.is_scheduled ? (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-blue-600" />
                        {report.schedule_frequency}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {lastGeneration && lastGeneration.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(lastGeneration.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/reports/${report.id}`)}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
} 