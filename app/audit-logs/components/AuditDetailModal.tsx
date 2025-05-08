'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, Database, Globe } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuditDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audit: any | null;
  loading: boolean;
}

export default function AuditDetailModal({ 
  open, 
  onOpenChange,
  audit,
  loading
}: AuditDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Reset tab when modal opens/closes
  useEffect(() => {
    if (open) {
      setActiveTab('overview');
    }
  }, [open]);

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
        <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto p-1">
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
    
    const changedValues = changedKeys
      .map(key => {
        const oldValue = audit.old_values?.[key];
        const newValue = audit.new_values?.[key];
        const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);
        
        if (!hasChanged) return null;
        
        return { key, oldValue, newValue };
      })
      .filter(Boolean) as Array<{ key: string; oldValue: any; newValue: any }>;
    
    if (changedValues.length === 0) {
      return (
        <div className="text-muted-foreground">
          Não foram detectadas alterações de valores.
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Valores Alterados</h3>
        <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto p-1">
          {changedValues.map(item => (
            <div key={item.key} className="flex flex-col border p-3 rounded-md">
              <span className="font-medium">{item.key}</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Valor Anterior</div>
                  <div className="break-all whitespace-pre-wrap bg-muted p-2 rounded">
                    {item.oldValue === null ? (
                      <span className="text-muted-foreground italic">null</span>
                    ) : (
                      <span>{String(item.oldValue)}</span>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Novo Valor</div>
                  <div className="break-all whitespace-pre-wrap bg-muted p-2 rounded">
                    {item.newValue === null ? (
                      <span className="text-muted-foreground italic">null</span>
                    ) : (
                      <span>{String(item.newValue)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDeletedValues = () => {
    if (!audit?.old_values) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Valores Excluídos</h3>
        <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto p-1">
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

  // Render a system information tab
  const renderSystemInfo = () => {
    if (!audit) return null;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
            <span className="text-sm font-medium">URL</span>
            <div className="text-sm p-2 bg-muted rounded break-all">{audit.url || 'N/A'}</div>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">Endereço IP</span>
            <div className="text-sm p-2 bg-muted rounded">{audit.ip_address || 'N/A'}</div>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium">User Agent</span>
            <div className="text-sm p-2 bg-muted rounded break-words">
              {audit.user_agent || 'N/A'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
        {loading ? (
          <div className="space-y-4">
            <DialogHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </DialogHeader>
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ) : audit ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Log de Auditoria #{audit.id}</DialogTitle>
                <Badge variant={getEventVariant(audit.event) as any}>
                  {getEventLabel(audit.event)}
                </Badge>
              </div>
              <DialogDescription>
                {audit.formatted_date ? formatDateTime(audit.formatted_date) : 'Data desconhecida'}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="changes">Alterações</TabsTrigger>
                <TabsTrigger value="system">Sistema</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                
                <Separator className="my-2" />
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">Detalhes do Evento</h3>
                  <p className="text-sm text-muted-foreground">
                    {audit.event === 'created' && 'Este registro foi criado no sistema.'}
                    {audit.event === 'updated' && 'Este registro foi atualizado no sistema.'}
                    {audit.event === 'deleted' && 'Este registro foi excluído do sistema.'}
                    {audit.event === 'restored' && 'Este registro foi restaurado no sistema.'}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="changes" className="space-y-4 pt-3">
                {renderValueChanges()}
              </TabsContent>

              <TabsContent value="system" className="space-y-4 pt-3">
                {renderSystemInfo()}
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <h2 className="text-xl font-semibold">Log não encontrado</h2>
            <p className="text-muted-foreground mt-2">
              Não foi possível obter os detalhes deste log de auditoria.
            </p>
            <Button 
              variant="secondary" 
              className="mt-4" 
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 