export type ThemeTokens = {
  name: 'light' | 'dark'
  colors: {
    bg: string
    surface: string
    text: string
    textMuted: string
    primary: string
    primaryText: string
    border: string
  }
  radius: {
    sm: string
    md: string
    lg: string
  }
  spacing: (n: number) => string
  fontSize: {
    sm: string
    md: string
    lg: string
    xl: string
  }
}

export const lightTheme: ThemeTokens = {
  name: 'light',
  colors: {
    bg: '#ffffff',
    surface: '#f6f7f9',
    text: '#1f2937',
    textMuted: '#6b7280',
    primary: '#2563eb',
    primaryText: '#ffffff',
    border: '#e5e7eb',
  },
  radius: { sm: '6px', md: '10px', lg: '14px' },
  spacing: (n: number) => `${n * 8}px`,
  fontSize: { sm: '12px', md: '14px', lg: '16px', xl: '20px' },
}

export const darkTheme: ThemeTokens = {
  name: 'dark',
  colors: {
    bg: '#0b1020',
    surface: '#12172a',
    text: '#e5e7eb',
    textMuted: '#9ca3af',
    primary: '#60a5fa',
    primaryText: '#0b1020',
    border: '#1f2937',
  },
  radius: { sm: '6px', md: '10px', lg: '14px' },
  spacing: (n: number) => `${n * 8}px`,
  fontSize: { sm: '12px', md: '14px', lg: '16px', xl: '20px' },
}

