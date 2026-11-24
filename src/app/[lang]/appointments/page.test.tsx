import { lang } from 'next/root-params'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import AppointmentsPage, { generateMetadata } from './page'

// Outside a Next.js request: the language of the URL is set by hand
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))

describe('AppointmentsPage', () => {
  it('has its heading in the static shell and the appointments streaming in', async () => {
    vi.mocked(lang).mockResolvedValue('en')
    const container = document.createElement('div')

    container.innerHTML = renderToStaticMarkup(
      await AppointmentsPage({
        params: Promise.resolve({ lang: 'en' }),
        searchParams: Promise.resolve({}),
      }),
    )

    expect(container.querySelector('h1')?.textContent).toBe('My appointments')
    expect(container.querySelector('[aria-busy="true"]')?.textContent).toBe(
      'Loading your appointments…',
    )
  })

  it('names the page', async () => {
    vi.mocked(lang).mockResolvedValue('es')

    expect(await generateMetadata()).toEqual({ title: 'Mis citas' })
  })
})
