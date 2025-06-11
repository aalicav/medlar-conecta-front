'use client'

import { Card } from '@/components/ui/card'
import { BillingOverview as BillingOverviewType } from '@/types/billing'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils'

interface BillingOverviewProps {
  data: BillingOverviewType | null
  loading: boolean
}

export function BillingOverview({ data, loading }: BillingOverviewProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-[100px] mb-2" />
            <Skeleton className="h-8 w-[150px]" />
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Receita Total
          </h3>
          <p className="mt-2 text-3xl font-bold">
            {formatCurrency(data.total_revenue)}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Pagamentos Pendentes
          </h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600">
            {formatCurrency(data.pending_payments)}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Assinaturas Ativas
          </h3>
          <p className="mt-2 text-3xl font-bold">
            {data.active_subscriptions}
          </p>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground">
            Taxa de Crescimento
          </h3>
          <p className={`mt-2 text-3xl font-bold ${data.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {data.growth_rate}%
          </p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-2 p-6">
          <h3 className="text-lg font-medium mb-4">Tendência de Receita</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenue_trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#0ea5e9" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Distribuição de Receita</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Clínicas
              </h4>
              <p className="mt-1 text-2xl font-semibold">
                {formatCurrency(data.clinic_revenue)}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Profissionais
              </h4>
              <p className="mt-1 text-2xl font-semibold">
                {formatCurrency(data.professional_revenue)}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground">
                Planos de Saúde
              </h4>
              <p className="mt-1 text-2xl font-semibold">
                {formatCurrency(data.health_plan_revenue)}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 