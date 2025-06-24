'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Transaction } from '@/types/billing'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TransactionListProps {
  transactions: Transaction[]
  loading: boolean
  onRefresh: () => void
}

const statusMap = {
  pending: { label: 'Pendente', color: 'bg-yellow-500' },
  completed: { label: 'Concluído', color: 'bg-green-500' },
  failed: { label: 'Falhou', color: 'bg-red-500' },
}

const typeMap = {
  payment: 'Pagamento',
  refund: 'Reembolso',
  subscription: 'Assinatura',
}

export function TransactionList({ transactions, loading, onRefresh }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredTransactions = transactions.filter(transaction => 
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.entity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.reference.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Pesquisar transações..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Referência</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Nenhuma transação encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.date), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{transaction.entity.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {transaction.entity.type === 'clinic' && 'Estabelecimento'}
                        {transaction.entity.type === 'professional' && 'Profissional'}
                        {transaction.entity.type === 'health_plan' && 'Plano de Saúde'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{typeMap[transaction.type]}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`${statusMap[transaction.status].color} text-white`}
                    >
                      {statusMap[transaction.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={transaction.type === 'refund' ? 'text-red-600' : ''}>
                      {transaction.type === 'refund' ? '- ' : ''}{formatCurrency(transaction.amount)}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.reference}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Baixar Comprovante</DropdownMenuItem>
                        {transaction.status === 'pending' && (
                          <DropdownMenuItem className="text-red-600">
                            Cancelar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 