import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button, buttonVariants } from './button'

describe('Button', () => {
  it('is a primary, medium button that does not submit forms by default', () => {
    render(<Button>Guardar</Button>)

    const button = screen.getByRole('button', { name: 'Guardar' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveClass('bg-primary', 'min-h-11')
  })

  it('applies the variant, the size and extra classes', () => {
    render(
      <Button variant="danger" size="sm" className="w-full">
        Cancelar cita
      </Button>,
    )

    expect(screen.getByRole('button', { name: 'Cancelar cita' })).toHaveClass(
      'bg-danger',
      'min-h-9',
      'w-full',
    )
  })

  it('calls onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Confirmar</Button>)

    await user.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('submits its form when it is a submit button', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn((event: React.FormEvent) => {
      event.preventDefault()
    })
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Enviar</Button>
      </form>,
    )

    await user.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('while loading, keeps the focus, says so to screen readers and ignores clicks', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const onSubmit = vi.fn()
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading loadingLabel="guardando" onClick={onClick}>
          Guardar
        </Button>
      </form>,
    )
    const button = screen.getByRole('button', { name: 'Guardar (guardando)' })

    await user.click(button)

    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toBeEnabled()
    expect(button).toHaveFocus()
    expect(onClick).not.toHaveBeenCalled()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('can be disabled', () => {
    render(<Button disabled>Reservar</Button>)

    expect(screen.getByRole('button', { name: 'Reservar' })).toBeDisabled()
  })

  it('gives its classes to links that look like buttons', () => {
    expect(buttonVariants({ variant: 'secondary', size: 'lg' })).toContain('border-input')
  })
})
