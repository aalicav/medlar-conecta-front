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

// Função auxiliar para mapear status para variantes de cores
const obterVarianteStatus = (status: NegotiationStatus) => {
  switch (status) {
    case 'draft': return 'outline';
    case 'pending_commercial':
    case 'pending_financial':
    case 'pending_management':
    case 'pending_legal':
    case 'pending_direction':
      return 'secondary';
    case 'approved': return 'success';
    case 'rejected': return 'destructive';
    case 'cancelled': return 'outline';
    default: return 'outline';
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
    acao: 'submit' | 'approve' | 'reject' | 'cancel' | null;
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

  const confirmarAcao = (acao: 'submit' | 'approve' | 'reject' | 'cancel', id: number) => {
    const titulos = {
      submit: 'Enviar para Aprovação',
      approve: 'Aprovar Negociação',
      reject: 'Rejeitar Negociação',
      cancel: 'Cancelar Negociação'
    };
    
    const descricoes = {
      submit: 'Tem certeza que deseja enviar esta negociação para aprovação?',
      approve: 'Tem certeza que deseja aprovar esta negociação?',
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
      switch (dialogoConfirmacao.acao) {
        case 'submit':
          await negotiationService.submitForApproval(dialogoConfirmacao.id);
          toast({
            title: "Sucesso",
            description: "Negociação enviada para aprovação com sucesso",
          });
          break;
        case 'approve':
          await negotiationService.processApproval(dialogoConfirmacao.id, 'approve');
          toast({
            title: "Sucesso",
            description: "Negociação aprovada com sucesso",
          });
          break;
        case 'reject':
          await negotiationService.processApproval(dialogoConfirmacao.id, 'reject');
          toast({
            title: "Sucesso",
            description: "Negociação rejeitada com sucesso",
          });
          break;
        case 'cancel':
          await negotiationService.cancelNegotiation(dialogoConfirmacao.id);
          toast({
            title: "Sucesso",
            description: "Negociação cancelada com sucesso",
          });
          break;
      }
      
      buscarNegociacoes(paginacao.atual, paginacao.tamanhoPagina);
    } catch (error) {
      console.error(`Erro ao processar ação:`, error);
      toast({
        title: "Erro",
        description: `Falha ao processar a ação`,
        variant: "destructive"
      });
    } finally {
      setDialogoConfirmacao({ ...dialogoConfirmacao, aberto: false });
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
    const userRole = 'commercial_manager' as UserRole; // TODO: Get from auth context
    
    const canApprove = (level: ApprovalLevel): boolean => {
      const roleMap: Record<ApprovalLevel, UserRole> = {
        commercial: 'commercial_manager',
        financial: 'financial_manager',
        management: 'management_committee',
        legal: 'legal_manager',
        direction: 'director'
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
          
          {negociacao.status === 'draft' && (
            <DropdownMenuItem onClick={() => confirmarAcao('submit', negociacao.id)}>
              Enviar para Aprovação
            </DropdownMenuItem>
          )}
          
          {negociacao.status.startsWith('pending_') && 
           canApprove(negociacao.current_approval_level as ApprovalLevel) && (
            <>
              <DropdownMenuItem onClick={() => confirmarAcao('approve', negociacao.id)}>
                Aprovar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => confirmarAcao('reject', negociacao.id)}>
                Rejeitar
              </DropdownMenuItem>
            </>
          )}
          
          {negociacao.status.startsWith('submitted') && (
            <DropdownMenuItem onClick={() => handleResendNotifications(negociacao.id)}>
              Reenviar Notificações
            </DropdownMenuItem>
          )}
          
          {!['approved', 'rejected', 'cancelled'].includes(negociacao.status) && (
            <DropdownMenuItem onClick={() => confirmarAcao('cancel', negociacao.id)}>
              Cancelar
            </DropdownMenuItem>
          )}
          
          {negociacao.status === 'approved' && (
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

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Negociações</h1>
          <p className="text-muted-foreground">Gerencie suas negociações com planos de saúde, profissionais e clínicas</p>
        </div>
        
        <Button onClick={() => router.push('/negotiations/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Negociação
        </Button>
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
                        <Badge variant={obterVarianteStatus(negociacao.status)}>
                          {negotiationStatusLabels[negociacao.status]}
                        </Badge>
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