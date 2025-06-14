import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NFeStatusBadgeProps {
  status: string;
  className?: string;
}

export function NFeStatusBadge({ status, className }: NFeStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Pendente',
        description: 'Aguardando processamento',
      },
      issued: {
        color: 'bg-blue-100 text-blue-800',
        text: 'Emitida',
        description: 'Nota fiscal gerada',
      },
      authorized: {
        color: 'bg-green-100 text-green-800',
        text: 'Autorizada',
        description: 'Nota fiscal autorizada pela SEFAZ',
      },
      cancelled: {
        color: 'bg-red-100 text-red-800',
        text: 'Cancelada',
        description: 'Nota fiscal cancelada',
      },
      error: {
        color: 'bg-red-100 text-red-800',
        text: 'Erro',
        description: 'Erro no processamento',
      },
    };

    return configs[status as keyof typeof configs] || {
      color: 'bg-gray-100 text-gray-800',
      text: 'Desconhecido',
      description: 'Status não identificado',
    };
  };

  const config = getStatusConfig(status);

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <Badge className={config.color}>{config.text}</Badge>
      <span className="text-xs text-muted-foreground">{config.description}</span>
    </div>
  );
} 