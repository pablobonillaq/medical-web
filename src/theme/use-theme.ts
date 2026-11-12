'use client'

import { useCallback, useSyncExternalStore } from 'react'
import {
  applyTheme,
  readStoredTheme,
  storeTheme,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from './theme'

// Every component using the hook re-renders when the theme changes in this tab…
const listeners = new Set<() => void>()

const subscribe = (listener: () => void) => {
  listeners.add(listener)

  // …or in another tab of the same site
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return
    applyTheme(readStoredTheme())
    listener()
  }
  window.addEventListener('storage', onStorage)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

// The server does not know the saved theme: "system" matches the HTML it sends.
// After hydration React reads the real value from localStorage.
const getServerSnapshot = (): ThemePreference => 'system'

export const useTheme = () => {
  const theme = useSyncExternalStore(subscribe, readStoredTheme, getServerSnapshot)

  const setTheme = useCallback((preference: ThemePreference) => {
    storeTheme(preference)
    applyTheme(preference)
    listeners.forEach((listener) => {
      listener()
    })
  }, [])

  return [theme, setTheme] as const
}
