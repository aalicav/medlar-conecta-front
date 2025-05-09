"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { apiClient } from "@/app/services/api-client"

interface User {
  id: string
  name: string
  email: string
  role: string
  roles?: string[]
  permissions?: string[]
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

interface SessionData {
  data: {
    user: User | null
  } | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if there's a token in localStorage
    const token = localStorage.getItem("auth_token")
    
    if (!token) {
      setIsLoading(false)
      return
    }

    // Load user data
    const loadUserData = async () => {
      try {
        const response = await apiClient.get("/auth/me")
        setUser(response.data.user)
      } catch (error) {
        // Clear invalid token
        localStorage.removeItem("auth_token")
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUserData()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    
    try {
      const response = await apiClient.post("/auth/login", { email, password })
      const { token, user } = response.data
      
      localStorage.setItem("auth_token", token)
      setUser(user)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout")
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("auth_token")
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

// Compatibility function to mimic next-auth's useSession hook
export function useSession(): SessionData {
  const { user, isLoading, isAuthenticated } = useAuth()
  
  let status: 'loading' | 'authenticated' | 'unauthenticated'
  if (isLoading) {
    status = 'loading'
  } else if (isAuthenticated) {
    status = 'authenticated'
  } else {
    status = 'unauthenticated'
  }
  
  return {
    data: user ? { user } : null,
    status
  }
} 