"use client"

import { PatientForm } from "@/components/forms/patient-form"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

export default function NewPatientPage() {
  const router = useRouter()
  
  const handleSuccess = () => {
    toast({
      title: "Sucesso",
      description: "Paciente cadastrado com sucesso",
    })
    router.push('/patients')
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Paciente</h1>
        <p className="text-muted-foreground">Cadastre um novo paciente no sistema</p>
      </div>
      
      <PatientForm 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
} 