'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Check, RefreshCcw, Trash, XCircle } from 'lucide-react';
import WhatsappService, { WhatsappMessage } from '@/app/services/whatsappService';

export default function MensagensFalhaWhatsApp() {
  const [failedMessages, setFailedMessages] = useState<WhatsappMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    fetchFailedMessages();
  }, []);

  const fetchFailedMessages = async () => {
    try {
      setLoading(true);
      const response = await WhatsappService.getMessages({
        status: 'failed',
        sort_field: 'created_at',
        sort_order: 'desc',
        per_page: 100,
      });
      setFailedMessages(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar mensagens com falha');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resendSelected = async () => {
    if (selectedIds.length === 0) return;
    
    setIsResending(true);
    setSuccess(null);
    setError(null);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const id of selectedIds) {
        try {
          await WhatsappService.resendMessage(id);
          successCount++;
        } catch (err) {
          console.error(`Erro ao reenviar mensagem ${id}:`, err);
          failCount++;
        }
      }

      if (failCount === 0) {
        setSuccess(`${successCount} mensagens reenviadas com sucesso!`);
      } else {
        setSuccess(`${successCount} mensagens reenviadas com sucesso. ${failCount} mensagens falharam ao reenviar.`);
      }

      // Refresh the list
      fetchFailedMessages();
      // Clear selection
      setSelectedIds([]);
    } catch (err) {
      setError('Houve um erro ao reenviar as mensagens');
      console.error(err);
    } finally {
      setIsResending(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === failedMessages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(failedMessages.map(msg => msg.id));
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mensagens com Falha</h1>
          <p className="text-gray-500">Gerencie e reenvia mensagens que falharam no envio</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard/whatsapp">Voltar ao Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/whatsapp/mensagens">Todas as Mensagens</Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
          <Check className="h-4 w-4" />
          <AlertTitle>Sucesso</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Mensagens com Erro</CardTitle>
              <CardDescription>
                Total: {failedMessages.length} mensagens com falha
              </CardDescription>
            </div>
            {failedMessages.length > 0 && (
              <Button 
                onClick={resendSelected} 
                disabled={selectedIds.length === 0 || isResending}
                className="flex items-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                {isResending ? 'Reenviando...' : `Reenviar ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={failedMessages.length > 0 && selectedIds.length === failedMessages.length} 
                      onCheckedChange={toggleSelectAll}
                      disabled={failedMessages.length === 0}
                    />
                  </TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={6} className="h-14">
                        <div className="h-4 bg-gray-100 rounded-md animate-pulse"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : failedMessages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhuma mensagem com falha encontrada. 🎉
                    </TableCell>
                  </TableRow>
                ) : (
                  failedMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(message.id)} 
                          onCheckedChange={() => toggleSelect(message.id)}
                        />
                      </TableCell>
                      <TableCell>{message.recipient}</TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {message.message || (message.media_url ? '📎 Arquivo anexado' : '—')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-red-600">
                          {message.error_message || 'Erro desconhecido'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            asChild
                          >
                            <Link href={`/dashboard/whatsapp/mensagens/${message.id}`}>
                              Detalhes
                            </Link>
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={async () => {
                              try {
                                await WhatsappService.resendMessage(message.id);
                                fetchFailedMessages();
                                setSuccess("Mensagem reenviada com sucesso!");
                              } catch (err) {
                                setError("Erro ao reenviar mensagem");
                                console.error(err);
                              }
                            }}
                            disabled={isResending}
                          >
                            <RefreshCcw className="h-4 w-4 mr-1" />
                            Reenviar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {failedMessages.length > 0 && (
          <CardFooter className="flex justify-between mt-4">
            <div className="text-sm text-gray-500">
              {selectedIds.length} de {failedMessages.length} mensagens selecionadas
            </div>
            <Button 
              variant="outline" 
              onClick={() => setSelectedIds([])}
              disabled={selectedIds.length === 0}
            >
              Limpar seleção
            </Button>
          </CardFooter>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Dicas para Resolver Falhas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Número inválido</h3>
              <p className="text-sm text-gray-600">
                Verifique se o número está no formato correto (com código do país, DDD e número).
                Exemplo correto: 5511999999999
              </p>
            </div>
            <div>
              <h3 className="font-medium">Mensagem não entregue</h3>
              <p className="text-sm text-gray-600">
                O destinatário pode não ter WhatsApp ou bloqueou mensagens de números desconhecidos.
                Tente entrar em contato por outros meios.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Problemas de conexão</h3>
              <p className="text-sm text-gray-600">
                Falhas temporárias de rede podem ocorrer. Tente reenviar a mensagem mais tarde.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Mídia inválida</h3>
              <p className="text-sm text-gray-600">
                Verifique se a URL da mídia está acessível e se o formato é suportado pelo WhatsApp.
                Formatos suportados: imagens (jpg, png), documentos (pdf), áudios (mp3, ogg) e vídeos (mp4).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 