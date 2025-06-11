import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface AttendanceStatisticsProps {
  data: {
    total_appointments: number;
    attended_appointments: number;
    missed_appointments: number;
    billable_appointments: number;
  } | null;
}

export function AttendanceStatistics({ data }: AttendanceStatisticsProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Nenhum dado de atendimento disponível
        </CardContent>
      </Card>
    );
  }

  const attendanceRate = (data.attended_appointments / data.total_appointments) * 100 || 0;
  const billableRate = (data.billable_appointments / data.attended_appointments) * 100 || 0;
  const missedRate = (data.missed_appointments / data.total_appointments) * 100 || 0;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Atendimentos</h3>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-3xl font-bold">
            {data.total_appointments}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            Total de Atendimentos
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Taxa de Comparecimento</span>
              <span className="text-sm text-green-600">
                {attendanceRate.toFixed(1)}%
              </span>
            </div>
            <div className="bg-green-100 rounded-full">
              <Progress 
                value={attendanceRate} 
                className="h-2 bg-green-600"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Taxa de Faturamento</span>
              <span className="text-sm text-blue-600">
                {billableRate.toFixed(1)}%
              </span>
            </div>
            <div className="bg-blue-100 rounded-full">
              <Progress 
                value={billableRate} 
                className="h-2 bg-blue-600"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Taxa de Absenteísmo</span>
              <span className="text-sm text-red-600">
                {missedRate.toFixed(1)}%
              </span>
            </div>
            <div className="bg-red-100 rounded-full">
              <Progress 
                value={missedRate} 
                className="h-2 bg-red-600"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Detalhamento</h4>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Realizados</span>
            <span className="text-sm">{data.attended_appointments}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Faturáveis</span>
            <span className="text-sm">{data.billable_appointments}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Faltas</span>
            <span className="text-sm">{data.missed_appointments}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 