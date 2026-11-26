import { lang } from 'next/root-params'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import PatientPage, { generateMetadata, instant } from './page'

// Outside a Next.js request: the language of the URL is set by hand
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))

describe('PatientPage', () => {
  it('has its heading in the static shell and the file streaming in', async () => {
    vi.mocked(lang).mockResolvedValue('en')
    const container = document.createElement('div')

    container.innerHTML = renderToStaticMarkup(
      await PatientPage({
        params: Promise.resolve({ lang: 'en', id: 'patient-1' }),
        searchParams: Promise.resolve({}),
      }),
    )

    expect(container.querySelector('h1')?.textContent).toBe('Patient file')
    expect(container.querySelector('[aria-busy="true"]')?.textContent).toBe('Loading the file…')
  })

  it('names the page', async () => {
    vi.mocked(lang).mockResolvedValue('es')

    expect(await generateMetadata()).toEqual({ title: 'Ficha del paciente' })
  })

  it('opts out of the static shell check: its URL is only known at request time', () => {
    expect(instant).toBe(false)
  })
})
