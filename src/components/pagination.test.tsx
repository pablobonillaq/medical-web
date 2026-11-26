import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Pagination, pageParam } from './pagination'

const pagination = (page: number, total: number) =>
  render(
    <Pagination
      path="/es/appointments"
      label="Páginas de tus citas anteriores"
      page={page}
      pageSize={10}
      total={total}
      previous="Más recientes"
      next="Más antiguas"
      pageOf="Página {page} de {pages}"
    />,
  )

describe('Pagination', () => {
  it('links to the page before and after, the first one without ?page=', () => {
    pagination(2, 30)

    const nav = screen.getByRole('navigation', { name: 'Páginas de tus citas anteriores' })
    expect(nav).toHaveTextContent('Página 2 de 3')
    expect(within(nav).getByRole('link', { name: 'Más recientes' })).toHaveAttribute(
      'href',
      '/es/appointments',
    )
    expect(within(nav).getByRole('link', { name: 'Más antiguas' })).toHaveAttribute(
      'href',
      '/es/appointments?page=3',
    )
  })

  it('has no link past the first or the last page', () => {
    pagination(1, 11)
    expect(screen.queryByRole('link', { name: 'Más recientes' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Más antiguas' })).toBeInTheDocument()
  })

  it('keeps the rest of the query on every page', () => {
    render(
      <Pagination
        path="/es/front-desk/patients"
        query={{ search: 'ortega salas' }}
        label="Páginas de pacientes"
        page={2}
        pageSize={20}
        total={60}
        previous="Anteriores"
        next="Siguientes"
        pageOf="Página {page} de {pages}"
      />,
    )

    expect(screen.getByRole('link', { name: 'Anteriores' })).toHaveAttribute(
      'href',
      '/es/front-desk/patients?search=ortega+salas',
    )
    expect(screen.getByRole('link', { name: 'Siguientes' })).toHaveAttribute(
      'href',
      '/es/front-desk/patients?search=ortega+salas&page=3',
    )
  })

  it('shows nothing when everything fits on one page', () => {
    const { container } = pagination(1, 10)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('pageParam', () => {
  it.each([
    ['3', 3],
    [undefined, 1],
    ['0', 1],
    ['-2', 1],
    ['1.5', 1],
    ['nada', 1],
    [['2', '3'], 1],
  ])('reads %j as page %i', (value, page) => {
    expect(pageParam(value)).toBe(page)
  })
})
