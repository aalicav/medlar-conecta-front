"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { HealthPlanForm } from "@/components/forms/health-plan-form"
import { fetchResourceById } from "@/services/resource-service"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import api from "@/services/api-client"

interface HealthPlan {
  id: number
  name: string
  cnpj: string
  municipal_registration: string
  email: string
  ans_code: string
  description: string
  legal_representative_name: string
  legal_representative_cpf: string
  legal_representative_position: string
  address: string
  city: string
  state: string
  postal_code: string
  logo: string | null
  phones: Array<{
    id: number
    number: string
    type: string
  }>
  documents: Array<{
    id: number
    type: string
    description: string
    file_path: string
    file_name: string
    reference_date: string | null
    expiration_date: string | null
  }>
  status: string
  user: {
    id: number
    email: string
  } | null
}

export default function EditHealthPlanPage() {
  const params = useParams()
  const healthPlanId = Number(params.id)
  const [healthPlan, setHealthPlan] = useState<HealthPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHealthPlan = async () => {
      try {
        setIsLoading(true)
        console.log("Fetching health plan with ID:", healthPlanId)
        
        // Use direct API call to get complete health plan data
        const response = await api.get(`/health-plans/${healthPlanId}`)
        const data = response.data.data
        
        console.log("Health plan data received:", data)
        
        if (!data || !data.id) {
          console.error("Invalid health plan data received:", data)
          toast({
            title: "Erro ao carregar plano",
            description: "Não foi possível carregar os dados do plano de saúde",
            variant: "destructive"
          })
          return
        }
        
        // Format the data for the form
        const formattedData = {
          ...data,
          // Ensure phones array exists and is properly formatted
          phones: Array.isArray(data.phones) ? data.phones.map((phone: any) => ({
            id: phone.id,
            number: phone.number,
            type: phone.type
          })) : [],
          // Ensure documents array exists
          documents: Array.isArray(data.documents) ? data.documents : [],
          // Get email from user if it exists
          email: data.user?.email || data.email || "",
        }
        
        setHealthPlan(formattedData)
        console.log("Health plan state set with formatted data:", formattedData)
      } catch (error) {
        console.error("Error fetching health plan:", error)
        toast({
          title: "Erro ao carregar plano",
          description: "Não foi possível carregar os dados do plano de saúde",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (healthPlanId) {
      fetchHealthPlan()
    }
  }, [healthPlanId])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="mt-2 h-4 w-[350px]" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }
  
  // If health plan wasn't loaded properly
  if (!healthPlan || !healthPlan.id) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Plano de Saúde</h1>
          <p className="text-muted-foreground text-red-500">
            Não foi possível carregar os dados do plano de saúde. Por favor, tente novamente.
          </p>
        </div>
      </div>
    )
  }

  console.log("Rendering form with health plan:", healthPlan)
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Plano de Saúde</h1>
        <p className="text-muted-foreground">
          Atualize as informações do plano de saúde: {healthPlan.name}
        </p>
      </div>

      <HealthPlanForm 
        initialData={healthPlan} 
        isEditing={true} 
        healthPlanId={healthPlanId} 
      />
    </div>
  )
}
