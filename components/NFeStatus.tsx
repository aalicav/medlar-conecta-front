import { Badge } from '@/components/ui/badge';

interface NFeStatusProps {
  status: string;
}

export function NFeStatus({ status }: NFeStatusProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      issued: 'bg-blue-100 text-blue-800',
      authorized: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      error: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      pending: 'Pendente',
      issued: 'Emitida',
      authorized: 'Autorizada',
      cancelled: 'Cancelada',
      error: 'Erro',
    };
    return texts[status as keyof typeof texts] || 'Desconhecido';
  };

  return (
    <Badge className={getStatusColor(status)}>
      {getStatusText(status)}
    </Badge>
  );
} 