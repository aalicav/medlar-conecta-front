'use client'

import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { MainLayout } from "@/components/layout"
import "./globals.css"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [token, setToken] = useState<string | undefined>()
  
  useEffect(() => {
    const cookieToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1]
    setToken(cookieToken)
  }, [])

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <AuthProvider>
            {token ? <MainLayout>
              {children}
            </MainLayout> : <>{children}</>}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
