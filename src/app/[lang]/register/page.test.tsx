import { render, screen } from '@testing-library/react'
import { lang } from 'next/root-params'
import { describe, expect, it, vi } from 'vitest'
import { StoreProvider } from '@/store/store-provider'
import RegisterPage, { generateMetadata } from './page'

// next/root-params only works inside Next.js: in tests the language of the URL is set by hand
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: vi.fn(),
}))

describe('RegisterPage', () => {
  it('has one level 1 heading, the form and a link to sign in instead', async () => {
    vi.mocked(lang).mockResolvedValue('en')

    render(<StoreProvider>{await RegisterPage()}</StoreProvider>)

    expect(screen.getByRole('heading', { level: 1, name: 'Create an account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/en/login')
  })

  it('names the page', async () => {
    vi.mocked(lang).mockResolvedValue('es')

    expect(await generateMetadata()).toEqual({ title: 'Crear cuenta' })
  })
})
