"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import Image from "next/image"
import {
  LayoutDashboard,
  Users,
  Building2,
  UserRound,
  ClipboardList,
  Calendar,
  CreditCard,
  FileText,
  Bell,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  Shield,
  GanttChart,
  LockKeyhole,
  AlertCircle,
  Building,
  Receipt,
  Cog
} from "lucide-react"
import { NavigationMenuItem, NavigationMenuLink, NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu"
import { LucideIcon } from 'lucide-react'

interface SidebarProps {
  className?: string
  items?: {
    title: string;
    href: string;
    icon: LucideIcon;
  }[];
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function Sidebar({ className, items, isCollapsed: externalIsCollapsed, onCollapsedChange }: SidebarProps) {
  const { user, hasRole, hasPermission, logout } = useAuth()
  const pathname = usePathname() || ""
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  // Use external state if provided, otherwise use internal state
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed
  const setIsCollapsed = onCollapsedChange || setInternalIsCollapsed

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["super_admin", "admin", "director", "commercial_manager", "legal", "operational", "financial", "plan_admin", "clinic_admin", "professional", "clinic", "network_manager"],
    },
    {
      title: "Planos de Saúde",
      href: "/health-plans",
      icon: Building2,
      roles: ["super_admin", "admin", "director", "commercial_manager", "network_manager"],
    },
    {
      title: "Faturamentos",
      href: "/health-plans/billing",
      icon: CreditCard,
      roles: ["plan_admin", "super_admin"],
    },
    {
      title: "Pacientes",
      href: "/patients",
      icon: Users,
      roles: ["super_admin", "admin", "director", "commercial_manager", "operational", "clinic_admin", "clinic", "network_manager", "plan_admin"],
    },
    {
      title: "Documentos",
      href: "/health-plans/documents",
      icon: FileText,
      roles: [],
    },
    {
      title: "Configurações",
      href: "/health-plans/settings",
      icon: Settings,
      roles: [],
    },
    {
      title: "Cadastros",
      href: "/professionals",
      icon: Users,
      roles: ["super_admin", "admin", "director", "commercial_manager", "operational", "clinic_admin", "clinic", "network_manager"],
    },
    {
      title: "Convites para agendamento",
      href: "/professionals/invites",
      icon: Calendar,
      roles: ["super_admin", "admin", "director", "clinic_admin", "operational", "professional", "clinic", "network_manager"],
    },
    {
      title: "Solicitações",
      href: "/solicitations",
      icon: ClipboardList,
      roles: ["super_admin", "admin", "director", "plan_admin", "clinic_admin", "operational", "network_manager"],
    },
    {
      title: "Agendamentos",
      href: "/appointments",
      icon: Calendar,
      roles: ["super_admin", "admin", "director", "plan_admin", "clinic_admin", "operational", "professional", "clinic", "network_manager"],
    },
    {
      title: "Negociações",
      href: "/negotiations",
      icon: GanttChart,
      roles: ["super_admin", "admin", "director", "commercial_manager", "clinic_admin", "professional", "network_manager"],
    },
    {
      title: "Verificações de Valores",
      href: "/value-verifications",
      icon: FileText,
      roles: ["super_admin", "admin", "director", "commercial_manager", "financial"],
    },
    {
      title: "Regras de Faturamento",
      href: "/health-plans/billing-rules",
      icon: CreditCard,
      roles: ["super_admin", "admin", "director", "financial_manager", "commercial_manager"],
    },
    {
      title: "Contratos",
      href: "/contracts",
      icon: FileText,
      roles: ["super_admin", "admin", "director", "commercial_manager", "legal", "plan_admin", "clinic_admin", "professional"],
    },
    {
      title: "Notas Fiscais",
      href: "/nfe",
      icon: Receipt,
      roles: ["super_admin", "admin", "director", "financial", "plan_admin"],
    },
    {
      title: "Configurações NFe",
      href: "/nfe-config",
      icon: Cog,
      roles: ["super_admin", "admin", "director", "financial"],
    },
    {
      title: "Assistente SURI",
      href: "/chatbot",
      icon: MessageSquare,
      roles: ["super_admin", "admin", "director", "operational", "financial", "professional", "network_manager"],
    },
    {
      title: "Notificações",
      href: "/notifications",
      icon: Bell,
      roles: ["super_admin", "admin", "director", "commercial_manager", "legal", "operational", "financial", "plan_admin", "clinic_admin", "professional", "clinic", "network_manager"],
    },
    {
      title: "Relatórios",
      href: "/reports",
      icon: BarChart3,
      roles: ["super_admin", "admin", "director", "commercial_manager", "financial", "plan_admin", "network_manager"],
    },
    {
      title: "Logs",
      href: "/audit-logs",
      icon: FileText,
      roles: ["super_admin", "admin", "director"],
    },
    {
      title: "Tipos de Documentos",
      href: "/admin/document-types",
      icon: FileText,
      roles: ["super_admin", "admin", "director"],
    },
    {
      title: "Usuários",
      href: "/admin/users",
      icon: UserRound,
      roles: ["super_admin", "admin", "director", "network_manager"],
    },
    {
      title: "WhatsApp",
      href: "/whatsapp",
      icon: MessageSquare,
      roles: ["super_admin", "admin", "director", "operational", "network_manager"],
    },
    {
      title: "Exceções de Agendamento",
      href: "/scheduling-exceptions",
      icon: AlertCircle,
      roles: ["super_admin", "admin", "professional", "clinic", "network_manager"],
    },
  ]

  const filteredNavItems = navItems.filter(
    (item) => hasRole(item.roles))

  return (
    <div className={cn(
      "flex flex-col h-full bg-primary text-primary-foreground shadow-xl transition-all duration-300 ease-in-out",
      className,
    )}>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/2 h-1/3 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/4 bg-gradient-to-tr from-secondary/30 to-transparent rounded-tr-full pointer-events-none"></div>

      {/* Header with collapse button */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10 relative backdrop-blur-sm">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground hover:bg-white/10 rounded-full transition-all duration-200" 
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-grow">
        <div className="px-2 py-4">
          {!isCollapsed && (
            <div className="mb-4 px-2">
              <h2 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Menu Principal</h2>
            </div>
          )}
          
          <nav className="space-y-1 overflow-hidden">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const isHovered = hoveredItem === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.title : undefined}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 relative overflow-hidden group",
                    isActive
                      ? "text-white" 
                      : "text-white/80 hover:text-white",
                  )}
                >
                  {/* Background effect for active and hovered items */}
                  {(isActive || isHovered) && (
                    <div className={cn(
                      "absolute inset-0 bg-secondary/40 rounded-md -z-10 transition-opacity duration-200",
                      isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}></div>
                  )}
                  
                  {/* Left highlight bar for active items */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-white rounded-r-full"></div>
                  )}
                  
                  <div className={cn(
                    "flex items-center gap-3",
                    isCollapsed && "justify-center w-full"
                  )}>
                    <div className={cn(
                      "h-8 w-8 flex items-center justify-center rounded-md transition-all duration-200",
                      isActive 
                        ? "bg-secondary text-secondary-foreground shadow-sm" 
                        : "text-primary-foreground/80 group-hover:bg-secondary/50 group-hover:text-primary-foreground"
                    )}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    {!isCollapsed && (
                      <span className="truncate max-w-[140px] block">{item.title}</span>
                    )}
                  </div>
                  
                  {isActive && !isCollapsed && (
                    <ChevronRight className="h-4 w-4 text-white/70 flex-shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </ScrollArea>

      {/* User profile section */}
      <div className="border-t border-white/10 p-3">
        <div className={cn(
          "flex items-center rounded-md bg-secondary/30 p-2 transition-all duration-200 hover:bg-secondary/40",
          isCollapsed ? "justify-center" : "space-x-3"
        )}>
          <Avatar className="h-8 w-8 border-2 border-white/20 ring-2 ring-secondary/50 shadow-lg">
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs">
              {user?.name ? getInitials(user.name) : ""}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate max-w-[120px]">{user?.name}</p>
                <p className="text-xs text-white/70 truncate max-w-[120px]">{user?.email}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-white/20 rounded-full transition-all duration-200 h-8 w-8" 
                onClick={logout}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
