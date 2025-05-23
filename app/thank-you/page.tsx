"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function ThankYouPage() {
  const router = useRouter()

  // Track conversion - this will be picked up by Google Tag Manager
  useEffect(() => {
    // If window exists (client-side), push a dataLayer event for GTM
    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({
        event: "formSubmission",
        formName: "leadCapture"
      })
    }
  }, [])

  return (
    <div className="container mx-auto py-12 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-lg border-2 border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">Obrigado pelo seu contato!</CardTitle>
          <CardDescription className="text-lg mt-2">
            Sua mensagem foi enviada com sucesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center pb-8">
          <p className="mb-6 text-muted-foreground">
            Um de nossos especialistas entrará em contato em breve para fornecer mais informações sobre nossos serviços.
          </p>
          <Button 
            onClick={() => router.push("/")} 
            className="mt-4"
          >
            Voltar para a página inicial
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 