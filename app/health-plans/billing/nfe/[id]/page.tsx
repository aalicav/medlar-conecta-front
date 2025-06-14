'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Download, ArrowLeft, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { NFeStatusBadge } from '@/components/NFeStatusBadge';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface NFeDetails {
  id: number;
  nfe_number: string;
  nfe_key: string;
  nfe_status: string;
  nfe_protocol: string;
  nfe_authorization_date: string;
  nfe_xml: string;
  total_amount: number;
  health_plan: {
    name: string;
    cnpj: string;
    ie: string;
    address_street: string;
    address_number: string;
    address_district: string;
    address_city: string;
    address_state: string;
    address_zipcode: string;
  };
  contract: {
    number: string;
  };
  items: Array<{
    id: number;
    procedure: {
      code: string;
      name: string;
    };
    amount: number;
  }>;
}

export default function NFeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const nfeId = params?.id;

  if (!nfeId) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-6">
            <div className="text-center">ID da nota fiscal não encontrado</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: nfe, isLoading } = useQuery<NFeDetails>({
    queryKey: ['nfe', nfeId],
    queryFn: async () => {
      const response = await api.get(`/billing/nfe/${nfeId}`);
      return response.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/billing/nfe/${nfeId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfe', nfeId] });
      toast.success('Nota fiscal cancelada com sucesso');
      router.push('/health-plans/billing/nfe');
    },
    onError: (error) => {
      toast.error('Erro ao cancelar nota fiscal');
      console.error('Error cancelling NFe:', error);
    },
  });

  const handleDownloadXML = async () => {
    if (!nfe) return;

    try {
      const response = await api.get(`/billing/nfe/${nfeId}/xml`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `nfe-${nfe.nfe_number}.xml`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading XML:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-6">
            <div className="text-center">Carregando...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!nfe) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-6">
            <div className="text-center">Nota fiscal não encontrada</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Link href="/health-plans/billing/nfe">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nota Fiscal #{nfe.nfe_number}</CardTitle>
              <CardDescription>
                Detalhes da nota fiscal emitida para {nfe.health_plan.name}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {nfe.nfe_status === 'authorized' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <XCircle className="h-4 w-4" />
                      Cancelar NFe
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar Nota Fiscal</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja cancelar esta nota fiscal? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => cancelMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Confirmar Cancelamento
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button onClick={handleDownloadXML} className="gap-2">
                <Download className="h-4 w-4" />
                Baixar XML
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Informações Gerais</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd>
                    <NFeStatusBadge status={nfe.nfe_status} />
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Chave de Acesso</dt>
                  <dd className="text-sm">{nfe.nfe_key}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Protocolo</dt>
                  <dd className="text-sm">{nfe.nfe_protocol || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Data de Autorização</dt>
                  <dd className="text-sm">
                    {nfe.nfe_authorization_date
                      ? format(new Date(nfe.nfe_authorization_date), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR,
                        })
                      : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Valor Total</dt>
                  <dd className="text-lg font-semibold">{formatCurrency(nfe.total_amount)}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Destinatário</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Plano de Saúde</dt>
                  <dd className="text-sm">{nfe.health_plan.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">CNPJ</dt>
                  <dd className="text-sm">{nfe.health_plan.cnpj}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Inscrição Estadual</dt>
                  <dd className="text-sm">{nfe.health_plan.ie}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contrato</dt>
                  <dd className="text-sm">{nfe.contract.number}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Endereço</dt>
                  <dd className="text-sm">
                    {nfe.health_plan.address_street}, {nfe.health_plan.address_number}
                    <br />
                    {nfe.health_plan.address_district}
                    <br />
                    {nfe.health_plan.address_city} - {nfe.health_plan.address_state}
                    <br />
                    CEP: {nfe.health_plan.address_zipcode}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h3 className="text-lg font-semibold mb-4">Itens da Nota Fiscal</h3>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Código
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Procedimento
                    </th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nfe.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-4 align-middle">{item.procedure.code}</td>
                      <td className="p-4 align-middle">{item.procedure.name}</td>
                      <td className="p-4 align-middle text-right">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-b bg-muted/50">
                    <td colSpan={2} className="p-4 align-middle font-medium">
                      Total
                    </td>
                    <td className="p-4 align-middle text-right font-medium">
                      {formatCurrency(nfe.total_amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 