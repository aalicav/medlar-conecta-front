import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

/**
 * Format a date string to a localized date format (day/month/year)
 */
export function formatDate(dateString: string): string {
  try {
    if (!dateString) return "N/A"
    
    const date = typeof dateString === "string" 
      ? parseISO(dateString) 
      : new Date(dateString)
      
    return format(date, "dd/MM/yyyy", { locale: ptBR })
  } catch (error) {
    console.error("Error formatting date:", error)
    return dateString || "N/A"
  }
}

/**
 * Format a date string to a localized date and time format
 */
export function formatDateTime(dateString: string): string {
  try {
    if (!dateString) return "N/A"
    
    const date = typeof dateString === "string" 
      ? parseISO(dateString) 
      : new Date(dateString)
      
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch (error) {
    console.error("Error formatting datetime:", error)
    return dateString || "N/A"
  }
}

/**
 * Format a date to return only time
 */
export function formatTime(dateString: string): string {
  try {
    if (!dateString) return "N/A"
    
    const date = typeof dateString === "string" 
      ? parseISO(dateString) 
      : new Date(dateString)
      
    return format(date, "HH:mm", { locale: ptBR })
  } catch (error) {
    console.error("Error formatting time:", error)
    return "N/A"
  }
}

/**
 * Format a date relative to current date (e.g. "2 days ago", "in 3 hours")
 */
export function formatRelative(dateString: string): string {
  try {
    if (!dateString) return "N/A"
    
    const date = typeof dateString === "string" 
      ? parseISO(dateString) 
      : new Date(dateString)
      
    return format(date, "PPp", { locale: ptBR })
  } catch (error) {
    console.error("Error formatting relative date:", error)
    return dateString || "N/A"
  }
} 