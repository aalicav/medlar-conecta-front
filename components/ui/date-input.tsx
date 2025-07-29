import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { format, parse, isValid } from "date-fns";

interface DateInputProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
}

export function DateInput({ value, onChange, placeholder = "DD/MM/AAAA", className }: DateInputProps) {
  const [inputValue, setInputValue] = useState<string>('');

  // Sincroniza o input com o valor da prop
  useEffect(() => {
    if (value) {
      setInputValue(format(value, 'dd/MM/yyyy'));
    } else {
      setInputValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const rawValue = e.target.value;
    
    // Remove caracteres não numéricos
    const cleaned = rawValue.replace(/\D/g, '');
    
    // Limita a 8 dígitos (DDMMAAAA)
    const limited = cleaned.slice(0, 8);
    
    // Formata a data automaticamente
    let formatted = limited;
    if (limited.length >= 3) {
      formatted = limited.slice(0, 2) + '/' + limited.slice(2);
    }
    if (limited.length >= 5) {
      formatted = formatted.slice(0, 5) + '/' + limited.slice(4);
    }
    
    // Atualiza o estado do input
    setInputValue(formatted);
    
    // Se tiver 8 dígitos, tenta converter para data
    if (limited.length === 8) {
      const day = limited.slice(0, 2);
      const month = limited.slice(2, 4);
      const year = limited.slice(4, 8);
      
      // Tenta fazer o parse da data
      const dateString = `${day}/${month}/${year}`;
      const parsedDate = parse(dateString, 'dd/MM/yyyy', new Date());
      
      // Verifica se é uma data válida
      if (isValid(parsedDate)) {
        onChange(parsedDate);
      } else {
        // Se a data for inválida, limpa o valor
        onChange(null);
      }
    } else if (limited.length === 0) {
      // Se o input estiver vazio, limpa a data
      onChange(null);
    }
  };

  const handleDatePickerChange = (date: Date | null): void => {
    onChange(date);
  };

  return (
    <div className="flex space-x-2">
      <Input
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        maxLength={10}
        className={className}
      />
      <DatePicker 
        date={value} 
        setDate={handleDatePickerChange}
      />
    </div>
  );
}