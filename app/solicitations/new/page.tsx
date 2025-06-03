"use client"
import { Suspense } from "react"
import { SolicitationForm } from "@/components/forms/solicitation-form"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

// Client component that uses useSearchParams
const NewSolicitationContent = () => {
  const router = useRouter()
  const { user, hasRole } = useAuth()

  const isPlanAdmin = hasRole("plan_admin")
  const healthPlanId = isPlanAdmin ? user?.entity_id : undefined;

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

// Main page component with Suspense boundary
export default function NewSolicitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <NewSolicitationContent />
    </Suspense>
  )
} 