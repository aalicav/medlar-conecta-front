"use client"

import { PatientForm } from "@/components/forms/patient-form"
import { useParams, useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function EditPatientPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params?.id as string
  
  const handleSuccess = () => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>Sucesso</span>
        </div>
      ),
      description: "Paciente atualizado com sucesso",
      variant: "success"
    })
    router.push(`/patients/${patientId}`)
  }

  const handleError = (error: any) => {
    toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>Erro ao atualizar paciente</span>
        </div>
      ),
      description: error?.message || "Ocorreu um erro ao atualizar o paciente",
      variant: "destructive"
    })
  }

  const handleCancel = () => {
    router.back()
  }
  
  if (!patientId) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">ID do paciente não encontrado</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Paciente</h1>
        <p className="text-muted-foreground">Atualize os dados do paciente</p>
      </div>
      
      <PatientForm 
        patientId={patientId} 
        onSuccess={handleSuccess}
        onError={handleError}
        onCancel={handleCancel}
      />
    </div>
  )
} 