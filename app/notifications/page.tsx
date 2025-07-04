'use client'

import React from "react"
import { useState, useEffect } from "react"
import { createResource, fetchResource, updateResource } from "@/services/resource-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  Search, 
  Filter, 
  Loader2, 
  Check, 
  ArrowLeft, 
  ArrowRight,
  UserRound, 
  FileText, 
  CalendarClock, 
  AlertCircle,
  MessageSquare,
  Eye,
  ClipboardList,
  CreditCard,
  XCircle
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// Interface para notificações
interface Notification {
  id: string
  type: string
  notifiable_type: string
  notifiable_id: number
  data: {
    title?: string
    message?: string
    type: string
    icon?: string
    link?: string
    action?: {
      label: string
      url: string
    }
    // Solicitation specific fields
    solicitation_id?: number
    patient_id?: number
    patient_name?: string
    tuss_code?: string
    tuss_description?: string
    priority?: string
    // Appointment specific fields
    appointment_id?: number
    confirmed_at?: string
    cancelled_at?: string
    detail_url?: string
    // Report specific fields
    report_type?: string
    file_path?: string
    // Error specific fields
    error_message?: string
    [key: string]: any
  }
  read_at: string | null
  created_at: string
  updated_at: string
}

interface NotificationResponse {
  current_page: number
  data: Notification[]
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  links: Array<{
    url: string | null
    label: string
    active: boolean
  }>
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number
  total: number
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingRead, setIsMarkingRead] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  
  const notificationTypes = [
    { value: "all", label: "Todos os tipos" },
    { value: "solicitation_created", label: "Nova Solicitação" },
    { value: "appointment_confirmed", label: "Agendamento Confirmado" },
    { value: "appointment_cancelled", label: "Agendamento Cancelado" },
    { value: "report_generated", label: "Relatório Gerado" },
    { value: "report_generation_failed", label: "Erro na Geração de Relatório" },
    { value: "appointment_notification", label: "Agendamentos" },
    { value: "solicitation_notification", label: "Solicitações" },
    { value: "payment_notification", label: "Pagamentos" },
    { value: "system_notification", label: "Sistema" },
    { value: "professional_registration_submitted", label: "Cadastro de Profissional" }
  ]

  useEffect(() => {
    fetchNotifications()
  }, [page, activeTab, selectedType])

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      
      const filters: Record<string, string> = {}
      
      // Filtrar por status (lido/não lido)
      if (activeTab === "unread") {
        filters.read = "0"
      } else if (activeTab === "read") {
        filters.read = "1"
      }
      
      // Filtrar por tipo
      if (selectedType && selectedType !== "all") {
        filters.type = selectedType
      }
      
      // Filtrar por busca
      if (searchQuery) {
        filters.search = searchQuery
      }
      
      const response = await fetchResource<NotificationResponse>('notifications', {
        page: page,
        per_page: 10,
        filters
      })
      
      if (response?.data) {
        setNotifications(response.data.data)
        setTotalPages(response.data.last_page || 1)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar as notificações",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const markAllAsRead = async () => {
    try {
      setIsMarkingRead(true)
      await createResource<{ success: boolean }>('notifications/read-all', {})
      
      // Atualizar estado local
      setNotifications(notifications.map(notification => ({
        ...notification,
        read_at: notification.read_at || new Date().toISOString()
      })))
      
      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas",
        variant: "default",
      })
      
      // Recarregar notificações para atualizar contadores
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar as notificações como lidas",
        variant: "destructive",
      })
    } finally {
      setIsMarkingRead(false)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await updateResource<{ success: boolean }>(`notifications/${id}/read`, {}, 'PATCH')
      
      // Atualizar estado local
      setNotifications(notifications.map(notification => 
        notification.id === id 
          ? { ...notification, read_at: new Date().toISOString() } 
          : notification
      ))
      
      toast({
        title: "Sucesso",
        description: "Notificação marcada como lida",
        variant: "default",
      })
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar a notificação como lida",
        variant: "destructive",
      })
    }
  }

  const markSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) return
    
    try {
      setIsMarkingRead(true)
      
      // Marca cada notificação selecionada como lida
      await Promise.all(
        selectedNotifications.map(id => 
          updateResource<{ success: boolean }>(`notifications/${id}/read`, {}, 'PATCH')
        )
      )
      
      // Atualiza o estado local
      setNotifications(notifications.map(notification => 
        selectedNotifications.includes(notification.id)
          ? { ...notification, read_at: new Date().toISOString() }
          : notification
      ))
      
      // Limpa a seleção
      setSelectedNotifications([])
      
      toast({
        title: "Sucesso",
        description: `${selectedNotifications.length} notificações marcadas como lidas`,
        variant: "default",
      })
    } catch (error) {
      console.error('Failed to mark selected notifications as read:', error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar as notificações selecionadas como lidas",
        variant: "destructive",
      })
    } finally {
      setIsMarkingRead(false)
    }
  }

  const handleSearch = () => {
    setPage(1) // Reset to first page
    fetchNotifications()
  }

  const handleTypeChange = (value: string) => {
    setSelectedType(value === "all" ? undefined : value)
    setPage(1) // Reset to first page
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setPage(1) // Reset to first page
  }

  const formatNotificationTime = (dateString: string) => {
    try {
      return `Há ${formatDistanceToNow(new Date(dateString), { locale: ptBR, addSuffix: false })}`
    } catch (error) {
      return 'Data desconhecida'
    }
  }

  const getNotificationIcon = (notification: Notification) => {
    // Use icon from data if available
    if (notification.data?.icon) {
      switch(notification.data.icon) {
        case "user-plus": return <UserRound className="h-5 w-5 text-blue-500" />;
        case "bell": return <Bell className="h-5 w-5 text-yellow-500" />;
        case "calendar": return <CalendarClock className="h-5 w-5 text-green-500" />;
        case "file-text": return <FileText className="h-5 w-5 text-indigo-500" />;
        case "file-medical": return <FileText className="h-5 w-5 text-blue-500" />;
        case "alert-circle": return <AlertCircle className="h-5 w-5 text-red-500" />;
        case "message-square": return <MessageSquare className="h-5 w-5 text-purple-500" />;
        default: return <Bell className="h-5 w-5 text-primary" />;
      }
    }
    
    // Fallback to type-based icon if no data.icon
    switch(notification.data?.type) {
      case "solicitation_created": 
        return <FileText className="h-5 w-5 text-blue-500" />;
      case "appointment_confirmed": 
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "appointment_cancelled": 
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "report_generated": 
        return <FileText className="h-5 w-5 text-indigo-500" />;
      case "report_generation_failed": 
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "appointment_notification": 
        return <CalendarClock className="h-5 w-5 text-green-500" />;
      case "solicitation_notification": 
        return <ClipboardList className="h-5 w-5 text-indigo-500" />;
      case "payment_notification": 
        return <CreditCard className="h-5 w-5 text-violet-500" />;
      case "system_notification": 
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "professional_registration_submitted": 
        return <UserRound className="h-5 w-5 text-blue-500" />;
      case "contract_notification":
        return <FileText className="h-5 w-5 text-amber-500" />;
      case "reminder_notification":
        return <Clock className="h-5 w-5 text-purple-500" />;
      default: 
        return <Bell className="h-5 w-5 text-primary" />;
    }
  }

  const getNotificationTitle = (notification: Notification): string => {
    if (notification.data?.title) {
      return notification.data.title
    }
    
    // Generate default titles based on notification type
    switch (notification.data?.type) {
      case "solicitation_created":
        return "Nova Solicitação Criada"
      case "appointment_confirmed":
        return "Agendamento Confirmado"
      case "appointment_cancelled":
        return "Agendamento Cancelado"
      case "report_generated":
        return "Relatório Gerado"
      case "report_generation_failed":
        return "Erro na Geração de Relatório"
      case "appointment_notification":
        return "Atualização de Agendamento"
      case "solicitation_notification":
        return "Atualização de Solicitação"
      case "payment_notification":
        return "Atualização de Pagamento"
      case "system_notification":
        return "Notificação do Sistema"
      case "professional_registration_submitted":
        return "Cadastro de Profissional"
      default:
        return "Notificação"
    }
  }

  const getNotificationMessage = (notification: Notification): string => {
    if (notification.data?.message) {
      return notification.data.message
    }
    
    // Generate default messages based on notification type
    switch (notification.data?.type) {
      case "solicitation_created":
        return notification.data?.patient_name 
          ? `Nova solicitação criada para ${notification.data.patient_name}`
          : "Uma nova solicitação foi criada"
      case "appointment_confirmed":
        return "Seu agendamento foi confirmado"
      case "appointment_cancelled":
        return "Seu agendamento foi cancelado"
      case "report_generated":
        return "Seu relatório está pronto para download"
      case "report_generation_failed":
        const reportType = notification.data?.report_type || "relatório"
        return `Falha na geração do ${reportType}. Verifique os detalhes.`
      case "appointment_notification":
        return "Há uma atualização em seu agendamento"
      case "solicitation_notification":
        return "Há uma atualização em sua solicitação"
      case "payment_notification":
        return "Há uma atualização em seu pagamento"
      case "system_notification":
        return "Há uma notificação do sistema"
      case "professional_registration_submitted":
        return "Um novo profissional foi cadastrado"
      default:
        return "Você tem uma nova notificação"
    }
  }

  const toggleSelectNotification = (id: string) => {
    setSelectedNotifications(prev => 
      prev.includes(id)
        ? prev.filter(notifId => notifId !== id)
        : [...prev, id]
    )
  }

  const isAllSelected = notifications.length > 0 && selectedNotifications.length === notifications.length
  
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedNotifications([])
    } else {
      setSelectedNotifications(notifications.map(n => n.id))
    }
  }

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === "unread") {
      return !notification.read_at
    } else if (activeTab === "read") {
      return notification.read_at
    }
    return true
  })

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-muted-foreground">Gerencie todas as suas notificações</p>
        </div>
        {activeTab !== "read" && (
          <Button 
            onClick={markAllAsRead} 
            variant="outline" 
            disabled={isMarkingRead || isLoading}
            className="text-primary hover:text-primary hover:bg-primary/10 border-primary/20"
          >
            {isMarkingRead ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            <span>Marcar todas como lidas</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar com filtros */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pesquisar</label>
              <div className="flex">
                <Input
                  placeholder="Buscar notificações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-r-none"
                />
                <Button 
                  type="button"
                  variant="default" 
                  size="icon"
                  className="rounded-l-none" 
                  onClick={handleSearch}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select
                value={selectedType || "all"}
                onValueChange={handleTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Separator className="my-4" />
            
            <div className="pt-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setSearchQuery("")
                  setSelectedType(undefined)
                  setPage(1)
                  fetchNotifications()
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de notificações */}
        <div className="md:col-span-3 space-y-4">
          <Card>
            <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <TabsList>
                    <TabsTrigger value="all" className="gap-2">
                      <Bell className="h-4 w-4" />
                      <span>Todas</span>
                    </TabsTrigger>
                    <TabsTrigger value="unread" className="gap-2">
                      <Eye className="h-4 w-4" />
                      <span>Não lidas</span>
                    </TabsTrigger>
                    <TabsTrigger value="read" className="gap-2">
                      <Check className="h-4 w-4" />
                      <span>Lidas</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {selectedNotifications.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedNotifications.length} selecionadas
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={markSelectedAsRead}
                        disabled={isMarkingRead}
                        className="h-8"
                      >
                        {isMarkingRead ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3 mr-1" />
                        )}
                        Marcar como lidas
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-2">
                <TabsContent value="all" className="m-0">
                  <NotificationList 
                    notifications={filteredNotifications} 
                    isLoading={isLoading}
                    markAsRead={markAsRead}
                    formatNotificationTime={formatNotificationTime}
                    getNotificationIcon={getNotificationIcon}
                    getNotificationTitle={getNotificationTitle}
                    getNotificationMessage={getNotificationMessage}
                    router={router}
                    selectedNotifications={selectedNotifications}
                    toggleSelectNotification={toggleSelectNotification}
                    isAllSelected={isAllSelected}
                    toggleSelectAll={toggleSelectAll}
                  />
                </TabsContent>
                
                <TabsContent value="unread" className="m-0">
                  <NotificationList 
                    notifications={filteredNotifications} 
                    isLoading={isLoading}
                    markAsRead={markAsRead}
                    formatNotificationTime={formatNotificationTime}
                    getNotificationIcon={getNotificationIcon}
                    getNotificationTitle={getNotificationTitle}
                    getNotificationMessage={getNotificationMessage}
                    router={router}
                    selectedNotifications={selectedNotifications}
                    toggleSelectNotification={toggleSelectNotification}
                    isAllSelected={isAllSelected}
                    toggleSelectAll={toggleSelectAll}
                  />
                </TabsContent>
                
                <TabsContent value="read" className="m-0">
                  <NotificationList 
                    notifications={filteredNotifications} 
                    isLoading={isLoading}
                    markAsRead={markAsRead}
                    formatNotificationTime={formatNotificationTime}
                    getNotificationIcon={getNotificationIcon}
                    getNotificationTitle={getNotificationTitle}
                    getNotificationMessage={getNotificationMessage}
                    router={router}
                    selectedNotifications={selectedNotifications}
                    toggleSelectNotification={toggleSelectNotification}
                    isAllSelected={isAllSelected}
                    toggleSelectAll={toggleSelectAll}
                  />
                </TabsContent>
              </CardContent>
              
              <CardFooter className="flex items-center justify-center pt-2 pb-4">
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault()
                            if (page > 1) setPage(page - 1)
                          }}
                          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                        // Lógica para mostrar as páginas corretamente
                        let pageNum
                        if (totalPages <= 5) {
                          // Mostrar todas as páginas se forem 5 ou menos
                          pageNum = i + 1
                        } else {
                          // Mostrar páginas em torno da página atual
                          if (page <= 3) {
                            // Nas primeiras páginas
                            if (i < 4) {
                              pageNum = i + 1
                            } else {
                              return (
                                <PaginationItem key={i}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )
                            }
                          } else if (page >= totalPages - 2) {
                            // Nas últimas páginas
                            if (i === 0) {
                              return (
                                <PaginationItem key={i}>
                                  <PaginationLink 
                                    href="#" 
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setPage(1)
                                    }}
                                  >
                                    1
                                  </PaginationLink>
                                </PaginationItem>
                              )
                            } else if (i === 1) {
                              return (
                                <PaginationItem key={i}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )
                            } else {
                              pageNum = totalPages - (4 - i)
                            }
                          } else {
                            // No meio
                            if (i === 0) {
                              return (
                                <PaginationItem key={i}>
                                  <PaginationLink 
                                    href="#" 
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setPage(1)
                                    }}
                                  >
                                    1
                                  </PaginationLink>
                                </PaginationItem>
                              )
                            } else if (i === 1) {
                              return (
                                <PaginationItem key={i}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )
                            } else if (i === 3) {
                              return (
                                <PaginationItem key={i}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              )
                            } else if (i === 4) {
                              return (
                                <PaginationItem key={i}>
                                  <PaginationLink 
                                    href="#" 
                                    onClick={(e) => {
                                      e.preventDefault()
                                      setPage(totalPages)
                                    }}
                                  >
                                    {totalPages}
                                  </PaginationLink>
                                </PaginationItem>
                              )
                            } else {
                              pageNum = page
                            }
                          }
                        }
                        
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink 
                              href="#" 
                              onClick={(e) => {
                                e.preventDefault()
                                setPage(pageNum)
                              }} 
                              isActive={page === pageNum}
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#" 
                          onClick={(e) => {
                            e.preventDefault()
                            if (page < totalPages) setPage(page + 1)
                          }}
                          className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </CardFooter>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}

