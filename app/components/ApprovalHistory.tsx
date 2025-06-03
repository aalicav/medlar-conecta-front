import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Timeline, TimelineItem, TimelineConnector, TimelineContent, TimelineDot, TimelineHeader } from "@/components/ui/timeline";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ApprovalHistoryItem } from "@/services/negotiationService";

interface ApprovalHistoryProps {
  history: ApprovalHistoryItem[];
}

export function ApprovalHistory({ history }: ApprovalHistoryProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approve':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'reject':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approve':
        return 'Aprovado';
      case 'reject':
        return 'Rejeitado';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approve':
        return 'success';
      case 'reject':
        return 'destructive';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Histórico de Aprovações
        </CardTitle>
        <CardDescription>
          Acompanhe o histórico completo de aprovações desta negociação
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Timeline>
          {history.map((item, index) => (
            <TimelineItem key={item.id} isLast={index === history.length - 1}>
              <TimelineHeader>
                <TimelineDot>
                  {getStatusIcon(item.status)}
                </TimelineDot>
                <TimelineConnector />
              </TimelineHeader>
              <TimelineContent>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusVariant(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                          <User className="h-3.5 w-3.5 mr-1" />
                          {item.user?.name || 'Usuário não encontrado'}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.user?.email}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(item.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.notes}
                    </p>
                  )}
                </div>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
} 