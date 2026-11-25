import { testAppointment, testAvailability } from '@mocks/appointments'
import { server } from '@mocks/node'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { useRouter } from 'next/navigation'
import { renderToString } from 'react-dom/server'
import { Provider } from 'react-redux'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/toast'
import { es } from '@/i18n/dictionaries/es'
import { makeStore } from '@/store/store'
import { StoreProvider } from '@/store/store-provider'
import { RescheduleForm } from './reschedule-form'

// Outside Next.js there is no router: the test checks where the form sends the patient
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }))

const router = { push: vi.fn(), refresh: vi.fn() }

beforeEach(() => {
  router.push = vi.fn()
  router.refresh = vi.fn()
  vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>)
})

const [, nineFortyFive] = testAvailability.slots

const form = () => (
  <StoreProvider>
    <ToastProvider>
      <RescheduleForm
        appointmentId={testAppointment.id}
        locale="es"
        labels={es.reschedulePage}
        legend="Horarios disponibles el jueves, 26 de noviembre de 2026"
        slots={[{ startsAt: nineFortyFive.startsAt, label: '9:45' }]}
      />
    </ToastProvider>
  </StoreProvider>
)

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Cambiar a este horario' }))

describe('RescheduleForm', () => {
  it('moves the appointment to the chosen time, says so and opens it', async () => {
    const user = userEvent.setup()
    let sent: unknown
    server.use(
      http.patch('*/api/appointments/:id/reschedule', async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({
          appointment: { ...testAppointment, startsAt: nineFortyFive.startsAt },
        })
      }),
    )
    render(form())

    expect(
      screen.getByRole('group', {
        name: 'Horarios disponibles el jueves, 26 de noviembre de 2026',
      }),
    ).toHaveAccessibleDescription('Horas de la clínica, en la Ciudad de México.')
    await user.click(screen.getByRole('radio', { name: '9:45' }))
    await submit(user)

    expect(await screen.findByText('Cambiamos tu cita.')).toBeInTheDocument()
    expect(router.push).toHaveBeenCalledWith(`/es/appointments/${testAppointment.id}`)
    expect(sent).toEqual({ startsAt: nineFortyFive.startsAt })
  })

  it('asks for a time when none was chosen, without sending', async () => {
    const user = userEvent.setup()
    let requests = 0
    server.use(
      http.patch('*/api/appointments/:id/reschedule', () => {
        requests += 1
        return HttpResponse.json({ appointment: testAppointment })
      }),
    )
    render(form())

    await submit(user)

    const group = screen.getByRole('group')
    expect(group).toHaveAttribute('aria-invalid', 'true')
    expect(group).toHaveAccessibleDescription(/Elige un horario\./)
    expect(screen.getByRole('radio', { name: '9:45' })).toHaveFocus()
    expect(requests).toBe(0)
  })

  it('reads the free times again when someone took the time first', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch('*/api/appointments/:id/reschedule', () =>
        HttpResponse.json({ error: 'This time slot was just booked' }, { status: 409 }),
      ),
    )
    render(form())

    await user.click(screen.getByRole('radio', { name: '9:45' }))
    await submit(user)

    const title = await screen.findByText('No pudimos cambiar tu cita')
    expect(title.closest('[role="alert"]')).toHaveTextContent(/Alguien acaba de tomar ese horario/)
    expect(router.refresh).toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('keeps the page as it is when the change failed for another reason', async () => {
    const user = userEvent.setup()
    server.use(
      http.patch('*/api/appointments/:id/reschedule', () =>
        HttpResponse.json({ error: 'Too late' }, { status: 400 }),
      ),
    )
    render(form())

    await user.click(screen.getByRole('radio', { name: '9:45' }))
    await submit(user)

    expect(await screen.findByText(/Ya no es posible cambiar esta cita/)).toBeInTheDocument()
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('starts without the error of an earlier visit', async () => {
    // A store with the error left by an earlier visit to the form
    const store = makeStore({ reschedule: { rescheduling: false, rescheduleError: 'network' } })
    render(
      <Provider store={store}>
        <ToastProvider>
          <RescheduleForm
            appointmentId={testAppointment.id}
            locale="es"
            labels={es.reschedulePage}
            legend="Horarios"
            slots={[]}
          />
        </ToastProvider>
      </Provider>,
    )

    await waitFor(() => expect(store.getState().reschedule.rescheduleError).toBeNull())
    expect(screen.queryByText('No pudimos cambiar tu cita')).not.toBeInTheDocument()
  })

  it('moves it only once, however many times it is submitted', async () => {
    let requests = 0
    server.use(
      http.patch('*/api/appointments/:id/reschedule', () => {
        requests += 1
        return HttpResponse.json({ appointment: testAppointment })
      }),
    )
    render(form())
    fireEvent.click(screen.getByRole('radio', { name: '9:45' }))
    const element = screen.getByRole('button', { name: 'Cambiar a este horario' }).closest('form')!

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
