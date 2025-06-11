export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

export interface BillingOverview {
  total_revenue: number
  pending_payments: number
  active_subscriptions: number
  growth_rate: number
  revenue_trend: {
    date: string
    amount: number
  }[]
  clinic_revenue: number
  professional_revenue: number
  health_plan_revenue: number
  total_revenue_reports: number
  total_transaction_reports: number
  total_subscription_reports: number
}

export interface Transaction {
  id: string
  date: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  type: 'payment' | 'refund' | 'subscription'
  entity: {
    name: string
    type: 'clinic' | 'professional' | 'health_plan'
  }
  reference: string
  description: string
} 