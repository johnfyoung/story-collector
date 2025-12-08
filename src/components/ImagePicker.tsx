import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import {
  uploadImage,
  isCloudinaryConfigured,
  openCloudinaryUploadWidget,
} from '../lib/assets'
import { shouldPreferDeviceUpload } from '../lib/deviceUploadPreference'

export function ImagePicker({
  availableImages = [],
  onSelect,
  onClose,
}: {
  availableImages?: string[]
  onSelect: (url: string) => void
  onClose: () => void
}) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canUseCloudinary = isCloudinaryConfigured()

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleUploadNew = async () => {
    if (busy) return
    const preferDevice = canUseCloudinary && shouldPreferDeviceUpload()

    if (canUseCloudinary && !preferDevice) {
      setBusy(true)
      try {
        const uploaded = await openCloudinaryUploadWidget(user?.$id)
        if (uploaded?.href) {
          onSelect(uploaded.href)
        }
      } catch (error) {
        console.error('Failed to upload image with Cloudinary widget', error)
      } finally {
        setBusy(false)
      }
      return
    }
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const { href } = await uploadImage(file, user?.$id)
      onSelect(href)
    } catch (error) {
      console.error('Failed to upload image from device', error)
    } finally {
      setBusy(false)
      e.currentTarget.value = ''
    }
  }

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 20,
  }

  const modalStyle: React.CSSProperties = {
    background: 'var(--color-surface)',
    borderRadius: 'var(--radius-md)',
    maxWidth: 600,
    maxHeight: '80vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid var(--color-border)',
  }

  const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 'var(--font-lg)',
    fontWeight: 600,
    color: 'var(--color-text)',
  }

  const closeButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-text)',
    fontSize: 24,
    cursor: 'pointer',
    padding: 4,
    lineHeight: 1,
  }

  const contentStyle: React.CSSProperties = {
    padding: 20,
    overflowY: 'auto',
    flex: 1,
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: 12,
  }

  const imageCardStyle: React.CSSProperties = {
    width: '100%',
    paddingBottom: '100%',
    position: 'relative',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    border: '1px solid var(--color-border)',
    cursor: 'pointer',
    background: 'var(--color-surface)',
  }

  const imageStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  }

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={titleStyle}>Choose an image</div>
          <button
            type="button"
            onClick={onClose}
            style={closeButtonStyle}
            title="Close (Esc)"
          >
            ×
          </button>
        </div>
        <div style={contentStyle}>
          {availableImages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
              No images available. Upload a new one below.
            </div>
          ) : (
            <div style={gridStyle}>
              {availableImages.map((url) => (
                <div
                  key={url}
                  style={imageCardStyle}
                  onClick={() => onSelect(url)}
                  title="Select this image"
                >
                  <img src={url} alt="Available image" style={imageStyle} />
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: availableImages.length > 0 ? 20 : 0 }}>
            <button
              type="button"
              onClick={handleUploadNew}
              disabled={busy}
              style={{
                width: '100%',
                padding: 12,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-primary)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              {busy ? 'Uploading…' : '+ Upload new image'}
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
