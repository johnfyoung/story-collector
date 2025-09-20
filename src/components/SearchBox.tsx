import { useMemo, useState } from 'react'

export function SearchBox({ value, onChange, suggestions, placeholder }: { value: string; onChange: (v: string) => void; suggestions: string[]; placeholder?: string }) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(0)
  const matches = useMemo(() => {
    const q = value.trim().toLowerCase()
    if (!q) return []
    return suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 8)
  }, [value, suggestions])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || matches.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setSelected((i) => (i + 1) % matches.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setSelected((i) => (i - 1 + matches.length) % matches.length)
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault(); onChange(matches[selected]); setOpen(false)
    } else if (e.key === 'Escape') {
      e.preventDefault(); setOpen(false)
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.currentTarget.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%', padding: '10px 12px',
          border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)',
          background: 'transparent', color: 'var(--color-text)'
        }}
      />
      {open && matches.length > 0 ? (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', zIndex: 30, border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-bg)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          {matches.map((m, i) => (
            <div
              key={m}
              onMouseDown={(e) => { e.preventDefault(); onChange(m); setOpen(false) }}
              style={{ padding: '6px 8px', cursor: 'pointer', background: i === selected ? 'var(--color-surface)' : 'transparent', color: 'var(--color-text)' }}
            >{m}</div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

