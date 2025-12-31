'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { Button } from '@/components/ui/button'

export function ThemeSelector() {
  const { theme, toggleTheme } = useTheme()

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="sm"
      className="h-9 px-3 text-sm text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] dark:text-[#94a3b8] dark:hover:text-white dark:hover:bg-[#1e293b] transition-all duration-300"
      title={theme === 'dark' ? 'Switch to Light Theme' : 'Cambiar a Tema Oscuro'}
    >
      {theme === 'dark' ? (
        <>
          <Sun className="h-4 w-4 mr-2" />
          <span>Light</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 mr-2" />
          <span>Dark</span>
        </>
      )}
    </Button>
  )
}

