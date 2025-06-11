import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/format';

interface GlosaStatisticsProps {
  data: {
    total_glosa_amount: number;
    total_glosas: number;
    pending_glosas: number;
    appealable_glosas: number;
    average_glosa_amount: number;
  } | null;
}

export function GlosaStatistics({ data }: GlosaStatisticsProps) {
  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Nenhum dado de glosa disponível
        </CardContent>
      </Card>
    );
  }

  const pendingPercentage = (data.pending_glosas / data.total_glosas) * 100 || 0;
  const appealablePercentage = (data.appealable_glosas / data.total_glosas) * 100 || 0;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Glosas</h3>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-3xl font-bold">
            {formatCurrency(data.total_glosa_amount)}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            Valor Total em Glosas
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Glosas Pendentes</span>
              <span className="text-sm text-amber-600">
                {data.pending_glosas} de {data.total_glosas}
              </span>
            </div>
            <div className="bg-amber-100 rounded-full">
              <Progress 
                value={pendingPercentage} 
                className="h-2 bg-amber-600"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Glosas Recorríveis</span>
              <span className="text-sm text-blue-600">
                {data.appealable_glosas} de {data.total_glosas}
              </span>
            </div>
            <div className="bg-blue-100 rounded-full">
              <Progress 
                value={appealablePercentage} 
                className="h-2 bg-blue-600"
              />
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm text-muted-foreground">
            Valor Médio por Glosa
          </h4>
          <p className="text-xl font-semibold text-red-600 mt-1">
            {formatCurrency(data.average_glosa_amount)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 