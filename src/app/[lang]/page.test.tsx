import { render, screen } from '@testing-library/react'
import { lang } from 'next/root-params'
import { describe, expect, it, vi } from 'vitest'
import HomePage from './page'

vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  usePathname: () => '/es',
}))

describe('HomePage', () => {
  it('has a main region, the skip link target, with one level 1 heading', async () => {
    vi.mocked(lang).mockResolvedValue('es')
    render(await HomePage())

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('heading', { level: 1, name: 'Clínica' })).toBeInTheDocument()
  })

  it('lets the visitor choose the theme and the language', async () => {
    vi.mocked(lang).mockResolvedValue('es')
    render(await HomePage())

    expect(screen.getByRole('group', { name: 'Tema' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Idioma' })).toBeInTheDocument()
  })
})
