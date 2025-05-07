"use client"

import { HealthPlanForm } from "@/components/forms/health-plan-form"

export default function NewHealthPlanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Plano de Saúde</h1>
        <p className="text-muted-foreground">
          Crie um novo plano de saúde com aprovação automática de procedimentos
        </p>
      </div>

      <HealthPlanForm />
    </div>
  )
}
