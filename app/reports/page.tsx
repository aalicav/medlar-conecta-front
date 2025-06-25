'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';
import { FileText, BarChart3, Receipt, Calendar, Filter, MapPin, Building, Plus, Download, Clock, ChevronRight, Trash2, Eye, MoreVertical } from 'lucide-react';
import api from '@/services/api-client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Report {
  id: number;
  name: string;
  type: 'financial' | 'appointment' | 'performance' | 'custom';
  description: string | null;
  parameters: {
    start_date?: string;
    end_date?: string;
    health_plan_id?: number;
    clinic_id?: number;
    professional_id?: number;
    status?: string;
    city?: string;
    state?: string;
    include_summary?: boolean;
    payment_type?: string;
    specialty?: string;
  };
  file_format: 'pdf' | 'csv' | 'xlsx';
  created_at: string;
  is_scheduled: boolean;
  schedule_frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  recipients?: string[];
  is_public: boolean;
  is_template: boolean;
  created_by: number;
  latest_generation?: Generation;
  generations: Generation[];
  creator?: {
    id: number;
    name: string;
    email: string;
  };
}

interface Generation {
  id: number;
  report_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  completed_at: string | null;
  started_at: string | null;
  file_path: string | null;
  file_format: string;
  file_size?: string;
  rows_count?: number;
  error_message?: string | null;
  generated_by: number;
  created_at: string;
  updated_at: string;
}

interface ReportConfig {
  types: {
    [key: string]: {
      name: string;
      description: string;
      filters: {
        [key: string]: {
          type: 'text' | 'number' | 'date' | 'select' | 'boolean';
          label: string;
          options?: { [key: string]: string };
          required?: boolean;
        };
      };
    };
  };
}

