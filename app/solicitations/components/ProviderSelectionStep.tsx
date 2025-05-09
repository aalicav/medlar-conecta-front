"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { MapPin, Info, AlertCircle } from "lucide-react"
import { formatMoney } from "@/app/utils/format"
import { SchedulingExceptionModal } from "@/components/modals/SchedulingExceptionModal"
import { toast } from "@/components/ui/use-toast"

interface Provider {
  id: number
  type: 'clinic' | 'professional'
  type_class: string
  name: string
  address: string
  city: string
  distance_km: number
  price: number
  available: boolean
}

interface ProviderSelectionStepProps {
  providers: Provider[]
  solicitationId: number
  onSelectProvider: (provider: Provider) => void
  onBack: () => void
  loading?: boolean
  recommendedProviderId?: number
}

export function ProviderSelectionStep({
  providers,
  solicitationId,
  onSelectProvider,
  onBack,
  loading = false,
  recommendedProviderId
}: ProviderSelectionStepProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null)
  const [exceptionModalOpen, setExceptionModalOpen] = useState(false)

  // Encontrar o provedor recomendado (com menor valor)
  const recommendedProvider = recommendedProviderId 
    ? providers.find(p => p.id === recommendedProviderId)
    : providers.reduce((prev, current) => (prev.price < current.price) ? prev : current, providers[0])

  const handleProviderSelect = () => {
    const provider = providers.find(p => p.id === selectedProviderId)
    
    if (!provider) {
      toast({
        title: "Selecione um prestador",
        description: "Por favor, selecione um prestador antes de continuar.",
        variant: "destructive",
      })
      return
    }
    
    // Verificar se o provedor selecionado é mais caro do que o recomendado
    // Se for, abrir o modal de exceção
    if (recommendedProvider && provider.price > recommendedProvider.price) {
      setExceptionModalOpen(true)
      return
    }
    
    // Se não for mais caro, prosseguir com a seleção
    onSelectProvider(provider)
  }
  
  // Quando a exceção for aprovada, continuar normalmente
  const handleExceptionSuccess = () => {
    const provider = providers.find(p => p.id === selectedProviderId)
    if (provider) {
      onSelectProvider(provider)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Selecione um Prestador</h2>
        <p className="text-muted-foreground">
          Escolha um prestador que atenda ao procedimento solicitado.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardContent className="p-6">
                <div className="flex flex-col gap-2">
                  <div className="h-5 bg-muted animate-pulse rounded w-1/3" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
                  <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <RadioGroup
          value={selectedProviderId?.toString() || ""}
          onValueChange={(value) => setSelectedProviderId(parseInt(value))}
          className="space-y-4"
        >
          {providers.map((provider) => {
            const isRecommended = recommendedProvider && provider.id === recommendedProvider.id
            const isMoreExpensive = recommendedProvider && provider.price > recommendedProvider.price
            
            return (
              <Card 
                key={`${provider.type}-${provider.id}`}
                className={`w-full cursor-pointer transition-colors ${
                  selectedProviderId === provider.id 
                    ? "border-primary" 
                    : isRecommended 
                      ? "border-green-500" 
                      : ""
                }`}
                onClick={() => setSelectedProviderId(provider.id)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value={provider.id.toString()} id={`provider-${provider.id}`} />
                          <Label htmlFor={`provider-${provider.id}`} className="font-medium text-lg">
                            {provider.name}
                          </Label>
                          
                          {isRecommended && (
                            <Badge variant="success" className="ml-2">Recomendado</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center text-muted-foreground mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {provider.address}, {provider.city} 
                            ({provider.distance_km.toFixed(1)} km)
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`font-bold text-lg ${isMoreExpensive ? 'text-red-500' : ''}`}>
                          {formatMoney(provider.price)}
                        </div>
                        
                        {isMoreExpensive && (
                          <div className="text-xs text-red-500 flex items-center justify-end">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            <span>
                              {((provider.price - recommendedProvider.price) / recommendedProvider.price * 100).toFixed(1)}% mais caro
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </RadioGroup>
      )}
      
      <Separator />
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Voltar
        </Button>
        <Button 
          onClick={handleProviderSelect}
          disabled={!selectedProviderId || loading}
        >
          Continuar
        </Button>
      </div>
      
      {/* Modal de exceção de agendamento */}
      {recommendedProvider && selectedProviderId && (
        <SchedulingExceptionModal
          open={exceptionModalOpen}
          onOpenChange={setExceptionModalOpen}
          solicitationId={solicitationId}
          providerId={selectedProviderId}
          providerType={providers.find(p => p.id === selectedProviderId)?.type_class || ""}
          providerName={providers.find(p => p.id === selectedProviderId)?.name || ""}
          providerPrice={providers.find(p => p.id === selectedProviderId)?.price || 0}
          recommendedPrice={recommendedProvider.price}
          onSuccess={handleExceptionSuccess}
        />
      )}
    </div>
  )
} 