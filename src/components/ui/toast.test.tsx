import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TOAST_DURATION_MS, ToastProvider, useToast, type ToastInput } from './toast'

function Trigger({ toast }: { toast: ToastInput }) {
  const showToast = useToast()
  return (
    <button type="button" onClick={() => showToast(toast)}>
      Mostrar
    </button>
  )
}

const renderWithToast = (toast: ToastInput) =>
  render(
    <ToastProvider>
      <Trigger toast={toast} />
    </ToastProvider>,
  )

const show = () => fireEvent.click(screen.getByRole('button', { name: 'Mostrar' }))
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('needs a ToastProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Trigger toast={{ title: 'Hola' }} />)).toThrow(
      'useToast must be used inside <ToastProvider>',
    )
  })

  it('keeps both live regions on the page before any toast', () => {
    renderWithToast({ title: 'Cita reservada' })

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })

  it('announces a message politely and hides it after a while', () => {
    renderWithToast({ title: 'Cita reservada', description: 'Lunes 10:00', variant: 'success' })
    show()

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Cita reservada')
    expect(status).toHaveTextContent('Lunes 10:00')
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()

    wait(TOAST_DURATION_MS - 1)
    expect(status).toHaveTextContent('Cita reservada')
    wait(1)
    expect(status).toBeEmptyDOMElement()
  })

  it('stops the time while the pointer is on the message', () => {
    renderWithToast({ title: 'Cita reservada' })
    show()
    const message = screen.getByText('Cita reservada')

    fireEvent.mouseEnter(message)
    wait(TOAST_DURATION_MS * 2)
    expect(screen.getByRole('status')).toHaveTextContent('Cita reservada')

    fireEvent.mouseLeave(message)
    wait(TOAST_DURATION_MS)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('stops the time while the focus is on the message', () => {
    renderWithToast({ title: 'Cita reservada' })
    show()
    const close = screen.getByRole('button', { name: 'Cerrar aviso' })

    act(() => close.focus())
    wait(TOAST_DURATION_MS * 2)
    expect(screen.getByRole('status')).toHaveTextContent('Cita reservada')

    act(() => close.blur())
    wait(TOAST_DURATION_MS)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })

  it('shows errors as alerts that stay until they are closed', () => {
    renderWithToast({ title: 'No se pudo reservar', variant: 'danger' })
    show()

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('No se pudo reservar')
    expect(screen.getByRole('status')).toBeEmptyDOMElement()

    wait(TOAST_DURATION_MS * 5)
    expect(alert).toHaveTextContent('No se pudo reservar')

    fireEvent.click(within(alert).getByRole('button', { name: 'Cerrar aviso' }))
    expect(alert).toBeEmptyDOMElement()
  })

  it('stacks several messages and closes only the chosen one', () => {
    renderWithToast({ title: 'Guardado' })
    show()
    show()

    const status = screen.getByRole('status')
    const closeButtons = within(status).getAllByRole('button', { name: 'Cerrar aviso' })
    expect(closeButtons).toHaveLength(2)

    fireEvent.click(closeButtons[0])
    expect(within(status).getAllByText('Guardado')).toHaveLength(1)
  })
})
