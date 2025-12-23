import { type CSSProperties } from 'react'

export function Scale({
  label,
  max,
  value,
  onChange,
  readOnly,
}: {
  label: string
  max: number
  value: number | string | undefined
  onChange?: (v: number) => void
  readOnly?: boolean
}) {
  const active = typeof value === 'string' ? parseInt(value || '0', 10) : (value ?? 0)
  const items = Array.from({ length: max }, (_, i) => i + 1)
  const wrap: CSSProperties = { display: 'flex', alignItems: 'center', gap: 8 }
  const dot = (i: number): CSSProperties => ({
    width: 20, height: 20, borderRadius: 10,
    border: '1px solid var(--color-border)', cursor: readOnly ? 'default' : 'pointer',
    background: i <= active ? 'var(--color-primary)' : 'transparent'
  })
  return (
    <div>
      <div style={{ color: 'var(--color-text)', marginBottom: 6 }}>{label}</div>
      <div style={wrap}>
        {items.map((i) => (
          <div
            key={i}
            title={String(i)}
            style={dot(i)}
            onClick={() => {
              if (readOnly) return
              onChange?.(i)
            }}
          />
        ))}
        <div style={{ color: 'var(--color-text-muted)', marginLeft: 8 }}>{active || 0}/{max}</div>
      </div>
    </div>
  )
}
