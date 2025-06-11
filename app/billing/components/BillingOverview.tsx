import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Wallet, AlertTriangle, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface BillingOverviewProps {
  data: {
    pending_amount: number;
    paid_amount: number;
    total_batches: number;
    pending_batches: number;
    overdue_batches: number;
  } | null;
}

export function BillingOverview({ data }: BillingOverviewProps) {
  if (!data) return null;

  const stats = [
    {
      title: 'Total Faturado',
      value: formatCurrency(data.pending_amount + data.paid_amount),
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      subtitle: `${data.total_batches} lotes no total`
    },
    {
      title: 'Total Recebido',
      value: formatCurrency(data.paid_amount),
      icon: Wallet,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      subtitle: 'Pagamentos confirmados'
    },
    {
      title: 'Pendente de Recebimento',
      value: formatCurrency(data.pending_amount),
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      subtitle: `${data.pending_batches} lotes pendentes`
    },
    {
      title: 'Pagamentos em Atraso',
      value: `${data.overdue_batches} lotes`,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      subtitle: 'Necessitam atenção'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className={`flex items-center justify-center w-12 h-12 rounded-lg ${stat.bgColor} ${stat.color} mr-4`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {stat.title}
                </p>
                <p className="text-2xl font-semibold mt-1">
                  {stat.value}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {stat.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 