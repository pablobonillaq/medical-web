import { lang } from 'next/root-params'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import HomePage from './page'

// Outside Next.js: the language of the URL is set by hand, and there is no cache
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }))

// The page renders as HTML, as on the server: the services stay behind their placeholder
const renderHome = async (locale: 'es' | 'en') => {
  vi.mocked(lang).mockResolvedValue(locale)
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(await HomePage())
  return container
}

const links = (container: HTMLElement) =>
  [...container.querySelectorAll('a')].map((link) => [link.textContent, link.getAttribute('href')])

describe('HomePage', () => {
  it('has one level 1 heading, in the language of the URL', async () => {
    expect((await renderHome('es')).querySelector('h1')?.textContent).toBe('Tu clínica, en línea')
    expect((await renderHome('en')).querySelector('h1')?.textContent).toBe('Your clinic, online')
    expect((await renderHome('es')).querySelectorAll('h1')).toHaveLength(1)
  })

  it('leads to the services, the doctors and the patients account', async () => {
    expect(links(await renderHome('es'))).toEqual([
      ['Ver servicios', '/es/services'],
      ['Conocer a los médicos', '/es/doctors'],
      ['Ver todos los servicios', '/es/services'],
      ['Crear cuenta', '/es/register'],
      ['Iniciar sesión', '/es/login'],
    ])
  })

  it('names each section after its heading, with the services loading behind a placeholder', async () => {
    const container = await renderHome('en')

    const sections = [...container.querySelectorAll('section[aria-labelledby]')]
    expect(
      sections.map(
        (section) =>
          container.querySelector(`#${section.getAttribute('aria-labelledby')}`)?.textContent,
      ),
    ).toEqual(['Services', 'Are you a patient?'])
    expect(container.querySelector('[aria-busy="true"]')?.textContent).toBe('Loading services…')
  })
})
