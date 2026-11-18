import { render, screen } from '@testing-library/react'
import { usePathname } from 'next/navigation'
import { describe, expect, it, vi } from 'vitest'
import { SignInLink } from './sign-in-link'

// Outside Next.js there is no router: the current path is set by hand
vi.mock('next/navigation', () => ({ usePathname: vi.fn() }))

describe('SignInLink', () => {
  it('comes back to the current page after signing in', () => {
    vi.mocked(usePathname).mockReturnValue('/es/account')
    render(<SignInLink locale="es" label="Iniciar sesión" />)

    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toHaveAttribute(
      'href',
      '/es/login?next=%2Fes%2Faccount',
    )
  })

  it('links to the sign-in page alone from the sign-in page', () => {
    vi.mocked(usePathname).mockReturnValue('/en/login')
    render(<SignInLink locale="en" label="Sign in" />)

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/en/login')
  })
})
