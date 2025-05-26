"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProfessionalForm } from "@/components/forms/professional-form"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import api from "@/services/api-client"
import { Card, CardContent } from "@/components/ui/card"

interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  entityType: "professional" | "clinic"
  entityId: string | number
  title?: string
}

export function EditModal({
  isOpen,
  onClose,
  onSuccess,
  entityType,
  entityId,
  title
}: EditModalProps) {
  const [isFetching, setIsFetching] = useState(false)
  const [initialData, setInitialData] = useState<any>(null)

  // Fetch entity data when modal opens
  useEffect(() => {
    if (isOpen && entityId) {
      fetchEntityData()
    }
  }, [isOpen, entityId, entityType])

  const fetchEntityData = async () => {
    setIsFetching(true)
    try {
      const endpoint = entityType === "professional" ? `/professionals/${entityId}` : `/clinics/${entityId}`
      const response = await api.get(endpoint)
      
      if (response.data && response.data.data) {
        const data = response.data.data
        
        // Transform data to match form structure exactly as expected by ProfessionalForm
        const transformedData = {
          documentType: entityType === "professional" ? "cpf" : "cnpj",
          name: data.name || "",
          email: data.email || (data.user?.email) || "",
          phone: data.phones?.[0]?.number || "",
          
          // Address handling - convert to the addresses array format expected by the form
          addresses: data.addresses?.length ? data.addresses.map((addr: any) => ({
            street: addr.street || "",
            number: addr.number || "",
            complement: addr.complement || "",
            district: addr.neighborhood || addr.district || "",
            city: addr.city || "",
            state: addr.state || "",
            postal_code: addr.postal_code || "",
            is_main: addr.is_primary || addr.is_main || false
          })) : [{
            street: data.address || "",
            number: "",
            complement: "",
            district: "",
            city: data.city || "",
            state: data.state || "",
            postal_code: data.postal_code || "",
            is_main: true
          }],
          
          // Professional specific fields
          ...(entityType === "professional" && {
            cpf: data.cpf || "",
            birth_date: data.birth_date ? new Date(data.birth_date).toISOString().split('T')[0] : "",
            gender: data.gender || "",
            specialty: data.specialty || "",
            council_type: data.council_type || "",
            council_number: data.council_number || "",
            council_state: data.council_state || "",
            bio: data.bio || "",
            clinic_id: data.clinic_id ? String(data.clinic_id) : "",
          }),
          
          // Clinic specific fields
          ...(entityType === "clinic" && {
            cnpj: data.cnpj || "",
            trading_name: data.trading_name || data.name || "",
            foundation_date: data.foundation_date || "",
            business_hours: data.business_hours || "",
            services: data.services || data.description || "",
            health_reg_number: data.cnes || "",
          }),
          
          // Documents (if any) - convert to form format
          documents: data.documents?.map((doc: any) => ({
            type_id: doc.type_id || 0,
            file_url: doc.file_path || doc.file_url,
            expiration_date: doc.expiration_date || "",
            observation: doc.observation || doc.description || ""
          })) || []
        }
        
        setInitialData(transformedData)
      }
    } catch (error) {
      console.error("Error fetching entity data:", error)
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados para edição",
        variant: "destructive"
      })
      onClose()
    } finally {
      setIsFetching(false)
    }
  }

  // Handle form submission - this will be called by ProfessionalForm
  const handleSubmit = async (data: any) => {
    try {
      // Create FormData for file uploads
      const formData = new FormData()
      
      // Add method override for PUT request
      formData.append("_method", "PUT")
      
      // Add professional_type based on documentType
      formData.append('professional_type', data.documentType === "cpf" ? "individual" : "clinic")
      
      // Add basic fields
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'documents' && key !== 'addresses' && value !== null && value !== undefined) {
          if (key === 'cpf' && typeof value === 'string') {
            formData.append(key, value.replace(/\D/g, ''))
          } else if (key === 'cnpj' && typeof value === 'string') {
            formData.append(key, value.replace(/\D/g, ''))
          } else if (key === 'phone' && typeof value === 'string') {
            formData.append(key, value.replace(/\D/g, ''))
          } else if (typeof value !== 'object') {
            formData.append(key, String(value))
          }
        }
      })

      // Add main address as legacy fields for backward compatibility
      const mainAddress = data.addresses?.find((addr: any) => addr.is_main === true) || data.addresses?.[0]
      if (mainAddress) {
        const fullAddress = `${mainAddress.street}, ${mainAddress.number}${mainAddress.complement ? ' - ' + mainAddress.complement : ''}, ${mainAddress.district}`
        formData.append('address', fullAddress)
        formData.append('city', mainAddress.city)
        formData.append('state', mainAddress.state)
        formData.append('postal_code', mainAddress.postal_code.replace(/\D/g, ''))
      }

      // Add addresses array
      if (data.addresses) {
        data.addresses.forEach((address: any, index: number) => {
          Object.entries(address).forEach(([key, value]) => {
            if (key === 'postal_code') {
              formData.append(`addresses[${index}][${key}]`, String(value).replace(/\D/g, ''))
            } else if (key === 'is_main') {
              formData.append(`addresses[${index}][is_primary]`, value ? "1" : "0")
            } else if (key === 'district') {
              formData.append(`addresses[${index}][neighborhood]`, String(value))
            } else {
              formData.append(`addresses[${index}][${key}]`, String(value))
            }
          })
        })
      }

      // Add documents if any new files were uploaded
      if (data.documents) {
        let docCount = 0
        for (let i = 0; i < data.documents.length; i++) {
          const doc = data.documents[i]
          if (doc.file instanceof File) {
            formData.append(`documents[${docCount}][file]`, doc.file)
            formData.append(`documents[${docCount}][type_id]`, String(doc.type_id))
            if (doc.expiration_date) {
              formData.append(`documents[${docCount}][expiration_date]`, doc.expiration_date)
            }
            if (doc.observation) {
              formData.append(`documents[${docCount}][observation]`, doc.observation)
            }
            docCount++
          }
        }
      }

      // Send to appropriate endpoint
      const endpoint = entityType === "professional" ? `/professionals/${entityId}` : `/clinics/${entityId}`
      
      const response = await api.post(endpoint, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })
      
      // Show success toast
      toast({
        title: "Sucesso",
        description: entityType === "professional"
          ? "Profissional atualizado com sucesso"
          : "Clínica atualizada com sucesso",
        variant: "default"
      })
      
      // Call success callback and close modal
      onSuccess?.()
      onClose()
      
    } catch (error: any) {
      console.error("Erro ao atualizar:", error)
      
      // Extract error message from API response
      let errorMsg = "Ocorreu um erro ao atualizar"
      
      if (error.response?.data?.errors) {
        const errorMessages: string[] = []
        const errors = error.response.data.errors
        
        Object.keys(errors).forEach(field => {
          const fieldErrors = errors[field]
          fieldErrors.forEach((msg: string) => {
            errorMessages.push(`${field}: ${msg}`)
          })
        })
        
        if (errorMessages.length) {
          errorMsg = errorMessages.join('. ')
        }
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message
      }
      
      // Show error toast
      toast({
        title: "Erro ao atualizar",
        description: errorMsg,
        variant: "destructive"
      })
      
      // Re-throw so ProfessionalForm can handle it too
      throw error
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {title || (entityType === "professional" ? "Editar Profissional" : "Editar Clínica")}
          </DialogTitle>
        </DialogHeader>
        
        <Card>
          <CardContent className="p-0">
            {isFetching ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : initialData ? (
              <ProfessionalForm 
                initialData={initialData}
                onSubmit={handleSubmit}
                entityId={String(entityId)}
                isEdit={true}
              />
            ) : null}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
} 