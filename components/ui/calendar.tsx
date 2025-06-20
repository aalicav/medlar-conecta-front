"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface CalendarProps {
  mode?: "single"
  selected?: Date | undefined
  onSelect?: (date: Date | undefined) => void
  className?: string
  disabled?: (date: Date) => boolean
  locale?: any
}

function Calendar({
  selected,
  onSelect,
  className,
  disabled,
  ...props
}: CalendarProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value ? new Date(e.target.value) : undefined
    onSelect?.(newDate)
  }

  const formatDateForInput = (date?: Date) => {
    if (!date) return ""
    return date.toISOString().split('T')[0]
  }

  return (
    <div className={cn("p-3", className)}>
      <Input
        type="date"
        value={formatDateForInput(selected)}
        onChange={handleDateChange}
        className="w-full"
        {...props}
      />
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
