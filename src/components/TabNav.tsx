import { Link } from 'react-router-dom'

type Tab = { label: string; to: string }

export function TabNav({ active, storyId }: { active: 'characters' | 'groups' | 'locations' | 'species' | 'items' | 'languages' | 'plot-lines'; storyId: string }) {
  const tabs: Tab[] = [
    { label: 'Characters', to: `/stories/${storyId}/characters` },
    { label: 'Groups', to: `/stories/${storyId}/groups` },
    { label: 'Locations', to: `/stories/${storyId}/locations` },
    { label: 'Species', to: `/stories/${storyId}/species` },
    { label: 'Items', to: `/stories/${storyId}/items` },
    { label: 'Languages', to: `/stories/${storyId}/languages` },
    { label: 'Plot lines', to: `/stories/${storyId}/plot-lines` },
  ]

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)', marginBottom: 12 }}>
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          rowGap: 8,
        }}
      >
        {tabs.map((t) => {
          const isActive = t.to.endsWith(active)
          return (
            <Link
              key={t.label}
              to={t.to}
              style={{
                padding: '8px 12px',
                textDecoration: 'none',
                color: isActive ? 'var(--color-primary-text)' : 'var(--color-text)',
                background: isActive ? 'var(--color-primary)' : 'transparent',
                border: '1px solid var(--color-border)',
                borderBottomColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                flex: '1 1 140px',
                minWidth: 120,
                textAlign: 'center',
              }}
            >
              {t.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

