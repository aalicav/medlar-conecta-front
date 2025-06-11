'use client'

import { Card } from '@/components/ui/card'
import { BillingOverview } from '@/types/billing'
import { Button } from '@/components/ui/button'
import { FileText, Download, FileSpreadsheet } from 'lucide-react'

interface BillingReportsProps {
  overview: BillingOverview | null
}

export function BillingReports({ overview }: BillingReportsProps) {
  if (!overview) return null

  const handleDownloadReport = async (type: string) => {
    try {
      const response = await fetch(`/api/billing/reports/${type}`, {
        method: 'GET',
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio-${type}-${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error downloading report:', error)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Relatório de Receitas</h3>
            <p className="text-sm text-muted-foreground">
              {overview.total_revenue_reports} relatórios gerados
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => handleDownloadReport('revenue')}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Relatório
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Relatório de Transações</h3>
            <p className="text-sm text-muted-foreground">
              {overview.total_transaction_reports} relatórios gerados
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => handleDownloadReport('transactions')}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Relatório
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Relatório de Assinaturas</h3>
            <p className="text-sm text-muted-foreground">
              {overview.total_subscription_reports} relatórios gerados
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => handleDownloadReport('subscriptions')}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Relatório
          </Button>
        </div>
      </Card>
    </div>
  )
} 