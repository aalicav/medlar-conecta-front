'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Clock, User, Database, Globe, RefreshCw } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type Audit = {
  id: number;
  event: 'created' | 'updated' | 'deleted' | 'restored';
  auditable_type: string;
  auditable_id: number;
  user_id: number;
  user_type: string;
  old_values: any;
  new_values: any;
  url: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  updated_at: string;
  formatted_date: string;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  auditable: {
    id: number;
    type: string;
    name: string;
  } | null;
};

export default function AuditLogDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAuditLog = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/audit-logs/${params.id}`);
      setAudit(response.data);
    } catch (error) {
      console.error('Failed to fetch audit log', error);
      toast({
        title: 'Erro',
        description: 'Falha ao buscar detalhes do log de auditoria',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchAuditLog();
    }
  }, [params.id]);

  const getEventLabel = (event: string) => {
    switch (event) {
      case 'created': return 'Criado';
      case 'updated': return 'Atualizado';
      case 'deleted': return 'Excluído';
      case 'restored': return 'Restaurado';
      default: return event;
    }
  };

  const getEventVariant = (event: string) => {
    switch (event) {
      case 'created': return 'success';
      case 'updated': return 'warning';
      case 'deleted': return 'destructive';
      case 'restored': return 'outline';
      default: return 'secondary';
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
  };

  const formatModelName = (type: string) => {
    return type.replace('App\\Models\\', '');
  };

  // Function to render the value changes
  const renderValueChanges = () => {
    if (!audit) return null;
    
    if (audit.event === 'created') {
      return renderCreatedValues();
    } else if (audit.event === 'updated') {
      return renderUpdatedValues();
    } else if (audit.event === 'deleted') {
      return renderDeletedValues();
    } else {
      return (
        <div className="text-muted-foreground">
          Não há detalhes disponíveis para este tipo de evento.
        </div>
      );
    }
  };

  const renderCreatedValues = () => {
    if (!audit?.new_values) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Valores Criados</h3>
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(audit.new_values).map(([key, value]) => (
            <div key={key} className="flex flex-col border p-3 rounded-md">
              <div className="flex justify-between">
                <span className="font-medium">{key}</span>
                <Badge variant="outline">{typeof value}</Badge>
              </div>
              <div className="mt-1 break-all whitespace-pre-wrap">
                {value === null ? (
                  <span className="text-muted-foreground italic">null</span>
                ) : (
                  <span>{String(value)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderUpdatedValues = () => {
    if (!audit?.old_values || !audit?.new_values) return null;
    
    const changedKeys = Object.keys({ ...audit.old_values, ...audit.new_values });
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Valores Alterados</h3>
        <div className="grid grid-cols-1 gap-3">
          {changedKeys.map(key => {
            const oldValue = audit.old_values?.[key];
            const newValue = audit.new_values?.[key];
            const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);
            
            if (!hasChanged) return null;
            
            return (
              <div key={key} className="flex flex-col border p-3 rounded-md">
                <span className="font-medium">{key}</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Valor Anterior</div>
                    <div className="break-all whitespace-pre-wrap bg-muted p-2 rounded">
                      {oldValue === null ? (
                        <span className="text-muted-foreground italic">null</span>
                      ) : (
                        <span>{String(oldValue)}</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Novo Valor</div>
                    <div className="break-all whitespace-pre-wrap bg-muted p-2 rounded">
                      {newValue === null ? (
                        <span className="text-muted-foreground italic">null</span>
                      ) : (
                        <span>{String(newValue)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }).filter(Boolean)}
        </div>
      </div>
    );
  };

  const renderDeletedValues = () => {
    if (!audit?.old_values) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Valores Excluídos</h3>
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(audit.old_values).map(([key, value]) => (
            <div key={key} className="flex flex-col border p-3 rounded-md">
              <div className="flex justify-between">
                <span className="font-medium">{key}</span>
                <Badge variant="outline">{typeof value}</Badge>
              </div>
              <div className="mt-1 break-all whitespace-pre-wrap">
                {value === null ? (
                  <span className="text-muted-foreground italic">null</span>
                ) : (
                  <span>{String(value)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Detalhes do Log de Auditoria</h1>
        </div>
        <Button
          variant="outline"
          onClick={fetchAuditLog}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : audit ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Log #{audit.id}</CardTitle>
                <Badge variant={getEventVariant(audit.event) as any}>
                  {getEventLabel(audit.event)}
                </Badge>
              </div>
              <CardDescription>
                {audit.formatted_date ? formatDateTime(audit.formatted_date) : 'Data desconhecida'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium flex items-center">
                    <Database className="h-4 w-4 mr-1.5" />
                    Entidade
                  </span>
                  {audit.auditable ? (
                    <div>
                      <div className="font-semibold">{audit.auditable.name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatModelName(audit.auditable.type)} #{audit.auditable.id}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Entidade não encontrada</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium flex items-center">
                    <User className="h-4 w-4 mr-1.5" />
                    Usuário
                  </span>
                  {audit.user ? (
                    <div>
                      <div className="font-semibold">{audit.user.name}</div>
                      <div className="text-sm text-muted-foreground">{audit.user.email}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Sistema ou usuário não identificado</span>
                  )}
                </div>

                <div className="flex flex-col space-y-1.5">
                  <span className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-1.5" />
                    Timestamp
                  </span>
                  <div>
                    <div className="font-semibold">{formatDateTime(audit.created_at)}</div>
                    <div className="text-sm text-muted-foreground">
                      Criado em {formatDateTime(audit.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center">
                  <Globe className="h-4 w-4 mr-1.5" />
                  Informações Adicionais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-medium">URL</span>
                    <div className="text-sm p-2 bg-muted rounded break-all">{audit.url || 'N/A'}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium">Endereço IP</span>
                    <div className="text-sm p-2 bg-muted rounded">{audit.ip_address || 'N/A'}</div>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-sm font-medium">User Agent</span>
                    <div className="text-sm p-2 bg-muted rounded break-words">
                      {audit.user_agent || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valores Alterados</CardTitle>
              <CardDescription>
                Detalhes das alterações registradas neste log de auditoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderValueChanges()}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <h2 className="text-xl font-semibold">Log de Auditoria não encontrado</h2>
            <p className="text-muted-foreground mt-2">
              O log solicitado não está disponível ou foi removido.
            </p>
            <Button 
              variant="default" 
              className="mt-4"
              onClick={() => router.push('/audit-logs')}
            >
              Voltar para a lista
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 