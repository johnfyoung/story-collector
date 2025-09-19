import { ButtonHTMLAttributes, type CSSProperties } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement>

export function IconButton({ children, style, ...rest }: Props) {
  const base: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    padding: 6,
    background: 'transparent',
    color: 'var(--color-text)',
    cursor: 'pointer',
  }
  return (
    <button aria-label="icon" {...rest} style={{ ...base, ...style }}>
      {children}
    </button>
  )
}
