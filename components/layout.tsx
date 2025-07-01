"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import Image from "next/image"
import { Menu } from "lucide-react"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar - Hidden on mobile, visible on md and up */}
      <div className={cn(
        "hidden md:block h-screen flex-shrink-0 border-r border-input shadow-sm transition-all duration-300",
        isSidebarCollapsed ? "w-16" : "w-64"
      )}>
        <div className={cn(
          "h-16 flex items-center justify-center border-b border-input bg-primary transition-all duration-300",
          isSidebarCollapsed ? "px-2" : "px-4"
        )}>
          {!isSidebarCollapsed && (
            <Image
              src="/conecta/logo.png"
              alt="Conecta Saúde"
              width={140}
              height={40}
              className="object-contain transition-opacity duration-300"
            />
          )}
        </div>
        <Sidebar 
          className="h-[calc(100%-4rem)]" 
          isCollapsed={isSidebarCollapsed}
          onCollapsedChange={setIsSidebarCollapsed}
        />
      </div>
      
      {/* Mobile Sidebar Toggle - Visible only on mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-[9999] bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-secondary transition-colors border-2 border-background"
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
        className="md:hidden fixed inset-y-0 left-0 z-40 w-64 border-r border-input transform -translate-x-full transition-transform duration-300 ease-in-out shadow-lg"
      >
        <div className="h-16 flex items-center justify-center border-b border-input bg-primary">
          <Image
            src="/conecta/logo.png"
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
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 bg-muted">
          <div className="max-w-7xl mx-auto bg-card rounded-xl shadow-sm border border-border p-6">
            {children}
          </div>
        </main>
        <footer className="flex-shrink-0 py-4 px-6 text-center text-sm text-primary border-t border-input bg-card">
          <p>© {new Date().getFullYear()} Conecta Saúde. Todos os direitos reservados.</p>
        </footer>
      </div>
    </div>
  )
}
