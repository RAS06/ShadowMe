import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../Dashboard'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should render dashboard with welcome message', () => {
    const mockUser = {
      fullName: 'Test User',
      email: 'test@example.com',
      role: 'student'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    expect(screen.getByText(/Welcome back, Test User/i)).toBeInTheDocument()
  })

  it('should display student without doctor indicator', () => {
    const mockUser = {
      fullName: 'Student User',
      email: 'student@example.com',
      role: 'student'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    expect(screen.getByText(/Welcome back, Student User!/i)).toBeInTheDocument()
    expect(screen.queryByText(/\(Doctor\)/i)).not.toBeInTheDocument()
  })

  it('should display doctor with doctor indicator', () => {
    const mockUser = {
      fullName: 'Dr Smith',
      email: 'drsmith@example.com',
      role: 'doctor'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    expect(screen.getByText(/Welcome back, Dr Smith!/i)).toBeInTheDocument()
    expect(screen.getByText(/\(Doctor\)/i)).toBeInTheDocument()
  })

  it('should show Create Opportunity button for doctors', () => {
    const mockUser = {
      fullName: 'Dr Smith',
      email: 'drsmith@example.com',
      role: 'doctor'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    expect(screen.getByText(/\+ Post Opportunity/i)).toBeInTheDocument()
  })

  it('should show Manage Appointments button for doctors', () => {
    const mockUser = {
      fullName: 'Dr Smith',
      email: 'drsmith@example.com',
      role: 'doctor'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    expect(screen.getByText(/📋 Manage My Opportunities/i)).toBeInTheDocument()
  })

  it('should show Book Appointment button for students', () => {
    const mockUser = {
      fullName: 'Student User',
      email: 'student@example.com',
      role: 'student'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    expect(screen.getByText(/🩺 Request Shadowing/i)).toBeInTheDocument()
  })

  it('should not show doctor buttons for students', () => {
    const mockUser = {
      fullName: 'Student User',
      email: 'student@example.com',
      role: 'student'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    expect(screen.queryByText(/📋 Post Opportunity/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/⚙️ Manage Opportunities/i)).not.toBeInTheDocument()
  })

  it('should navigate to create appointment when clicking Create Opportunity', () => {
    const mockUser = {
      fullName: 'Dr Smith',
      email: 'drsmith@example.com',
      role: 'doctor'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    const createButton = screen.getByText(/\+ Post Opportunity/i)
    expect(createButton.closest('a')).toHaveAttribute('href', '/appointments/create')
  })

  it('should navigate to book appointment when clicking Request Opportunity', () => {
    const mockUser = {
      fullName: 'Student User',
      email: 'student@example.com',
      role: 'student'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    const bookButton = screen.getByText(/🩺 Request Shadowing/i)
    expect(bookButton.closest('a')).toHaveAttribute('href', '/appointments/book')
  })

  it('should navigate to manage appointments when clicking Manage button', () => {
    const mockUser = {
      fullName: 'Dr Smith',
      email: 'drsmith@example.com',
      role: 'doctor'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    const manageButton = screen.getByText(/📋 Manage My Opportunities/i)
    expect(manageButton.closest('a')).toHaveAttribute('href', '/appointments/manage')
  })
})
