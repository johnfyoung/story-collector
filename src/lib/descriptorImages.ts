export function parseImageValue(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean)
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) {
        return parsed
          .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
          .filter(Boolean)
      }
    } catch {
      // fall through to delimiter parsing
    }
    return trimmed
      .split(/[\n,]+/)
      .map((part) => part.trim())
      .filter(Boolean)
  }
  return []
}

export function stringifyImageValue(images: string[]): string {
  return images.length > 0 ? JSON.stringify(images) : ''
}
