'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { BillingOverview } from './components/BillingOverview';
import { RecentBatches } from './components/RecentBatches';
import { PaymentDistribution } from './components/PaymentDistribution';
import { MonthlyTotals } from './components/MonthlyTotals';
import { GlosaStatistics } from './components/GlosaStatistics';
import { AttendanceStatistics } from './components/AttendanceStatistics';
import { BillingFilters } from './components/BillingFilters';
import { api } from '@/lib/api';
import { LoadingSpinner } from '../components/ui/loading-spinner';

interface BillingFiltersType {
  operator_id: string | null;
  status: string | null;
  procedure_id: string | null;
  start_date: string | null;
  end_date: string | null;
}

interface TotalStatistics {
  pending_amount: number;
  paid_amount: number;
  total_batches: number;
  pending_batches: number;
  overdue_batches: number;
}

interface BatchItem {
  id: number;
  description: string;
  total_amount: number;
  tuss_code: string;
  tuss_description: string;
  professional: {
    name: string;
    specialty: string;
  };
  patient: {
    name: string;
    document: string;
  };
  patient_journey: {
    scheduled_at: string;
    pre_confirmation: boolean;
    patient_confirmed: boolean;
    professional_confirmed: boolean;
    guide_status: string;
    patient_attended: boolean;
  };
}

interface Batch {
  id: number;
  reference_period: {
    start: string;
    end: string;
  };
  billing_date: string;
  due_date: string;
  total_amount: number;
  items_count: number;
  status: string;
  payment_status: string;
  operator: string;
  items: BatchItem[];
}

interface PaymentStatus {
  payment_status: string;
  total_batches: number;
  total_amount: number;
}

interface MonthlyTotal {
  month: string;
  total_amount: number;
  batch_count: number;
  paid_amount: number;
  pending_amount: number;
  overdue_count: number;
}

interface GlosaStats {
  total_glosa_amount: number;
  total_glosas: number;
  pending_glosas: number;
  appealable_glosas: number;
  average_glosa_amount: number;
}

interface AttendanceStats {
  total_appointments: number;
  attended_appointments: number;
  missed_appointments: number;
  billable_appointments: number;
}

interface BillingData {
  total_statistics: TotalStatistics;
  recent_batches: Batch[];
  payment_status_distribution: PaymentStatus[];
  monthly_totals: MonthlyTotal[];
  glosa_statistics: GlosaStats;
  attendance_statistics: AttendanceStats;
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<BillingData | null>(null);
  const [filters, setFilters] = useState<BillingFiltersType>({
    operator_id: null,
    status: null,
    procedure_id: null,
    start_date: null,
    end_date: null
  });

  useEffect(() => {
    loadBillingData();
  }, [filters]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const response = await api.get<BillingData>('/billing/overview', { params: filters });
      setData(response.data);
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">
        Faturamento
      </h1>

      <BillingFilters 
        filters={filters} 
        onFilterChange={setFilters} 
      />

      <div className="grid gap-6">
        <div className="w-full">
          <BillingOverview data={data?.total_statistics || null} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Totais Mensais</h3>
              </CardHeader>
              <CardContent>
                <MonthlyTotals data={data?.monthly_totals || null} />
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-4">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Distribuição de Pagamentos</h3>
              </CardHeader>
              <CardContent>
                <PaymentDistribution data={data?.payment_status_distribution || null} />
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-8">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Lotes Recentes</h3>
              </CardHeader>
              <CardContent>
                <RecentBatches batches={data?.recent_batches || null} />
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-4">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Estatísticas de Glosas</h3>
                </CardHeader>
                <CardContent>
                  <GlosaStatistics data={data?.glosa_statistics || null} />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Estatísticas de Atendimento</h3>
                </CardHeader>
                <CardContent>
                  <AttendanceStatistics data={data?.attendance_statistics || null} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 