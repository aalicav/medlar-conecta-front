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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createExtemporaneousNegotiation } from "@/services/extemporaneous-negotiations"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { formatMoney } from "@/app/utils/format"
import { Loader2 } from "lucide-react"

interface ExtemporaneousNegotiationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId: number
  contractNumber: string
  tussId: number
  tussCode: string
  tussDescription: string
  currentValue?: number
  onSuccess?: () => void
}

export function ExtemporaneousNegotiationModal({
  open,
  onOpenChange,
  contractId,
  contractNumber,
  tussId,
  tussCode,
  tussDescription,
  currentValue,
  onSuccess
}: ExtemporaneousNegotiationModalProps) {
  const [requestedValue, setRequestedValue] = useState(currentValue || 0)
  const [justification, setJustification] = useState("")
  const [urgencyLevel, setUrgencyLevel] = useState<string>("medium")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const handleSubmit = async () => {
    if (justification.trim().length < 10) {
      toast({
        title: "Justificativa muito curta",
        description: "Por favor, forneça uma justificativa mais detalhada (mínimo 10 caracteres).",
        variant: "destructive",
      })
      return
    }
    
    if (requestedValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, informe um valor válido.",
        variant: "destructive",
      })
      return
    }
    
    setIsSubmitting(true)
    
    try {
      await createExtemporaneousNegotiation({
        contract_id: contractId,
        tuss_id: tussId,
        requested_value: requestedValue,
        justification: justification.trim(),
        urgency_level: urgencyLevel as 'low' | 'medium' | 'high'
      })
      
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de negociação extemporânea foi enviada para aprovação da equipe comercial.",
      })
      
      if (onSuccess) {
        onSuccess()
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao solicitar negociação extemporânea:", error)
      toast({
        title: "Erro ao enviar solicitação",
        description: "Não foi possível enviar sua solicitação. Por favor, tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Solicitar Negociação Extemporânea</DialogTitle>
          <DialogDescription>
            Solicite um valor diferente para um procedimento fora do contrato original.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Negociação para contrato #{contractNumber}</AlertTitle>
            <AlertDescription>
              Esta solicitação requer aprovação da equipe comercial e pode exigir um aditivo contratual.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4">
            <div>
              <h3 className="text-lg font-medium">Dados do Procedimento</h3>
              <div className="mt-2 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Código:</span> 
                  <span>{tussCode}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Descrição:</span> 
                  <span>{tussDescription}</span>
                </div>
                {currentValue ? (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium">Valor atual:</span> 
                      <span className="font-bold">{formatMoney(currentValue)}</span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="requested_value" className="text-right">
                  Valor Solicitado
                </Label>
                <span className="text-xs text-muted-foreground">
                  Obrigatório
                </span>
              </div>
              <Input
                id="requested_value"
                type="number"
                step="0.01"
                min="0"
                value={requestedValue}
                onChange={(e) => setRequestedValue(Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="urgency_level" className="text-right">
                  Nível de Urgência
                </Label>
              </div>
              <Select
                value={urgencyLevel}
                onValueChange={(value) => setUrgencyLevel(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível de urgência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
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
                placeholder="Informe detalhadamente o motivo para esta solicitação de valor diferenciado"
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Justificativas detalhadas têm maior chance de aprovação. Mínimo de 10 caracteres.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={justification.trim().length < 10 || requestedValue <= 0 || isSubmitting}
            className="ml-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : "Enviar Solicitação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 