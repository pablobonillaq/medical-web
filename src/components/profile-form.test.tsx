import { testProfile } from '@mocks/patients'
import { server } from '@mocks/node'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { useRouter } from 'next/navigation'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/toast'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import type { Patient } from '@/patients/types'
import { StoreProvider } from '@/store/store-provider'
import { ProfileForm } from './profile-form'

// Outside Next.js there is no router: the test checks that the page reads the profile again
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }))

const router = { replace: vi.fn(), refresh: vi.fn() }

beforeEach(() => {
  router.refresh = vi.fn()
  vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>)
})

const form = (patient: Patient = testProfile, labels = es.profilePage) => (
  <StoreProvider>
    <ToastProvider>
      <ProfileForm patient={patient} labels={labels} />
    </ToastProvider>
  </StoreProvider>
)

const save = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

describe('ProfileForm', () => {
  it('starts with the profile the API has, the phone as its 10 digits', () => {
    render(form())

    expect(screen.getByLabelText(/^Nombre/)).toHaveValue('Luz')
    expect(screen.getByLabelText(/Apellidos/)).toHaveValue('Méndez')
    expect(screen.getByLabelText(/Fecha de nacimiento/)).toHaveValue('1990-05-21')
    expect(screen.getByLabelText(/Teléfono celular/)).toHaveValue('5512345678')
    expect(screen.getByLabelText('Correo para recordatorios')).toHaveValue('')
    expect(screen.getByLabelText('Quiero recibir recordatorios por correo')).toBeChecked()
    expect(screen.getByLabelText('Quiero recibir recordatorios por WhatsApp')).not.toBeChecked()
  })

  it("says where reminders go when there is no contact email: the account's email", () => {
    render(form())

    expect(screen.getByLabelText('Correo para recordatorios')).toHaveAccessibleDescription(
      'Déjalo vacío para recibirlos en el correo de tu cuenta: paciente@test.com.',
    )
  })

  it('saves the changes, says so and reads the profile again', async () => {
    const user = userEvent.setup()
    let sent: unknown
    server.use(
      http.patch(`*/api/patients/${testProfile.id}`, async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ patient: testProfile })
      }),
    )
    render(form())

    await user.clear(screen.getByLabelText(/Teléfono celular/))
    await user.type(screen.getByLabelText(/Teléfono celular/), '55 8765 4321')
    await user.type(screen.getByLabelText('Correo para recordatorios'), 'luz@correo.test')
    await user.click(screen.getByLabelText('Quiero recibir recordatorios por WhatsApp'))
    await save(user)

    expect(await screen.findByText('Guardamos tus cambios.')).toBeInTheDocument()
    expect(router.refresh).toHaveBeenCalled()
    expect(sent).toEqual({
      firstName: 'Luz',
      lastName: 'Méndez',
      birthDate: '1990-05-21',
      phone: '5587654321',
      contactEmail: 'luz@correo.test',
      emailRemindersOptIn: true,
      whatsappOptIn: true,
    })
  })

  it('explains each wrong field next to it and focuses the first one, without sending', async () => {
    const user = userEvent.setup()
    let requests = 0
    server.use(
      http.patch('*/api/patients/:id', () => {
        requests += 1
        return HttpResponse.json({ patient: testProfile })
      }),
    )
    render(form())

    await user.clear(screen.getByLabelText(/Teléfono celular/))
    await user.type(screen.getByLabelText('Correo para recordatorios'), 'luz@')
    await save(user)

    const phone = screen.getByLabelText(/Teléfono celular/)
    expect(phone).toHaveFocus()
    expect(phone).toHaveAccessibleDescription(/Escribe tu teléfono celular\./)
    expect(screen.getByLabelText('Correo para recordatorios')).toHaveAccessibleDescription(
      /Escribe un correo válido/,
    )
    expect(requests).toBe(0)
  })

  it('announces why saving failed', async () => {
    const user = userEvent.setup()
    server.use(http.patch('*/api/patients/:id', () => HttpResponse.error()))
    render(form())

    await save(user)

    // The toasts have their own alert region: this is the one in the form
    const title = await screen.findByText('No pudimos guardar tus cambios')
    expect(title.closest('[role="alert"]')).toHaveTextContent(
      'No pudimos conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.',
    )
    expect(router.refresh).not.toHaveBeenCalled()
  })

  it('sends only once, however many times it is submitted while saving', async () => {
    let requests = 0
    server.use(
      http.patch('*/api/patients/:id', () => {
        requests += 1
        return HttpResponse.json({ patient: testProfile })
      }),
    )
    render(form())
    const element = screen.getByRole('button', { name: 'Guardar cambios' }).closest('form')!

    fireEvent.submit(element)
    fireEvent.submit(element)

    await waitFor(() => expect(router.refresh).toHaveBeenCalledTimes(1))
    expect(requests).toBe(1)
  })

  it('speaks the language of the page, and leaves the account email out when there is none', () => {
    render(form({ ...testProfile, email: null, contactEmail: 'luz@correo.test' }, en.profilePage))

    expect(screen.getByLabelText('Email for reminders')).toHaveValue('luz@correo.test')
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeInTheDocument()
  })

  it('can only be submitted once React runs, and never by GET', () => {
    const container = document.createElement('div')
    container.innerHTML = renderToString(form())

    expect(container.querySelector('form')).toHaveAttribute('method', 'post')
    expect(container.querySelector('button[type="submit"]')).toBeDisabled()
  })
})
