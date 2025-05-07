import { SolicitationForm } from "@/components/forms/solicitation-form"

export default function NewSolicitationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Solicitação</h1>
        <p className="text-muted-foreground">Cadastre uma nova solicitação de procedimento médico</p>
      </div>
      
      <SolicitationForm />
    </div>
  )
} 