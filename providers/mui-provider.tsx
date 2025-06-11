'use client'

import { ThemeProvider } from '@mui/material/styles'
import { theme } from '@/lib/mui-theme'

export function MUIProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  )
} 