'use client'

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { MUIProvider } from '@/providers/mui-provider'
import { MainLayout } from "@/components/layout"
import { UserGuide } from "@/components/user-guide"
import { Toaster } from "@/components/ui/toaster"

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [token, setToken] = useState<string | undefined>()
  const pathname = usePathname() || ""
  
  // Array de rotas onde o layout não deve ser aplicado
  const noLayoutRoutes = ['/login', '/login/forgot-password', '/reset-password']
  const isNoLayoutPage = noLayoutRoutes.includes(pathname)
  
  // Criar uma nova instância do QueryClient para cada sessão
  const [queryClient] = useState(() => new QueryClient())

  useEffect(() => {
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1]
    setToken(cookieToken)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem 
        disableTransitionOnChange
      >
        <AuthProvider>
          <MUIProvider>
            {!isNoLayoutPage && token ? (
              <MainLayout>
                {children}
                <UserGuide />
              </MainLayout>
            ) : (
              <>{children}</>
            )}
            <Toaster />
          </MUIProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
} 