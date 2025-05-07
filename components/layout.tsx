"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import Image from "next/image"

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8F9FF] flex overflow-hidden">
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
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <button
          className="bg-[#1E88E5] text-white rounded-full p-3 shadow-lg hover:bg-[#1976D2] transition-colors border-2 border-white"
          onClick={() => {
            const sidebar = document.getElementById('mobile-sidebar')
            if (sidebar) {
              sidebar.classList.toggle('translate-x-0')
              sidebar.classList.toggle('-translate-x-full')
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>
      </div>

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
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-[#E6E9F0] p-6">
            {children}
          </div>
        </main>
        <footer className="py-4 px-6 text-center text-sm text-[#64B5F6] border-t border-[#E6E9F0] bg-white">
          <p>© {new Date().getFullYear()} Conecta Saúde. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  )
}