function ReportsContent() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ReportConfig | null>(null);
  const [filters, setFilters] = useState({
    type: '',
    is_scheduled: '',
    is_template: '',
    sort_by: 'created_at',
    sort_direction: 'desc',
    per_page: 15
  });
  const [pagination, setPagination] = useState({
    total: 0,
    per_page: 15,
    current_page: 1,
    last_page: 1
  });
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  // Carregar configuração dos relatórios
  useEffect(() => {
    fetchConfig();
  }, []);

  // Carregar relatórios quando os filtros mudarem
  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchConfig = async () => {
    try {
      console.group('Fetching Report Config');
      const response = await api.get('/reports/config');
      
      if (response.data.success) {
        console.log('Config loaded:', response.data.data);
        setConfig(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to load report configuration');
      }
    } catch (error: any) {
      console.error('Error loading config:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar configurações",
        description: error.message || "Não foi possível carregar as configurações dos relatórios"
      });
    } finally {
      console.groupEnd();
    }
  };

  const fetchReports = async () => {
    try {
      console.group('Fetching Reports');
      console.log('Filters:', filters);
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await api.get(`/reports/list?${queryParams.toString()}`);
      console.log('API Response:', response.data);
      
      if (response.data.success) {
        // Get the reports array from the nested data structure
        const reportsData = response.data.data.data;
        setReports(reportsData || []);
        
        // Set pagination from the meta data
        setPagination({
          total: response.data.meta.total,
          per_page: response.data.meta.per_page,
          current_page: response.data.meta.current_page,
          last_page: response.data.meta.last_page
        });
      } else {
        throw new Error(response.data.message || 'Failed to fetch reports');
      }
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar relatórios",
        description: error.message || "Não foi possível carregar os relatórios"
      });
      setReports([]);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  const handleExport = async (report: Report) => {
    try {
      console.group('Generating New Report Version');
      console.log('Report:', report);

      const response = await api.post(`/reports/${report.id}/generate`, {
        format: report.file_format,
        filters: report.parameters
      });

      console.log('Generation Response:', response.data);

      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Nova versão do relatório está sendo gerada. Aguarde alguns instantes."
        });

        // Esperar um pouco para dar tempo do relatório ser gerado
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Recarregar a lista de relatórios
        await fetchReports();

        // Se temos um ID de geração, fazer o download
        if (response.data.data?.generation?.id) {
          await handleDownload(response.data.data.generation.id);
        }
      } else {
        throw new Error(response.data.message || 'Failed to generate report version');
      }
    } catch (error: any) {
      console.error('Error generating report version:', error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar relatório",
        description: error.message || "Não foi possível gerar nova versão do relatório"
      });
    } finally {
      console.groupEnd();
    }
  };

  const handleDownload = async (generationId: number) => {
    try {
      console.group('Downloading Report');
      console.log('Generation ID:', generationId);
      
      const response = await api.get(`/reports/download/${generationId}`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/json, application/pdf, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });
      
      // Get filename from Content-Disposition header or fallback to default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `report-${generationId}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Get content type from response
      const contentType = response.headers['content-type'];
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('Download completed successfully');
    } catch (error: any) {
      console.error('Error downloading report:', error);
      toast({
        variant: "destructive",
        title: "Erro ao baixar relatório",
        description: "Não foi possível baixar o relatório. Tente novamente mais tarde."
      });
    } finally {
      console.groupEnd();
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSortChange = (field: string) => {
    setFilters(prev => ({
      ...prev,
      sort_by: field,
      sort_direction: prev.sort_by === field && prev.sort_direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusBadge = (status: string) => {
    type StatusColors = {
      [key: string]: string;
      pending: string;
      processing: string;
      completed: string;
      failed: string;
    };

    const colors: StatusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'financial':
        return <Receipt className="h-4 w-4 mr-2" />;
      case 'appointment':
        return <Calendar className="h-4 w-4 mr-2" />;
      case 'performance':
        return <BarChart3 className="h-4 w-4 mr-2" />;
      default:
        return <FileText className="h-4 w-4 mr-2" />;
    }
  };

  const toggleRowExpanded = (reportId: number) => {
    setExpandedRows(current =>
      current.includes(reportId)
        ? current.filter(id => id !== reportId)
        : [...current, reportId]
    );
  };

  const GenerationHistory = ({ generations }: { generations: Generation[] }) => {
    return (
      <div className="p-4 bg-gray-50">
        <h4 className="text-sm font-medium mb-2">Histórico de Gerações</h4>
        <div className="space-y-2">
          {generations.map((generation) => (
            <div key={generation.id} className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm">
              <div className="flex items-center space-x-4">
                <div>{getStatusBadge(generation.status)}</div>
                <div className="text-sm">
                  {format(new Date(generation.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </div>
                {generation.file_size && (
                  <div className="text-sm text-gray-500">
                    {(parseInt(generation.file_size) / 1024).toFixed(2)} KB
                  </div>
                )}
                {generation.error_message && (
                  <div className="text-sm text-red-500">
                    {generation.error_message}
                  </div>
                )}
              </div>
              {generation.status === 'completed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(generation.id)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Adicionar intervalo de atualização automática
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchReports();
      }
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [loading]);

  // Add delete report function
  const handleDeleteReport = async (report: Report) => {
    try {
      console.group('Deleting Report');
      console.log('Report:', report);
      
      const response = await api.delete(`/reports/${report.id}`);
      
      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Relatório excluído com sucesso"
        });
        
        // Refresh the reports list
        await fetchReports();
      } else {
        throw new Error(response.data.message || 'Failed to delete report');
      }
    } catch (error: any) {
      console.error('Error deleting report:', error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir relatório",
        description: error.message || "Não foi possível excluir o relatório"
      });
    } finally {
      setReportToDelete(null);
      console.groupEnd();
    }
  };

  // Add view details function
  const handleViewDetails = (report: Report) => {
    router.push(`/reports/${report.id}`);
  };

  // Update the ReportActions component
  const ReportActions = ({ 
    report, 
    onDownload, 
    onExport,
    onDelete,
    onViewDetails 
  }: { 
    report: Report; 
    onDownload: (id: number) => void;
    onExport: (report: Report) => void;
    onDelete: (report: Report) => void;
    onViewDetails: (report: Report) => void;
  }) => {
    return (
      <div className="flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {report.latest_generation?.status === 'completed' && (
              <DropdownMenuItem onClick={() => onDownload(report.latest_generation!.id)}>
                <Download className="h-4 w-4 mr-2" />
                Baixar último relatório
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onExport(report)}>
              <FileText className="h-4 w-4 mr-2" />
              Gerar novo relatório
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewDetails(report)}>
              <Eye className="h-4 w-4 mr-2" />
              Ver detalhes
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-600"
              onClick={() => onDelete(report)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir relatório
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  // Add the delete confirmation dialog
  {reportToDelete && (
    <AlertDialog open={!!reportToDelete} onOpenChange={() => setReportToDelete(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o relatório "{reportToDelete.name}"? 
            Esta ação não pode ser desfeita e todos os arquivos gerados serão excluídos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => handleDeleteReport(reportToDelete)}
            className="bg-red-600 hover:bg-red-700"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )}

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
            onValueChange={(value) => handleFilterChange('type', value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo de Relatório" />
            </SelectTrigger>
            <SelectContent>
              {config && Object.entries(config.types).map(([key, type]) => (
                <SelectItem key={key} value={key}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.is_scheduled}
            onValueChange={(value) => handleFilterChange('is_scheduled', value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Agendamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Agendados</SelectItem>
              <SelectItem value="false">Não Agendados</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.is_template}
            onValueChange={(value) => handleFilterChange('is_template', value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Templates</SelectItem>
              <SelectItem value="false">Relatórios</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSortChange('name')}
              >
                Nome {filters.sort_by === 'name' && (
                  filters.sort_direction === 'asc' ? '↑' : '↓'
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSortChange('type')}
              >
                Tipo {filters.sort_by === 'type' && (
                  filters.sort_direction === 'asc' ? '↑' : '↓'
                )}
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => handleSortChange('created_at')}
              >
                Criado em {filters.sort_by === 'created_at' && (
                  filters.sort_direction === 'asc' ? '↑' : '↓'
                )}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Agendamento</TableHead>
              <TableHead className="text-right w-[200px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3">Carregando relatórios...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Nenhum relatório encontrado
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <React.Fragment key={report.id}>
                  <TableRow className="cursor-pointer hover:bg-gray-50" onClick={() => toggleRowExpanded(report.id)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <ChevronRight 
                          className={`h-4 w-4 mr-2 transition-transform ${
                            expandedRows.includes(report.id) ? 'transform rotate-90' : ''
                          }`}
                        />
                        {report.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getReportTypeIcon(report.type)}
                        {config?.types[report.type]?.name || report.type}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(report.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {report.latest_generation && getStatusBadge(report.latest_generation.status)}
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
                      <ReportActions 
                        report={report} 
                        onDownload={handleDownload}
                        onExport={handleExport}
                        onDelete={(report) => setReportToDelete(report)}
                        onViewDetails={handleViewDetails}
                      />
                    </TableCell>
                  </TableRow>
                  {expandedRows.includes(report.id) && (
                    <TableRow>
                      <TableCell colSpan={6} className="p-0">
                        <GenerationHistory generations={report.generations} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>

        {reports.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-500">
              Mostrando {((pagination.current_page - 1) * pagination.per_page) + 1} a {Math.min(pagination.current_page * pagination.per_page, pagination.total)} de {pagination.total} resultados
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current_page === 1}
                onClick={() => handlePageChange(pagination.current_page - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => handlePageChange(pagination.current_page + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
} 