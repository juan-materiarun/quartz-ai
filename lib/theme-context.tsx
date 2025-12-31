'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type Theme = 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Initialize with default theme, will be updated from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('quartz-theme') as Theme | null
      if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        return savedTheme
      }
    }
    return 'dark'
  })
  const [mounted, setMounted] = useState(false)

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('quartz-theme') as Theme | null
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setThemeState(savedTheme)
    }
    setMounted(true)
  }, [])

  // Apply theme class to document
  useEffect(() => {
    if (mounted) {
      const html = document.documentElement
      html.classList.remove('dark', 'light')
      if (theme === 'dark') {
        html.classList.add('dark')
      } else {
        html.classList.add('light')
      }
    }
  }, [theme, mounted])

  // Save theme to localStorage when it changes
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('quartz-theme', newTheme)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

