"use client"

import { PatientForm } from "@/components/forms/patient-form"
import { useParams, useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export default function EditPatientPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string
  
  const handleSuccess = () => {
    toast({
      title: "Sucesso",
      description: "Paciente atualizado com sucesso",
    })
    router.push(`/patients/${patientId}`)
  }

  const handleCancel = () => {
    router.back()
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
        onCancel={handleCancel}
      />
    </div>
  )
} 