import { render, screen, within } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { describe, expect, it, vi } from 'vitest'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { MainNav } from './main-nav'

// Outside Next.js there is no router: the current path is set by hand
vi.mock('next/navigation', () => ({ usePathname: vi.fn(() => '/es') }))

describe('MainNav', () => {
  it('links to the sections of the site, in the language of the page', () => {
    vi.mocked(usePathname).mockReturnValue('/en')
    render(<MainNav locale="en" labels={en.nav} />)

    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('link', { name: 'Services' })).toHaveAttribute(
      'href',
      '/en/services',
    )
  })

  it('marks the section of the current page', () => {
    vi.mocked(usePathname).mockReturnValue('/es/services')
    render(<MainNav locale="es" labels={es.nav} />)

    expect(screen.getByRole('link', { name: 'Servicios' })).toHaveAttribute('aria-current', 'page')
  })

  it('marks no section on a page outside them', () => {
    vi.mocked(usePathname).mockReturnValue('/es')
    render(<MainNav locale="es" labels={es.nav} />)

    expect(screen.getByRole('link', { name: 'Servicios' })).not.toHaveAttribute('aria-current')
  })
})
