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
  Building
} from "lucide-react"
import { NavigationMenuItem, NavigationMenuLink, NavigationMenu, NavigationMenuList } from "@/components/ui/navigation-menu"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { user, hasRole, hasPermission, logout } = useAuth()
  const pathname = usePathname() || ""
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener("resize", checkMobile)
    
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  useEffect(() => {
    // Close sidebar on route change in mobile view
    if (isMobile) {
      setIsOpen(false)
    }
  }, [pathname, isMobile])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const closeSidebar = () => {
    setIsOpen(false)
  }

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed)
  }

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
      roles: ["super_admin", "admin", "director", "commercial", "legal", "operational", "financial", "plan_admin", "clinic_admin", "professional", "clinic"],
    },
    {
      title: "Planos de Saúde",
      href: "/health-plans",
      icon: Building2,
      roles: ["super_admin", "admin", "director", "commercial", "plan_admin"],
    },
    {
      title: "Profissionais",
      href: "/professionals",
      icon: UserRound,
      roles: ["super_admin", "admin", "director", "commercial", "operational", "clinic_admin", "clinic"],
    },
    {
      title: "Clínicas",
      href: "/clinics",
      icon: Building2,
      roles: ["super_admin", "admin", "director", "commercial", "operational", "clinic_admin"],
    },
    {
      title: "Pacientes",
      href: "/patients",
      icon: Users,
      roles: ["super_admin", "admin", "director", "plan_admin", "operational", "professional", "clinic"],
    },
    {
      title: "Solicitações",
      href: "/solicitations",
      icon: ClipboardList,
      roles: ["super_admin", "admin", "director", "plan_admin", "clinic_admin", "operational", "professional", "clinic"],
    },
    {
      title: "Agendamentos",
      href: "/appointments",
      icon: Calendar,
      roles: ["super_admin", "admin", "director", "plan_admin", "clinic_admin", "operational", "professional", "clinic"],
    },
    {
      title: "Negociações",
      href: "/negotiations",
      icon: GanttChart,
      roles: ["super_admin", "admin", "director", "commercial", "plan_admin", "clinic_admin", "professional"],
    },
    {
      title: "Negociações por Especialidade",
      href: "/specialty-negotiations",
      icon: GanttChart,
      roles: ["super_admin", "admin", "director", "commercial", "legal"],
    },
    {
      title: "Negociações Extemporâneas",
      href: "/extemporaneous-negotiations",
      icon: AlertCircle,
      roles: ["super_admin", "admin", "director", "commercial", "legal"],
    },
    {
      title: "Verificações de Valores",
      href: "/value-verifications",
      icon: FileText,
      roles: ["super_admin", "admin", "director", "commercial", "financial"],
    },
    {
      title: "Faturamento",
      href: "/billing",
      icon: CreditCard,
      roles: ["super_admin", "admin", "director", "financial", "plan_admin", "clinic_admin"],
    },
    {
      title: "Regras de Faturamento",
      href: "/billing-rules",
      icon: CreditCard,
      roles: ["super_admin", "admin", "director", "financial", "commercial"],
    },
    {
      title: "Contratos",
      href: "/contracts",
      icon: FileText,
      roles: ["super_admin", "admin", "director", "commercial", "legal", "plan_admin", "clinic_admin", "professional"],
    },
    {
      title: "Aprovações de Contratos",
      href: "/contract-approvals",
      icon: FileText,
      roles: ["super_admin", "admin", "director", "commercial", "legal"],
    },
    {
      title: "Modelos de Contratos",
      href: "/contract-templates",
      icon: FileText,
      roles: ["super_admin", "admin", "director", "commercial", "legal"],
    },
    {
      title: "Privacidade (LGPD)",
      href: "/privacy",
      icon: Shield,
      roles: ["super_admin", "admin", "director"],
    },
    {
      title: "Assistente SURI",
      href: "/chatbot",
      icon: MessageSquare,
      roles: ["super_admin", "admin", "director", "commercial", "legal", "operational", "financial", "professional", "clinic"],
    },
    {
      title: "Notificações",
      href: "/notifications",
      icon: Bell,
      roles: ["super_admin", "admin", "director", "commercial", "legal", "operational", "financial", "plan_admin", "clinic_admin", "professional", "clinic"],
    },
    {
      title: "Relatórios",
      href: "/reports",
      icon: BarChart3,
      roles: ["super_admin", "admin", "director", "commercial", "financial", "plan_admin"],
    },
    {
      title: "Logs",
      href: "/audit-logs",
      icon: FileText,
      roles: ["super_admin", "admin", "director"],
    },
    {
      title: "Configurações",
      href: "/settings",
      icon: Settings,
      roles: ["super_admin", "admin", "director"],
      permission: "edit settings",
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
      roles: ["super_admin", "admin", "director"],
    },
    {
      title: "WhatsApp",
      href: "/whatsapp",
      icon: MessageSquare,
      roles: ["super_admin", "admin", "director", "operational"],
    },
    {
      title: "Exceções de Agendamento",
      href: "/scheduling-exceptions",
      icon: AlertCircle,
      roles: ["super_admin", "admin", "professional", "clinic"],
    },
  ]

  const filteredNavItems = navItems.filter(
    (item) => hasRole(item.roles))

  return (
    <>
      {/* Mobile menu button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed top-4 left-4 z-50 md:hidden shadow-sm bg-background/90 backdrop-blur-md hover:bg-background/80 transition-all duration-200" 
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden opacity-100 transition-opacity duration-300" 
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "flex flex-col h-full bg-primary text-primary-foreground shadow-xl transition-all duration-300 ease-in-out",
          isMobile ? "fixed top-0 left-0 z-50 w-[280px]" : isCollapsed ? "w-[80px]" : "w-[280px]",
          isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "",
          className,
        )}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/2 h-1/3 bg-gradient-to-bl from-white/10 to-transparent rounded-bl-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/4 bg-gradient-to-tr from-secondary/30 to-transparent rounded-tr-full pointer-events-none"></div>

        <div className="flex h-16 items-center justify-between px-6 border-b border-white/10 relative backdrop-blur-sm">
          <div className="flex items-center">
            {!isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary-foreground hover:bg-white/10 rounded-full transition-all duration-200 mr-2" 
                onClick={toggleCollapsed}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
              </Button>
            )}
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary-foreground hover:bg-white/10 rounded-full transition-all duration-200" 
                onClick={closeSidebar}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-grow">
          <div className="px-4 py-6">
            {!isCollapsed && (
              <div className="mb-6 px-4">
                <h2 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Menu Principal</h2>
              </div>
            )}
            
            <nav className="space-y-1.5">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const isHovered = hoveredItem === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.title}
                    onMouseEnter={() => setHoveredItem(item.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      "flex items-center justify-between rounded-md px-4 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden group",
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
                      {!isCollapsed && <span>{item.title}</span>}
                    </div>
                    
                    {isActive && !isCollapsed && (
                      <ChevronRight className="h-4 w-4 text-white/70" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </ScrollArea>

        <div className="border-t border-white/10 p-4">
          <div className={cn(
            "flex items-center rounded-md bg-secondary/30 p-3 transition-all duration-200 hover:bg-secondary/40",
            isCollapsed ? "justify-center" : "space-x-3"
          )}>
            <Avatar className="h-10 w-10 border-2 border-white/20 ring-2 ring-secondary/50 shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                {user?.name ? getInitials(user.name) : ""}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                  <p className="text-xs text-white/70 truncate">{user?.email}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-white hover:bg-white/20 rounded-full transition-all duration-200" 
                  onClick={logout}
                  title="Sair"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
