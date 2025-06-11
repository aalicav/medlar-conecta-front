"use client"

import * as React from "react"
import { cn } from "@/utils/cn"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export interface CalendarProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  className?: string
  disabled?: boolean
}

function Calendar({
  value,
  onChange,
  className,
  disabled = false,
}: CalendarProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined
    onChange?.(newDate)
  }

  const formatDateForInput = (date?: Date) => {
    if (!date) return ""
    return date.toISOString().split('T')[0]
  }

  return (
    <div className={cn("grid w-full items-center gap-1.5", className)}>
      <Input
        type="date"
        value={formatDateForInput(value)}
        onChange={handleDateChange}
        disabled={disabled}
        className="w-full"
      />
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
