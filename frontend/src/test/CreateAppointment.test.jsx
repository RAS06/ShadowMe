import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import CreateAppointment from '../CreateAppointment'

describe('CreateAppointment Component', () => {
  beforeEach(() => {
    localStorage.clear()
    const mockUser = {
      fullName: 'Dr Smith',
      email: 'drsmith@example.com',
      role: 'doctor'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))
    localStorage.setItem('sm_token', 'mock-jwt-token')
  })

  it('should render create opportunity form', () => {
    render(
      <BrowserRouter>
        <CreateAppointment />
      </BrowserRouter>
    )

    expect(screen.getByText(/Post Shadowing Opportunity/i)).toBeInTheDocument()
  })

  it('should have required fields', () => {
    render(
      <BrowserRouter>
        <CreateAppointment />
      </BrowserRouter>
    )

    // Check for specialty dropdown
    expect(screen.getByText(/-- Select Specialty --/i)).toBeInTheDocument()
    
    // Check for description textarea
    expect(screen.getByPlaceholderText(/Describe the shadowing opportunity/i)).toBeInTheDocument()
    
    // Check for date field by type
    const dateInput = document.querySelector('input[type="date"]')
    expect(dateInput).toBeTruthy()
  })

  it('should have submit button', () => {
    render(
      <BrowserRouter>
        <CreateAppointment />
      </BrowserRouter>
    )

    const submitButton = screen.getByRole('button', { name: /Post Opportunity/i })
    expect(submitButton).toHaveAttribute('type', 'submit')
  })
})
