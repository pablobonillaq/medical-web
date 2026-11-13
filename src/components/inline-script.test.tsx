import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InlineScript } from './inline-script'

const renderScript = () => {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(<InlineScript html="window.ran = true" />)
  return container.querySelector('script')
}

describe('InlineScript', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is JavaScript when rendered on the server', () => {
    vi.stubGlobal('window', undefined)

    const script = renderScript()

    expect(script).toHaveAttribute('type', 'text/javascript')
    expect(script).toHaveTextContent('window.ran = true')
  })

  it('is plain text, ignored by the browser, when rendered on the client', () => {
    expect(renderScript()).toHaveAttribute('type', 'text/plain')
  })
})
