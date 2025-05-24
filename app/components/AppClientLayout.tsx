'use client'

import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { MainLayout } from "@/components/layout"
import "../globals.css"
import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { UserGuide } from "@/components/user-guide"

const inter = Inter({ subsets: ["latin"] })

interface AppClientLayoutProps {
  children: React.ReactNode
  token: string | undefined
  isNoLayoutPage: boolean
}

export function AppClientLayout({
  children,
  token, 
  isNoLayoutPage,
}: Readonly<AppClientLayoutProps>) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem 
        disableTransitionOnChange
      >
        <AuthProvider>
          {!isNoLayoutPage && token ? (
            <MainLayout>
              {children}
              <UserGuide />
            </MainLayout>
          ) : (
            <>{children}</>
          )}
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
} 