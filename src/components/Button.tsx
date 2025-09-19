import { ButtonHTMLAttributes, type CSSProperties } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
}

export function Button({ variant = 'primary', style, ...rest }: Props) {
  const base: CSSProperties = {
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    padding: '8px 12px',
    fontSize: 'var(--font-md)',
    background: variant === 'primary' ? 'var(--color-primary)' : 'transparent',
    color: variant === 'primary' ? 'var(--color-primary-text)' : 'var(--color-text)',
    cursor: 'pointer',
  }
  return <button {...rest} style={{ ...base, ...style }} />
}
