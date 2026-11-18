import { render, screen } from '@testing-library/react'
import { lang } from 'next/root-params'
import { describe, expect, it, vi } from 'vitest'
import { StoreProvider } from '@/store/store-provider'
import LoginPage, { generateMetadata } from './page'

// next/root-params only works inside Next.js: in tests the language of the URL is set by hand
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: vi.fn(),
}))

describe('LoginPage', () => {
  it('has one level 1 heading and the sign-in form, in the language of the URL', async () => {
    vi.mocked(lang).mockResolvedValue('en')

    render(<StoreProvider>{await LoginPage()}</StoreProvider>)

    expect(screen.getByRole('heading', { level: 1, name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('names the page', async () => {
    vi.mocked(lang).mockResolvedValue('es')

    expect(await generateMetadata()).toEqual({ title: 'Iniciar sesión' })
  })
})
