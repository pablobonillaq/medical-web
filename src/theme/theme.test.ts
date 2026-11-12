import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyTheme,
  isThemePreference,
  readStoredTheme,
  storeTheme,
  THEME_STORAGE_KEY,
  themeScript,
} from './theme'

const root = document.documentElement

// localStorage that throws, as in some private windows or with storage blocked
const breakStorage = () => {
  const error = () => {
    throw new Error('Storage is disabled')
  }
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(error)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(error)
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(error)
}

afterEach(() => {
  localStorage.clear()
  root.removeAttribute('data-theme')
})

describe('isThemePreference', () => {
  it('accepts only the three options', () => {
    expect(['light', 'dark', 'system'].every(isThemePreference)).toBe(true)
    expect(isThemePreference('blue')).toBe(false)
    expect(isThemePreference(null)).toBe(false)
  })
})

describe('applyTheme', () => {
  it('sets data-theme for light and dark, and removes it for system', () => {
    applyTheme('dark')
    expect(root.dataset.theme).toBe('dark')

    applyTheme('light')
    expect(root.dataset.theme).toBe('light')

    applyTheme('system')
    expect(root).not.toHaveAttribute('data-theme')
  })
})

describe('readStoredTheme and storeTheme', () => {
  it('saves light and dark, and forgets the choice for system', () => {
    storeTheme('dark')
    expect(readStoredTheme()).toBe('dark')

    storeTheme('system')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    expect(readStoredTheme()).toBe('system')
  })

  it('uses the system theme when the saved value is not valid', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'blue')

    expect(readStoredTheme()).toBe('system')
  })

  it('keeps working when localStorage is not available', () => {
    breakStorage()

    expect(readStoredTheme()).toBe('system')
    expect(() => {
      storeTheme('dark')
      storeTheme('system')
    }).not.toThrow()
  })
})

describe('themeScript', () => {
  // The script is a string for the <head>: it runs here the same way the browser runs it
  const runThemeScript = () => {
    new Function(themeScript)()
  }

  it('applies a saved theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')

    runThemeScript()

    expect(root.dataset.theme).toBe('dark')
  })

  it('ignores invalid values and leaves the system theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, '"><script>')

    runThemeScript()

    expect(root).not.toHaveAttribute('data-theme')
  })

  it('does not fail when localStorage is not available', () => {
    breakStorage()

    expect(runThemeScript).not.toThrow()
    expect(root).not.toHaveAttribute('data-theme')
  })
})
