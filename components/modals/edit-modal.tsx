"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProfessionalForm } from "@/components/forms/professional-form"
import { useToast } from "@/hooks/use-toast"
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
  const { toast } = useToast()

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
      
      if (response.data) {
        const data = response.data.data || response.data
        
        // Transform data to match form structure exactly as expected by ProfessionalForm
        const transformedData = {
          documentType: entityType === "professional" ? "cpf" : "cnpj",
          name: data.name || "",
          // Tentar obter email de várias possíveis fontes
          email: data.email || data.user?.email || "",
          // Garantir que phones seja sempre um array com o formato correto
          phones: Array.isArray(data.phones) ? data.phones.map((phone: any) => ({
            id: phone.id,
            number: phone.formatted_number || phone.number || "",
            type: phone.type || "mobile",
            is_whatsapp: Boolean(phone.is_whatsapp),
            is_primary: Boolean(phone.is_primary)
          })) : [],
          
          // Address handling - convert to the addresses array format expected by the form
          addresses: Array.isArray(data.addresses) && data.addresses.length > 0 
            ? data.addresses.map((addr: any) => ({
                id: addr.id,
                street: addr.street || "",
                number: addr.number || "",
                complement: addr.complement || "",
                neighborhood: addr.neighborhood || addr.district || "",
                city: addr.city || "",
                state: addr.state || "",
                postal_code: addr.postal_code || "",
                is_primary: Boolean(addr.is_primary || addr.is_main)
              }))
            : [{
                street: data.address || "",
                number: data.address_number || "",
                complement: data.address_complement || "",
                neighborhood: data.neighborhood || data.district || "",
                city: data.city || "",
                state: data.state || "",
                postal_code: data.postal_code || "",
                is_primary: true
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
            description: data.description || "",
            cnes: data.cnes || "",
            technical_director: data.technical_director || "",
            technical_director_document: data.technical_director_document || "",
            technical_director_professional_id: data.technical_director_professional_id || "",
          }),
          
          // Documents (if any)
          documents: Array.isArray(data.documents) ? data.documents.map((doc: any) => ({
            id: doc.id,
            type: doc.type,
            file_path: doc.file_path,
            description: doc.description,
            uploaded_at: doc.uploaded_at
          })) : []
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

  // Handle form submission
  const handleSubmit = async (formData: any) => {
    try {
      if (!entityId) {
        toast({
          title: "Erro ao atualizar",
          description: "ID da entidade não encontrado",
          variant: "destructive"
        })
        return
      }

      // Garantir que o entityId seja uma string
      const id = String(entityId)
      const endpoint = entityType === "professional" ? `/professionals/${id}` : `/clinics/${id}`
      
      // Create FormData for file uploads
      const data = new FormData()
      
      // Add method override for PUT request
      data.append("_method", "PUT")
      
      // Add basic fields
      Object.keys(formData).forEach(key => {
        if (key !== 'documents' && key !== 'addresses' && key !== 'phones') {
          if (formData[key] !== null && formData[key] !== undefined) {
            data.append(key, formData[key])
          }
        }
      })

      // Add addresses
      if (formData.addresses) {
        formData.addresses.forEach((addr: any, index: number) => {
          Object.entries(addr).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              data.append(`addresses[${index}][${key}]`, String(value))
            }
          })
        })
      }

      // Add phones
      if (formData.phones) {
        formData.phones.forEach((phone: any, index: number) => {
          Object.entries(phone).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              data.append(`phones[${index}][${key}]`, String(value))
            }
          })
        })
      }

      // Add documents
      if (formData.documents) {
        formData.documents.forEach((doc: any, index: number) => {
          if (doc.file) {
            data.append(`documents[${index}][file]`, doc.file)
          }
          if (doc.type) {
            data.append(`documents[${index}][type]`, doc.type)
          }
          if (doc.description) {
            data.append(`documents[${index}][description]`, doc.description)
          }
        })
      }

      console.log('Sending request to:', endpoint) // Debug log
      console.log('Entity ID:', id) // Debug log

      const response = await api.post(endpoint, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data) {
        toast({
          title: "Sucesso",
          description: "Dados atualizados com sucesso",
        })
        onSuccess?.()
        onClose()
      }
    } catch (error: any) {
      console.error("Error updating data:", error)
      
      // Extrair mensagem de erro específica da resposta da API
      let errorMessage = "Não foi possível atualizar os dados"
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        errorMessage = Object.values(errors)
          .flat()
          .join(', ')
      }
      
      toast({
        title: "Erro ao atualizar",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        {isFetching ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <ProfessionalForm
            initialData={initialData}
            onSubmit={handleSubmit}
            entityId={entityId as string}
            isEdit={true}
          />
        )}
      </DialogContent>
    </Dialog>
  )
} 