import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { createSchedulingException } from "@/services/api"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"

interface SchedulingExceptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  solicitationId: number
  providerType: string // App\Models\Clinic ou App\Models\Professional
  providerId: number
  providerName: string
  providerPrice: number
  recommendedPrice?: number
  onSuccess?: () => void
}

export function SchedulingExceptionModal({
  open,
  onOpenChange,
  solicitationId,
  providerType,
  providerId,
  providerName,
  providerPrice,
  recommendedPrice,
  onSuccess
}: SchedulingExceptionModalProps) {
  const [justification, setJustification] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const priceDifference = recommendedPrice 
    ? ((providerPrice - recommendedPrice) / recommendedPrice * 100).toFixed(1)
    : null
  
  const handleSubmit = async () => {
    if (justification.trim().length < 10) {
      toast({
        title: "Justificativa muito curta",
        description: "Por favor, forneça uma justificativa mais detalhada (mínimo 10 caracteres).",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await createSchedulingException({
        solicitation_id: solicitationId,
        provider_type_class: providerType,
        provider_id: providerId,
        justification: justification.trim()
      })
      
      toast({
        title: "Exceção solicitada",
        description: "Sua solicitação de exceção foi enviada para aprovação e você será notificado do resultado.",
      })
      
      if (onSuccess) {
        onSuccess()
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao solicitar exceção:", error)
      toast({
        title: "Erro ao solicitar exceção",
        description: "Não foi possível enviar sua solicitação. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Solicitar Exceção de Agendamento</DialogTitle>
          <DialogDescription>
            Esta solicitação será encaminhada para aprovação da direção.
          </DialogDescription>
        </DialogHeader>
        
        <Alert className="mt-2" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Provedor com valor acima do recomendado</AlertTitle>
          <AlertDescription>
            O prestador selecionado possui um valor superior ao recomendado pelo sistema.
            {priceDifference && (
              <span className="font-bold"> ({priceDifference}% mais caro)</span>
            )}
          </AlertDescription>
        </Alert>
        
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-lg font-medium">Dados do Prestador</h3>
            <div className="mt-2 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">Nome:</span> 
                <span>{providerName}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">Valor:</span> 
                <span className="font-bold">R$ {providerPrice.toFixed(2)}</span>
              </div>
              {recommendedPrice && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-medium">Valor recomendado:</span> 
                    <span className="text-green-600 font-bold">R$ {recommendedPrice.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="justification" className="text-right">
                Justificativa
              </Label>
              <span className="text-xs text-muted-foreground">
                Obrigatório
              </span>
            </div>
            <Textarea
              id="justification"
              placeholder="Informe detalhadamente o motivo para solicitar este prestador de maior valor"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">
              Justificativas detalhadas têm maior chance de aprovação.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={justification.trim().length < 10 || isSubmitting}
            className="ml-2"
          >
            {isSubmitting ? "Enviando..." : "Solicitar Aprovação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 