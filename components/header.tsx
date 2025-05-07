"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"
import { 
  Bell, 
  User, 
  Settings, 
  UserRound, 
  FileText, 
  LogOut, 
  CheckCircle, 
  Clock, 
  Search,
  HelpCircle,
  MessageSquare,
  CalendarClock,
  AlertCircle,
  Loader2
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { fetchResource, updateResource, ApiResponse } from "@/services/resource-service"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

// Interface for notifications
interface Notification {
  id: string
  type: string
  title: string
  message: string
  read_at: string | null
  created_at: string
  data?: any
}

interface HeaderProps {
  className?: string
}

export function Header({ className }: HeaderProps) {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMarkingRead, setIsMarkingRead] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchExpanded, setSearchExpanded] = useState(false)
  
  const unreadCount = notifications.filter(n => !n.read_at).length

  // Fetch notifications on mount
  useEffect(() => {
    fetchNotifications()
    // Set up polling interval to check for new notifications
    const interval = setInterval(fetchNotifications, 60000) // Every minute
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetchResource<Notification[]>('notifications', {
        per_page: 10 // Limit to the 10 most recent notifications for the header
      })
      if (response?.data) {
        setNotifications(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      setIsMarkingRead(true)
      await updateResource<{ success: boolean }>('notifications/read-all', {}, 'PATCH')
      // Update local state instead of refetching
      setNotifications(notifications.map(notification => ({
        ...notification,
        read_at: notification.read_at || new Date().toISOString()
      })))
      toast({
        title: "Notificações",
        description: "Todas as notificações foram marcadas como lidas.",
      })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar as notificações como lidas.",
        variant: "destructive",
      })
    } finally {
      setIsMarkingRead(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await updateResource<{ success: boolean }>(`notifications/${id}/read`, {}, 'PATCH')
      // Update local state
      setNotifications(notifications.map(notification => 
        notification.id === id 
          ? { ...notification, read_at: new Date().toISOString() } 
          : notification
      ))
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const formatNotificationTime = (dateString: string) => {
    try {
      return `Há ${formatDistanceToNow(new Date(dateString), { locale: ptBR, addSuffix: false })}`
    } catch (error) {
      return 'Data desconhecida'
    }
  }

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case "appointment_notification": return <CalendarClock className="h-5 w-5 text-primary" />;
      case "solicitation_notification": return <FileText className="h-5 w-5 text-primary" />;
      case "payment_notification": return <FileText className="h-5 w-5 text-primary" />;
      case "system_notification": return <AlertCircle className="h-5 w-5 text-primary" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  }

  return (
    <header 
      className={`sticky top-0 z-30 w-full flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur-md px-4 md:px-6 transition-all duration-300 ${
        isScrolled ? 'shadow-md' : ''
      } ${className || ''}`}
    >
      <div className="flex items-center md:hidden">
        {/* Logo for mobile - sidebar toggle is in the Sidebar component */}
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <span className="text-lg font-bold text-primary">CS</span>
          </div>
        </Link>
      </div>

      {/* Search */}
      <div className={`hidden md:flex items-center transition-all duration-300 ${searchExpanded ? 'w-96' : 'w-64'}`}>
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-primary" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full py-2 pl-10 pr-4 rounded-full text-sm bg-muted/50 focus:bg-muted border-none ring-1 ring-border focus:ring-primary/30 focus:outline-none transition-all duration-200"
            onFocus={() => setSearchExpanded(true)}
            onBlur={() => setSearchExpanded(false)}
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end space-x-4">
        <nav className="flex items-center space-x-1 md:space-x-2">
          {/* Help button */}
          <Button variant="ghost" size="icon" className="relative rounded-full text-primary hover:text-primary hover:bg-muted transition-colors duration-200">
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Messages */}
          <Button variant="ghost" size="icon" className="relative rounded-full text-primary hover:text-primary hover:bg-muted transition-colors duration-200">
            <MessageSquare className="h-5 w-5" />
            <Badge 
              variant="secondary" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground"
            >
              2
            </Badge>
          </Button>

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative rounded-full text-primary hover:text-primary hover:bg-muted transition-colors duration-200"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="default" 
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground"
                  >
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[360px] p-0 rounded-xl shadow-lg border-border/50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted">
                <h4 className="font-semibold text-sm text-foreground">Notificações</h4>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs hover:bg-muted text-primary"
                    onClick={markAllAsRead}
                    disabled={isMarkingRead}
                  >
                    {isMarkingRead ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    )}
                    <span>Marcar todas como lidas</span>
                  </Button>
                )}
              </div>
              <div className="max-h-[320px] overflow-y-auto overscroll-contain">
                {isLoading && notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-3 animate-spin" />
                    <p className="text-muted-foreground">Carregando notificações...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhuma notificação</p>
                  </div>
                ) : (
                  <div>
                    {notifications.some(n => !n.read_at) && (
                      <p className="text-[11px] uppercase font-semibold text-primary tracking-wider px-4 pt-3 pb-1">
                        Não lidas
                      </p>
                    )}
                    
                    {notifications.filter(n => !n.read_at).map((notification) => (
                      <div 
                        key={notification.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b border-border/60 transition-colors duration-150"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5 p-2 bg-muted rounded-full">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-medium text-foreground">
                                {notification.title}
                              </p>
                              <Badge variant="secondary" className="h-2 w-2 rounded-full p-0 bg-primary" />
                            </div>
                            <p className="text-xs text-foreground mt-0.5">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              {formatNotificationTime(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}

                    {notifications.some(n => n.read_at) && (
                      <p className="text-[11px] uppercase font-semibold text-muted-foreground tracking-wider px-4 pt-3 pb-1">
                        Anteriores
                      </p>
                    )}
                    
                    {notifications.filter(n => n.read_at).map((notification) => (
                      <div 
                        key={notification.id}
                        className="p-3 hover:bg-muted cursor-pointer border-b border-border/40 opacity-70 hover:opacity-100 transition-all duration-150"
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5 p-2 bg-muted rounded-full">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-primary">{notification.title}</p>
                            <p className="text-xs text-foreground mt-0.5">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              {formatNotificationTime(notification.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-2 border-t bg-muted">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-xs text-primary hover:bg-muted hover:text-primary border-border"
                  asChild
                >
                  <Link href="/notifications">Ver todas notificações</Link>
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <ModeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-9 flex items-center gap-2 pl-2 pr-2.5 rounded-full hover:bg-muted transition-colors duration-200"
              >
                <Avatar className="h-7 w-7 border ring-2 ring-border shadow-sm">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground text-xs">
                    {user?.name ? getInitials(user.name) : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm hidden md:inline-block font-medium truncate max-w-[100px] text-foreground">
                  {user?.name?.split(" ")[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="end" forceMount>
              <div className="flex items-center justify-start p-2 border-b border-border space-x-2">
                <Avatar className="h-10 w-10 border-2 border-border">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                    {user?.name ? getInitials(user.name) : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium leading-none text-foreground">{user?.name}</p>
                  <p className="text-xs leading-none text-primary">{user?.email}</p>
                </div>
              </div>
              
              <div className="p-2">
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/profile" className="flex items-center rounded-md py-1.5 text-foreground hover:text-foreground hover:bg-muted">
                    <UserRound className="mr-2 h-4 w-4" />
                    <span>Meu Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings" className="flex items-center rounded-md py-1.5 text-foreground hover:text-foreground hover:bg-muted">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
              </div>
              
              <div className="p-2 pt-0">
                <DropdownMenuItem 
                  onClick={() => logout()} 
                  className="flex items-center cursor-pointer text-destructive focus:text-destructive hover:bg-destructive/10 rounded-md py-1.5"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair da conta</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
