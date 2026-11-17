import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/node'

// The fake API answers every request. A request with no handler fails the test, so no test
// reaches a real server by accident
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

// Each test starts with an empty document and the default answers of the fake API
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

// jsdom does not implement <dialog> yet. This is the least the components need: open, close and
// the close event. Focus trapping, Escape and the backdrop are the browser's job, checked with
// Playwright in real browsers.
// Tests in the node environment (proxy.test.ts) have no DOM, so they skip it.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  Object.defineProperty(HTMLDialogElement.prototype, 'open', {
    get(this: HTMLDialogElement) {
      return this.hasAttribute('open')
    },
    configurable: true,
  })
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.open) return
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
