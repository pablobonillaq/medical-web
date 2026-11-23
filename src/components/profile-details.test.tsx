import { testProfile } from '@mocks/patients'
import { server } from '@mocks/node'
import { fakeToken, testUsers } from '@mocks/session'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw/http'
import { cookies, headers } from 'next/headers'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider } from '@/components/ui/toast'
import { es } from '@/i18n/dictionaries/es'
import { StoreProvider } from '@/store/store-provider'
import { ProfileDetails, ProfileDetailsFallback } from './profile-details'

// Outside a Next.js request: the cookies, headers, language and router are set by hand
vi.mock('next/headers', () => ({ cookies: vi.fn(), headers: vi.fn() }))
vi.mock('next/root-params', () => ({ lang: vi.fn(async () => 'es') }))
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  useRouter: () => ({ refresh: () => {} }),
}))

const signedInAs = (user?: (typeof testUsers)[keyof typeof testUsers]) => {
  const token = user && fakeToken({ sub: user.id, exp: Date.now() / 1000 + 3600 })
  vi.mocked(cookies).mockResolvedValue({
    get: () => (token ? { name: 'access_token', value: token } : undefined),
  } as unknown as Awaited<ReturnType<typeof cookies>>)
  vi.mocked(headers).mockResolvedValue(new Headers() as Awaited<ReturnType<typeof headers>>)
  if (user) {
    server.use(http.get('http://localhost:3000/auth/me', () => HttpResponse.json({ user })))
  }
}

const details = () => ProfileDetails({ labels: es.profilePage })

const renderDetails = async () =>
  render(
    <StoreProvider>
      <ToastProvider>{await details()}</ToastProvider>
    </StoreProvider>,
  )

describe('ProfileDetails', () => {
  it("shows the patient's own profile, read with their session, ready to change", async () => {
    signedInAs(testUsers.patient)

    await renderDetails()

    expect(screen.getByLabelText(/^Nombre/)).toHaveValue(testProfile.firstName)
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument()
  })

  it('explains that the profile could not be loaded when the API fails', async () => {
    signedInAs(testUsers.patient)
    server.use(http.get('*/patients/me', () => HttpResponse.error()))

    await renderDetails()

    expect(screen.getByText('No pudimos cargar tu perfil')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument()
  })

  it('sends a visitor without a session to sign in', async () => {
    signedInAs()

    await expect(details()).rejects.toMatchObject({
      digest: expect.stringContaining(';/es/login?next=%2Fes%2Fprofile;'),
    })
  })

  it('answers 403 to anyone who is not a patient', async () => {
    signedInAs(testUsers.employee)
    // forbidden() only works with experimental.authInterrupts, which sets this variable
    process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS = 'true'

    try {
      await expect(details()).rejects.toMatchObject({ digest: 'NEXT_HTTP_ERROR_FALLBACK;403' })
    } finally {
      delete process.env.__NEXT_EXPERIMENTAL_AUTH_INTERRUPTS
    }
  })

  it('says that the profile is loading, for screen readers too', () => {
    const { container } = render(<ProfileDetailsFallback label="Cargando tu perfil…" />)

    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Cargando tu perfil…')).toBeInTheDocument()
  })
})
