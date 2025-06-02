import React from 'react';
import Link from 'next/link';
import { Negotiation, negotiationStatusLabels, negotiationStatusColors } from '@/services/negotiationService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, ExternalLink } from 'lucide-react';

interface ForkedNegotiationsListProps {
  parentNegotiation: Negotiation;
  forkedNegotiations?: Negotiation[];
}

export function ForkedNegotiationsList({ parentNegotiation, forkedNegotiations }: ForkedNegotiationsListProps) {
  // Se não tiver negociações bifurcadas nem for uma bifurcação, não renderiza nada
  if ((!forkedNegotiations || forkedNegotiations.length === 0) && !parentNegotiation.parent_negotiation_id) {
    return null;
  }

  // Formatador de data
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Negociações Relacionadas
        </CardTitle>
        <CardDescription>
          {parentNegotiation.parent_negotiation_id 
            ? 'Esta negociação foi bifurcada a partir de outra negociação'
            : 'Esta negociação foi bifurcada em múltiplas negociações'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Se esta negociação foi bifurcada de outra (mostrar a negociação pai) */}
          {parentNegotiation.parent_negotiation_id && parentNegotiation.parent_negotiation && (
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">Negociação de Origem</h3>
                <Badge variant="outline">Principal</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">{parentNegotiation.parent_negotiation.title}</span>
                  <Badge variant={negotiationStatusColors[parentNegotiation.parent_negotiation.status] as any}>
                    {negotiationStatusLabels[parentNegotiation.parent_negotiation.status]}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Criada em: {formatDate(parentNegotiation.parent_negotiation.created_at)}</p>
                  {parentNegotiation.parent_negotiation.items?.length && (
                    <p>Itens: {parentNegotiation.parent_negotiation.items.length}</p>
                  )}
                </div>
                <div className="mt-2">
                  <Link 
                    href={`/negotiations/${parentNegotiation.parent_negotiation.id}`}
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    Ver negociação
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
          
          {/* Se tem negociações bifurcadas, mostrar a lista */}
          {forkedNegotiations && forkedNegotiations.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium mb-2">Negociações Bifurcadas ({forkedNegotiations.length})</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {forkedNegotiations.map((negotiation) => (
                  <div key={negotiation.id} className="border rounded-lg p-3 hover:bg-accent/5 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium truncate">{negotiation.title}</span>
                      <Badge variant={negotiationStatusColors[negotiation.status] as any}>
                        {negotiationStatusLabels[negotiation.status]}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Bifurcada em: {formatDate(negotiation.forked_at || negotiation.created_at)}</p>
                      {negotiation.items?.length && (
                        <p>Itens: {negotiation.items.length}</p>
                      )}
                    </div>
                    <div className="mt-2">
                      <Link 
                        href={`/negotiations/${negotiation.id}`}
                        className="inline-flex items-center text-xs text-primary hover:underline"
                      >
                        Ver negociação
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 