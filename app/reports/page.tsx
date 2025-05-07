'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw, PencilLine, Trash2, Plus } from "lucide-react";
import { toast } from '@/components/ui/use-toast';
import api from '../../services/api-client';
import { formatDateTime } from '@/app/utils/formatters';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface Report {
  id: number;
  name: string;
  type: string;
  is_template: boolean;
  is_scheduled: boolean;
  created_at: string;
  generations: Generation[];
}

interface Generation {
  id: number;
  completed_at: string;
}

interface Params {
  page: number;
  per_page: number;
  type?: string;
  is_template?: boolean;
  is_scheduled?: boolean;
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);
  const [user, setUser] = useState<any>({});

  // Filter states
  const [reportType, setReportType] = useState('all');
  const [isTemplate, setIsTemplate] = useState('all');
  const [isScheduled, setIsScheduled] = useState('all');

  useEffect(() => {
    // Safely access localStorage only on client side
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [page, rowsPerPage, reportType, isTemplate, isScheduled]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let params: Params = {
        page: page,
        per_page: rowsPerPage,
      };

      if (reportType !== 'all') {
        params.type = reportType;
      }

      if (isTemplate !== 'all') {
        params.is_template = isTemplate === 'true';
      }

      if (isScheduled !== 'all') {
        params.is_scheduled = isScheduled === 'true';
      }

      const response = await api.get('/api/reports', { params });
      if (response.data.status === 'success') {
        setReports(response.data.data.data);
        setTotal(response.data.meta.total);
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar os relatórios"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os relatórios"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleNewReport = () => {
    router.push('/reports/new');
  };

  const handleEditReport = (id: number) => {
    router.push(`/reports/${id}/edit`);
  };

  const handleViewReport = (id: number) => {
    router.push(`/reports/${id}`);
  };

  const handleGenerateReport = async (id: number) => {
    try {
      const response = await api.post(`/api/reports/${id}/generate`);
      if (response.data.status === 'success') {
        toast({
          title: "Sucesso",
          description: "Relatório gerado com sucesso"
        });
        window.open(response.data.data.download_url, '_blank');
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

  const handleDeleteClick = (report: Report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const handleDeleteReport = async () => {
    if (!reportToDelete) return;
    
    try {
      const response = await api.delete(`/api/reports/${reportToDelete.id}`);
      if (response.data.status === 'success') {
        toast({
          title: "Sucesso",
          description: "Relatório excluído com sucesso"
        });
        fetchReports();
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao excluir relatório"
        });
      }
    } catch (error) {
      console.error('Erro ao excluir relatório:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o relatório"
      });
    } finally {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
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

  const renderStatusBadge = (report: Report) => {
    if (report.is_template) {
      return <Badge variant="outline">Modelo</Badge>;
    }
    if (report.is_scheduled) {
      return <Badge variant="secondary">Agendado</Badge>;
    }
    return <Badge variant="default">Relatório</Badge>;
  };

  // Calculate total pages for pagination
  const totalPages = Math.ceil(total / rowsPerPage);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <Button onClick={handleNewReport}>
          <Plus className="mr-2 h-4 w-4" /> Novo Relatório
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="reportType" className="text-sm font-medium">
                Tipo de Relatório
              </label>
              <Select
                value={reportType}
                onValueChange={setReportType}
              >
                <SelectTrigger id="reportType">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="financial">Financeiro</SelectItem>
                  <SelectItem value="appointment">Agendamentos</SelectItem>
                  <SelectItem value="performance">Desempenho</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="isTemplate" className="text-sm font-medium">
                Modelo
              </label>
              <Select
                value={isTemplate}
                onValueChange={setIsTemplate}
              >
                <SelectTrigger id="isTemplate">
                  <SelectValue placeholder="É um modelo?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="isScheduled" className="text-sm font-medium">
                Agendado
              </label>
              <Select
                value={isScheduled}
                onValueChange={setIsScheduled}
              >
                <SelectTrigger id="isScheduled">
                  <SelectValue placeholder="É agendado?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Sim</SelectItem>
                  <SelectItem value="false">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead>Última geração</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Nenhum relatório encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <button 
                          onClick={() => handleViewReport(report.id)}
                          className="text-primary underline font-medium"
                        >
                          {report.name}
                        </button>
                      </TableCell>
                      <TableCell>{getReportTypeLabel(report.type)}</TableCell>
                      <TableCell>{renderStatusBadge(report)}</TableCell>
                      <TableCell>{formatDateTime(report.created_at)}</TableCell>
                      <TableCell>
                        {report.generations && report.generations.length > 0
                          ? formatDateTime(report.generations[0].completed_at)
                          : 'Nunca gerado'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleGenerateReport(report.id)}
                            title="Gerar relatório"
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleEditReport(report.id)}
                            title="Editar"
                          >
                            <PencilLine className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDeleteClick(report)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {reports.length > 0 ? (page - 1) * rowsPerPage + 1 : 0} a {Math.min(page * rowsPerPage, total)} de {total} resultados
          </div>
          <Pagination>
            <Button 
              variant="outline" 
              onClick={() => handleChangePage(page - 1)}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="mx-4">
              Página {page} de {totalPages}
            </span>
            <Button 
              variant="outline" 
              onClick={() => handleChangePage(page + 1)}
              disabled={page >= totalPages}
            >
              Próxima
            </Button>
          </Pagination>
        </CardFooter>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Relatório</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReport}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 