'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '@/lib/api';
import { Calendar } from '@/components/ui/calendar';

interface BillingFiltersProps {
  filters: {
    status: string | null;
    procedure_id: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  onFilterChange: (filters: any) => void;
}

interface Procedure {
  id: number;
  name: string;
  code: string;
  avg_price: number;
}

interface BillingStats {
  total_revenue: number;
  total_procedures: number;
  total_solicitations: number;
  total_appointments: number;
}

export function BillingFilters({ filters, onFilterChange }: BillingFiltersProps) {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [startDate, setStartDate] = useState<string>(filters.start_date ? format(new Date(filters.start_date), 'yyyy-MM-dd') : '');
  const [endDate, setEndDate] = useState<string>(filters.end_date ? format(new Date(filters.end_date), 'yyyy-MM-dd') : '');
  const [selectedStatus, setSelectedStatus] = useState<string>(filters.status || '');
  const [selectedProcedure, setSelectedProcedure] = useState<string>(filters.procedure_id || '');

  useEffect(() => {
    loadProcedures();
    loadStats();
  }, []);

  const loadProcedures = async () => {
    try {
      const response = await api.get('/health-plans/dashboard/procedures');
      setProcedures(response.data.data);
    } catch (error) {
      console.error('Error loading procedures:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/health-plans/dashboard/stats', {
        params: {
          range: 'month'
        }
      });
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    onFilterChange({
      ...filters,
      status: value
    });
  };

  const handleProcedureChange = (value: string) => {
    setSelectedProcedure(value);
    onFilterChange({
      ...filters,
      procedure_id: value
    });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    const newDate = date ? format(date, 'yyyy-MM-dd') : '';
    setStartDate(newDate);
    if (newDate) {
      onFilterChange({
        ...filters,
        start_date: newDate
      });
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    const newDate = date ? format(date, 'yyyy-MM-dd') : '';
    setEndDate(newDate);
    if (newDate) {
      onFilterChange({
        ...filters,
        end_date: newDate
      });
    }
  };

  const handleClearFilters = () => {
    setSelectedStatus('');
    setSelectedProcedure('');
    setStartDate('');
    setEndDate('');
    onFilterChange({
      status: null,
      procedure_id: null,
      start_date: null,
      end_date: null
    });
  };

  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    try {
      return format(new Date(isoDate), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <>
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Faturamento Total</div>
              <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total de Procedimentos</div>
              <div className="text-2xl font-bold">{stats.total_procedures}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Solicitações</div>
              <div className="text-2xl font-bold">{stats.total_solicitations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Consultas</div>
              <div className="text-2xl font-bold">{stats.total_appointments}</div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Status do Faturamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Em Processamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedProcedure} onValueChange={handleProcedureChange}>
              <SelectTrigger>
                <SelectValue placeholder="Procedimento" />
              </SelectTrigger>
              <SelectContent>
                {procedures.map((procedure) => (
                  <SelectItem key={procedure.id} value={procedure.id.toString()}>
                    {procedure.code} - {procedure.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Calendar
              value={startDate ? new Date(startDate) : undefined}
              onChange={handleStartDateChange}
              className="w-full"
            />

            <Calendar
              value={endDate ? new Date(endDate) : undefined}
              onChange={handleEndDateChange}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              {selectedStatus && (
                <Badge variant="secondary">
                  Status: {selectedStatus}
                </Badge>
              )}
              {selectedProcedure && (
                <Badge variant="secondary">
                  Procedimento: {procedures.find(p => p.id.toString() === selectedProcedure)?.name}
                </Badge>
              )}
              {startDate && (
                <Badge variant="secondary">
                  De: {formatDisplayDate(startDate)}
                </Badge>
              )}
              {endDate && (
                <Badge variant="secondary">
                  Até: {formatDisplayDate(endDate)}
                </Badge>
              )}
            </div>
            {(selectedStatus || selectedProcedure || startDate || endDate) && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
} 