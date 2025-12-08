import { useEffect } from 'react'

export function ImageModal({
  imageUrl,
  alt = 'Image',
  onClose,
}: {
  imageUrl: string
  alt?: string
  onClose: () => void
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  }

  const imageContainerStyle: React.CSSProperties = {
    position: 'relative',
    maxWidth: '90vw',
    maxHeight: '90vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const imageStyle: React.CSSProperties = {
    maxWidth: '100%',
    maxHeight: '90vh',
    objectFit: 'contain',
    borderRadius: 'var(--radius-md)',
  }

  const closeButtonStyle: React.CSSProperties = {
    position: 'absolute',
    top: -40,
    right: 0,
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: 32,
    cursor: 'pointer',
    padding: 8,
    lineHeight: 1,
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={imageContainerStyle} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          style={closeButtonStyle}
          title="Close (Esc)"
        >
          ×
        </button>
        <img src={imageUrl} alt={alt} style={imageStyle} />
      </div>
    </div>
  )
}
