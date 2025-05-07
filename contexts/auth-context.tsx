"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import api from "@/services/api-client"
import { toast } from "@/components/ui/use-toast"
import Cookies from 'js-cookie'
import axios from "axios"

interface PermissionPivot {
  role_id: number
  permission_id: number
}

interface RolePivot {
  model_id: number
  model_type: string
  role_id: number
}

interface Permission {
  id: number
  name: string
  guard_name: string
  created_at: string
  updated_at: string
  pivot?: PermissionPivot
}

interface Role {
  id: number
  name: string
  guard_name: string
  created_at: string
  updated_at: string
  pivot: RolePivot
  permissions?: Permission[]
}

export interface User {
  id: number
  name: string
  email: string
  phone_number: string | null
  email_verified_at: string | null
  entity_id: number | null
  entity_type: string | null
  is_active: boolean
  profile_photo: string | null
  notification_preferences: any | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  stripe_id: string | null
  pm_type: string | null
  pm_last_four: string | null
  trial_ends_at: string | null
  roles: Role[]
  permissions: Permission[]
  clinic_id?: number | null
  professional_id?: number | null
  // For backwards compatibility with UI components
  avatar_url?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  hasPermission: (permission: string) => boolean
  hasRole: (role: string | string[]) => boolean
  getUserRole: () => string
  // Funções para recuperação de senha
  requestPasswordReset: (email: string) => Promise<void>
  validateResetToken: (email: string, token: string, resetCode?: string) => Promise<boolean>
  resetPassword: (email: string, password: string, passwordConfirmation: string, token?: string, resetCode?: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Cookie expiration times
const COOKIE_EXPIRES_DAYS = 7
const TOKEN_KEY = "token"
const USER_KEY = "user"

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const API_URL = process.env.NEXT_PUBLIC_API_URL

  // Process user data to ensure compatibility with UI components
  const processUserData = (userData: User): User => {
    // Set avatar URL for UI components
    return {
      ...userData,
      avatar_url: userData.profile_photo || undefined
    };
  };

  // Get the user's primary role name (first role from the roles array)
  const getUserRole = (): string => {
    if (!user || !user.roles || user.roles.length === 0) {
      return '';
    }
    return user.roles[0].name;
  };

  useEffect(() => {
    // Check if user is already logged in
    const loadUserSession = async () => {
      try {
        setIsLoading(true)
        
        // Obter token - prioriza o cookie para compatibilidade com Next.js
        const storedToken = Cookies.get(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
        const storedUser = localStorage.getItem(USER_KEY)

        if (storedToken) {
          // Sincronizar armazenamento - garantir que token existe em ambos locais
          localStorage.setItem(TOKEN_KEY, storedToken)
          Cookies.set(TOKEN_KEY, storedToken, { expires: COOKIE_EXPIRES_DAYS, path: '/' })
          
          // Configurar estado do token
          setToken(storedToken)
          
          if (storedUser) {
            // Parse e processar dados do usuário
            const userData = processUserData(JSON.parse(storedUser));
            // Configurar estado do usuário
            setUser(userData)
          } else {
            // Se temos token mas não temos dados do usuário, buscar
            try {
              const { data } = await api.get("/user")
              const processedUser = processUserData(data.user);
              setUser(processedUser)
              localStorage.setItem(USER_KEY, JSON.stringify(data.user))
            } catch (error) {
              console.error("Erro ao buscar informações do usuário:", error)
              // Se não conseguimos obter usuário, limpar sessão
              clearSession()
            }
          }
        } else {
          // Nem token nem dados do usuário - usuário não autenticado
          clearSession()
        }
      } catch (error) {
        console.error("Error loading user session:", error)
        clearSession()
      } finally {
        setIsLoading(false)
      }
    }

    loadUserSession()
  }, [])

  // Helper function to clear session data
  const clearSession = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    Cookies.remove(TOKEN_KEY, { path: '/' })
  }

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await api.post("/login", { email, password })

      const { token, user: userData } = response.data
      
      // Process user data for UI compatibility
      const processedUser = processUserData(userData);

      // Save to state
      setToken(token)
      setUser(processedUser)

      // Save to localStorage
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
      
      // Save to cookies for server-side auth check
      Cookies.set(TOKEN_KEY, token, { expires: COOKIE_EXPIRES_DAYS, path: '/' })

      // Redirect based on role
      redirectBasedOnRole(processedUser)

      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${processedUser.name}!`,
      })
    } catch (error: any) {
      // Let the login page component handle the error
      throw error;
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)

      // Call logout API if we have a token
      if (token) {
        try {
          await api.post("/logout")
        } catch (error) {
          console.warn("Error during logout API call:", error)
          // Continue with logout even if API call fails
        }
      }

      // Clear session data
      clearSession()

      // Redirect to login
      router.push("/login")

      toast({
        title: "Logout realizado com sucesso",
      })
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro inesperado, mas sua sessão foi encerrada.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para solicitar recuperação de senha
  const requestPasswordReset = async (email: string) => {
    try {
      setIsLoading(true)
      await axios.post(`${API_URL}/api/auth/password/reset-request`, { email });
      
      toast({
        title: "Solicitação enviada",
        description: "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.",
      })
    } catch (error) {
      console.error('Password reset request error:', error);
      // Não exibimos mensagem específica de erro para não revelar se o email existe
      toast({
        title: "Solicitação enviada",
        description: "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Função para validar token de recuperação de senha
  const validateResetToken = async (email: string, token: string, resetCode?: string) => {
    try {
      setIsLoading(true)
      const payload = resetCode 
        ? { email, reset_code: resetCode }
        : { email, token };
        
      const response = await axios.post(`${API_URL}/api/auth/password/validate-token`, payload);
      return response.data.valid;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    } finally {
      setIsLoading(false)
    }
  }

  // Função para redefinir a senha
  const resetPassword = async (
    email: string, 
    password: string, 
    passwordConfirmation: string, 
    token?: string, 
    resetCode?: string
  ) => {
    try {
      setIsLoading(true)
      const payload = {
        email,
        password,
        password_confirmation: passwordConfirmation,
        ...(resetCode ? { reset_code: resetCode } : { token })
      };
      
      await axios.post(`${API_URL}/api/auth/password/reset`, payload);
      
      toast({
        title: "Senha redefinida com sucesso",
        description: "Você já pode fazer login com sua nova senha.",
      })
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Mensagem de erro específica
      const errorMessage = error.response?.data?.message || 'Erro ao redefinir a senha. Tente novamente.';
      
      toast({
        title: "Erro ao redefinir senha",
        description: errorMessage,
        variant: "destructive",
      })
      
      throw error;
    } finally {
      setIsLoading(false)
    }
  }

  // Helper function to redirect based on role
  const redirectBasedOnRole = (user: User) => {
    if (!user.roles || user.roles.length === 0) {
      router.push("/dashboard")
      return
    }

    const roleName = user.roles[0].name

    switch (roleName) {
      case "super_admin":
      case "admin":
        router.push("/dashboard")
        break
      case "plan_admin":
        router.push("/health-plans")
        break
      case "clinic_admin":
        router.push("/clinics")
        break
      case "professional":
        router.push("/professional")
        break
      default:
        router.push("/dashboard")
    }
  }

  const hasPermission = (permission: string): boolean => {
    if (!user) return false

    // Super admin has all permissions
    if (user.roles?.some(role => role.name === "super_admin")) return true

    // Check direct permissions
    if (user.permissions?.some(p => p.name === permission)) {
      return true
    }

    // Check permissions within roles if they exist
    return !!user.roles?.some(role => 
      role.permissions?.some(p => p.name === permission)
    )
  }

  const hasRole = (role: string | string[]): boolean => {
    if (!user || !user.roles) return false

    const userRoleNames = user.roles.map(r => r.name)
    
    if (Array.isArray(role)) {
      return role.some(r => userRoleNames.includes(r))
    }

    return userRoleNames.includes(role)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
        hasPermission,
        hasRole,
        getUserRole,
        requestPasswordReset,
        validateResetToken,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
