import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { SiteHeader } from './site-header'

// Outside Next.js there is no router: the current path is set by hand
vi.mock('next/navigation', () => ({ usePathname: () => '/es' }))

describe('SiteHeader', () => {
  it('is the banner of the page, with a link home named after the clinic', () => {
    render(<SiteHeader locale="es" dictionary={es} />)

    const banner = screen.getByRole('banner')
    expect(within(banner).getByRole('link', { name: 'Clínica' })).toHaveAttribute('href', '/es')
  })

  it('holds the theme and language preferences', () => {
    render(<SiteHeader locale="es" dictionary={es} />)

    expect(screen.getByRole('group', { name: 'Tema' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Idioma' })).toBeInTheDocument()
  })

  it('speaks the language of the page', () => {
    render(<SiteHeader locale="en" dictionary={en} />)

    expect(screen.getByRole('link', { name: 'Clinic' })).toHaveAttribute('href', '/en')
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
  })
})
