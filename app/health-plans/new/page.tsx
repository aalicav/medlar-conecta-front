"use client"

import { useState } from "react"
import { HealthPlanForm } from "@/components/forms/health-plan-form"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, PlusCircle, GitBranch } from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useQuery } from "@tanstack/react-query"
import api from "@/services/api-client"
import { Skeleton } from "@/components/ui/skeleton"

export default function NewHealthPlanPage() {
  const [isChildPlan, setIsChildPlan] = useState(false)
  const [selectedParentId, setSelectedParentId] = useState<string>("")

  // Fetch parent plans
  const { data: parentPlans, isLoading: loadingParents } = useQuery({
    queryKey: ['parent-plans'],
    queryFn: async () => {
      const response = await api.get('/health-plans', {
        params: {
          is_parent: true,
          status: 'approved',
          per_page: 100
        }
      })
      return response.data.data
    },
    enabled: isChildPlan // Only fetch when creating a child plan
  })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 border-l-4 border-l-primary pl-4">
        <div className="flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-primary" />
          <h1 className="text-3xl font-bold">Novo Plano de Saúde</h1>
        </div>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Preencha os dados do plano de saúde usando o formulário abaixo. Os campos marcados com * são obrigatórios.
          Use o botão de busca para completar o endereço automaticamente a partir do CEP.
        </p>
        <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800 text-sm">
            <strong>Atenção:</strong> Novos planos de saúde precisam ser aprovados e ter o contrato assinado
            antes que solicitações possam ser criadas.
            {isChildPlan && (
              <span className="block mt-1">
                <GitBranch className="inline-block w-4 h-4 mr-1" />
                Planos filhos serão automaticamente aprovados se o plano pai já estiver aprovado.
              </span>
            )}
          </p>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Tipo de Plano</CardTitle>
          <CardDescription>
            Selecione se este é um plano independente ou um plano filho de outro plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <div className="flex items-center space-x-4">
              <Switch
                id="child-plan"
                checked={isChildPlan}
                onCheckedChange={setIsChildPlan}
              />
              <Label htmlFor="child-plan" className="font-medium">
                Este é um plano filho
              </Label>
            </div>

            {isChildPlan && (
              <div className="space-y-2">
                <Label htmlFor="parent-plan">Selecione o Plano Pai</Label>
                <Select
                  value={selectedParentId}
                  onValueChange={setSelectedParentId}
                  disabled={loadingParents}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingParents ? "Carregando..." : "Selecione um plano pai"} />
                  </SelectTrigger>
                  <SelectContent>
                    {parentPlans?.map((plan: any) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                        {plan.status === 'approved' && (
                          <span className="ml-2 text-xs text-green-600">
                            (Aprovado)
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Apenas planos aprovados podem ser selecionados como plano pai
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted/30 rounded-lg p-6">
        <HealthPlanForm 
          isChildPlan={isChildPlan} 
          parentPlanId={selectedParentId}
        />
      </div>
      
      <Toaster />
    </div>
  )
}
