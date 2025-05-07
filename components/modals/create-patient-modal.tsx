"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PatientForm } from "@/components/forms/patient-form"

interface CreatePatientModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (patient: any) => void
  healthPlanId?: string
}

export function CreatePatientModal({
  open,
  onOpenChange,
  onSuccess,
  healthPlanId
}: CreatePatientModalProps) {
  const handleSuccess = (patient: any) => {
    console.log("Paciente criado:", patient);
    
    // Garantir que estamos passando o objeto do paciente correto
    // Diferentes APIs podem retornar o paciente em formatos diferentes
    const patientData = patient.data || patient;
    
    // Verificar se temos os dados necessários do paciente
    if (!patientData || !patientData.id) {
      console.error("Dados do paciente inválidos:", patientData);
      return;
    }
    
    // Chamar o callback de sucesso com os dados do paciente
    onSuccess(patientData);
    
    // Fechar o modal após o sucesso
    onOpenChange(false);
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Paciente</DialogTitle>
          <DialogDescription>
            Preencha os dados do paciente para criar um novo registro
          </DialogDescription>
        </DialogHeader>
        <PatientForm 
          onSuccess={handleSuccess} 
          onCancel={handleCancel} 
          healthPlanId={healthPlanId}
        />
      </DialogContent>
    </Dialog>
  )
} 