import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
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
    expect(document.body.textContent).toBe('Contenido')
  })

  it('names every page after the clinic', () => {
    expect(metadata.title).toEqual({ default: 'Clínica', template: '%s | Clínica' })
  })
})
