import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { themeScript } from '@/theme/theme'
import RootLayout, { metadata } from './layout'

// next/font only works inside the Next.js compiler: in tests each font gives back its CSS variable
vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: 'font-geist-sans' }),
  Geist_Mono: () => ({ variable: 'font-geist-mono' }),
}))

// The root layout renders <html>, so it is rendered to a string and parsed as a full document
const renderDocument = () => {
  const html = renderToStaticMarkup(
    <RootLayout params={Promise.resolve({})}>
      <p>Contenido</p>
    </RootLayout>,
  )
  return new DOMParser().parseFromString(html, 'text/html')
}

describe('RootLayout', () => {
  // A document made by DOMParser does not belong to the test window, so the jest-dom matchers
  // (toHaveAttribute, toHaveClass) reject its elements: they are checked with plain DOM properties
  it('declares Spanish as the page language, for screen readers', () => {
    expect(renderDocument().documentElement.lang).toBe('es')
  })

  it('loads the fonts and renders the page inside the body', () => {
    const document = renderDocument()

    expect([...document.documentElement.classList]).toEqual(
      expect.arrayContaining(['font-geist-sans', 'font-geist-mono']),
    )

    expect(document.body.children[1]?.textContent).toBe('Contenido')
  })

  it('keeps the live regions for toasts on every page', () => {
    const { body } = renderDocument()

    expect(body.querySelector('[role="status"]')).not.toBeNull()
    expect(body.querySelector('[role="alert"]')).not.toBeNull()
  })

  it('starts the body with the link that skips to the main content', () => {
    expect(renderDocument().body.firstElementChild).toHaveProperty('hash', '#main-content')
  })

  it('names every page after the clinic', () => {
    expect(metadata.title).toEqual({ default: 'Clínica', template: '%s | Clínica' })
  })

  it('applies the saved theme in <head>, before the page is painted', () => {
    expect(renderDocument().head.querySelector('script')?.textContent).toBe(themeScript)
  })
})
