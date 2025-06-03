import React from 'react';
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

interface DateInputProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function DateInput({ value, onChange, placeholder = "DD/MM/AAAA", className }: DateInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove caracteres não numéricos
    const cleaned = value.replace(/\D/g, '');
    
    // Formata a data automaticamente
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 4) {
      formatted = formatted.slice(0, 5) + '/' + cleaned.slice(5);
    }
    
    // Atualiza o valor do input
    e.target.value = formatted;
    
    // Se tiver 8 dígitos, tenta converter para data
    if (cleaned.length === 8) {
      const day = parseInt(cleaned.slice(0, 2));
      const month = parseInt(cleaned.slice(2, 4)) - 1;
      const year = parseInt(cleaned.slice(4, 8));
      const date = new Date(year, month, day);
      
      // Verifica se é uma data válida
      if (!isNaN(date.getTime())) {
        onChange(date);
      }
    }
  };

  return (
    <div className="flex space-x-2">
      <Input
        type="text"
        placeholder={placeholder}
        value={value ? format(new Date(value), 'dd/MM/yyyy') : ''}
        onChange={handleInputChange}
        maxLength={10}
        className={className}
      />
      <DatePicker 
        date={value} 
        setDate={onChange}
      />
    </div>
  );
}