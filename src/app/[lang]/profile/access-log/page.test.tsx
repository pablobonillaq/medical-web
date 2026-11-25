import { lang } from 'next/root-params'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import AccessLogPage, { generateMetadata } from './page'

// Outside a Next.js request: the language of the URL is set by hand
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))

describe('AccessLogPage', () => {
  it('has its heading in the static shell and the accesses streaming in', async () => {
    vi.mocked(lang).mockResolvedValue('en')
    const container = document.createElement('div')

    container.innerHTML = renderToStaticMarkup(
      await AccessLogPage({
        params: Promise.resolve({ lang: 'en' }),
        searchParams: Promise.resolve({}),
      }),
    )

    expect(container.querySelector('h1')?.textContent).toBe('Who opened my record')
    expect(container.querySelector('[aria-busy="true"]')?.textContent).toBe('Loading the accesses…')
  })

  it('names the page', async () => {
    vi.mocked(lang).mockResolvedValue('es')

    expect(await generateMetadata()).toEqual({ title: 'Quién consultó mi expediente' })
  })
})
