"use client"
import { SolicitationForm } from "@/components/forms/solicitation-form"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function NewSolicitationPage() {
  const router = useRouter()
  const { user, hasRole } = useAuth()

  const isPlanAdmin = hasRole("plan_admin")
  const healthPlanId = isPlanAdmin ? user?.id : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Solicitação</h1>
        <p className="text-muted-foreground">Cadastre uma nova solicitação de procedimento médico</p>
      </div>
      
      <SolicitationForm 
        isPlanAdmin={isPlanAdmin}
        healthPlanId={healthPlanId?.toString()}
        onSubmit={async () => {
          await router.push('/solicitations')
        }}
      />
    </div>
  )
} 