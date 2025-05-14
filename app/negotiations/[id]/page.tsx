"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Edit, 
  ArrowLeft, 
  DollarSign,
  User,
  Calendar,
  Clock,
  Clipboard
} from 'lucide-react';

import { 
  negotiationService, 
  Negotiation, 
  NegotiationItem,
  negotiationStatusLabels, 
  negotiationItemStatusLabels,
} from '../../services/negotiationService';

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';

// Helper function to map status to color variants
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'draft': return 'outline';
    case 'submitted': return 'secondary';
    case 'approved': return 'default';
    case 'partially_approved': return 'secondary';
    case 'cancelled': return 'outline';
    default: return 'outline';
  }
};

const getItemStatusVariant = (status: string) => {
  switch (status) {
    case 'pending': return 'outline';
    case 'approved': return 'default';
    case 'rejected': return 'destructive';
    case 'counter_offered': return 'secondary';
    default: return 'outline';
  }
};

// Helper function to format currency for Brazilian format
const formatCurrency = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return 'R$ 0,00';
  
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Format with Brazilian style (comma as decimal separator)
  return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
};

export default function NegotiationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const negotiationId = params.id;
  const [negotiation, setNegotiation] = useState<Negotiation | null>(null);
  const [loading, setLoading] = useState(true);
  const [respondLoading, setRespondLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NegotiationItem | null>(null);
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [responseForm, setResponseForm] = useState({
    status: 'approved',
    approved_value: 0,
    notes: ''
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'submit' | 'cancel' | null;
    title: string;
    description: string;
  }>({
    open: false,
    action: null,
    title: '',
    description: ''
  });

  const fetchNegotiation = async () => {
    setLoading(true);
    try {
      const response = await negotiationService.getNegotiation(parseInt(negotiationId));
      setNegotiation(response.data);
    } catch (error) {
      console.error('Error fetching negotiation:', error);
      toast({
        title: "Erro",
        description: "Falha ao obter detalhes da negociação",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNegotiation();
  }, [negotiationId]);
  
  const confirmAction = (action: 'submit' | 'cancel') => {
    const titles = {
      submit: 'Submeter Negociação',
      cancel: 'Cancelar Negociação'
    };
    
    const descriptions = {
      submit: 'Tem certeza que deseja submeter esta negociação para aprovação?',
      cancel: 'Tem certeza que deseja cancelar esta negociação?'
    };
    
    setConfirmDialog({
      open: true,
      action,
      title: titles[action],
      description: descriptions[action]
    });
  };

  const handleActionConfirm = async () => {
    if (!confirmDialog.action || !negotiation) return;
    
    try {
      if (confirmDialog.action === 'submit') {
        await negotiationService.submitNegotiation(negotiation.id);
        toast({
          title: "Sucesso",
          description: "Negociação submetida com sucesso",
        });
      } else if (confirmDialog.action === 'cancel') {
        await negotiationService.cancelNegotiation(negotiation.id);
        toast({
          title: "Sucesso",
          description: "Negociação cancelada com sucesso",
        });
      }
      
      fetchNegotiation();
    } catch (error) {
      console.error(`Error ${confirmDialog.action}ing negotiation:`, error);
      toast({
        title: "Erro",
        description: `Falha ao ${confirmDialog.action === 'submit' ? 'submeter' : 'cancelar'} a negociação`,
        variant: "destructive"
      });
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleGenerateContract = async () => {
    if (!negotiation) return;
      
    try {
      const response = await negotiationService.generateContract(negotiation.id);
      toast({
        title: "Sucesso",
        description: "Contrato gerado com sucesso",
      });
      router.push(`/contracts/${response.data.contract_id}`);
    } catch (error) {
      console.error('Error generating contract:', error);
      toast({
        title: "Erro",
        description: "Falha ao gerar contrato",
        variant: "destructive"
      });
    }
  };

  const showResponseDialog = (item: NegotiationItem) => {
    setSelectedItem(item);
    setResponseForm({
      status: 'approved',
      approved_value: item.proposed_value,
      notes: ''
    });
    setResponseDialogOpen(true);
  };

  const handleResponseSubmit = async () => {
    if (!selectedItem) return;
    
    setRespondLoading(true);
    try {
      if (responseForm.status === 'counter_offered') {
        // Usando a rota de contra-oferta específica
        await negotiationService.counterOffer(selectedItem.id!, {
          approved_value: responseForm.approved_value,
          notes: responseForm.notes
        });
      } else {
        // Usando a rota de resposta normal
        await negotiationService.respondToItem(selectedItem.id!, {
          status: responseForm.status as any,
          approved_value: responseForm.status === 'approved' ? responseForm.approved_value : undefined,
          notes: responseForm.notes
        });
      }
      
      toast({
        title: "Sucesso",
        description: "Resposta enviada com sucesso",
      });
      setResponseDialogOpen(false);
      fetchNegotiation();
    } catch (error) {
      console.error('Error responding to item:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar resposta",
        variant: "destructive"
      });
    } finally {
      setRespondLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!negotiation) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          <span>/</span>
          <Link href="/negotiations" className="hover:underline">Negociações</Link>
          <span>/</span>
          <span>Detalhes</span>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p>Negociação não encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate metrics
  const totalItems = negotiation.items.length;
  const approvedItems = negotiation.items.filter(item => item.status === 'approved').length;
  const rejectedItems = negotiation.items.filter(item => item.status === 'rejected').length;
  const pendingItems = negotiation.items.filter(item => item.status === 'pending').length;
  
  // Make sure we're working with numeric values and provide defaults
  const totalProposedValue = negotiation.items.reduce((sum, item) => 
    sum + (typeof item.proposed_value === 'number' ? item.proposed_value : 
          typeof item.proposed_value === 'string' ? parseFloat(item.proposed_value) : 0), 0);
    
  const totalApprovedValue = negotiation.items
    .filter(item => item.status === 'approved')
    .reduce((sum, item) => 
      sum + (typeof item.approved_value === 'number' ? item.approved_value : 
            typeof item.approved_value === 'string' ? parseFloat(item.approved_value) : 0), 0);

  return (
    <div className="container py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-muted-foreground">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <span>/</span>
        <Link href="/negotiations" className="hover:underline">Negociações</Link>
        <span>/</span>
        <span>{negotiation.title}</span>
      </div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => router.push('/negotiations')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{negotiation.title}</h1>
            <div className="flex items-center mt-1 gap-2">
              <Badge variant={getStatusVariant(negotiation.status)}>
                {negotiationStatusLabels[negotiation.status]}
              </Badge>
              <span className="text-muted-foreground">
                ID: {negotiation.id}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {negotiation.status === 'draft' && (
            <>
              <Button variant="outline" onClick={() => router.push(`/negotiations/${negotiation.id}/edit`)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button onClick={() => confirmAction('submit')}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Submeter
              </Button>
            </>
          )}
          
          {['draft', 'submitted'].includes(negotiation.status) && (
            <Button variant="destructive" onClick={() => confirmAction('cancel')}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
          
          {negotiation.status === 'approved' && (
            <Button onClick={handleGenerateContract}>
              <FileText className="mr-2 h-4 w-4" />
              Gerar Contrato
            </Button>
          )}
        </div>
      </div>
      
      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Detalhes</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Entidade
                </dt>
                <dd className="font-medium">
                  {negotiation.negotiable?.name || '-'}
                  <span className="block text-xs text-muted-foreground">
                    {negotiation.negotiable_type.split('\\').pop() === 'HealthPlan' 
                      ? 'Plano de Saúde' 
                      : negotiation.negotiable_type.split('\\').pop() === 'Professional'
                        ? 'Profissional'
                        : 'Clínica'}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground flex items-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  Período
                </dt>
                <dd className="font-medium">
                  {new Date(negotiation.start_date).toLocaleDateString()} - {new Date(negotiation.end_date).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  Criado em
                </dt>
                <dd className="font-medium">
                  {new Date(negotiation.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between py-1">
                <dt className="text-muted-foreground flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Criado por
                </dt>
                <dd className="font-medium">
                  {negotiation.creator?.name || '-'}
                </dd>
              </div>
              {negotiation.notes && (
                <div className="py-1">
                  <dt className="text-muted-foreground flex items-center mb-1">
                    <Clipboard className="mr-2 h-4 w-4" />
                    Observações
                  </dt>
                  <dd className="font-medium border-l-2 pl-3 border-muted italic">
                    {negotiation.notes}
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total de Itens</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Badge variant="default" className="mr-2">
                      {approvedItems}
                    </Badge>
                    Aprovados
                  </span>
                  <span className="text-sm">{totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${totalItems > 0 ? (approvedItems / totalItems) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Badge variant="destructive" className="mr-2">
                      {rejectedItems}
                    </Badge>
                    Rejeitados
                  </span>
                  <span className="text-sm">{totalItems > 0 ? Math.round((rejectedItems / totalItems) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-destructive rounded-full"
                    style={{ width: `${totalItems > 0 ? (rejectedItems / totalItems) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Badge variant="outline" className="mr-2">
                      {pendingItems}
                    </Badge>
                    Pendentes
                  </span>
                  <span className="text-sm">{totalItems > 0 ? Math.round((pendingItems / totalItems) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-muted-foreground rounded-full"
                    style={{ width: `${totalItems > 0 ? (pendingItems / totalItems) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/40 p-4 rounded-lg">
                  <div className="text-muted-foreground text-sm mb-1">Valor Proposto</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalProposedValue)}</div>
                </div>
                <div className="bg-muted/40 p-4 rounded-lg">
                  <div className="text-muted-foreground text-sm mb-1">Valor Aprovado</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalApprovedValue)}</div>
                </div>
              </div>
              
              {approvedItems > 0 && (
                <div className="pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Diferença</span>
                    <span className={totalApprovedValue !== totalProposedValue ? 
                      (totalApprovedValue > totalProposedValue ? "text-green-600" : "text-red-600") : ""}>
                      {totalApprovedValue > totalProposedValue ? '+' : ''}
                      {formatCurrency(totalApprovedValue - totalProposedValue).substring(3)} 
                      ({totalProposedValue > 0 
                        ? (((totalApprovedValue - totalProposedValue) / totalProposedValue) * 100).toFixed(1).replace('.', ',') 
                        : 0}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Itens da Negociação</CardTitle>
          <CardDescription>
            {negotiation.status === 'draft' ? 
              'Estes itens serão incluídos na negociação após a submissão.' :
              'Revise o status de cada procedimento nesta negociação.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Procedimento</TableHead>
                <TableHead>Valor Proposto</TableHead>
                <TableHead>Valor Aprovado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observações</TableHead>
                {['submitted'].includes(negotiation.status) && (
                  <TableHead className="text-right">Ações</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {negotiation.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Nenhum item encontrado
                  </TableCell>
                </TableRow>
              ) : (
                negotiation.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.tuss?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Código: {item.tuss?.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(item.proposed_value)}
                    </TableCell>
                    <TableCell>
                      {item.status === 'approved' && item.approved_value ? (
                        <span className={
                          parseFloat(String(item.approved_value)) < parseFloat(String(item.proposed_value))
                            ? "text-red-600" 
                            : parseFloat(String(item.approved_value)) > parseFloat(String(item.proposed_value))
                              ? "text-green-600" 
                              : ""
                        }>
                          {formatCurrency(item.approved_value)}
                          {parseFloat(String(item.approved_value)) < parseFloat(String(item.proposed_value)) && ' ↓'}
                          {parseFloat(String(item.approved_value)) > parseFloat(String(item.proposed_value)) && ' ↑'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getItemStatusVariant(item.status)}>
                        {negotiationItemStatusLabels[item.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={item.notes || ''}>
                        {item.notes || '-'}
                      </div>
                    </TableCell>
                    {['submitted'].includes(negotiation.status) && (
                      <TableCell className="text-right">
                        {item.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => showResponseDialog(item)}
                          >
                            Responder
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Response Dialog */}
      <Dialog open={responseDialogOpen} onOpenChange={setResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder ao Item</DialogTitle>
            <DialogDescription>
              Revise e responda a {selectedItem?.tuss?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="proposed-value">Valor Proposto</Label>
                <Input 
                  id="proposed-value" 
                  value={selectedItem && selectedItem.proposed_value 
                    ? parseFloat(String(selectedItem.proposed_value)).toFixed(2).replace('.', ',')
                    : '0,00'} 
                  disabled 
                />
              </div>
              
              <div>
                <Label htmlFor="status">Resposta</Label>
                <Select 
                  value={responseForm.status} 
                  onValueChange={(value) => setResponseForm({...responseForm, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Aprovar</SelectItem>
                    <SelectItem value="rejected">Rejeitar</SelectItem>
                    <SelectItem value="counter_offered">Contra-proposta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {responseForm.status !== 'rejected' && (
              <div>
                <Label htmlFor="approved-value">
                  {responseForm.status === 'approved' ? 'Valor Aprovado' : 'Valor da Contra-proposta'}
                </Label>
                <Input 
                  id="approved-value"
                  type="number"
                  step="0.01"
                  value={responseForm.approved_value} 
                  onChange={(e) => setResponseForm({...responseForm, approved_value: parseFloat(e.target.value) || 0})}
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea 
                id="notes"
                placeholder="Adicione comentários ou observações sobre sua resposta"
                value={responseForm.notes}
                onChange={(e) => setResponseForm({...responseForm, notes: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setResponseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleResponseSubmit} 
              disabled={respondLoading}
            >
              {respondLoading ? 'Enviando...' : 'Enviar Resposta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Dialog */}
      <AlertDialog 
        open={confirmDialog.open} 
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleActionConfirm}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 