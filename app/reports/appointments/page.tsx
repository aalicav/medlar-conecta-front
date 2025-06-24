'use client';

import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Download, Filter, Calendar } from 'lucide-react';
import api from '@/app/services/api';
import { formatDate, formatTime } from '@/app/utils/formatters';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AppointmentsReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  
  // Filter states
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [clinicId, setClinicId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [status, setStatus] = useState('all');
  const [reportName, setReportName] = useState('Relatório de Agendamentos');

  useEffect(() => {
    // Load clinics and professionals for filters
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [clinicsResponse, professionalsResponse] = await Promise.all([
          api.get('/api/clinics'),
          api.get('/api/professionals'),
        ]);

        if (clinicsResponse.data && Array.isArray(clinicsResponse.data.data)) {
          setClinics(clinicsResponse.data.data);
        }

        if (professionalsResponse.data && Array.isArray(professionalsResponse.data.data)) {
          setProfessionals(professionalsResponse.data.data);
        }
      } catch (error) {
        console.error('Erro ao carregar opções de filtro:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar todas as opções de filtro"
        });
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, []);

  const fetchAppointmentsReport = async () => {
    setLoading(true);
    try {
      const params = {};
      
      if (startDate) {
        params.start_date = startDate.toISOString().split('T')[0];
      }
      
      if (endDate) {
        params.end_date = endDate.toISOString().split('T')[0];
      }
      
      if (clinicId) {
        params.clinic_id = clinicId;
      }
      
      if (professionalId) {
        params.professional_id = professionalId;
      }
      
      if (status !== 'all') {
        params.status = status;
      }
      
      params.include_summary = true;
      
      const response = await api.get('/reports/appointments', { params });
      
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
          description: "Erro ao carregar relatório de agendamentos"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar relatório de agendamentos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o relatório de agendamentos"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const params = {
        report_type: 'appointment',
        format: 'pdf',
        name: reportName,
        description: `Relatório de agendamentos de ${startDate ? formatDate(startDate) : 'sempre'} até ${endDate ? formatDate(endDate) : 'hoje'}`,
        save_as_report: false,
        parameters: {
          start_date: startDate ? startDate.toISOString().split('T')[0] : null,
          end_date: endDate ? endDate.toISOString().split('T')[0] : null,
          clinic_id: clinicId || null,
          professional_id: professionalId || null,
          status: status !== 'all' ? status : null,
          include_summary: true
        }
      };
      
      const response = await api.post('/reports/export', params);
      
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Agendado</Badge>;
      case 'confirmed':
        return <Badge variant="secondary">Confirmado</Badge>;
      case 'completed':
        return <Badge variant="success">Realizado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      case 'no_show':
        return <Badge variant="warning">Não Compareceu</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatório de Agendamentos</h1>
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
          <CardDescription>Selecione os filtros para visualizar os dados de agendamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Status
              </label>
              <Select
                value={status}
                onValueChange={setStatus}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="scheduled">Agendado</SelectItem>
                  <SelectItem value="confirmed">Confirmado</SelectItem>
                  <SelectItem value="completed">Realizado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                  <SelectItem value="no_show">Não Compareceu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Estabelecimento
              </label>
              <Select
                value={clinicId}
                onValueChange={setClinicId}
                disabled={loadingOptions || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a clínica" />
                </SelectTrigger>
                <SelectContent>
                  {clinics.map((clinic) => (
                    <SelectItem key={clinic.id} value={clinic.id.toString()}>
                      {clinic.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            onClick={fetchAppointmentsReport}
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
          {/* Summary Section */}
          {reportData.summary && (
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total de Agendamentos</CardDescription>
                  <CardTitle className="text-2xl">{reportData.summary.total_appointments}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Confirmados</CardDescription>
                  <CardTitle className="text-2xl text-blue-600">{reportData.summary.confirmed_appointments || 0}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Realizados</CardDescription>
                  <CardTitle className="text-2xl text-green-600">{reportData.summary.completed_appointments || 0}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Cancelados</CardDescription>
                  <CardTitle className="text-2xl text-red-600">{reportData.summary.cancelled_appointments || 0}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Não Compareceram</CardDescription>
                  <CardTitle className="text-2xl text-amber-600">{reportData.summary.no_show_appointments || 0}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Taxa de Comparecimento</CardDescription>
                  <CardTitle className="text-2xl">
                    {reportData.summary.attendance_rate 
                      ? `${(reportData.summary.attendance_rate * 100).toFixed(1)}%` 
                      : '0%'}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Appointments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos</CardTitle>
              <CardDescription>
                Lista de agendamentos do período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Estabelecimento</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.appointments && reportData.appointments.length > 0 ? (
                    reportData.appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>{appointment.id}</TableCell>
                        <TableCell>{formatDate(new Date(appointment.scheduled_date))}</TableCell>
                        <TableCell>{formatTime(new Date(appointment.scheduled_date))}</TableCell>
                        <TableCell>{appointment.patient_name}</TableCell>
                        <TableCell>{appointment.professional_name}</TableCell>
                        <TableCell>{appointment.clinic_name}</TableCell>
                        <TableCell>{appointment.procedure_name}</TableCell>
                        <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        Nenhum agendamento encontrado no período
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground text-center mb-4">
              Selecione os filtros e clique em "Gerar Relatório" para visualizar os dados de agendamentos.
            </p>
            <Button onClick={fetchAppointmentsReport}>
              <Calendar className="mr-2 h-4 w-4" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 