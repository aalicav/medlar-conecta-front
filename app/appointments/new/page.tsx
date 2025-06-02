"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DatePicker } from "@/components/ui/date-picker"
import { toast } from "@/components/ui/use-toast"
import { createResource, fetchResource } from "@/services/resource-service"
import { Loader2, ArrowLeft } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"
import debounce from "lodash/debounce"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import { AppointmentForm } from "@/components/forms/appointment-form"

// Define the form schema with Zod
const formSchema = z.object({
  patient_id: z.string().min(1, "Selecione um paciente"),
  health_plan_id: z.string().min(1, "Selecione um plano de saúde"),
  tuss_id: z.string().min(1, "Selecione um procedimento"),
  provider_type: z.enum(["clinic", "professional"], {
    required_error: "Selecione o tipo de provedor",
  }),
  provider_id: z.string().min(1, "Selecione um provedor"),
  scheduled_for: z.date({
    required_error: "Selecione a data e hora",
  }),
  notes: z.string().optional(),
})

// Infer the type from the schema
type FormValues = z.infer<typeof formSchema>

interface Provider {
  id: number
  name: string
  type: "clinic" | "professional"
}

interface Patient {
  id: number
  name: string
  health_plan_id: number
  health_plan_name: string
}

interface HealthPlan {
  id: number
  name: string
}

interface TussProcedure {
  id: number
  code: string
  name: string
}

function AppointmentContent() {
  const searchParams = useSearchParams()
  
  // Safely get search params with null checks
  const healthPlanId = searchParams?.get("health_plan_id") ?? null
  const patientId = searchParams?.get("patient_id") ?? null
  const doctorId = searchParams?.get("doctor_id") ?? null
  const date = searchParams?.get("date") ?? null
  const time = searchParams?.get("time") ?? null

  return (
    <AppointmentForm 
      healthPlanId={healthPlanId || undefined}
      patientId={patientId || undefined}
      doctorId={doctorId || undefined}
      selectedDate={date ? new Date(date) : undefined}
      selectedTime={time || undefined}
    />
  )
}

export default function NewAppointmentPage() {
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Nova Consulta</h1>
      <Suspense fallback={<div>Carregando...</div>}>
        <AppointmentContent />
      </Suspense>
    </div>
  )
} 