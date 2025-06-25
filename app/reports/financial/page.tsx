'use client';

import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Download, Filter } from 'lucide-react';
import api from '../../../services/api-client';
import { formatCurrency, formatDate } from '@/app/utils/formatters';
import { useRouter } from 'next/navigation';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Transaction {
  id: number;
  date: string;
  description: string;
  health_plan_name: string;
  payment_type: string;
  status: string;
  amount: number;
}

interface Summary {
  total_revenue: number;
  total_received: number;
  total_pending: number;
  total_gloss: number;
}

interface FinancialReportData {
  summary: Summary;
  transactions: Transaction[];
}

interface ReportParams {
  start_date?: string;
  end_date?: string;
  include_summary?: boolean;
}

export default function FinancialReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<FinancialReportData | null>(null);
  
  // Filter states
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [reportName, setReportName] = useState('Relatório Financeiro');

  const router = useRouter();

  const fetchFinancialReport = async () => {
    setLoading(true);
    try {
      const params: ReportParams = {};
      
      if (startDate) {
        params.start_date = startDate.toISOString().split('T')[0];
      }
      
      if (endDate) {
        params.end_date = endDate.toISOString().split('T')[0];
      }
      
      params.include_summary = true;
      
      const response = await api.get('/reports/financials', { params });
      
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
          description: "Erro ao carregar relatório financeiro"
        });
      }
    } catch (error) {
      console.error('Erro ao buscar relatório financeiro:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar o relatório financeiro"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const params = {
        type: 'financial',
        format: 'pdf',
        name: reportName,
        description: `Relatório financeiro de ${startDate ? formatDate(startDate) : 'sempre'} até ${endDate ? formatDate(endDate) : 'hoje'}`,
        filters: {
          start_date: startDate ? startDate.toISOString().split('T')[0] : null,
          end_date: endDate ? endDate.toISOString().split('T')[0] : null,
          include_summary: true
        }
      };
      
      const response = await api.post('/reports/create', params);
      
      if (response.data.success) {
        toast({
          title: "Sucesso",
          description: "Relatório está sendo gerado. Você receberá uma notificação quando estiver pronto."
        });

        // Redirect to report page
        if (response.data.data?.report?.id) {
          router.push(`/reports/${response.data.data.report.id}`);
        }
      } else {
        throw new Error(response.data.message || 'Failed to create report');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível criar o relatório"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'paid') {
      return <Badge className="bg-green-500">Pago</Badge>;
    } else if (status === 'pending') {
      return <Badge className="bg-amber-500">Pendente</Badge>;
    } else {
      return <Badge variant="destructive">Glosado</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatório Financeiro</h1>
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
          <CardDescription>Selecione um período para visualizar os dados financeiros</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                setDate={(date: Date | null) => setStartDate(date)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Data Final
              </label>
              <DatePicker 
                date={endDate}
                setDate={(date: Date | null) => setEndDate(date)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={fetchFinancialReport}
            disabled={loading}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Faturamento Total</CardDescription>
                  <CardTitle className="text-2xl">{formatCurrency(reportData.summary.total_revenue)}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Recebido</CardDescription>
                  <CardTitle className="text-2xl text-green-600">{formatCurrency(reportData.summary.total_received)}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Pendente</CardDescription>
                  <CardTitle className="text-2xl text-amber-600">{formatCurrency(reportData.summary.total_pending)}</CardTitle>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Glosado</CardDescription>
                  <CardTitle className="text-2xl text-red-600">{formatCurrency(reportData.summary.total_gloss || 0)}</CardTitle>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Transações</CardTitle>
              <CardDescription>
                Lista de transações financeiras do período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Plano de Saúde</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.transactions && reportData.transactions.length > 0 ? (
                    reportData.transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.id}</TableCell>
                        <TableCell>{formatDate(new Date(transaction.date))}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.health_plan_name}</TableCell>
                        <TableCell>{transaction.payment_type}</TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(transaction.amount)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6">
                        Nenhuma transação encontrada no período
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
              Selecione os filtros e clique em "Gerar Relatório" para visualizar os dados financeiros.
            </p>
            <Button onClick={fetchFinancialReport}>
              <Filter className="mr-2 h-4 w-4" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 