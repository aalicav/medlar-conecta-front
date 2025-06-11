import { Card } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { formatCurrency } from "../../utils/masks";

interface BillingChartProps {
  data: Array<{
    date: string;
    value: number;
    type?: string;
  }>;
}

export default function BillingChart({ data }: BillingChartProps) {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  const getGrowthIndicator = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <Card>
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Variação</TableHead>
              <TableHead>Tipo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => {
              const previousValue = index > 0 ? data[index - 1].value : 0;
              const growth = getGrowthIndicator(item.value, previousValue);
              
              return (
                <TableRow key={item.date}>
                  <TableCell>
                    {new Date(item.date).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(item.value)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={growth >= 0 ? "success" : "destructive"}>
                      {growth >= 0 ? '+' : ''}{growth.toFixed(2)}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.type || 'Revenue'}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="font-bold">
              <TableCell>Total</TableCell>
              <TableCell colSpan={3}>
                {formatCurrency(total)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
} 