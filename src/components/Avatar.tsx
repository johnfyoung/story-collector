import { useState } from 'react'
import { ImagePicker } from './ImagePicker'

export function Avatar({
  name,
  url,
  size = 56,
  editable = false,
  onChange,
  availableImages = [],
}: {
  name: string
  url?: string
  size?: number
  editable?: boolean
  onChange?: (nextUrl: string) => void
  availableImages?: string[]
}) {
  const [hover, setHover] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const letter = (name?.trim()?.[0] || '?').toUpperCase()

  const handleClick = () => {
    if (!editable) return
    setShowPicker(true)
  }

  const handleImageSelect = (selectedUrl: string) => {
    onChange?.(selectedUrl)
    setShowPicker(false)
  }

  // Combine current avatar URL with available images (deduplicated)
  const allAvailableImages = (() => {
    const images = [...availableImages]
    if (url && !images.includes(url)) {
      images.unshift(url) // Add current avatar at the beginning
    }
    return images
  })()

  const style: React.CSSProperties = {
    position: 'relative',
    width: size,
    height: size,
    borderRadius: 8,
    background: '#111827',
    color: '#fff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    userSelect: 'none',
    overflow: 'hidden',
    border: '1px solid var(--color-border)',
    cursor: editable ? 'pointer' : 'default',
  }

  const overlay: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: editable && hover ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.35)',
    fontSize: 12,
    cursor: 'pointer',
  }

  return (
    <>
      <div
        style={style}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={handleClick}
        title={editable ? 'Change avatar' : undefined}
      >
        {url ? (
          <img
            src={url}
            alt={name ? `${name} avatar` : 'Avatar'}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span aria-hidden>{letter}</span>
        )}
        <div style={overlay}>✎</div>
      </div>

      {showPicker && (
        <ImagePicker
          availableImages={allAvailableImages}
          onSelect={handleImageSelect}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}
