import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import HomePage from './page'

describe('HomePage', () => {
  it('has a main region, the skip link target, with one level 1 heading', () => {
    render(<HomePage />)

    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('heading', { level: 1, name: 'Clínica' })).toBeInTheDocument()
  })
})
