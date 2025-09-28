import { useMemo, useRef, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import {
  isCloudinaryConfigured,
  openCloudinaryUploadWidget,
  uploadImage,
} from '../lib/assets'
import { shouldPreferDeviceUpload } from '../lib/deviceUploadPreference'
import { parseImageValue, stringifyImageValue } from '../lib/descriptorImages'

export function ImagesField({
  label,
  value,
  onChange,
  mainImageUrl,
}: {
  label: string
  value: string
  onChange: (nextValue: string) => void
  mainImageUrl?: string
}) {
  const { user } = useAuth()
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const storedImages = useMemo(() => parseImageValue(value), [value])
  const combinedImages = useMemo(() => {
    const unique = new Set<string>()
    const items: Array<{ url: string; isMain: boolean }> = []
    const addImage = (url: string, isMain: boolean) => {
      const clean = url.trim()
      if (!clean || unique.has(clean)) return
      unique.add(clean)
      items.push({ url: clean, isMain })
    }
    if (mainImageUrl) addImage(mainImageUrl, true)
    for (const url of storedImages) addImage(url, false)
    return items
  }, [mainImageUrl, storedImages])

  const canUseCloudinary = isCloudinaryConfigured()

  const updateImages = (next: string[]) => {
    onChange(stringifyImageValue(next))
  }

  const handleWidgetUpload = async () => {
    setBusy(true)
    try {
      const uploaded = await openCloudinaryUploadWidget(user?.$id)
      if (uploaded?.href) {
        updateImages([...storedImages, uploaded.href])
      }
    } catch (error) {
      console.error('Failed to upload image with Cloudinary widget', error)
    } finally {
      setBusy(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setBusy(true)
    try {
      const { href } = await uploadImage(file, user?.$id)
      updateImages([...storedImages, href])
    } catch (error) {
      console.error('Failed to upload image from device', error)
    } finally {
      setBusy(false)
    }
  }

  const startUpload = () => {
    if (busy) return
    const preferDevice = canUseCloudinary && shouldPreferDeviceUpload()
    if (canUseCloudinary && !preferDevice) {
      void handleWidgetUpload()
      return
    }
    fileInputRef.current?.click()
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    if (file) {
      void handleFileUpload(file)
    }
    event.currentTarget.value = ''
  }

  const removeImage = (url: string) => {
    updateImages(storedImages.filter((img) => img !== url))
  }

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto', color: 'var(--color-text)' }}>{label}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={startUpload}
            disabled={busy}
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface)',
              color: 'var(--color-text)',
              padding: '6px 10px',
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? 'Uploading…' : 'Upload image'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onFileChange}
          />
        </div>
      </div>
      {combinedImages.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-sm)' }}>
          No images yet. Use “Upload image” to add one.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {combinedImages.map((img) => (
            <div
              key={img.url}
              style={{
                position: 'relative',
                width: 96,
                height: 96,
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
              }}
            >
              <img
                src={img.url}
                alt={img.isMain ? 'Main image' : 'Supporting image'}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {img.isMain ? (
                <div
                  style={{
                    position: 'absolute',
                    left: 4,
                    top: 4,
                    padding: '2px 4px',
                    background: 'rgba(17,24,39,0.75)',
                    color: '#fff',
                    fontSize: 10,
                    borderRadius: 3,
                  }}
                >
                  Main image
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => removeImage(img.url)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    border: 'none',
                    borderRadius: 999,
                    width: 20,
                    height: 20,
                    background: 'rgba(17,24,39,0.8)',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                  title="Remove image"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
