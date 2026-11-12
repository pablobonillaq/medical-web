import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Each test starts with an empty document
afterEach(() => {
  cleanup()
})

// jsdom does not implement <dialog> yet. This is the least the components need: open, close and
// the close event. Focus trapping, Escape and the backdrop are the browser's job, checked with
// Playwright in real browsers.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
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
