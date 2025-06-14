'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Download, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { NFeStatusBadge } from '@/components/NFeStatusBadge';
import Link from 'next/link';

interface NFe {
  id: number;
  nfe_number: string;
  nfe_key: string;
  nfe_status: string;
  nfe_authorization_date: string;
  total_amount: number;
  health_plan: {
    name: string;
  };
  contract: {
    number: string;
  };
}

export default function NFePage() {
  const [search, setSearch] = useState('');

  const { data: nfes, isLoading } = useQuery<NFe[]>({
    queryKey: ['nfes', search],
    queryFn: async () => {
      const response = await api.get('/billing/nfe', {
        params: { search },
      });
      return response.data;
    },
  });

  const handleDownloadXML = async (nfeId: number, nfeNumber: string) => {
    try {
      const response = await api.get(`/billing/nfe/${nfeId}/xml`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `nfe-${nfeNumber}.xml`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading XML:', error);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Notas Fiscais</CardTitle>
          <CardDescription>
            Gerencie todas as notas fiscais emitidas pelo sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número da nota, plano ou contrato..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Número
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Plano de Saúde
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Contrato
                  </th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                    Valor Total
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Data de Autorização
                  </th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center">
                      Carregando...
                    </td>
                  </tr>
                ) : nfes?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center">
                      Nenhuma nota fiscal encontrada
                    </td>
                  </tr>
                ) : (
                  nfes?.map((nfe) => (
                    <tr key={nfe.id} className="border-b">
                      <td className="p-4 align-middle">
                        <Link
                          href={`/health-plans/billing/nfe/${nfe.id}`}
                          className="font-medium hover:underline"
                        >
                          #{nfe.nfe_number}
                        </Link>
                      </td>
                      <td className="p-4 align-middle">{nfe.health_plan.name}</td>
                      <td className="p-4 align-middle">{nfe.contract.number}</td>
                      <td className="p-4 align-middle text-right">
                        {formatCurrency(nfe.total_amount)}
                      </td>
                      <td className="p-4 align-middle">
                        <NFeStatusBadge status={nfe.nfe_status} />
                      </td>
                      <td className="p-4 align-middle">
                        {nfe.nfe_authorization_date
                          ? format(new Date(nfe.nfe_authorization_date), 'dd/MM/yyyy HH:mm', {
                              locale: ptBR,
                            })
                          : '-'}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadXML(nfe.id, nfe.nfe_number)}
                          title="Baixar XML"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 