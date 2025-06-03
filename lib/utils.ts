import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return '';
    
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function formatPhone(phone: string): string {
  return phone.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
}

export function formatCEP(cep: string): string {
  return cep.replace(/(\d{5})(\d{3})/, "$1-$2");
}

export function removeSpecialCharacters(text: string): string {
  return text.replace(/[^a-zA-Z0-9]/g, "");
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
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
