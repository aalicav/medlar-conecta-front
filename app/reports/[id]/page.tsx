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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { FileText, Download, Clock, ArrowLeft, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '@/lib/api';

interface Report {
  id: number;
  name: string;
  type: string;
  description: string;
  parameters: any;
  file_format: string;
  is_scheduled: boolean;
  schedule_frequency?: string;
  is_public: boolean;
  created_at: string;
  generations: {
    id: number;
    status: string;
    completed_at: string;
  }[];
}

export default function ReportDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [params.id]);

  const fetchReport = async () => {
    try {
      const response = await api.get(`/reports/${params.id}`);
      const data = response.data;
      
      if (data.success) {
        console.log(data.data);
        setReport(data.data.report);
      } else {
        throw new Error(data.message || 'Failed to fetch report');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o relatório',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const response = await api.post(`/reports/generate`, {
          type: report?.type,
          format: report?.file_format,
          filters: report?.parameters,
        });

      const data = response.data;

      if (data.success) {
        toast({
          title: 'Sucesso',
          description: data.message,
        });
        fetchReport(); // Refresh to show new generation
      } else {
        throw new Error(data.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o relatório',
        variant: 'destructive',
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownload = async (generationId: number) => {
    try {
      const response = await api.get(`/reports/download/${generationId}`, {
        responseType: 'blob',
        headers: {
          Accept: '*/*'
        }
      });

      // Create blob from response data
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream' 
      });

      // Get filename from content-disposition or generate default
      let filename = `${report?.name?.toLowerCase().replace(/ /g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.${report?.file_format}`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.includes('filename=')) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches?.[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Create and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar o relatório',
        variant: 'destructive',
      });
    }
  };

  const handleToggleSchedule = async () => {
    if (!report) return;

    try {
      const response = await api.post(`/reports/${report.id}/toggle-schedule`);

      const data = response.data;

      if (data.success) {
        setReport(data.data);
        toast({
          title: 'Sucesso',
          description: data.message,
        });
      } else {
        throw new Error(data.message || 'Failed to toggle schedule');
      }
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o agendamento',
        variant: 'destructive',
      });
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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Carregando relatório...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Relatório não encontrado</h2>
          <Button onClick={() => router.push('/reports')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para relatórios
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">{report.name}</h1>
        </div>
        <Button onClick={handleGenerateReport} disabled={generatingReport}>
          {generatingReport ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Gerar Relatório
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Informações do Relatório</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Tipo</Label>
              <p className="font-medium">
                {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
              </p>
            </div>
            
            {report.description && (
              <div>
                <Label className="text-muted-foreground">Descrição</Label>
                <p className="font-medium">{report.description}</p>
              </div>
            )}

            <div>
              <Label className="text-muted-foreground">Formato</Label>
              <p className="font-medium uppercase">{report.file_format}</p>
            </div>

            <div>
              <Label className="text-muted-foreground">Criado em</Label>
              <p className="font-medium">
                {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>

            {report.is_scheduled && (
              <div>
                <Label className="text-muted-foreground">Frequência</Label>
                <p className="font-medium">
                  {report.schedule_frequency?.charAt(0).toUpperCase() + report.schedule_frequency?.slice(1)}
                </p>
              </div>
            )}

            <div className="pt-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Agendamento Automático</Label>
                <p className="text-sm text-muted-foreground">
                  {report.is_scheduled
                    ? 'O relatório será gerado automaticamente'
                    : 'O relatório precisa ser gerado manualmente'}
                </p>
              </div>
              <Switch
                checked={report.is_scheduled}
                onCheckedChange={handleToggleSchedule}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Parâmetros</h2>
          <div className="space-y-4">
            {Object.entries(report.parameters).map(([key, value]) => (
              <div key={key}>
                <Label className="text-muted-foreground">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}
                </Label>
                <p className="font-medium">
                  {typeof value === 'boolean'
                    ? value
                      ? 'Sim'
                      : 'Não'
                    : value?.toString() || '-'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Histórico de Gerações</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.generations.map((generation) => (
                <TableRow key={generation.id}>
                  <TableCell>
                    {format(new Date(generation.completed_at), 'dd/MM/yyyy HH:mm', {
                      locale: ptBR,
                    })}
                  </TableCell>
                  <TableCell>
                    <span className={getStatusColor(generation.status)}>
                      {generation.status.charAt(0).toUpperCase() +
                        generation.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {generation.status === 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(generation.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {report.generations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Nenhuma geração encontrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
} 