"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  FileText, 
  Camera, 
  Upload,
  AlertTriangle
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import apiClient from "@/services/api-client"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

interface Appointment {
  appointment_id: number
  scheduled_date: string
  patient_name: string
  procedure_name: string
  provider_name: string
  provider_type: string
}

export default function VerifyAppointmentPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notes, setNotes] = useState("")
  const [validToken, setValidToken] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Camera capture
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  
  useEffect(() => {
    const verifyToken = async () => {
      setIsLoading(true)
      try {
        const response = await apiClient.get(`/appointments/verify/${token}`)
        if (response.data.success) {
          setAppointment(response.data.data)
          setValidToken(true)
        } else {
          setError("Link de verificação inválido ou expirado")
        }
      } catch (error) {
        console.error("Erro ao verificar token:", error)
        setError("Não foi possível verificar o token")
      } finally {
        setIsLoading(false)
      }
    }
    
    verifyToken()
  }, [token])
  
  const handleConfirm = async (confirmed: boolean) => {
    setIsSubmitting(true)
    try {
      const formData = {
        confirmed,
        notes,
        guide_image: imagePreview
      }
      
      const response = await apiClient.post(`/appointments/confirm/${token}`, formData)
      
      if (response.data.success) {
        setSuccess(true)
        toast({
          title: confirmed ? "Atendimento confirmado" : "Ausência registrada",
          description: confirmed 
            ? "O atendimento foi confirmado com sucesso" 
            : "A ausência foi registrada com sucesso"
        })
      } else {
        setError("Não foi possível processar a confirmação")
      }
    } catch (error) {
      console.error("Erro ao confirmar atendimento:", error)
      setError("Erro ao processar a confirmação")
      toast({
        title: "Erro",
        description: "Não foi possível processar a confirmação",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch (err) {
      console.error("Erro ao acessar a câmera:", err)
      toast({
        title: "Erro",
        description: "Não foi possível acessar a câmera",
        variant: "destructive"
      })
    }
  }
  
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      const tracks = stream.getTracks()
      
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }
  
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const context = canvas.getContext('2d')
      context?.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      const imageData = canvas.toDataURL('image/jpeg')
      setImagePreview(imageData)
      
      // Stop camera after capture
      stopCamera()
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p>Verificando...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen max-w-md mx-auto text-center p-4">
        <XCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Link Inválido</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <p className="text-sm text-muted-foreground mb-6">
          Este link pode ter expirado ou já foi utilizado. Entre em contato com suporte se precisar de ajuda.
        </p>
        <Button onClick={() => router.push("/")} variant="default">
          Voltar para página inicial
        </Button>
      </div>
    )
  }
  
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-screen max-w-md mx-auto text-center p-4">
        <CheckCircle className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Confirmação Processada</h1>
        <p className="text-muted-foreground mb-6">
          Sua confirmação foi processada com sucesso. Obrigado!
        </p>
        <Button onClick={() => router.push("/")} variant="default">
          Voltar para página inicial
        </Button>
      </div>
    )
  }
  
  if (!appointment || !validToken) {
    return (
      <div className="flex flex-col items-center justify-center h-screen max-w-md mx-auto text-center p-4">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Agendamento Não Encontrado</h1>
        <p className="text-muted-foreground mb-6">
          Não foi possível encontrar as informações do agendamento.
        </p>
        <Button onClick={() => router.push("/")} variant="default">
          Voltar para página inicial
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-lg mx-auto px-4 py-8">
      <Card className="border-2 border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center">
            <Calendar className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Confirmação de Atendimento</CardTitle>
          <CardDescription className="text-lg">
            Confirme a realização do seu atendimento
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{formatDate(appointment.scheduled_date)}</p>
                <p className="text-sm text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 inline mr-1" />
                  {new Date(appointment.scheduled_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <User className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{appointment.patient_name}</p>
                <p className="text-sm text-muted-foreground">Paciente</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{appointment.procedure_name}</p>
                <p className="text-sm text-muted-foreground">Procedimento</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{appointment.provider_name}</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.provider_type === "Clinic" ? "Clínica" : "Profissional"}
                </p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-3">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea 
              id="notes"
              placeholder="Adicione observações sobre o atendimento aqui..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-3">
            <Label>Guia de Atendimento Assinada</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Anexe uma foto da guia de atendimento assinada pelo paciente e pelo profissional
            </p>
            
            <Tabs defaultValue="upload">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="camera">Câmera</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4">
                <div 
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">Clique para fazer upload</p>
                  <p className="text-xs text-muted-foreground">ou arraste uma imagem aqui</p>
                  <Input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*"
                    className="hidden" 
                    onChange={handleImageUpload}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="camera" className="space-y-4">
                {!cameraActive ? (
                  <Button 
                    onClick={startCamera} 
                    className="w-full"
                    variant="secondary"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Iniciar Câmera
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={stopCamera}
                        variant="outline"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                      
                      <Button 
                        onClick={captureImage}
                        variant="default"
                        className="flex-1"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Capturar
                      </Button>
                    </div>
                  </div>
                )}
                
                <canvas ref={canvasRef} className="hidden" />
              </TabsContent>
            </Tabs>
            
            {imagePreview && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Imagem anexada:</p>
                <div className="relative border rounded-lg overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-auto"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={() => setImagePreview(null)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            className="w-full sm:w-1/2"
            onClick={() => handleConfirm(false)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Não Compareci
          </Button>
          
          <Button 
            variant="default"
            className="w-full sm:w-1/2"
            onClick={() => handleConfirm(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Confirmar Atendimento
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 