import { type CSSProperties, type ReactNode, type MouseEvent } from 'react'

export function Card({ children, style, onClick }: { children: ReactNode; style?: CSSProperties; onClick?: (e: MouseEvent<HTMLDivElement>) => void }) {
  const base: CSSProperties = {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px',
    cursor: onClick ? 'pointer' as const : 'default',
  }
  return (
    <div style={{ ...base, ...style }} onClick={onClick}>
      {children}
    </div>
  )
}
