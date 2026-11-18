import { server } from '@mocks/node'
import { testUsers } from '@mocks/session'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw/http'
import { useRouter } from 'next/navigation'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { en } from '@/i18n/dictionaries/en'
import { es } from '@/i18n/dictionaries/es'
import { StoreProvider } from '@/store/store-provider'
import { LoginForm } from './login-form'

// Outside Next.js there is no router: the test checks where the form sends the visitor
vi.mock('next/navigation', () => ({ useRouter: vi.fn() }))

const router = { replace: vi.fn(), refresh: vi.fn() }

beforeEach(() => {
  router.replace = vi.fn()
  router.refresh = vi.fn()
  vi.mocked(useRouter).mockReturnValue(router as unknown as ReturnType<typeof useRouter>)
})

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

const renderForm = (labels = es.login, locale: 'es' | 'en' = 'es') =>
  render(
    <StoreProvider>
      <LoginForm labels={labels} locale={locale} />
    </StoreProvider>,
  )

const fillAndSubmit = async (email: string, password: string) => {
  const user = userEvent.setup()
  if (email) await user.type(screen.getByLabelText(/Correo electrónico/), email)
  if (password) await user.type(screen.getByLabelText(/Contraseña/), password)
  await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
  return user
}

const apiAnswers = (answer: () => Response | Promise<Response>) =>
  server.use(http.post('*/api/auth/login', answer))

describe('LoginForm', () => {
  it('has the email and password fields, filled in by the browser', () => {
    renderForm()

    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled()
    expect(screen.getByLabelText(/Correo electrónico/)).toHaveAttribute('autocomplete', 'email')
    expect(screen.getByLabelText(/Contraseña/)).toHaveAttribute('autocomplete', 'current-password')
    expect(screen.getByLabelText(/Contraseña/)).toHaveAttribute('type', 'password')
  })

  it('explains what to fix next to each field and moves the focus to the first one', async () => {
    renderForm()

    await fillAndSubmit('', '1234')

    const email = screen.getByLabelText(/Correo electrónico/)
    expect(email).toHaveAccessibleDescription('Error: Escribe tu correo electrónico.')
    expect(email).toHaveFocus()
    expect(screen.getByLabelText(/Contraseña/)).toHaveAccessibleDescription(
      'Error: La contraseña tiene al menos 8 caracteres.',
    )
  })

  it('moves the focus again on each submit with errors', async () => {
    renderForm()
    const user = await fillAndSubmit('', '')
    await user.click(screen.getByLabelText(/Contraseña/))

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }))

    expect(screen.getByLabelText(/Correo electrónico/)).toHaveFocus()
  })

  it('signs in and goes back to the page that asked for the session', async () => {
    apiAnswers(() => HttpResponse.json({ user: testUsers.patient }))
    window.history.replaceState(null, '', '/es/login?next=%2Fes%2Fappointments')
    renderForm()

    await fillAndSubmit(testUsers.patient.email, '12345678')

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/es/appointments'))
    expect(router.refresh).toHaveBeenCalled()
  })

  it('goes to the home page when there is no page to go back to', async () => {
    apiAnswers(() => HttpResponse.json({ user: testUsers.patient }))
    renderForm()

    await fillAndSubmit(testUsers.patient.email, '12345678')

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/es'))
  })

  it('announces why the sign-in failed and stays on the page', async () => {
    apiAnswers(() => HttpResponse.json({ error: 'Invalid email or password' }, { status: 401 }))
    renderForm()

    await fillAndSubmit(testUsers.patient.email, 'wrong-password')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos iniciar tu sesión' +
        'El correo o la contraseña no coinciden. Revísalos e inténtalo de nuevo.',
    )
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('ignores a second submit while the first one is running', async () => {
    let requests = 0
    apiAnswers(async () => {
      requests += 1
      await new Promise((resolve) => setTimeout(resolve, 50))
      return HttpResponse.json({ user: testUsers.patient })
    })
    renderForm()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/Correo electrónico/), testUsers.patient.email)
    await user.type(screen.getByLabelText(/Contraseña/), '12345678')
    const form = screen.getByRole('button', { name: 'Iniciar sesión' }).closest('form')!

    // A double click, or Enter pressed twice: the second submit comes while the first one runs
    fireEvent.submit(form)
    fireEvent.submit(form)

    await waitFor(() => expect(router.replace).toHaveBeenCalledTimes(1))
    expect(requests).toBe(1)
  })

  it('can only be submitted once React runs, and never by GET', () => {
    const container = document.createElement('div')
    container.innerHTML = renderToString(
      <StoreProvider>
        <LoginForm labels={es.login} locale="es" />
      </StoreProvider>,
    )

    expect(container.querySelector('form')).toHaveAttribute('method', 'post')
    expect(container.querySelector('button[type="submit"]')).toBeDisabled()
  })

  it('speaks the language of the page', () => {
    renderForm(en.login, 'en')

    expect(screen.getByLabelText(/Email/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
  })
})
