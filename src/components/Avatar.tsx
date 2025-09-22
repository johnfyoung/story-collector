import { useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import {
  uploadImage as uploadLocalImage,
  isCloudinaryConfigured,
  openCloudinaryUploadWidget,
} from '../lib/assets'

export function Avatar({ name, url, size = 56, editable = false, onChange }: { name: string; url?: string; size?: number; editable?: boolean; onChange?: (nextUrl: string) => void }) {
  const { user } = useAuth()
  const [hover, setHover] = useState(false)
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const letter = (name?.trim()?.[0] || '?').toUpperCase()

  const canUseCloudinary = isCloudinaryConfigured()

  async function pickFile() {
    if (!editable || busy) return
    if (canUseCloudinary) {
      setBusy(true)
      try {
        const uploaded = await openCloudinaryUploadWidget(user?.$id)
        if (uploaded?.href) {
          onChange?.(uploaded.href)
        }
      } catch (error) {
        console.error('Failed to upload image with Cloudinary widget', error)
      } finally {
        setBusy(false)
      }
      return
    }
    inputRef.current?.click()
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.currentTarget.files?.[0]
    if (!f) return
    setBusy(true)
    try {
      const { href } = await uploadLocalImage(f)
      onChange?.(href)
    } finally {
      setBusy(false)
      e.currentTarget.value = ''
    }
  }

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
    <div
      style={style}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={pickFile}
      title={editable ? (busy ? 'Uploading…' : 'Change avatar') : undefined}
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
      <div style={overlay}>{busy ? 'Uploading…' : '✎'}</div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileChange} />
    </div>
  )
}
