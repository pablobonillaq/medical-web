import { testAppointment, testAvailability } from '@mocks/appointments'
import { server } from '@mocks/node'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { useRouter } from 'next/navigation'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/toast'
import { es } from '@/i18n/dictionaries/es'
import { StoreProvider } from '@/store/store-provider'
import { SlotPickerForm } from './slot-picker-form'

// Outside Next.js there is no router: the test checks where the form sends the patient
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }))

const router = { push: vi.fn(), refresh: vi.fn() }

beforeEach(() => {
  router.push = vi.fn()
  router.refresh = vi.fn()
  vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>)
})

const [nine, nineFortyFive] = testAvailability.slots

const form = () => (
  <StoreProvider>
    <ToastProvider>
      <SlotPickerForm
        locale="es"
        labels={es.bookingPage}
        doctorId={testAppointment.doctor.id}
        serviceId={testAppointment.service.id}
        legend="Horarios disponibles el jueves, 26 de noviembre de 2026"
        slots={[
          { startsAt: nine.startsAt, label: '9:00' },
          { startsAt: nineFortyFive.startsAt, label: '9:45' },
        ]}
      />
    </ToastProvider>
  </StoreProvider>
)

const book = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Agendar cita' }))

describe('SlotPickerForm', () => {
  it("offers the free times as a group named after the date, in the clinic's time", () => {
    render(form())

    const group = screen.getByRole('group', {
      name: 'Horarios disponibles el jueves, 26 de noviembre de 2026',
    })
    expect(group).toHaveAccessibleDescription('Horas de la clínica, en la Ciudad de México.')
    expect(screen.getByRole('radio', { name: '9:00' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '9:45' })).toBeInTheDocument()
  })

  it('books the chosen time with the notes, says so and opens the appointment', async () => {
    const user = userEvent.setup()
    let sent: unknown
    server.use(
      http.post('*/api/appointments', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ appointment: testAppointment }, { status: 201 })
      }),
    )
    render(form())

    await user.click(screen.getByRole('radio', { name: '9:45' }))
    await user.type(screen.getByLabelText(/Notas para el médico/), '  Dolor abdominal ')
    await book(user)

    expect(await screen.findByText('Tu cita quedó agendada.')).toBeInTheDocument()
    expect(router.push).toHaveBeenCalledWith(`/es/appointments/${testAppointment.id}`)
    expect(sent).toEqual({
      doctorId: testAppointment.doctor.id,
      serviceId: testAppointment.service.id,
      startsAt: nineFortyFive.startsAt,
      notes: 'Dolor abdominal',
    })
  })

  it('sends no notes when the patient wrote none', async () => {
    const user = userEvent.setup()
    let sent: Record<string, unknown> = {}
    server.use(
      http.post('*/api/appointments', async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ appointment: testAppointment }, { status: 201 })
      }),
    )
    render(form())

    await user.click(screen.getByRole('radio', { name: '9:00' }))
    await book(user)

    await waitFor(() => expect(router.push).toHaveBeenCalled())
    expect(sent).not.toHaveProperty('notes')
  })

  it('asks for a time when none was chosen, without sending', async () => {
    const user = userEvent.setup()
    let requests = 0
    server.use(
      http.post('*/api/appointments', () => {
        requests += 1
        return HttpResponse.json({ appointment: testAppointment }, { status: 201 })
      }),
    )
    render(form())

    await book(user)

    const group = screen.getByRole('group')
    expect(group).toHaveAttribute('aria-invalid', 'true')
    expect(group).toHaveAccessibleDescription(/Elige un horario\./)
    expect(screen.getByRole('radio', { name: '9:00' })).toHaveFocus()
    expect(requests).toBe(0)
  })

  it('reads the free times again when someone took the time first', async () => {
    const user = userEvent.setup()
    server.use(
      http.post('*/api/appointments', () =>
        HttpResponse.json({ error: 'This time slot was just booked' }, { status: 409 }),
      ),
    )
    render(form())

    await user.click(screen.getByRole('radio', { name: '9:00' }))
    await book(user)

    const title = await screen.findByText('No pudimos agendar tu cita')
    expect(title.closest('[role="alert"]')).toHaveTextContent(/Alguien acaba de tomar ese horario/)
    expect(router.refresh).toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('keeps the free times when booking failed for another reason', async () => {
    const user = userEvent.setup()
    server.use(http.post('*/api/appointments', () => HttpResponse.error()))
    render(form())

    await user.click(screen.getByRole('radio', { name: '9:00' }))
    await book(user)

    expect(await screen.findByText(/No pudimos conectar con el servicio/)).toBeInTheDocument()
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('books only once, however many times it is submitted while booking', async () => {
    let requests = 0
    server.use(
      http.post('*/api/appointments', () => {
        requests += 1
        return HttpResponse.json({ appointment: testAppointment }, { status: 201 })
      }),
    )
    render(form())
    fireEvent.click(screen.getByRole('radio', { name: '9:00' }))
    const element = screen.getByRole('button', { name: 'Agendar cita' }).closest('form')!

    fireEvent.submit(element)
    fireEvent.submit(element)

    await waitFor(() => expect(router.push).toHaveBeenCalledTimes(1))
    expect(requests).toBe(1)
  })

  it('can only be submitted once React runs, and never by GET', () => {
    const container = document.createElement('div')
    container.innerHTML = renderToString(form())

    expect(container.querySelector('form')).toHaveAttribute('method', 'post')
    expect(container.querySelector('button[type="submit"]')).toBeDisabled()
  })
})
