/**
 * Utility functions for formatting and unformatting input values
 */

// Remove all non-numeric characters
export const unmask = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Format CPF: 000.000.000-00
export const maskCPF = (value: string): string => {
  const digits = unmask(value);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .substring(0, 14);
};

// Format phone: (00) 00000-0000 or (00) 0000-0000
export const maskPhone = (value: string): string => {
  const digits = unmask(value);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 14);
  }
  return digits
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15);
};

// Format CEP: 00000-000
export const maskCEP = (value: string): string => {
  const digits = unmask(value);
  return digits
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 9);
}; 