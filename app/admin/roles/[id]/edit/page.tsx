"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { getRole, updateRole, getPermissions } from '../../../users/userService';

type PageProps = {
  params: {
    id: string;
  };
};

interface Permission {
  id: number;
  name: string;
  guard_name: string;
  description?: string;
  group?: string;
}

interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions?: Permission[];
}

export default function EditRolePage({ params }: PageProps) {
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    guard_name: 'web',
    permissions: [] as string[]
  });
  const router = useRouter();
  const roleId = parseInt(params.id);
  
  // Lista de roles que não podem ser editadas
  const restrictedRoles = ['super_admin', 'plan_admin', 'professional', 'clinic_admin'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Carregar role e permissões em paralelo
        const [roleResponse, permissionsResponse] = await Promise.all([
          getRole(roleId),
          getPermissions()
        ]);

        const roleData = roleResponse.data;
        const permissionsData = permissionsResponse.data;

        setRole(roleData);
        setPermissions(permissionsData);
        
        // Preencher formulário com dados da role
        setFormData({
          name: roleData.name,
          guard_name: roleData.guard_name || 'web',
          permissions: roleData.permissions?.map((p: Permission) => p.name) || []
        });

      } catch (err) {
        setError('Não foi possível carregar os dados.');
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados da função.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    if (roleId) {
      fetchData();
    }
  }, [roleId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (permissionName: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionName]
        : prev.permissions.filter(p => p !== permissionName)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se é uma role restrita
    if (role && restrictedRoles.includes(role.name)) {
      toast({
        title: "Operação não permitida",
        description: `A função "${role.name}" é uma função do sistema e não pode ser editada.`,
        variant: "destructive"
      });
      return;
    }

    // Validações
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da função é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      
      await updateRole(roleId, {
        name: formData.name.trim(),
        guard_name: formData.guard_name,
        permissions: formData.permissions
      });

      toast({
        title: 'Sucesso',
        description: 'Função atualizada com sucesso.',
      });
      
      router.push(`/admin/roles/${roleId}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Não foi possível atualizar a função.';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  // Agrupar permissões por categoria
  const groupedPermissions = permissions.reduce((groups, permission) => {
    const group = permission.group || 'Geral';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(permission);
    return groups;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <div className="container py-6">
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <div className="flex justify-center items-center py-8 text-destructive gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="container py-6">
        <div className="flex justify-center items-center py-8 text-muted-foreground">
          Função não encontrada
        </div>
      </div>
    );
  }

  const isRestricted = restrictedRoles.includes(role.name);

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/admin/roles/${roleId}`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Função</h1>
            <p className="text-muted-foreground">
              Edite as informações e permissões da função "{role.name}"
            </p>
          </div>
        </div>
        
        {isRestricted && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Função do Sistema
          </Badge>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Configure as informações básicas da função
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Função</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Digite o nome da função"
                  disabled={isRestricted}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="guard_name">Guard</Label>
                <Input
                  id="guard_name"
                  value={formData.guard_name}
                  onChange={(e) => handleInputChange('guard_name', e.target.value)}
                  placeholder="web"
                  disabled={isRestricted}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Permissões */}
        <Card>
          <CardHeader>
            <CardTitle>Permissões</CardTitle>
            <CardDescription>
              Selecione as permissões que esta função terá acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {Object.entries(groupedPermissions).map(([groupName, groupPermissions]) => (
              <div key={groupName} className="mb-6">
                <h3 className="text-lg font-medium mb-3">{groupName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupPermissions.map((permission) => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={formData.permissions.includes(permission.name)}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(permission.name, checked as boolean)
                        }
                        disabled={isRestricted}
                      />
                      <Label 
                        htmlFor={`permission-${permission.id}`}
                        className="text-sm cursor-pointer"
                      >
                        <div className="font-medium">{permission.name}</div>
                        {permission.description && (
                          <div className="text-muted-foreground text-xs">
                            {permission.description}
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
            
            {permissions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhuma permissão disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>
              Confira as informações antes de salvar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Nome:</span>
                <span>{formData.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Guard:</span>
                <span>{formData.guard_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Permissões selecionadas:</span>
                <Badge variant="outline">{formData.permissions.length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/roles/${roleId}`)}
          >
            Cancelar
          </Button>
          
          <div className="flex gap-2">
            {isRestricted && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <XCircle className="h-4 w-4" />
                Função do sistema não pode ser editada
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={saving || isRestricted}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </form>
    </div>
  );
} 