"use client"

import { ReactNode } from "react"
import { useAuth } from "@/contexts/auth-context"

interface ConditionalRenderProps {
  children: ReactNode
  requiredRoles?: string[]
  requiredPermissions?: string[]
  hideForRoles?: string[]
  hideOnContractData?: boolean
  hideOnNegotiationData?: boolean
  hideOnFinancialData?: boolean
}

/**
 * Componente para renderização condicional baseada em papéis e permissões
 * 
 * Útil para ocultar elementos específicos baseados no papel do usuário ou permissões,
 * especialmente para usuários como o network_manager que não devem ver informações
 * financeiras, de contratos ou negociações
 */
export function ConditionalRender({
  children,
  requiredRoles,
  requiredPermissions,
  hideForRoles,
  hideOnContractData = false,
  hideOnNegotiationData = false,
  hideOnFinancialData = false
}: ConditionalRenderProps) {
  const { hasRole, hasPermission, getUserRole } = useAuth()
  const currentRole = getUserRole()
  
  // Verificar se o usuário tem pelo menos um dos papéis requeridos
  if (requiredRoles && requiredRoles.length > 0) {
    if (!hasRole(requiredRoles)) return null
  }
  
  // Verificar se o usuário tem pelo menos uma das permissões requeridas
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAnyRequiredPermission = requiredPermissions.some(perm => hasPermission(perm))
    if (!hasAnyRequiredPermission) return null
  }
  
  // Verificar se o papel do usuário está na lista de papéis ocultos
  if (hideForRoles && hideForRoles.length > 0) {
    if (hasRole(hideForRoles)) return null
  }
  
  // Casos especiais para o network_manager
  if (currentRole === 'network_manager') {
    // Ocultar dados de contrato se especificado
    if (hideOnContractData) return null
    
    // Ocultar dados de negociação se especificado
    if (hideOnNegotiationData) return null
    
    // Ocultar dados financeiros se especificado
    if (hideOnFinancialData) return null
  }
  
  // Se passou por todas as verificações, renderizar o conteúdo
  return <>{children}</>
} 