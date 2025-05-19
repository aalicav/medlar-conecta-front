"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Filter,
  FileDown
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { 
  negotiationService, 
  Negotiation, 
  negotiationStatusLabels, 
  NegotiationStatus,
  ApprovalLevel,
  approvalLevelLabels,
  ApprovalAction,
  UserRole
} from '../services/negotiationService';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { useToast } from '@/components/ui/use-toast';

/**
 * Fluxo de status da negociação:
 * 1. draft: Rascunho inicial
 * 2. submitted: Em análise pela entidade, aguardando respostas para envio à aprovação interna
 * 3. pending: Em avaliação interna para aprovação 
 * 4. approved: Aprovado internamente, enviado automaticamente à entidade para aprovação final
 * 5a. complete: Completamente aprovado pela entidade externa
 * 5b. partially_complete: Parcialmente aprovado pela entidade externa
 * 
 * Também pode ser:
 * - partially_approved: Alguns itens aprovados, outros rejeitados pela entidade
 * - rejected: Rejeitado internamente ou externamente
 * - cancelled: Cancelado manualmente
 */
// Função auxiliar para mapear status para variantes de cores
const obterVarianteStatus = (status: NegotiationStatus) => {
  switch (status) {
    case 'draft': return 'outline';
    case 'submitted': return 'secondary';
    case 'pending': return 'warning';
    case 'complete': return 'success';
    case 'partially_complete': return 'warning';
    case 'approved': return 'success';
    case 'partially_approved': return 'warning';
    case 'rejected': return 'destructive';
    case 'cancelled': return 'outline';
    default: return 'outline';
  }
};

/**
 * Obter descrição do fluxo de status para ajudar na compreensão do usuário
 */
const getStatusDescription = (status: NegotiationStatus): string => {
  switch (status) {
    case 'draft':
      return 'Rascunho inicial aguardando envio para aprovação interna';
    case 'submitted':
      return 'Em análise pela entidade, aguardando respostas para envio à aprovação interna';
    case 'pending':
      return 'Em análise interna para aprovação';
    case 'approved':
      return 'Aprovado internamente, negociação enviada automaticamente à entidade para aprovação final';
    case 'complete':
      return 'Aprovado pela entidade (aprovação completa)';
    case 'partially_complete':
      return 'Parcialmente aprovado pela entidade';
    case 'partially_approved':
      return 'Alguns itens foram aprovados, outros rejeitados';
    case 'rejected':
      return 'Rejeitado internamente ou pela entidade';
    case 'cancelled':
      return 'Cancelado manualmente';
    default:
      return 'Status desconhecido';
  }
};

