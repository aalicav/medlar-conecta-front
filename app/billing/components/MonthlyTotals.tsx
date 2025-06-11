import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/format';

interface MonthlyTotal {
  month: string;
  total_amount: number;
  batch_count: number;
  paid_amount: number;
  pending_amount: number;
  overdue_count: number;
}

interface MonthlyTotalsProps {
  data: MonthlyTotal[] | null;
}

export function MonthlyTotals({ data }: MonthlyTotalsProps) {
  if (!data?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Nenhum dado mensal disponível
        </CardContent>
      </Card>
    );
  }

  // Format month labels (e.g., "2024-03" to "Mar/24")
  const chartData = data.map(item => {
    const [year, month] = item.month.split('-');
    return {
      ...item,
      month: `${new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'short' })}/${year.slice(2)}`
    };
  });

  const totalAmount = data.reduce((sum, item) => sum + item.total_amount, 0);
  const totalBatches = data.reduce((sum, item) => sum + item.batch_count, 0);
  const averageAmount = totalAmount / data.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-1.5">
          <h3 className="text-lg font-semibold">Evolução Mensal</h3>
          <div className="flex gap-4">
            <p className="text-sm text-muted-foreground">
              Média Mensal: {formatCurrency(averageAmount)}
            </p>
            <p className="text-sm text-muted-foreground">
              Total de Lotes: {totalBatches}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: 'var(--foreground)' }}
                contentStyle={{ 
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar 
                dataKey="paid_amount" 
                name="Pago" 
                stackId="total" 
                fill="#22c55e" 
              />
              <Bar 
                dataKey="pending_amount" 
                name="Pendente" 
                stackId="total" 
                fill="#f59e0b" 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          {chartData.map((item, index) => (
            <div
              key={item.month}
              className={`flex justify-between items-center p-2 rounded ${
                index % 2 === 0 ? 'bg-muted/50' : ''
              }`}
            >
              <div>
                <p className="text-sm font-medium">{item.month}</p>
                <p className="text-xs text-muted-foreground">
                  {item.batch_count} lotes
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-600">
                  Pago: {formatCurrency(item.paid_amount)}
                </p>
                <p className="text-sm text-amber-600">
                  Pendente: {formatCurrency(item.pending_amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 