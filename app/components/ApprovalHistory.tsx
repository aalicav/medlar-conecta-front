import { ApprovalHistory, approvalLevelLabels } from '../services/negotiationService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ApprovalHistoryProps {
  history: ApprovalHistory[];
}

export function ApprovalHistoryList({ history }: ApprovalHistoryProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprovado';
      case 'rejected': return 'Rejeitado';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Aprovações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item.id} className="flex items-start justify-between border-b pb-4 last:border-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{approvalLevelLabels[item.level]}</span>
                  <Badge variant={getStatusVariant(item.status)}>
                    {getStatusLabel(item.status)}
                  </Badge>
                </div>
                {item.notes && (
                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  {item.user?.name} • {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 