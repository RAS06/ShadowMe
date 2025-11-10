import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import BookAppointment from '../BookAppointment'

describe('BookAppointment Component', () => {
  beforeEach(() => {
    localStorage.clear()
    const mockUser = {
      fullName: 'John Student',
      email: 'john@example.com',
      role: 'student'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))
    localStorage.setItem('sm_token', 'mock-jwt-token')
  })

  it('should render request shadowing form', () => {
    render(
      <BrowserRouter>
        <BookAppointment />
      </BrowserRouter>
    )

    expect(screen.getByText(/Request Shadowing Opportunity/i)).toBeInTheDocument()
  })

  it('should have required fields', () => {
    render(
      <BrowserRouter>
        <BookAppointment />
      </BrowserRouter>
    )

    // Check for name field
    expect(screen.getByPlaceholderText(/Your full name/i)).toBeInTheDocument()
    
    // Check for email field
    expect(screen.getByPlaceholderText(/your.email@example.com/i)).toBeInTheDocument()
    
    // Check for school field
    expect(screen.getByPlaceholderText(/Harvard Medical School/i)).toBeInTheDocument()
  })

  it('should have submit button', () => {
    render(
      <BrowserRouter>
        <BookAppointment />
      </BrowserRouter>
    )

    const submitButton = screen.getByRole('button', { name: /Submit Shadowing Request/i })
    expect(submitButton).toHaveAttribute('type', 'submit')
  })
})
