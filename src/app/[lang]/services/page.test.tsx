import { lang } from 'next/root-params'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import ServicesPage, { generateMetadata } from './page'

// Outside Next.js: the language of the URL is set by hand, and there is no cache
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

describe('ServicesPage', () => {
  it('has its heading right away and the list behind a placeholder while it loads', async () => {
    vi.mocked(lang).mockResolvedValue('en')
    const container = document.createElement('div')

    container.innerHTML = renderToStaticMarkup(await ServicesPage())

    expect(container.querySelector('h1')?.textContent).toBe('Services')
    expect(container.querySelector('[aria-busy="true"]')?.textContent).toBe('Loading services…')
  })

  it('names and describes the page for search engines', async () => {
    vi.mocked(lang).mockResolvedValue('es')

    expect(await generateMetadata()).toEqual({
      title: 'Servicios',
      description: 'Los servicios de la clínica y cuánto dura cada uno.',
    })
  })
})
