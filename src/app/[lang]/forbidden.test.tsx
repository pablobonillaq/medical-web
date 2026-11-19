import { render, screen } from '@testing-library/react'
import { lang } from 'next/root-params'
import { describe, expect, it, vi } from 'vitest'
import Forbidden from './forbidden'

// next/root-params only works inside Next.js: in tests the language of the URL is set by hand
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))

describe('Forbidden', () => {
  it('explains that the role may not see the page, and links home', async () => {
    vi.mocked(lang).mockResolvedValue('es')
    render(await Forbidden())

    expect(
      screen.getByRole('heading', { level: 1, name: 'No tienes acceso a esta página' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/es')
  })

  it('speaks the language of the URL', async () => {
    vi.mocked(lang).mockResolvedValue('en')
    render(await Forbidden())

    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/en')
  })
})
