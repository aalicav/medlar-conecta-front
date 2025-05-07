/**
 * Utility functions for formatting and masking Brazilian data formats
 */

/**
 * Formats a CNPJ number (Brazilian company ID)
 * Input: raw numbers (14 digits)
 * Output: formatted CNPJ (XX.XXX.XXX/XXXX-XX)
 */
export function formatCNPJ(cnpj: string): string {
  cnpj = cnpj.replace(/\D/g, '') // Remove all non-digits
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

/**
 * Formats a CPF number (Brazilian individual ID)
 * Input: raw numbers (11 digits)
 * Output: formatted CPF (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string): string {
  cpf = cpf.replace(/\D/g, '') // Remove all non-digits
  return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
}

/**
 * Formats a Brazilian phone number
 * Input: raw numbers (10 or 11 digits)
 * Output: formatted phone based on length:
 * - 10 digits (landline): (XX) XXXX-XXXX
 * - 11 digits (mobile): (XX) XXXXX-XXXX
 */
export function formatPhone(phone: string): string {
  phone = phone.replace(/\D/g, '') // Remove all non-digits
  
  if (phone.length === 10) {
    // Landline format
    return phone.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  } else if (phone.length === 11) {
    // Mobile format
    return phone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  }
  
  // Return original if not matching expected lengths
  return phone
}

/**
 * Formats a Brazilian CEP (postal code)
 * Input: raw numbers (8 digits)
 * Output: formatted CEP (XXXXX-XXX)
 */
export function formatCEP(cep: string): string {
  cep = cep.replace(/\D/g, '') // Remove all non-digits
  return cep.replace(/^(\d{5})(\d{3})$/, '$1-$2')
}

/**
 * Mask for CEP (postal code) - Alternative version for direct component use
 * @param value Value to mask as CEP
 * @returns Masked CEP string (XXXXX-XXX)
 */
export function maskCEP(value: string): string {
  const digits = value.replace(/\D/g, '')
  return digits
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 9)
}

/**
 * Apply CNPJ mask to input value (for use in controlled inputs)
 * @param value Current input value
 * @returns Masked CNPJ value
 */
export function applyCNPJMask(value: string): string {
  value = value.replace(/\D/g, '')
  value = value.replace(/^(\d{2})(\d)/, '$1.$2')
  value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  value = value.replace(/\.(\d{3})(\d)/, '.$1/$2')
  value = value.replace(/(\d{4})(\d)/, '$1-$2')
  return value
}

/**
 * Apply municipal registration mask to input value (for use in controlled inputs)
 * @param value Current input value
 * @returns Masked municipal registration value
 */
export function applyMunicipalRegistrationMask(value: string): string {
  value = unmask(value)
  
  // Format depends on the city, using a generic format: XXX.XXX.XXX-XX
  if (value.length <= 9) {
    value = value.replace(/^(\d{3})(\d)/g, '$1.$2')
    value = value.replace(/^(\d{3})\.(\d{3})(\d)/g, '$1.$2.$3')
  } else {
    value = value.replace(/^(\d{3})(\d)/g, '$1.$2')
    value = value.replace(/^(\d{3})\.(\d{3})(\d)/g, '$1.$2.$3')
    value = value.replace(/\.(\d{3})(\d)/g, '.$1-$2')
  }
  
  return value
}

/**
 * Apply CPF mask to input value (for use in controlled inputs)
 * @param value Current input value
 * @returns Masked CPF value
 */
export function applyCPFMask(value: string): string {
  value = value.replace(/\D/g, '')
  value = value.replace(/^(\d{3})(\d)/, '$1.$2')
  value = value.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
  value = value.replace(/\.(\d{3})(\d)/, '.$1-$2')
  return value
}

/**
 * Apply phone mask to input value (for use in controlled inputs)
 * @param value Current input value
 * @returns Masked phone value
 */
export function applyPhoneMask(value: string): string {
  value = value.replace(/\D/g, '')
    
  if (value.length <= 10) {
    // Landline format
    value = value.replace(/^(\d{2})(\d)/, '($1) $2')
    value = value.replace(/(\d)(\d{4})$/, '$1-$2')
  } else {
    // Mobile format
    value = value.replace(/^(\d{2})(\d)/, '($1) $2')
    value = value.replace(/(\d)(\d{4})$/, '$1-$2')
  }
  
  return value
}

/**
 * Apply CEP mask to input value (for use in controlled inputs)
 * @param value Current input value
 * @returns Masked CEP value
 */
export function applyCEPMask(value: string): string {
  value = value.replace(/\D/g, '')
  value = value.replace(/^(\d{5})(\d)/, '$1-$2')
  return value
}

/**
 * Format a monetary value in Brazilian Real (R$)
 * @param value Number to format
 * @returns Formatted value (e.g., R$ 1.234,56)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Format a date in Brazilian format (DD/MM/YYYY)
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

/**
 * Removes all non-digit characters from a string
 * @param value String to be unmasked
 * @returns String containing only digits
 */
export function unmask(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Apply currency mask for input fields
 * @param value Current input value
 * @returns Formatted currency string
 */
export function applyCurrencyMask(value: string): string {
  value = unmask(value)
  
  if (value === '') return ''
  
  // Convert to number and format as currency
  const valueAsNumber = parseInt(value, 10) / 100
  
  // Format with 2 decimal places
  return valueAsNumber.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
} 