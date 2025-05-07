import axios, { type AxiosError } from "axios"
import { toast } from "@/components/ui/use-toast"
import Cookies from 'js-cookie'

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = Cookies.get("token")

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})


// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    const data = error.response?.data as any

    // Handle validation errors (422)
    if (status === 422) {
      // Se houver mensagens de erro de validação
      if (data?.errors) {
        // Pegar a primeira mensagem de erro para exibir como toast
        const firstErrorField = Object.keys(data.errors)[0]
        const firstErrorMessage = data.errors[firstErrorField][0]
        
        toast({
          title: "Erro de validação",
          description: firstErrorMessage || "Verifique os dados informados",
          variant: "destructive",
        })
      } else if (data?.message) {
        toast({
          title: "Erro de validação",
          description: data.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Erro de validação",
          description: "Verifique os dados informados e tente novamente",
          variant: "destructive",
        })
      }
    }

    // Handle authentication errors
    if (status === 401) {
      // Não redirecionar automaticamente para evitar perda de contexto
      toast({
        title: "Erro de autenticação",
        description: "Ocorreu um problema com sua autenticação.",
        variant: "destructive",
      })
    }

    // Handle forbidden errors
    if (status === 403) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar este recurso.",
        variant: "destructive",
      })
    }

    // Handle server errors
    if (status && status >= 500) {
      toast({
        title: "Erro no servidor",
        description: "Ocorreu um erro no servidor. Tente novamente mais tarde.",
        variant: "destructive",
      })
    }

    return Promise.reject(error)
  },
)

export default api
