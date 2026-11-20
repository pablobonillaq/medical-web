import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { SiteHeader } from './site-header'

// Outside Next.js there is no router: the current path is set by hand
vi.mock('next/navigation', () => ({ usePathname: () => '/es' }))

const account = <span>Cuenta</span>

describe('SiteHeader', () => {
  it('is the banner of the page, with a link home named after the clinic', () => {
    render(<SiteHeader locale="es" dictionary={es} account={account} />)

    const banner = screen.getByRole('banner')
    expect(within(banner).getByRole('link', { name: 'Clínica' })).toHaveAttribute('href', '/es')
  })

  it('links to the sections of the site', () => {
    render(<SiteHeader locale="es" dictionary={es} account={account} />)

    const nav = within(screen.getByRole('banner')).getByRole('navigation', { name: 'Principal' })
    expect(within(nav).getByRole('link', { name: 'Servicios' })).toHaveAttribute(
      'href',
      '/es/services',
    )
  })

  it('holds the account and the theme and language preferences', () => {
    render(<SiteHeader locale="es" dictionary={es} account={account} />)

    expect(within(screen.getByRole('banner')).getByText('Cuenta')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Tema' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Idioma' })).toBeInTheDocument()
  })

  it('speaks the language of the page', () => {
    render(<SiteHeader locale="en" dictionary={en} account={account} />)

    expect(screen.getByRole('link', { name: 'Clinic' })).toHaveAttribute('href', '/en')
    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument()
  })
})
