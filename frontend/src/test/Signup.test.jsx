import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Signup from '../Signup'

describe('Signup Component', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should render signup form', () => {
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    )

    expect(screen.getByRole('heading', { name: /Sign up/i })).toBeInTheDocument()
  })

  it('should have all required fields', () => {
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    )

    expect(screen.getByPlaceholderText(/Your full name/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Confirm your password/i)).toBeInTheDocument()
  })

  it('should have submit button', () => {
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    )

    const submitButton = screen.getByRole('button', { name: /Sign up/i })
    expect(submitButton).toHaveAttribute('type', 'submit')
  })
})
