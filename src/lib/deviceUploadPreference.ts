export function shouldPreferDeviceUpload(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const nav = window.navigator as Navigator & { msMaxTouchPoints?: number }
  if (typeof nav.maxTouchPoints === 'number' && nav.maxTouchPoints > 1) {
    return true
  }

  if (typeof nav.msMaxTouchPoints === 'number' && nav.msMaxTouchPoints > 1) {
    return true
  }

  if ('ontouchstart' in window) {
    return true
  }

  if (typeof window.matchMedia === 'function') {
    try {
      if (window.matchMedia('(pointer: coarse)').matches) {
        return true
      }
    } catch {
      // Ignore matchMedia errors (older browsers or SSR environments)
    }
  }

  return false
}
