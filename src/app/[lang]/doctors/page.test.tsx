import { lang } from 'next/root-params'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import DoctorsPage, { generateMetadata } from './page'

// Outside Next.js: the language of the URL is set by hand, and there is no cache
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

describe('DoctorsPage', () => {
  it('has its heading right away and the directory behind a placeholder while it loads', async () => {
    vi.mocked(lang).mockResolvedValue('en')
    const container = document.createElement('div')

    container.innerHTML = renderToStaticMarkup(
      await DoctorsPage({
        params: Promise.resolve({ lang: 'en' }),
        searchParams: Promise.resolve({}),
      }),
    )

    expect(container.querySelector('h1')?.textContent).toBe('Doctors')
    expect(container.querySelector('[aria-busy="true"]')?.textContent).toBe('Loading doctors…')
  })

  it('names and describes the page for search engines', async () => {
    vi.mocked(lang).mockResolvedValue('es')

    expect(await generateMetadata()).toEqual({
      title: 'Médicos',
      description: 'Los médicos de la clínica, su especialidad y los servicios que ofrecen.',
    })
  })
})
