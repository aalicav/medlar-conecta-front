"use client"

import * as React from "react"
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker'
import { ptBR } from '@mui/x-date-pickers/locales'
import dayjs, { Dayjs } from 'dayjs'
import 'dayjs/locale/pt-br'

interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

interface DatePickerWithRangeProps {
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
  date,
  onDateChange,
}: DatePickerWithRangeProps) {
  const [value, setValue] = React.useState<[Dayjs | null, Dayjs | null]>([
    date?.from ? dayjs(date.from) : null,
    date?.to ? dayjs(date.to) : null,
  ])

  const handleChange = (newValue: [Dayjs | null, Dayjs | null]) => {
    setValue(newValue)
    onDateChange({
      from: newValue[0]?.toDate(),
      to: newValue[1]?.toDate(),
    })
  }

  return (
    <LocalizationProvider 
      dateAdapter={AdapterDayjs} 
      adapterLocale="pt-br"
      localeText={ptBR.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      <DateRangePicker
        value={value}
        onChange={handleChange}
        slotProps={{
          textField: { size: 'small' },
          fieldSeparator: { children: 'até' },
        }}
        sx={{
          '& .MuiInputBase-root': {
            borderRadius: '6px',
            backgroundColor: 'white',
          },
        }}
      />
    </LocalizationProvider>
  )
} 