interface NotificationListProps {
  notifications: Notification[]
  isLoading: boolean
  markAsRead: (id: string) => Promise<void>
  formatNotificationTime: (dateString: string) => string
  getNotificationIcon: (notification: Notification) => React.ReactElement
  getNotificationTitle: (notification: Notification) => string
  getNotificationMessage: (notification: Notification) => string
  router: any
  selectedNotifications: string[]
  toggleSelectNotification: (id: string) => void
  isAllSelected: boolean
  toggleSelectAll: () => void
}

function NotificationList({
  notifications,
  isLoading,
  markAsRead,
  formatNotificationTime,
  getNotificationIcon,
  getNotificationTitle,
  getNotificationMessage,
  router,
  selectedNotifications,
  toggleSelectNotification,
  isAllSelected,
  toggleSelectAll
}: NotificationListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
        <p className="text-muted-foreground">Carregando notificações...</p>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-1">Nenhuma notificação encontrada</h3>
        <p className="text-muted-foreground">Não há notificações para exibir nesta seção.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center py-2 px-3 bg-muted/30 rounded-md">
        <div className="flex items-center gap-2 flex-1">
          <Checkbox 
            checked={isAllSelected}
            onCheckedChange={() => toggleSelectAll()}
            id="select-all"
          />
          <label 
            htmlFor="select-all" 
            className="text-xs font-medium cursor-pointer"
          >
            Selecionar todos
          </label>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">Notificação</span>
          <span className="text-xs text-muted-foreground w-24 text-right">Data</span>
        </div>
      </div>
      
      {notifications.map((notification) => (
        <div 
          key={notification.id}
          className={`p-3 rounded-md transition-colors duration-200 flex items-start gap-3 
            ${!notification.read_at 
              ? 'bg-primary/5 hover:bg-primary/10 border border-primary/10' 
              : 'hover:bg-muted border border-transparent'}`}
        >
          <div className="flex items-start gap-3 flex-1">
            <Checkbox 
              checked={selectedNotifications.includes(notification.id)}
              onCheckedChange={() => toggleSelectNotification(notification.id)}
              className="mt-1"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              {getNotificationIcon(notification)}
            </div>
            
            <div 
              className="flex-1 cursor-pointer"
              onClick={() => {
                if (notification.data?.link || notification.data?.action?.url) {
                  if (!notification.read_at) {
                    markAsRead(notification.id)
                  }
                  const url = notification.data?.action?.url || notification.data?.link
                  if (url) {
                    router.push(url)
                  }
                } else if (!notification.read_at) {
                  markAsRead(notification.id)
                }
              }}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{getNotificationTitle(notification)}</h3>
                    {!notification.read_at && (
                      <Badge className="h-2 w-2 rounded-full p-0 bg-primary" />
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {getNotificationMessage(notification)}
                  </p>
                </div>
                
                <div className="text-xs text-muted-foreground flex items-center whitespace-nowrap ml-4 mt-1">
                  <Clock className="h-3 w-3 mr-1 shrink-0" />
                  <span>{formatNotificationTime(notification.created_at)}</span>
                </div>
              </div>
              
              {notification.data?.patient_name && (
                <div className="mt-2 flex items-center">
                  <Badge variant="outline" className="text-xs">
                    {notification.data.patient_name}
                  </Badge>
                </div>
              )}
              
              {notification.data?.error_message && (
                <div className="mt-2">
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Ver detalhes do erro
                    </summary>
                    <div className="mt-1 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs font-mono text-destructive">
                      {notification.data.error_message}
                    </div>
                  </details>
                </div>
              )}
              
              {notification.data?.action && (
                <div className="mt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (notification.data?.action?.url) {
                        if (!notification.read_at) {
                          markAsRead(notification.id)
                        }
                        router.push(notification.data.action.url)
                      }
                    }}
                  >
                    {notification.data.action.label}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
} 