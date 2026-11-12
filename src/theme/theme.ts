export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]

export const THEME_STORAGE_KEY = 'theme'

export const isThemePreference = (value: unknown): value is ThemePreference =>
  THEME_PREFERENCES.some((preference) => preference === value)

// "light" and "dark" set data-theme on <html>. "system" removes it, so the CSS follows the
// operating system (see color-scheme in globals.css).
export const applyTheme = (preference: ThemePreference) => {
  const root = document.documentElement
  if (preference === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', preference)
}

// localStorage can be unavailable (private mode, blocked storage): then the system theme is used
export const readStoredTheme = (): ThemePreference => {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(stored) ? stored : 'system'
  } catch {
    return 'system'
  }
}

export const storeTheme = (preference: ThemePreference) => {
  try {
    if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Not saved: the choice still applies until the page is reloaded
  }
}

// Runs in <head> before the first paint, so a saved theme never flashes. It repeats the logic of
// readStoredTheme() and applyTheme() as plain JavaScript, because it runs before React loads.
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`
