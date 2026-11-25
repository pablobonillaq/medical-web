import { lang } from 'next/root-params'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import ReschedulePage, { generateMetadata, instant } from './page'

// Outside a Next.js request: the language of the URL is set by hand
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))

describe('ReschedulePage', () => {
  it('has its heading in the static shell and the appointment streaming in', async () => {
    vi.mocked(lang).mockResolvedValue('en')
    const container = document.createElement('div')

    container.innerHTML = renderToStaticMarkup(
      await ReschedulePage({
        params: Promise.resolve({ lang: 'en', id: 'appointment-1' }),
        searchParams: Promise.resolve({}),
      }),
    )

    expect(container.querySelector('h1')?.textContent).toBe('Change date or time')
    expect(container.querySelector('[aria-busy="true"]')?.textContent).toBe(
      'Loading your appointment…',
    )
  })

  it('names the page', async () => {
    vi.mocked(lang).mockResolvedValue('es')

    expect(await generateMetadata()).toEqual({ title: 'Cambiar fecha u hora' })
  })

  it('opts out of the static shell check: its URL is only known at request time', () => {
    expect(instant).toBe(false)
  })
})
