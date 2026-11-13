import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { describe, expect, it, vi } from 'vitest'
import { LanguageSwitcher } from './language-switcher'

// Outside Next.js there is no router: the current path is set by hand
vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/es') }))

describe('LanguageSwitcher', () => {
  it('is a navigation region named by its visible label', () => {
    render(<LanguageSwitcher label="Idioma" current="es" />)

    expect(screen.getByRole('navigation', { name: 'Idioma' })).toBeInTheDocument()
    expect(screen.getAllByRole('link')).toHaveLength(2)
  })

  it('names each language in itself, marked with its lang', () => {
    render(<LanguageSwitcher label="Idioma" current="es" />)

    const english = screen.getByRole('link', { name: 'English' })
    expect(english).toHaveAttribute('lang', 'en')
    expect(english).toHaveAttribute('hreflang', 'en')
    expect(screen.getByRole('link', { name: 'Español' })).toHaveAttribute('lang', 'es')
  })

  it('links to the same page in each language and marks the current one', () => {
    vi.mocked(usePathname).mockReturnValue('/en/citas/proximas')
    render(<LanguageSwitcher label="Language" current="en" />)

    const spanish = screen.getByRole('link', { name: 'Español' })
    const english = screen.getByRole('link', { name: 'English' })
    expect(spanish).toHaveAttribute('href', '/es/citas/proximas')
    expect(spanish).not.toHaveAttribute('aria-current')
    expect(english).toHaveAttribute('href', '/en/citas/proximas')
    expect(english).toHaveAttribute('aria-current', 'page')
  })

  it('links to each home page from the home page', () => {
    vi.mocked(usePathname).mockReturnValue('/es')
    render(<LanguageSwitcher label="Idioma" current="es" />)

    expect(screen.getByRole('link', { name: 'English' })).toHaveAttribute('href', '/en')
  })
})
