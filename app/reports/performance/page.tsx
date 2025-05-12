'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Download, Filter, BarChart3 } from 'lucide-react';
import api from '@/app/services/api-client';
import { formatDate, formatPercentage } from '@/app/utils/formatters';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface Professional {
  id: number;
  name: string;
  specialty: string;
  total_appointments: number;
  attendance_rate: number;
  patient_satisfaction: number;
  efficiency: number;
  overall_score: number;
}

interface OverallPerformance {
  score: number;
  attendance_rate: number;
  patient_satisfaction: number;
  efficiency: number;
}

interface PerformanceReport {
  overall_performance: OverallPerformance;
  professionals: Professional[];
}

interface ReportParams {
  start_date?: string;
  end_date?: string;
  professional_id?: string;
}

export default function PerformanceReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<PerformanceReport | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  
  // Filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [professionalId, setProfessionalId] = useState('');
  const [reportName, setReportName] = useState('Relatório de Desempenho');

  useEffect(() => {
    // Load professionals for filters
    const fetchProfessionals = async () => {
      setLoadingOptions(true);
      try {
        const response = await api.get('/api/professionals');
        if (response.data && Array.isArray(response.data.data)) {
          setProfessionals(response.data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar profissionais:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar a lista de profissionais"
        });
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchProfessionals();
  }, []);

  const fetchPerformanceReport = async () => {
    setLoading(true);
    try {
      const params: ReportParams = {};
      
      if (startDate) {
        params.start_date = startDate.toISOString().split('T')[0];
      }
      
      if (endDate) {
        params.end_date = endDate.toISOString().split('T')[0];
      }
      
      if (professionalId) {
        params.professional_id = professionalId;
      }
      
      const response = await api.get('/api/reports/performance', { params });
      
      if (response.data.status === 'success') {
        setReportData(response.data.data);
        toast({
          title: "Sucesso",
          description: "Relatório carregado com sucesso"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao carregar relatório de desempenho"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar relatório de desempenho:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o relatório de desempenho"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const params = {
        report_type: 'performance',
        format: 'pdf',
        name: reportName,
        description: `Relatório de desempenho de ${startDate ? formatDate(startDate) : 'sempre'} até ${endDate ? formatDate(endDate) : 'hoje'}`,
        save_as_report: false,
        parameters: {
          start_date: startDate ? startDate.toISOString().split('T')[0] : null,
          end_date: endDate ? endDate.toISOString().split('T')[0] : null,
          professional_id: professionalId || null
        }
      };
      
      const response = await api.post('/api/reports/export', params);
      
      if (response.data.status === 'success') {
        toast({
          title: "Sucesso",
          description: "Relatório exportado com sucesso"
        });
        window.open(response.data.data.download_url, '_blank');
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao exportar relatório"
        });
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível exportar o relatório"
      });
    }
  };

  // Helper function to get the className for progress bars based on value
  const getProgressColorClass = (value: number, max = 100): string => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-blue-500";
    if (percentage >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatório de Desempenho</h1>
        <Button 
          variant="outline" 
          onClick={handleExportReport}
          disabled={loading || !reportData}
        >
          <Download className="mr-2 h-4 w-4" /> Exportar PDF
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Selecione um período e profissional para visualizar os dados de desempenho</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label htmlFor="reportName" className="text-sm font-medium">
                Nome do Relatório
              </label>
              <Input 
                id="reportName"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Nome para o relatório"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Data Inicial
              </label>
              <DatePicker 
                date={startDate} 
                setDate={setStartDate} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Data Final
              </label>
              <DatePicker 
                date={endDate} 
                setDate={setEndDate} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Profissional
              </label>
              <Select
                value={professionalId}
                onValueChange={setProfessionalId}
                disabled={loadingOptions || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  
                  {professionals.map((professional) => (
                    <SelectItem key={professional.id} value={professional.id.toString()}>
                      {professional.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={fetchPerformanceReport}
            disabled={loading || loadingOptions}
          >
            <Filter className="mr-2 h-4 w-4" /> Gerar Relatório
          </Button>
        </CardFooter>
      </Card>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Overall Performance Section */}
          {reportData.overall_performance && (
            <Card>
              <CardHeader>
                <CardTitle>Desempenho Geral</CardTitle>
                <CardDescription>Métricas agregadas de todos os profissionais no período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="text-sm font-medium">Pontuação Geral</div>
                      <div className="text-sm font-medium">{reportData.overall_performance.score.toFixed(1)}/10</div>
                    </div>
                    <Progress 
                      value={reportData.overall_performance.score * 10} 
                      className={`h-2 ${getProgressColorClass(reportData.overall_performance.score, 10)}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="text-sm font-medium">Taxa de Comparecimento</div>
                      <div className="text-sm font-medium">{formatPercentage(reportData.overall_performance.attendance_rate)}</div>
                    </div>
                    <Progress 
                      value={reportData.overall_performance.attendance_rate * 100} 
                      className={`h-2 ${getProgressColorClass(reportData.overall_performance.attendance_rate, 1)}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="text-sm font-medium">Satisfação do Paciente</div>
                      <div className="text-sm font-medium">{reportData.overall_performance.patient_satisfaction.toFixed(1)}/5</div>
                    </div>
                    <Progress 
                      value={reportData.overall_performance.patient_satisfaction * 20} 
                      className={`h-2 ${getProgressColorClass(reportData.overall_performance.patient_satisfaction, 5)}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="text-sm font-medium">Eficiência</div>
                      <div className="text-sm font-medium">{formatPercentage(reportData.overall_performance.efficiency/100)}</div>
                    </div>
                    <Progress 
                      value={reportData.overall_performance.efficiency} 
                      className={`h-2 ${getProgressColorClass(reportData.overall_performance.efficiency, 100)}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Professional Performance Table */}
          {reportData.professionals && reportData.professionals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Desempenho por Profissional</CardTitle>
                <CardDescription>Métricas detalhadas por profissional no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead className="text-center">Agendamentos</TableHead>
                      <TableHead>Comparecimento</TableHead>
                      <TableHead>Satisfação</TableHead>
                      <TableHead>Eficiência</TableHead>
                      <TableHead>Pontuação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.professionals.map((professional) => (
                      <TableRow key={professional.id}>
                        <TableCell className="font-medium">{professional.name}</TableCell>
                        <TableCell>{professional.specialty}</TableCell>
                        <TableCell className="text-center">{professional.total_appointments}</TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{formatPercentage(professional.attendance_rate)}</span>
                            </div>
                            <Progress 
                              value={professional.attendance_rate * 100} 
                              className={`h-2 ${getProgressColorClass(professional.attendance_rate, 1)}`}
                            />
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{professional.patient_satisfaction.toFixed(1)}/5</span>
                            </div>
                            <Progress 
                              value={professional.patient_satisfaction * 20} 
                              className={`h-2 ${getProgressColorClass(professional.patient_satisfaction, 5)}`}
                            />
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{formatPercentage(professional.efficiency/100)}</span>
                            </div>
                            <Progress 
                              value={professional.efficiency} 
                              className={`h-2 ${getProgressColorClass(professional.efficiency, 100)}`}
                            />
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{professional.overall_score.toFixed(1)}/10</span>
                            </div>
                            <Progress 
                              value={professional.overall_score * 10} 
                              className={`h-2 ${getProgressColorClass(professional.overall_score, 10)}`}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center mb-4">
              Selecione os filtros e clique em "Gerar Relatório" para visualizar os dados de desempenho.
            </p>
            <Button onClick={fetchPerformanceReport}>
              <BarChart3 className="mr-2 h-4 w-4" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 