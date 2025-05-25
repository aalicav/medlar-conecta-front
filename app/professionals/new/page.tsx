"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfessionalForm } from "@/components/forms/professional-form"
import { toast } from "@/components/ui/use-toast"
import api from "@/services/api-client"
import { unmask } from "@/utils/masks"
import { Card, CardContent } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function CreateProfessionalPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const [navigationPath, setNavigationPath] = useState<string | null>(null)
  const [formRef, setFormRef] = useState<any>(null)

  // Handle navigation away from form
  const handleNavigation = (path: string) => {
    setNavigationPath(path)
    setShowExitDialog(true)
  }

  // Handle form submission
  const handleSubmit = async (data: any) => {
    setIsLoading(true)
    
    try {
      // Create FormData for file uploads
      const formData = new FormData()
      
      // Add basic fields based on document type
      formData.append("documentType", data.documentType)
      formData.append("name", data.name)
      formData.append("email", data.email)
      formData.append("phone", unmask(data.phone))
      
      if (data.address) formData.append("address", data.address)
      if (data.city) formData.append("city", data.city)
      if (data.state) formData.append("state", data.state)
      if (data.zip_code) formData.append("postal_code", unmask(data.zip_code))
      
      // Professional fields
      if (data.documentType === "cpf") {
        formData.append("cpf", unmask(data.cpf))
        formData.append("birth_date", data.birth_date)
        formData.append("gender", data.gender)
        formData.append("specialty", data.specialty)
        formData.append("crm", data.crm)
        if (data.bio) formData.append("bio", data.bio)
        if (data.clinic_id) formData.append("clinic_id", data.clinic_id)
      } 
      // Establishment fields
      else {
        formData.append("cnpj", unmask(data.cnpj))
        formData.append("trading_name", data.trading_name)
        formData.append("foundation_date", data.foundation_date)
        if (data.business_hours) formData.append("business_hours", data.business_hours)
        if (data.services) formData.append("services", data.services)
        if (data.health_reg_number) formData.append("health_reg_number", data.health_reg_number)
      }
      
      // Add documents
      if (data.documents) {
        for (let i = 0; i < data.documents.length; i++) {
          const doc = data.documents[i];
          if (!doc.type_id) continue;
          
          // This is handled directly by the form component's FormData
        }
      }

      // Send to appropriate endpoint
      const endpoint = data.documentType === "cpf" ? "/professionals" : "/clinics"
      
      const response = await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      
      // Show success toast with icon
      toast({
        title: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>
              {data.documentType === "cpf" 
                ? "Profissional cadastrado com sucesso" 
                : "Estabelecimento cadastrado com sucesso"}
            </span>
          </div>
        ) as any,
        description: data.documentType === "cpf"
          ? "O profissional foi adicionado ao sistema"
          : "O estabelecimento foi adicionado ao sistema"
      })
      
      // Redirect to the appropriate list
      router.push(data.documentType === "cpf" ? "/professionals" : "/clinics")
    } catch (error: any) {
      console.error("Erro ao cadastrar:", error)
      
      // Extract error message from API response or use default
      let errorMsg = "Ocorreu um erro ao cadastrar";
      
      if (error.response?.data?.errors) {
        // Process multiple validation errors
        const errorMessages: string[] = [];
        const errors = error.response.data.errors;
        
        Object.keys(errors).forEach(field => {
          const fieldErrors = errors[field];
          fieldErrors.forEach((msg: string) => {
            errorMessages.push(`${field}: ${msg}`);
          });
        });
        
        if (errorMessages.length) {
          errorMsg = errorMessages.join('. ');
        }
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      
      // Show error toast with icon
      toast({
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>
              {data.documentType === "cpf" 
                ? "Erro ao cadastrar profissional" 
                : "Erro ao cadastrar estabelecimento"}
            </span>
          </div>
        ) as any,
        description: errorMsg,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleNavigation("/professionals")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novo Cadastro</h1>
            <p className="text-muted-foreground">
              Cadastre um novo profissional ou estabelecimento no sistema
            </p>
          </div>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <ProfessionalForm 
              onSubmit={handleSubmit} 
              ref={setFormRef}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Exit dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja mesmo sair?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem alterações não salvas no formulário. Se sair agora, as alterações serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (navigationPath) {
                  router.push(navigationPath);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 