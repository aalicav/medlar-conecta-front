import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/format';

interface PaymentStatus {
  payment_status: string;
  total_batches: number;
  total_amount: number;
}

interface PaymentDistributionProps {
  data: PaymentStatus[] | null;
}

interface ChartDataItem {
  id: string;
  value: number;
  label: string;
}

export function PaymentDistribution({ data }: PaymentDistributionProps) {
  if (!data?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Nenhum dado de distribuição disponível
        </CardContent>
      </Card>
    );
  }

  const statusColors = {
    paid: '#22c55e',
    pending: '#f59e0b',
    overdue: '#ef4444',
    processing: '#3b82f6'
  } as const;

  const statusLabels = {
    paid: 'Pago',
    pending: 'Pendente',
    overdue: 'Atrasado',
    processing: 'Processando'
  } as const;

  const chartData: ChartDataItem[] = data.map(item => ({
    id: item.payment_status,
    value: item.total_amount,
    label: statusLabels[item.payment_status as keyof typeof statusLabels] || item.payment_status
  }));

  const totalAmount = data.reduce((sum, item) => sum + item.total_amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-1.5">
          <h3 className="text-lg font-semibold">Distribuição de Pagamentos</h3>
          <p className="text-sm text-muted-foreground">
            Total: {formatCurrency(totalAmount)}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {chartData.map((entry) => (
                  <Cell 
                    key={entry.id} 
                    fill={statusColors[entry.id as keyof typeof statusColors] || '#666666'} 
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {data.map((item) => (
            <div
              key={item.payment_status}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: statusColors[item.payment_status as keyof typeof statusColors] || '#666666' }}
                />
                <span className="text-sm">
                  {statusLabels[item.payment_status as keyof typeof statusLabels] || item.payment_status}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {item.total_batches} lotes
                </span>
                <span className="text-sm font-medium">
                  {formatCurrency(item.total_amount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 