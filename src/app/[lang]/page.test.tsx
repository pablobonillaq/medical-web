import { render, screen } from '@testing-library/react'
import { lang } from 'next/root-params'
import { describe, expect, it, vi } from 'vitest'
import HomePage from './page'

// next/root-params only works inside Next.js: in tests the language of the URL is set by hand
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))

describe('HomePage', () => {
  it('has one level 1 heading, in the language of the URL', async () => {
    vi.mocked(lang).mockResolvedValue('es')
    const { unmount } = render(await HomePage())
    expect(screen.getByRole('heading', { level: 1, name: 'Clínica' })).toBeInTheDocument()
    unmount()

    vi.mocked(lang).mockResolvedValue('en')
    render(await HomePage())
    expect(screen.getByRole('heading', { level: 1, name: 'Clinic' })).toBeInTheDocument()
  })
})
