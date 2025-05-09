import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Formata uma data utilizando date-fns com locale pt-BR
 */
export function formatDate(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
  if (!date) return ''
  
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, formatStr, { locale: ptBR })
}

/**
 * Formata um valor monetário
 */
export function formatMoney(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata percentuais
 */
export function formatPercent(value: number, fractionDigits: number = 1): string {
  return `${value.toFixed(fractionDigits)}%`
}

/**
 * Trunca um texto para o tamanho especificado
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
} 