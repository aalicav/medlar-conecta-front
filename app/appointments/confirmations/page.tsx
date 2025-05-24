"use client"

import { ConfirmationScheduler } from "@/app/appointments/components/ConfirmationScheduler"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Bell } from "lucide-react"

export default function AppointmentConfirmationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Confirmações de Agendamentos</h1>
        <p className="text-muted-foreground">
          Gerencie as confirmações de agendamentos e envie notificações aos pacientes
        </p>
      </div>
      
      <Tabs defaultValue="48-hour" className="space-y-4">
        <TabsList>
          <TabsTrigger value="48-hour" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Confirmações 48h</span>
          </TabsTrigger>
          <TabsTrigger value="day-of" className="flex items-center gap-1">
            <Bell className="h-4 w-4" />
            <span>Confirmações no Dia</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="48-hour" className="space-y-4">
          <ConfirmationScheduler />
        </TabsContent>
        
        <TabsContent value="day-of" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Confirmações no Dia</CardTitle>
              <CardDescription>
                Gere links de confirmação para os agendamentos do dia atual
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Este módulo permite enviar links de confirmação para pacientes e prestadores 
                confirmarem a realização efetiva do atendimento no dia marcado. Os links são 
                enviados via e-mail e WhatsApp.
              </p>
              
              {/* Componente para gerenciar confirmações no dia a ser implementado */}
              <div className="mt-6 p-8 border rounded-lg text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">
                  Confirmações no dia do atendimento
                </h3>
                <p className="text-sm text-muted-foreground">
                  Este módulo estará disponível em breve. Ele permitirá gerar e enviar links
                  de confirmação para pacientes e prestadores no dia do atendimento.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 