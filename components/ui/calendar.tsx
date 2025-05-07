"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Locale } from "date-fns"

export interface CalendarProps {
  mode?: "single" | "range" | "multiple"
  selected?: Date | Date[] | { from: Date; to: Date }
  onSelect?: (date: Date | undefined) => void
  className?: string
  disabled?: { before?: Date; after?: Date; dates?: Date[]; weekdays?: number[] }
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  showOutsideDays?: boolean
  locale?: Locale
  ISOWeek?: boolean
  fixedWeeks?: boolean
  defaultMonth?: Date
  month?: Date
  onMonthChange?: (date: Date) => void
}

function Calendar({
  className,
  mode = "single",
  selected,
  onSelect,
  disabled,
  weekStartsOn = 0,
  showOutsideDays = true,
  defaultMonth = new Date(),
  month: controlledMonth,
  onMonthChange,
  ...props
}: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(defaultMonth || new Date())
  
  React.useEffect(() => {
    if (controlledMonth) {
      setMonth(controlledMonth)
    }
  }, [controlledMonth])

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get day of week of first day in month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handlePrevMonth = () => {
    const prevMonth = new Date(month)
    prevMonth.setMonth(prevMonth.getMonth() - 1)
    setMonth(prevMonth)
    onMonthChange?.(prevMonth)
  }

  const handleNextMonth = () => {
    const nextMonth = new Date(month)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    setMonth(nextMonth)
    onMonthChange?.(nextMonth)
  }

  const handleDayClick = (day: number) => {
    if (!onSelect) return
    
    const newDate = new Date(month.getFullYear(), month.getMonth(), day)
    onSelect(newDate)
  }

  const isSelected = (day: number) => {
    if (!selected) return false
    
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    
    if (selected instanceof Date) {
      return date.toDateString() === selected.toDateString()
    }
    
    if (Array.isArray(selected)) {
      return selected.some(d => d.toDateString() === date.toDateString())
    }
    
    if ('from' in selected && 'to' in selected) {
      return (
        date >= selected.from && 
        date <= selected.to
      )
    }
    
    return false
  }

  const isToday = (day: number) => {
    const today = new Date()
    const date = new Date(month.getFullYear(), month.getMonth(), day)
    return date.toDateString() === today.toDateString()
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(month.getFullYear(), month.getMonth())
    const firstDayOfMonth = getFirstDayOfMonth(month.getFullYear(), month.getMonth())
    
    // Adjust for week start
    const adjustedFirstDay = (firstDayOfMonth - weekStartsOn + 7) % 7
    
    // Generate days array
    const days = []
    
    // Previous month days
    if (showOutsideDays) {
      const prevMonthDays = getDaysInMonth(
        month.getMonth() === 0 ? month.getFullYear() - 1 : month.getFullYear(),
        month.getMonth() === 0 ? 11 : month.getMonth() - 1
      )
      
      for (let i = 0; i < adjustedFirstDay; i++) {
        days.push({
          day: prevMonthDays - adjustedFirstDay + i + 1,
          isCurrentMonth: false,
          isPrevMonth: true
        })
      }
    } else {
      for (let i = 0; i < adjustedFirstDay; i++) {
        days.push({ day: 0, isCurrentMonth: false, isPrevMonth: true })
      }
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, isCurrentMonth: true, isPrevMonth: false })
    }
    
    // Next month days
    const remainingCells = 42 - days.length // 6 weeks * 7 days = 42
    
    if (showOutsideDays) {
      for (let i = 1; i <= remainingCells; i++) {
        days.push({ day: i, isCurrentMonth: false, isPrevMonth: false })
      }
    } else {
      for (let i = 1; i <= remainingCells; i++) {
        days.push({ day: 0, isCurrentMonth: false, isPrevMonth: false })
      }
    }
    
    return days
  }

  const days = renderCalendar()
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Adjust weekdays based on weekStartsOn
  const adjustedWeekDays = [
    ...weekDays.slice(weekStartsOn),
    ...weekDays.slice(0, weekStartsOn)
  ]

  return (
    <div className={cn("p-3", className)}>
      <div className="space-y-4">
        <div className="flex justify-center pt-1 relative items-center">
          <div className="text-sm font-medium">
            {monthNames[month.getMonth()]} {month.getFullYear()}
          </div>
          <div className="space-x-1 flex items-center">
            <Button
              variant="outline"
              className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
              onClick={handlePrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="w-full">
          <div className="flex">
            {adjustedWeekDays.map((day, i) => (
              <div
                key={i}
                className="text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 mt-2">
            {days.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "h-9 w-9 text-center text-sm p-0 relative",
                  day.isCurrentMonth ? "" : "text-muted-foreground opacity-50"
                )}
              >
                {day.day > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => day.isCurrentMonth && handleDayClick(day.day)}
                    className={cn(
                      "h-9 w-9 p-0 font-normal",
                      isSelected(day.day) && day.isCurrentMonth ? 
                        "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground" : "",
                      isToday(day.day) && day.isCurrentMonth ? "bg-accent text-accent-foreground" : ""
                    )}
                  >
                    {day.day}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
