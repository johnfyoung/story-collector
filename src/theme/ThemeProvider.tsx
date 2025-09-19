import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { darkTheme, lightTheme, type ThemeTokens } from './tokens'

type ThemeContextValue = {
  theme: ThemeTokens
  setMode: (mode: 'light' | 'dark') => void
  toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function applyCssVars(tokens: ThemeTokens) {
  const root = document.documentElement
  root.style.setProperty('--color-bg', tokens.colors.bg)
  root.style.setProperty('--color-surface', tokens.colors.surface)
  root.style.setProperty('--color-text', tokens.colors.text)
  root.style.setProperty('--color-text-muted', tokens.colors.textMuted)
  root.style.setProperty('--color-primary', tokens.colors.primary)
  root.style.setProperty('--color-primary-text', tokens.colors.primaryText)
  root.style.setProperty('--color-border', tokens.colors.border)
  root.style.setProperty('--radius-sm', tokens.radius.sm)
  root.style.setProperty('--radius-md', tokens.radius.md)
  root.style.setProperty('--radius-lg', tokens.radius.lg)
  root.style.setProperty('--font-sm', tokens.fontSize.sm)
  root.style.setProperty('--font-md', tokens.fontSize.md)
  root.style.setProperty('--font-lg', tokens.fontSize.lg)
  root.style.setProperty('--font-xl', tokens.fontSize.xl)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>(() => (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))

  const theme = useMemo(() => (mode === 'dark' ? darkTheme : lightTheme), [mode])

  useEffect(() => {
    applyCssVars(theme)
    document.documentElement.dataset.theme = theme.name
  }, [theme])

  const setThemeMode = useCallback((m: 'light' | 'dark') => setMode(m), [])
  const toggle = useCallback(() => setMode((m) => (m === 'light' ? 'dark' : 'light')), [])

  const value = useMemo<ThemeContextValue>(() => ({ theme, setMode: setThemeMode, toggle }), [theme, setThemeMode, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