export default function PaginaNegociacoes() {
  const router = useRouter();
  const { toast } = useToast();
  const [negociacoes, setNegociacoes] = useState<Negotiation[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [textoBusca, setTextoBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<NegotiationStatus | ''>('');
  const [paginacao, setPaginacao] = useState({
    atual: 1,
    tamanhoPagina: 10,
    total: 0
  });
  const [campoOrdenacao, setCampoOrdenacao] = useState('created_at');
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<'asc' | 'desc'>('desc');
  const [dialogoConfirmacao, setDialogoConfirmacao] = useState<{
    aberto: boolean;
    acao: 'approve' | 'reject' | 'cancel' | null;
    id: number | null;
    titulo: string;
    descricao: string;
  }>({
    aberto: false,
    acao: null,
    id: null,
    titulo: '',
    descricao: ''
  });

  const buscarNegociacoes = async (pagina = 1, tamanhoPagina = 10) => {
    setCarregando(true);
    try {
      const response = await negotiationService.getNegotiations({
        search: textoBusca || undefined,
        status: filtroStatus || undefined,
        sort_field: campoOrdenacao,
        sort_order: direcaoOrdenacao,
        page: pagina,
        per_page: tamanhoPagina
      });
      
      setNegociacoes(response.data);
      setPaginacao({
        atual: response.meta.current_page,
        tamanhoPagina: response.meta.per_page,
        total: response.meta.total
      });
    } catch (error) {
      console.error('Erro ao buscar negociações:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar negociações",
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarNegociacoes(paginacao.atual, paginacao.tamanhoPagina);
  }, [filtroStatus, campoOrdenacao, direcaoOrdenacao]);

  const handleBusca = () => {
    setPaginacao({ ...paginacao, atual: 1 });
    buscarNegociacoes(1, paginacao.tamanhoPagina);
  };

  const handleFiltroStatus = (valor: string) => {
    setFiltroStatus(valor as NegotiationStatus | '');
    setPaginacao({ ...paginacao, atual: 1 });
  };

  const handleMudancaPagina = (pagina: number) => {
    setPaginacao({ ...paginacao, atual: pagina });
    buscarNegociacoes(pagina, paginacao.tamanhoPagina);
  };

  const handleMudancaOrdenacao = (campo: string) => {
    const novaDirecao = campo === campoOrdenacao && direcaoOrdenacao === 'asc' ? 'desc' : 'asc';
    setCampoOrdenacao(campo);
    setDirecaoOrdenacao(novaDirecao);
  };

  const confirmarAcao = (acao: 'approve' | 'reject' | 'cancel', id: number) => {
    const titulos = {
      approve: 'Aprovar Negociação Internamente',
      reject: 'Rejeitar Negociação',
      cancel: 'Cancelar Negociação'
    };
    
    const descricoes = {
      approve: 'Tem certeza que deseja aprovar internamente esta negociação? Após aprovação interna, a entidade deverá dar o veredito final.',
      reject: 'Tem certeza que deseja rejeitar esta negociação?',
      cancel: 'Tem certeza que deseja cancelar esta negociação?'
    };
    
    setDialogoConfirmacao({
      aberto: true,
      acao,
      id,
      titulo: titulos[acao],
      descricao: descricoes[acao]
    });
  };

  const handleConfirmarAcao = async () => {
    if (!dialogoConfirmacao.acao || !dialogoConfirmacao.id) return;
    
    try {
      setCarregando(true);
      
      switch (dialogoConfirmacao.acao) {
        case 'approve':
          // Aprovar internamente
          await negotiationService.processApproval(dialogoConfirmacao.id, 'approve');
          toast({
            title: "Sucesso",
            description: "Negociação aprovada com sucesso",
          });
          break;
          
        case 'reject':
          // Rejeitar
          await negotiationService.processApproval(dialogoConfirmacao.id, 'reject');
          toast({
            title: "Sucesso",
            description: "Negociação rejeitada com sucesso",
          });
          break;
          
        case 'cancel':
          // Cancelar
          await negotiationService.cancelNegotiation(dialogoConfirmacao.id);
          toast({
            title: "Sucesso",
            description: "Negociação cancelada com sucesso",
          });
          break;
      }
      
      // Fechar o diálogo de confirmação e atualizar a lista
      setDialogoConfirmacao({ ...dialogoConfirmacao, aberto: false });
      buscarNegociacoes(paginacao.atual, paginacao.tamanhoPagina);
    } catch (error) {
      console.error(`Erro ao ${dialogoConfirmacao.acao} negociação:`, error);
      toast({
        title: "Erro",
        description: `Falha ao ${dialogoConfirmacao.acao} a negociação`,
        variant: "destructive"
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleGerarContrato = async (id: number) => {
    try {
      const response = await negotiationService.generateContract(id);
      toast({
        title: "Sucesso",
        description: "Geração de contrato iniciada com sucesso",
      });
      
      if (response.data?.contract_id) {
        router.push(`/contracts/${response.data.contract_id}`);
      }
    } catch (error) {
      console.error('Erro ao gerar contrato:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar contrato",
        variant: "destructive"
      });
    }
  };

  const handleResendNotifications = async (id: number) => {
    try {
      const negotiation = negociacoes.find(n => n.id === id);
      await negotiationService.resendNotifications(id, negotiation?.status);
      toast({
        title: "Sucesso",
        description: "Notificações reenviadas com sucesso",
      });
      
      buscarNegociacoes(paginacao.atual, paginacao.tamanhoPagina);
    } catch (error) {
      console.error('Erro ao reenviar notificações:', error);
      toast({
        title: "Erro",
        description: "Falha ao reenviar notificações",
        variant: "destructive"
      });
    }
  };

  const renderizarPaginacao = () => {
    const { atual, total, tamanhoPagina } = paginacao;
    const totalPaginas = Math.ceil(total / tamanhoPagina);
    
    if (totalPaginas <= 1) return null;
    
    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => handleMudancaPagina(Math.max(1, atual - 1))}
              className={atual === 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          
          {Array.from({ length: Math.min(5, totalPaginas) }).map((_, i) => {
            let numPagina = atual <= 3 
              ? i + 1 
              : atual >= totalPaginas - 2 
                ? totalPaginas - 4 + i 
                : atual - 2 + i;
                
            if (numPagina > totalPaginas) return null;
            if (numPagina < 1) numPagina = 1;
            
            return (
              <PaginationItem key={numPagina}>
                <PaginationLink 
                  isActive={numPagina === atual}
                  onClick={() => handleMudancaPagina(numPagina)}
                >
                  {numPagina}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          
          {totalPaginas > 5 && atual < totalPaginas - 2 && (
            <>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink onClick={() => handleMudancaPagina(totalPaginas)}>
                  {totalPaginas}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => handleMudancaPagina(Math.min(totalPaginas, atual + 1))}
              className={atual === totalPaginas ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const renderizarAcoes = (negociacao: Negotiation) => {
    // TODO: Get from auth context
    const userRole = 'commercial_manager' as UserRole; 
    
    const canApprove = (level: ApprovalLevel): boolean => {
      const roleMap: Record<ApprovalLevel, UserRole> = {
        approval: 'commercial_manager'
      };
      
      return userRole === roleMap[level];
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Draft - Enviar para aprovação interna */}
          {negociacao.status === 'draft' && (
            <DropdownMenuItem onClick={() => handleSubmitForFinalApproval(negociacao.id)}>
              Enviar para Aprovação Interna
            </DropdownMenuItem>
          )}
          
          {/* Submitted/Partially Approved - Enviar para aprovação interna */}
          {(negociacao.status === 'submitted' || negociacao.status === 'partially_approved') && (
            <DropdownMenuItem onClick={() => handleSubmitForFinalApproval(negociacao.id)}>
              Enviar para Aprovação Interna
            </DropdownMenuItem>
          )}
          
          {/* Pending - Aprovação / Rejeição interna */}
          {negociacao.status === 'pending' && canApprove(negociacao.current_approval_level as ApprovalLevel) && (
            <>
              <DropdownMenuItem onClick={() => confirmarAcao('approve', negociacao.id)}>
                Aprovar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => confirmarAcao('reject', negociacao.id)}>
                Rejeitar
              </DropdownMenuItem>
            </>
          )}
          
          {/* Approved - Mudanças de status são gerenciadas automaticamente pela aplicação */}
          {negociacao.status === 'approved' && (
            <DropdownMenuItem onClick={() => handleResendNotifications(negociacao.id)}>
              Reenviar Notificação à Entidade
            </DropdownMenuItem>
          )}
          
          {/* Reenvio de notificações */}
          {['submitted', 'pending'].includes(negociacao.status) && (
            <DropdownMenuItem onClick={() => handleResendNotifications(negociacao.id)}>
              Reenviar Notificações
            </DropdownMenuItem>
          )}
          
          {/* Cancelar negociação ativa */}
          {!['complete', 'partially_complete', 'approved', 'rejected', 'cancelled'].includes(negociacao.status) && (
            <DropdownMenuItem onClick={() => confirmarAcao('cancel', negociacao.id)}>
              Cancelar
            </DropdownMenuItem>
          )}
          
          {/* Gerar contrato para negociações aprovadas ou completas */}
          {['approved', 'complete', 'partially_complete'].includes(negociacao.status) && (
            <DropdownMenuItem onClick={() => handleGerarContrato(negociacao.id)}>
              Gerar Contrato
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem asChild>
            <Link href={`/negotiations/${negociacao.id}`}>
              Ver Detalhes
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Adicionar funções para novas ações
  const handleRequestExternalReview = async (id: number) => {
    try {
      // Agora, em vez de enviar diretamente para a entidade,
      // enviamos para aprovação interna primeiro
      await negotiationService.submitForApproval(id);
      toast({
        title: "Sucesso",
        description: "Negociação enviada para aprovação interna com sucesso",
      });
      buscarNegociacoes(paginacao.atual, paginacao.tamanhoPagina);
    } catch (error) {
      console.error('Erro ao enviar para aprovação interna:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar para aprovação interna",
        variant: "destructive"
      });
    }
  };
  
  const handleSubmitForFinalApproval = async (id: number) => {
    try {
      // Usar o serviço para enviar para aprovação final
      await negotiationService.submitForApproval(id);
      toast({
        title: "Sucesso",
        description: "Negociação enviada para aprovação final com sucesso",
      });
      buscarNegociacoes(paginacao.atual, paginacao.tamanhoPagina);
    } catch (error) {
      console.error('Erro ao enviar para aprovação final:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar para aprovação final",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsComplete = async (id: number) => {
    try {
      await negotiationService.markAsComplete(id);
      toast({
        title: "Sucesso",
        description: "Negociação marcada como completa com sucesso",
      });
      buscarNegociacoes(paginacao.atual, paginacao.tamanhoPagina);
    } catch (error) {
      console.error('Erro ao marcar negociação como completa:', error);
      toast({
        title: "Erro",
        description: "Falha ao marcar negociação como completa",
        variant: "destructive"
      });
    }
  };

  const handleMarkAsPartiallyComplete = async (id: number) => {
    try {
      await negotiationService.markAsPartiallyComplete(id);
      toast({
        title: "Sucesso",
        description: "Negociação marcada como parcialmente completa com sucesso",
      });
      buscarNegociacoes(paginacao.atual, paginacao.tamanhoPagina);
    } catch (error) {
      console.error('Erro ao marcar negociação como parcialmente completa:', error);
      toast({
        title: "Erro",
        description: "Falha ao marcar negociação como parcialmente completa",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Negociações</h1>
          <p className="text-muted-foreground">Gerencie suas negociações com planos de saúde, profissionais e clínicas</p>
        </div>
        
        <div className="flex gap-2">
          <Link href="/negotiations/extemporaneous">
            <Button variant="secondary">
              Negociações Extemporâneas
            </Button>
          </Link>
          <Button onClick={() => router.push('/negotiations/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Negociação
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="w-full sm:w-auto flex-1">
              <div className="relative flex">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar negociações..."
                  value={textoBusca}
                  onChange={(e) => setTextoBusca(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBusca()}
                  className="pl-8 mr-2"
                />
                <Button type="button" onClick={handleBusca} variant="secondary">
                  Buscar
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select
                value={filtroStatus || ''}
                onValueChange={handleFiltroStatus}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(negotiationStatusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleMudancaOrdenacao('title')}
                  >
                    Título {campoOrdenacao === 'title' && (direcaoOrdenacao === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleMudancaOrdenacao('created_at')}
                  >
                    Criada em {campoOrdenacao === 'created_at' && (direcaoOrdenacao === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {carregando ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : negociacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Nenhuma negociação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  negociacoes.map((negociacao) => (
                    <TableRow key={negociacao.id}>
                      <TableCell>
                        <Link 
                          href={`/negotiations/${negociacao.id}`}
                          className="font-medium hover:underline"
                        >
                          {negociacao.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{negociacao.negotiable?.name || '-'}</span>
                          <span className="text-xs text-muted-foreground">
                            {negociacao.negotiable_type.split('\\').pop() === 'HealthPlan' 
                              ? 'Plano de Saúde' 
                              : negociacao.negotiable_type.split('\\').pop() === 'Professional'
                                ? 'Profissional'
                                : 'Clínica'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant={obterVarianteStatus(negociacao.status)}>
                                {negotiationStatusLabels[negociacao.status]}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{getStatusDescription(negociacao.status)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        {new Date(negociacao.start_date).toLocaleDateString()} - {new Date(negociacao.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(negociacao.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {renderizarAcoes(negociacao)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {renderizarPaginacao()}
        </CardContent>
      </Card>
      
      <AlertDialog 
        open={dialogoConfirmacao.aberto} 
        onOpenChange={(aberto) => setDialogoConfirmacao({ ...dialogoConfirmacao, aberto })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogoConfirmacao.titulo}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogoConfirmacao.descricao}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarAcao}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 