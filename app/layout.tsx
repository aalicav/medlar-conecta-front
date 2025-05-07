import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { MainLayout } from "@/components/layout"
import "./globals.css"
import { usePathname } from "next/dist/client/components/navigation"
import { cookies } from "next/headers"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Conecta Saúde - Sistema de Retaguarda Médica",
  description: "Sistema de retaguarda médica B2B que conecta planos de saúde, profissionais e clínicas",
    generator: 'v0.dev'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value
  

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
