import { lang } from 'next/root-params'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import BookingPage, { generateMetadata } from './page'

// Outside a Next.js request: the language of the URL is set by hand
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))

describe('BookingPage', () => {
  it('has its heading in the static shell and the steps streaming in', async () => {
    vi.mocked(lang).mockResolvedValue('en')
    const container = document.createElement('div')

    container.innerHTML = renderToStaticMarkup(
      await BookingPage({
        params: Promise.resolve({ lang: 'en' }),
        searchParams: Promise.resolve({}),
      }),
    )

    expect(container.querySelector('h1')?.textContent).toBe('Book an appointment')
    expect(container.querySelector('[aria-busy="true"]')?.textContent).toBe('Loading…')
  })

  it('names the page', async () => {
    vi.mocked(lang).mockResolvedValue('es')

    expect(await generateMetadata()).toEqual({ title: 'Agendar cita' })
  })
})
