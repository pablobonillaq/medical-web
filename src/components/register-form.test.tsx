import { server } from '@mocks/node'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { useRouter } from 'next/navigation'
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { StoreProvider } from '@/store/store-provider'
import { RegisterForm } from './register-form'

// Outside Next.js there is no router: the test checks where the form sends the visitor
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }))

const router = { replace: vi.fn(), refresh: vi.fn() }

beforeEach(() => {
  router.replace = vi.fn()
  router.refresh = vi.fn()
  vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>)
})

const renderForm = (labels = es.register, locale: 'es' | 'en' = 'es') =>
  render(
    <StoreProvider>
      <RegisterForm labels={labels} locale={locale} />
    </StoreProvider>,
  )

// A fictitious patient
const fillIn = async () => {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/^Nombre/), 'Ana')
  await user.type(screen.getByLabelText(/Apellidos/), 'García López')
  fireEvent.change(screen.getByLabelText(/Fecha de nacimiento/), {
    target: { value: '1990-05-21' },
  })
  await user.type(screen.getByLabelText(/Teléfono celular/), '55 1234 5678')
  await user.type(screen.getByLabelText(/Correo electrónico/), 'ana.garcia@test.com')
  await user.type(screen.getByLabelText(/Contraseña/), '12345678')
  await user.click(screen.getByLabelText('Quiero recibir recordatorios por correo'))
  return user
}

const submit = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Crear cuenta' }))

const newPatient = {
  id: 'a1b2c3d4-0000-4000-8000-000000000001',
  email: 'ana.garcia@test.com',
  role: 'patient',
}

describe('RegisterForm', () => {
  it('asks for the data the browser can fill in, with hints for the phone and the password', () => {
    renderForm()

    expect(screen.getByLabelText(/^Nombre/)).toHaveAttribute('autocomplete', 'given-name')
    expect(screen.getByLabelText(/Fecha de nacimiento/)).toHaveAttribute('type', 'date')
    expect(screen.getByLabelText(/Teléfono celular/)).toHaveAccessibleDescription(
      'Diez dígitos, por ejemplo 55 1234 5678.',
    )
    expect(screen.getByLabelText(/Contraseña/)).toHaveAttribute('autocomplete', 'new-password')
    expect(screen.getByRole('group', { name: 'Recordatorios de tus citas' })).toBeInTheDocument()
  })

  it('explains what to fix next to each field and moves the focus to the first one', async () => {
    renderForm()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Teléfono celular/), '123')

    await submit(user)

    const firstName = screen.getByLabelText(/^Nombre/)
    expect(firstName).toHaveFocus()
    expect(firstName).toHaveAccessibleDescription('Error: Escribe tu nombre.')
    expect(screen.getByLabelText(/Teléfono celular/)).toHaveAccessibleDescription(
      'Error: Escribe un celular de México con 10 dígitos. Diez dígitos, por ejemplo 55 1234 5678.',
    )
    expect(screen.getByLabelText(/Fecha de nacimiento/)).toHaveAccessibleDescription(
      'Error: Escribe tu fecha de nacimiento.',
    )
  })

  it('creates the account, signs in and goes to the new account', async () => {
    let registered: Record<string, unknown> = {}
    server.use(
      http.post('*/api/auth/register', async ({ request }) => {
        registered = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ patient: {} }, { status: 201 })
      }),
      http.post('*/api/auth/login', () => HttpResponse.json({ user: newPatient })),
    )
    renderForm()
    const user = await fillIn()

    await submit(user)

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/es/account'))
    expect(router.refresh).toHaveBeenCalled()
    expect(registered).toMatchObject({
      firstName: 'Ana',
      phone: '5512345678',
      emailRemindersOptIn: true,
      whatsappOptIn: false,
    })
  })

  it('goes to sign in when the account was created but the session did not start', async () => {
    server.use(
      http.post('*/api/auth/register', () => HttpResponse.json({ patient: {} }, { status: 201 })),
      http.post('*/api/auth/login', () => HttpResponse.error()),
    )
    renderForm(es.register, 'es')
    const user = await fillIn()

    await submit(user)

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/es/login'))
  })

  it('announces why the account could not be created and stays on the page', async () => {
    server.use(
      http.post('*/api/auth/register', () =>
        HttpResponse.json({ error: 'Email is already registered' }, { status: 409 }),
      ),
    )
    renderForm()
    const user = await fillIn()

    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya existe una cuenta con ese correo. Inicia sesión o usa otro correo.',
    )
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('ignores a second submit while the first one is running', async () => {
    let requests = 0
    server.use(
      http.post('*/api/auth/register', async () => {
        requests += 1
        await new Promise((resolve) => setTimeout(resolve, 50))
        return HttpResponse.json({ patient: {} }, { status: 201 })
      }),
      http.post('*/api/auth/login', () => HttpResponse.json({ user: newPatient })),
    )
    renderForm()
    await fillIn()
    const form = screen.getByRole('button', { name: 'Crear cuenta' }).closest('form')!

    fireEvent.submit(form)
    fireEvent.submit(form)

    await waitFor(() => expect(router.replace).toHaveBeenCalledTimes(1))
    expect(requests).toBe(1)
  })

  it('can only be submitted once React runs, and never by GET', () => {
    const container = document.createElement('div')
    container.innerHTML = renderToString(
      <StoreProvider>
        <RegisterForm labels={es.register} locale="es" />
      </StoreProvider>,
    )

    expect(container.querySelector('form')).toHaveAttribute('method', 'post')
    expect(container.querySelector('button[type="submit"]')).toBeDisabled()
  })

  it('speaks the language of the page', () => {
    renderForm(en.register, 'en')

    expect(screen.getByLabelText(/Date of birth/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
  })
})
