"use client"

import { SolicitationForm } from "@/components/forms/solicitation-form"
import { useParams } from "next/navigation"

export default function EditSolicitationPage() {
  const params = useParams()
  const solicitationId = Number(params.id)
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Solicitação</h1>
        <p className="text-muted-foreground">Atualize os dados da solicitação de procedimento médico</p>
      </div>
      
      <SolicitationForm isEditing={true} solicitationId={solicitationId} />
    </div>
  )
} 