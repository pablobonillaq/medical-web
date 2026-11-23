import { lang } from 'next/root-params'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import ProfilePage, { generateMetadata } from './page'

// Outside a Next.js request: the language of the URL and the cookies are set by hand
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => undefined }),
  headers: async () => new Headers(),
}))

describe('ProfilePage', () => {
  it('has its heading in the static shell and the profile streaming in', async () => {
    vi.mocked(lang).mockResolvedValue('en')
    const container = document.createElement('div')

    container.innerHTML = renderToStaticMarkup(await ProfilePage())

    expect(container.querySelector('h1')?.textContent).toBe('My profile')
    expect(container.querySelector('[aria-busy="true"]')?.textContent).toBe('Loading your profile…')
  })

  it('names the page', async () => {
    vi.mocked(lang).mockResolvedValue('es')

    expect(await generateMetadata()).toEqual({ title: 'Mi perfil' })
  })
})
