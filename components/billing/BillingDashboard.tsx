'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BillingOverview } from './BillingOverview'
import { TransactionList } from './TransactionList'
import { BillingReports } from './BillingReports'
import { DatePickerWithRange } from '@/components/ui/date-range-picker'
import { addDays } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'
import { DateRange, BillingOverview as BillingOverviewType, Transaction } from '@/types/billing'
import api from '@/services/api-client'

export default function BillingDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<BillingOverviewType | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchBillingData()
  }, [dateRange])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      const params = {
        start_date: dateRange.from?.toISOString(),
        end_date: dateRange.to?.toISOString(),
      }

      // Fetch overview data
      const overviewResponse = await api.get('/billing/overview', { params })
      
      if (overviewResponse.status === 200) {
        const overviewData = overviewResponse.data
        setOverview(overviewData)
      }

      // Fetch transactions
      const transactionsResponse = await fetch('/api/billing/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json()
        setTransactions(transactionsData)
      }
    } catch (error) {
      console.error('Error fetching billing data:', error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar dados de faturamento",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DatePickerWithRange
          date={dateRange}
          onDateChange={setDateRange}
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <BillingOverview data={overview} loading={loading} />
        </TabsContent>
        
        <TabsContent value="transactions">
          <TransactionList 
            transactions={transactions}
            loading={loading}
            onRefresh={fetchBillingData}
          />
        </TabsContent>
        
        <TabsContent value="reports">
          <BillingReports overview={overview} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 