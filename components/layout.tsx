"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import Image from "next/image"
import { Menu } from "lucide-react"

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen h-screen bg-[#F8F9FF] flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar - Hidden on mobile, visible on md and up */}
      <div className="hidden md:block h-screen flex-shrink-0 border-r border-[#E6E9F0] bg-[#BBDEFB] shadow-sm">
        <div className="h-16 flex items-center justify-center border-b border-[#E6E9F0] bg-[#1E88E5]">
          <Image
            src="/logo.png"
            alt="Conecta Saúde"
            width={140}
            height={40}
            className="object-contain"
          />
        </div>
        <Sidebar className="h-[calc(100%-4rem)]" />
      </div>
      
      {/* Mobile Sidebar Toggle - Visible only on mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-[9999] bg-[#1E88E5] text-white rounded-full p-2 shadow-lg hover:bg-[#1976D2] transition-colors border-2 border-white"
        onClick={() => {
          const sidebar = document.getElementById('mobile-sidebar')
          if (sidebar) {
            sidebar.classList.toggle('translate-x-0')
            sidebar.classList.toggle('-translate-x-full')
          }
        }}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Sidebar */}
      <div
        id="mobile-sidebar"
        className="md:hidden fixed inset-y-0 left-0 z-40 w-64 bg-[#BBDEFB] border-r border-[#E6E9F0] transform -translate-x-full transition-transform duration-300 ease-in-out shadow-lg"
      >
        <div className="h-16 flex items-center justify-center border-b border-[#E6E9F0] bg-[#1E88E5]">
          <Image
            src="/logo.png"
            alt="Conecta Saúde"
            width={140}
            height={40}
            className="object-contain"
          />
        </div>
        <Sidebar className="h-[calc(100%-4rem)]" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen max-h-screen">
        <Header className="flex-shrink-0" />
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-[#E6E9F0] p-6">
            {children}
          </div>
        </main>
        <footer className="flex-shrink-0 py-4 px-6 text-center text-sm text-[#64B5F6] border-t border-[#E6E9F0] bg-white">
          <p>© {new Date().getFullYear()} Conecta Saúde. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  )
}
