import { lang } from 'next/root-params'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { themeScript } from '@/theme/theme'
import RootLayout, { generateMetadata, generateStaticParams } from './layout'

// next/font only works inside the Next.js compiler: in tests each font gives back its CSS variable
vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: 'font-geist-sans' }),
  Geist_Mono: () => ({ variable: 'font-geist-mono' }),
}))

// next/root-params only works inside Next.js: in tests the language of the URL is set by hand
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))

// The root layout is an async Server Component that renders <html>: it is awaited, rendered to a
// string and parsed as a full document
const renderDocument = async (locale = 'es') => {
  vi.mocked(lang).mockResolvedValue(locale)
  const layout = await RootLayout({
    params: Promise.resolve({ lang: locale }),
    children: <p>Contenido</p>,
  })
  return new DOMParser().parseFromString(renderToStaticMarkup(layout), 'text/html')
}

describe('RootLayout', () => {
  // A document made by DOMParser does not belong to the test window, so the jest-dom matchers
  // (toHaveAttribute, toHaveClass) reject its elements: they are checked with plain DOM properties
  it('declares the language of the URL, for screen readers', async () => {
    expect((await renderDocument('es')).documentElement.lang).toBe('es')
    expect((await renderDocument('en')).documentElement.lang).toBe('en')
  })

  it('loads the fonts and renders the page inside the body', async () => {
    const document = await renderDocument()

    expect([...document.documentElement.classList]).toEqual(
      expect.arrayContaining(['font-geist-sans', 'font-geist-mono']),
    )
    expect(document.body.children[1]?.textContent).toBe('Contenido')
  })

  it('keeps the live regions for toasts on every page', async () => {
    const { body } = await renderDocument()

    expect(body.querySelector('[role="status"]')).not.toBeNull()
    expect(body.querySelector('[role="alert"]')).not.toBeNull()
  })

  it('starts the body with the skip link, in the language of the page', async () => {
    const spanish = (await renderDocument('es')).body.firstElementChild
    expect(spanish).toHaveProperty('hash', '#main-content')
    expect(spanish?.textContent).toBe('Saltar al contenido principal')

    const english = (await renderDocument('en')).body.firstElementChild
    expect(english?.textContent).toBe('Skip to main content')
  })

  it('applies the saved theme in <head>, before the page is painted', async () => {
    expect((await renderDocument()).head.querySelector('script')?.textContent).toBe(themeScript)
  })

  it('prerenders both languages', () => {
    expect(generateStaticParams()).toEqual([{ lang: 'es' }, { lang: 'en' }])
  })

  it('names every page after the clinic, in the language of the URL', async () => {
    vi.mocked(lang).mockResolvedValue('es')
    expect(await generateMetadata()).toMatchObject({
      title: { default: 'Clínica', template: '%s | Clínica' },
    })

    vi.mocked(lang).mockResolvedValue('en')
    expect(await generateMetadata()).toMatchObject({
      title: { default: 'Clinic', template: '%s | Clinic' },
      description: "Appointment booking, medical records and chat with the clinic's front desk.",
    })
  })
})
