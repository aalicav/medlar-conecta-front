'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface PatientJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  journey: {
    scheduled_at: string;
    confirmed_at: string;
    attendance_confirmed_at: string;
    attended: boolean;
    guide_status: string;
  };
}

export function PatientJourneyModal({ isOpen, onClose, journey }: PatientJourneyModalProps) {
  const getStatusIcon = (status: boolean | null) => {
    if (status === true) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    if (status === false) return <XCircle className="w-5 h-5 text-red-500" />;
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  const getGuideStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pendente', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
      approved: { label: 'Aprovada', className: 'bg-green-50 text-green-700 border-green-200' },
      rejected: { label: 'Rejeitada', className: 'bg-red-50 text-red-700 border-red-200' },
      signed: { label: 'Assinada', className: 'bg-blue-50 text-blue-700 border-blue-200' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Jornada do Paciente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-500">Data da Marcação</p>
                <p className="text-base font-semibold">
                  {format(new Date(journey.scheduled_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              {getStatusIcon(true)}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-500">Confirmação (48h antes)</p>
                <p className="text-base font-semibold">
                  {journey.confirmed_at ? (
                    format(new Date(journey.confirmed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
                  ) : (
                    'Não confirmado'
                  )}
                </p>
              </div>
              {getStatusIcon(journey.confirmed_at ? true : false)}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-500">Confirmação de Comparecimento</p>
                <p className="text-base font-semibold">
                  {journey.attendance_confirmed_at ? (
                    format(new Date(journey.attendance_confirmed_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })
                  ) : (
                    'Não registrado'
                  )}
                </p>
              </div>
              {getStatusIcon(journey.attendance_confirmed_at ? true : false)}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-500">Comparecimento</p>
                <p className="text-base font-semibold">
                  {journey.attended ? 'Compareceu' : 'Não compareceu'}
                </p>
              </div>
              {getStatusIcon(journey.attended)}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-500">Status da Guia</p>
                <div className="mt-1">
                  {getGuideStatusBadge(journey.guide_status)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 