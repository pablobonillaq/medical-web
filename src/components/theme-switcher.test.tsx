import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { THEME_STORAGE_KEY } from '@/theme/theme'
import { ThemeSwitcher } from './theme-switcher'

const root = document.documentElement

afterEach(() => {
  localStorage.clear()
  root.removeAttribute('data-theme')
})

// A change made in another tab of the same site
const changeInAnotherTab = (key: string, value: string) => {
  localStorage.setItem(key, value)
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key }))
  })
}

describe('ThemeSwitcher', () => {
  it('is a group of three options named "Tema", with Sistema chosen by default', () => {
    render(<ThemeSwitcher />)

    expect(screen.getByRole('group', { name: 'Tema' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('radio', { name: 'Sistema' })).toBeChecked()
  })

  it('shows the saved theme', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')

    render(<ThemeSwitcher />)

    expect(screen.getByRole('radio', { name: 'Oscuro' })).toBeChecked()
  })

  it('applies and saves the chosen theme', async () => {
    const user = userEvent.setup()
    render(<ThemeSwitcher />)

    await user.click(screen.getByRole('radio', { name: 'Oscuro' }))

    expect(screen.getByRole('radio', { name: 'Oscuro' })).toBeChecked()
    expect(root.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    await user.click(screen.getByRole('radio', { name: 'Sistema' }))

    expect(root).not.toHaveAttribute('data-theme')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('follows a theme chosen in another tab, and ignores other saved values', () => {
    render(<ThemeSwitcher />)

    changeInAnotherTab('language', 'en')
    expect(screen.getByRole('radio', { name: 'Sistema' })).toBeChecked()

    changeInAnotherTab(THEME_STORAGE_KEY, 'light')
    expect(screen.getByRole('radio', { name: 'Claro' })).toBeChecked()
    expect(root.dataset.theme).toBe('light')
  })

  it('renders Sistema on the server, where the saved theme is unknown', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    const container = document.createElement('div')

    container.innerHTML = renderToString(<ThemeSwitcher />)

    expect(container.querySelector<HTMLInputElement>('input[value="system"]')?.checked).toBe(true)
  })
})
