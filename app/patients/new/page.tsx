import { PatientForm } from "@/components/forms/patient-form"

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Novo Paciente</h1>
        <p className="text-muted-foreground">Cadastre um novo paciente no sistema</p>
      </div>
      
      <PatientForm />
    </div>
  )
} 