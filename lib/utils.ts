import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export function formatDateTime(date: string | Date) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

/**
 * Converte um caminho de armazenamento local (/storage/...) em uma URL completa
 * apontando para o servidor de produção
 * 
 * @param storagePath Caminho que começa com /storage/ ou path relativo
 * @returns URL completa para o arquivo no servidor de produção
 */
export function getStorageUrl(storagePath: string | null | undefined): string {
  if (!storagePath) return '';
  
  // Se o caminho já for uma URL completa, retorne-a como está
  if (storagePath.startsWith('http')) {
    return storagePath;
  }
  
  // Remover possíveis barras duplicadas e remover a barra inicial se houver
  const cleanPath = storagePath.replace(/^\/+/, '').replace(/\/+/g, '/');
  
  // Se o caminho começar com "storage/", remover para evitar duplicação
  const finalPath = cleanPath.startsWith('storage/') 
    ? cleanPath.replace('storage/', '') 
    : cleanPath;
    
  // Transformar no formato esperado para o servidor de produção
  return `https://blueviolet-hummingbird-768195.hostingersite.com/storage/app/public/${finalPath}`;
}
