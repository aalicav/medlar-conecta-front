import { Metadata } from 'next'
import { Inter } from "next/font/google"
import { ClientLayout } from "@/components/client-layout"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'Medlar Conecta',
  description: 'Sistema de gestão para clínicas e profissionais de saúde',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
