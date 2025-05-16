"use client"

import { useState, useEffect } from "react"
import { fetchResource } from "@/services/resource-service"
import { Badge } from "@/components/ui/badge"

interface NotificationCounterProps {
  className?: string
}

export function NotificationCounter({ className }: NotificationCounterProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getUnreadCount = async () => {
      try {
        setIsLoading(true)
        const response = await fetchResource<any>('notifications/unread-count')
        if (response?.data) {
          setUnreadCount(response.data.count || 0)
        }
      } catch (error) {
        console.error('Failed to fetch unread notifications count:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Buscar contagem inicial
    getUnreadCount()
    
    // Configurar busca a cada minuto
    const interval = setInterval(getUnreadCount, 60000)
    
    // Limpar intervalo quando o componente é desmontado
    return () => clearInterval(interval)
  }, [])

  // Não mostrar nada enquanto estiver carregando
  if (isLoading) {
    return null
  }

  // Não mostrar nada se não houver notificações não lidas
  if (unreadCount === 0) {
    return null
  }

  return (
    <Badge 
      variant="destructive" 
      className={`h-5 w-auto px-1.5 flex items-center justify-center text-xs ${className || ''}`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  )
} 