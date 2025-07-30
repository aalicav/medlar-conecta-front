'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltipContent, ChartLegendContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Clock, MessageSquare, Send } from 'lucide-react';
import WhatsappService, { WhatsappStatistics } from '@/app/services/whatsappService';
import Link from 'next/link';

export default function WhatsappDashboard() {
  const [stats, setStats] = useState<WhatsappStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const data = await WhatsappService.getStatistics();
        setStats(data);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar estatísticas do WhatsApp');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const chartData = stats ? {
    labels: ['Pendente', 'Enviado', 'Entregue', 'Lido', 'Falha'],
    datasets: [
      {
        label: 'Mensagens',
        data: [stats.pending, stats.sent, stats.delivered, stats.read, stats.failed],
        backgroundColor: [
          'rgba(255, 159, 64, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgb(255, 159, 64)',
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)',
          'rgb(153, 102, 255)',
          'rgb(255, 99, 132)',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de WhatsApp</h1>
          <p className="text-gray-500">Monitoramento e controle das mensagens de WhatsApp</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/whatsapp/mensagens">Ver Mensagens</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/whatsapp/conversas">Conversas</Link>
          </Button>
          <Button asChild>
            <Link href="/whatsapp/nova-mensagem">Nova Mensagem</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/whatsapp/templates">Testar Templates</Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6 flex items-center">
          <AlertCircle className="mr-2" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-md animate-pulse"></div>
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Total de Mensagens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Entregues e Lidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.delivered + stats.read}</div>
                <p className="text-sm text-gray-500">
                  {((stats.delivered + stats.read) / stats.total * 100).toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-amber-500" />
                  Pendentes e Enviadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.pending + stats.sent}</div>
                <p className="text-sm text-gray-500">
                  {((stats.pending + stats.sent) / stats.total * 100).toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                  Falhas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.failed}</div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {(stats.failed / stats.total * 100).toFixed(1)}% do total
                  </p>
                  {stats.failed > 0 && (
                    <Button asChild variant="destructive" size="sm">
                      <Link href="/dashboard/whatsapp/falhas">Ver Falhas</Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Status</CardTitle>
                <CardDescription>Distribuição de mensagens por status</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData && (
                  <ChartContainer 
                    className="aspect-square h-[300px]"
                    config={{
                      pending: { 
                        color: 'rgba(255, 159, 64, 0.6)',
                        label: 'Pendente' 
                      },
                      sent: { 
                        color: 'rgba(54, 162, 235, 0.6)',
                        label: 'Enviado' 
                      },
                      delivered: { 
                        color: 'rgba(75, 192, 192, 0.6)',
                        label: 'Entregue' 
                      },
                      read: { 
                        color: 'rgba(153, 102, 255, 0.6)',
                        label: 'Lido' 
                      },
                      failed: { 
                        color: 'rgba(255, 99, 132, 0.6)',
                        label: 'Falha' 
                      },
                    }}
                  >
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pendente', value: stats.pending, dataKey: 'pending' },
                          { name: 'Enviado', value: stats.sent, dataKey: 'sent' },
                          { name: 'Entregue', value: stats.delivered, dataKey: 'delivered' },
                          { name: 'Lido', value: stats.read, dataKey: 'read' },
                          { name: 'Falha', value: stats.failed, dataKey: 'failed' },
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label
                      >
                        {[
                          { dataKey: 'pending', fill: 'var(--color-pending)' },
                          { dataKey: 'sent', fill: 'var(--color-sent)' },
                          { dataKey: 'delivered', fill: 'var(--color-delivered)' },
                          { dataKey: 'read', fill: 'var(--color-read)' },
                          { dataKey: 'failed', fill: 'var(--color-failed)' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend content={<ChartLegendContent />} />
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhes por Status</CardTitle>
                <CardDescription>Informação detalhada por status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 mr-2">Pendente</Badge>
                      <span className="text-sm">Aguardando envio</span>
                    </div>
                    <div className="font-semibold">{stats.pending}</div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 mr-2">Enviado</Badge>
                      <span className="text-sm">Enviada para o WhatsApp</span>
                    </div>
                    <div className="font-semibold">{stats.sent}</div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-teal-50 text-teal-700 mr-2">Entregue</Badge>
                      <span className="text-sm">Entregue ao destinatário</span>
                    </div>
                    <div className="font-semibold">{stats.delivered}</div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 mr-2">Lido</Badge>
                      <span className="text-sm">Lida pelo destinatário</span>
                    </div>
                    <div className="font-semibold">{stats.read}</div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Badge variant="outline" className="bg-red-50 text-red-700 mr-2">Falha</Badge>
                      <span className="text-sm">Falha no envio</span>
                    </div>
                    <div className="font-semibold">{stats.failed}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
} 