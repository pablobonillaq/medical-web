import { testAppointment } from '@mocks/appointments'
import { server } from '@mocks/node'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { useRouter } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PatientActions } from '@/appointments/rules'
import { ToastProvider } from '@/components/ui/toast'
import { es } from '@/i18n/dictionaries/es'
import { StoreProvider } from '@/store/store-provider'
import { AppointmentActions } from './appointment-actions'

// Outside Next.js there is no router: the test checks that the page reads the appointment again
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }))

const router = { refresh: vi.fn() }

beforeEach(() => {
  router.refresh = vi.fn()
  vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>)
})

const all: PatientActions = {
  canConfirm: true,
  canCancel: true,
  canReschedule: true,
  tooLateToCancel: false,
}

const renderActions = (actions: PatientActions = all) =>
  render(
    <StoreProvider>
      <ToastProvider>
        <AppointmentActions
          appointmentId={testAppointment.id}
          locale="es"
          actions={actions}
          labels={es.appointmentPage}
          date="jueves, 26 de noviembre de 2026"
          time="9:00"
        />
      </ToastProvider>
    </StoreProvider>,
  )

const openCancel = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Cancelar cita' }))
  return screen.getByRole('dialog', { name: '¿Cancelar esta cita?' })
}

describe('AppointmentActions', () => {
  it('offers what the patient may do, under a heading', () => {
    renderActions()

    const section = screen.getByRole('region', { name: 'Tu asistencia' })
    expect(
      within(section).getByRole('button', { name: 'Confirmar asistencia' }),
    ).toBeInTheDocument()
    expect(within(section).getByRole('button', { name: 'Cancelar cita' })).toBeInTheDocument()
    expect(within(section).getByRole('link', { name: 'Cambiar fecha u hora' })).toHaveAttribute(
      'href',
      `/es/appointments/${testAppointment.id}/reschedule`,
    )
  })

  it('sends the patient to call when it is too late to change it here', () => {
    renderActions({
      canConfirm: true,
      canCancel: false,
      canReschedule: false,
      tooLateToCancel: true,
    })

    expect(screen.getByText(/Para cancelarla o cambiarla, llama a la clínica/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Cambiar fecha u hora' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancelar cita' })).not.toBeInTheDocument()
  })

  it('confirms, says so and reads the appointment again', async () => {
    const user = userEvent.setup()
    renderActions()

    await user.click(screen.getByRole('button', { name: 'Confirmar asistencia' }))

    expect(await screen.findByText('Confirmamos tu asistencia.')).toBeInTheDocument()
    expect(router.refresh).toHaveBeenCalled()
  })

  it('confirms only once, however many times it is pressed', async () => {
    let requests = 0
    server.use(
      http.patch('*/api/appointments/:id/status', () => {
        requests += 1
        return HttpResponse.json({ appointment: { ...testAppointment, status: 'confirmed' } })
      }),
    )
    renderActions()
    const confirm = screen.getByRole('button', { name: 'Confirmar asistencia' })

    fireEvent.click(confirm)
    fireEvent.click(confirm)

    await waitFor(() => expect(router.refresh).toHaveBeenCalledTimes(1))
    expect(requests).toBe(1)
  })

  it('shows the current status when the appointment changed elsewhere', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch('*/api/appointments/:id/status', () =>
        HttpResponse.json({ error: 'Cannot change status' }, { status: 409 }),
      ),
    )
    renderActions()

    await user.click(screen.getByRole('button', { name: 'Confirmar asistencia' }))

    const title = await screen.findByText('No pudimos hacer el cambio')
    expect(title.closest('[role="alert"]')).toHaveTextContent(/La cita cambió mientras tanto/)
    expect(router.refresh).toHaveBeenCalled()
  })

  it('keeps the page as it is when confirming failed for another reason', async () => {
    const user = userEvent.setup()
    server.use(http.patch('*/api/appointments/:id/status', () => HttpResponse.error()))
    renderActions()

    await user.click(screen.getByRole('button', { name: 'Confirmar asistencia' }))

    expect(await screen.findByText(/No pudimos conectar con el servicio/)).toBeInTheDocument()
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('asks before cancelling, saying which appointment, and keeps it when asked', async () => {
    const user = userEvent.setup()
    renderActions()

    const dialog = await openCancel(user)

    expect(dialog).toHaveAccessibleDescription(
      'La cita del jueves, 26 de noviembre de 2026 a las 9:00 quedará cancelada y el horario se liberará para alguien más.',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Conservar cita' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('cancels with the reason, says so and reads the appointment again', async () => {
    const user = userEvent.setup()
    let body: unknown
    server.use(
      http.patch('*/api/appointments/:id/cancel', async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ appointment: { ...testAppointment, status: 'cancelled' } })
      }),
    )
    renderActions()

    const dialog = await openCancel(user)
    await user.type(within(dialog).getByLabelText(/Motivo/), ' Viaje de trabajo ')
    await user.click(within(dialog).getByRole('button', { name: 'Sí, cancelar' }))

    expect(await screen.findByText('Cancelamos tu cita.')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(body).toEqual({ reason: 'Viaje de trabajo' })
    expect(router.refresh).toHaveBeenCalled()
  })

  it('asks for a longer reason, or none, without sending', async () => {
    const user = userEvent.setup()
    let requests = 0
    server.use(
      http.patch('*/api/appointments/:id/cancel', () => {
        requests += 1
        return HttpResponse.json({ appointment: testAppointment })
      }),
    )
    renderActions()

    const dialog = await openCancel(user)
    await user.type(within(dialog).getByLabelText(/Motivo/), 'no')
    await user.click(within(dialog).getByRole('button', { name: 'Sí, cancelar' }))

    expect(within(dialog).getByLabelText(/Motivo/)).toHaveAccessibleDescription(
      /Escribe al menos 3 caracteres, o déjalo vacío\./,
    )
    expect(requests).toBe(0)
  })

  it('explains in the dialog why cancelling failed, and starts over when opened again', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch('*/api/appointments/:id/cancel', () =>
        HttpResponse.json({ error: 'Too late' }, { status: 400 }),
      ),
    )
    renderActions()

    let dialog = await openCancel(user)
    await user.click(within(dialog).getByRole('button', { name: 'Sí, cancelar' }))
    expect(
      await within(dialog).findByText(/Ya no es posible hacer este cambio/),
    ).toBeInTheDocument()
    expect(router.refresh).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole('button', { name: 'Conservar cita' }))
    dialog = await openCancel(user)
    expect(within(dialog).queryByText(/Ya no es posible/)).not.toBeInTheDocument()
  })

  it('reads the appointment again when it was cancelled elsewhere', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch('*/api/appointments/:id/cancel', () =>
        HttpResponse.json({ error: 'Already cancelled' }, { status: 409 }),
      ),
    )
    renderActions()

    const dialog = await openCancel(user)
    await user.click(within(dialog).getByRole('button', { name: 'Sí, cancelar' }))

    await waitFor(() => expect(router.refresh).toHaveBeenCalled())
  })

  it('cancels only once, however many times it is sent', async () => {
    const user = userEvent.setup()
    let requests = 0
    server.use(
      http.patch('*/api/appointments/:id/cancel', () => {
        requests += 1
        return HttpResponse.json({ appointment: { ...testAppointment, status: 'cancelled' } })
      }),
    )
    renderActions()
    const dialog = await openCancel(user)
    const form = within(dialog).getByRole('button', { name: 'Sí, cancelar' }).closest('form')!

    fireEvent.submit(form)
    fireEvent.submit(form)

    await waitFor(() => expect(router.refresh).toHaveBeenCalledTimes(1))
    expect(requests).toBe(1)
  })
})
