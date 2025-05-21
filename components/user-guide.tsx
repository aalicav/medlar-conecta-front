"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info, Shield } from "lucide-react"

/**
 * Componente que mostra um guia/alerta para usuários com o papel network_manager
 * explicando suas limitações de acesso
 */
export function UserGuide() {
  const { user, getUserRole } = useAuth()
  const [open, setOpen] = useState(false)
  const role = getUserRole()
  
  useEffect(() => {
    // Verificar se é a primeira vez que o usuário acessa (poderia ser salvo em localStorage)
    const isFirstAccess = !localStorage.getItem('networkManagerGuideShown')
    
    if (role === 'network_manager' && isFirstAccess) {
      setOpen(true)
      // Marcar que o guia já foi mostrado
      localStorage.setItem('networkManagerGuideShown', 'true')
    }
  }, [role])
  
  if (role !== 'network_manager') return null
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Info className="h-5 w-5" />
            <DialogTitle>Guia de Acesso - Gerente de Redes</DialogTitle>
          </div>
          <DialogDescription>
            Bem-vindo ao sistema Conecta Saúde. Como Gerente de Redes, você tem acesso a:
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex gap-2 items-start">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">O que você pode ver:</h3>
              <ul className="text-sm text-muted-foreground mt-1 list-disc pl-5 space-y-1">
                <li>Cadastros de planos de saúde, profissionais e clínicas</li>
                <li>Informações de pacientes e agendamentos</li>
                <li>Gerenciamento de usuários da sua rede</li>
                <li>Relatórios gerais (não financeiros)</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-2 items-start">
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Limitações de acesso:</h3>
              <ul className="text-sm text-muted-foreground mt-1 list-disc pl-5 space-y-1">
                <li>Informações de contratos</li>
                <li>Dados de negociações</li>
                <li>Informações financeiras e de faturamento</li>
              </ul>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Entendi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 