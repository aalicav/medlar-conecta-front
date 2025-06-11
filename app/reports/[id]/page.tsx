'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, RotateCw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import api from '../../../services/api-client';
import { formatDateTime } from '@/app/utils/formatters';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface Report {
  id: number;
  name: string;
  type: string;
  description: string;
  is_template: boolean;
  is_scheduled: boolean;
  created_at: string;
  generations: Generation[];
}

interface Generation {
  id: number;
  completed_at: string;
  file_format: string;
}

export default function ReportDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    if (!params?.id) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/reports/${params.id}`);
      if (response.data.status === 'success') {
        setReport(response.data.data);
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar o relatório"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o relatório"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!params?.id) return;
    
    try {
      const response = await api.post(`/reports/${params.id}/generate`);
      if (response.data.status === 'success') {
        toast({
          title: "Sucesso",
          description: "Relatório gerado com sucesso"
        });
        fetchReport(); // Refresh to show new generation
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao gerar relatório"
        });
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o relatório"
      });
    }
  };

  const handleDownload = async (generationId: number) => {
    try {
      const response = await api.get(`/reports/generations/${generationId}/download`, {
        responseType: 'blob'
      });
      
      // Create a blob from the response data
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${generationId}.${response.headers['content-type'].split('/')[1]}`;
      
      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível baixar o relatório"
      });
    }
  };

  const getReportTypeLabel = (type: string) => {
    const types = {
      financial: 'Financeiro',
      appointment: 'Agendamentos',
      performance: 'Desempenho',
      custom: 'Personalizado'
    };
    return types[type as keyof typeof types] || type;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl">Relatório não encontrado</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold">{report.name}</h1>
          <Badge variant={report.is_template ? "outline" : report.is_scheduled ? "secondary" : "default"}>
            {report.is_template ? "Modelo" : report.is_scheduled ? "Agendado" : "Relatório"}
          </Badge>
        </div>
        <Button onClick={handleGenerateReport}>
          <RotateCw className="mr-2 h-4 w-4" />
          Gerar Relatório
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="font-medium text-gray-500">Tipo</dt>
                <dd>{getReportTypeLabel(report.type)}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Criado em</dt>
                <dd>{formatDateTime(report.created_at)}</dd>
              </div>
              {report.description && (
                <div className="col-span-2">
                  <dt className="font-medium text-gray-500">Descrição</dt>
                  <dd>{report.description}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Gerações</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data de Geração</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.generations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-gray-500">
                      Nenhuma geração encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  report.generations.map((generation) => (
                    <TableRow key={generation.id}>
                      <TableCell>{formatDateTime(generation.completed_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(generation.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 