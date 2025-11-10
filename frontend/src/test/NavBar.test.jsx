import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import NavBar from '../NavBar'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('NavBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should render navigation bar with Dashboard link', () => {
    const mockHandleLogout = vi.fn()

    render(
      <BrowserRouter>
        <NavBar onLogout={mockHandleLogout} />
      </BrowserRouter>
    )

    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
  })

  it('should display Dashboard link', () => {
    const mockHandleLogout = vi.fn()

    render(
      <BrowserRouter>
        <NavBar onLogout={mockHandleLogout} />
      </BrowserRouter>
    )

    const dashboardLink = screen.getByText(/Dashboard/i)
    expect(dashboardLink).toBeInTheDocument()
    expect(dashboardLink.closest('a')).toHaveAttribute('href', '/dashboard')
  })

  it('should show Post Opportunity link for doctor role', () => {
    const mockUser = {
      fullName: 'Dr Smith',
      email: 'drsmith@example.com',
      role: 'doctor'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))

    const mockHandleLogout = vi.fn()

    render(
      <BrowserRouter>
        <NavBar onLogout={mockHandleLogout} />
      </BrowserRouter>
    )

    const createLink = screen.getByText(/Post Opportunity/i)
    expect(createLink).toBeInTheDocument()
    expect(createLink.closest('a')).toHaveAttribute('href', '/appointments/create')
  })

  it('should show Request Shadowing link for all users', () => {
    const mockUser = {
      fullName: 'Student User',
      email: 'student@example.com',
      role: 'student'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))

    const mockHandleLogout = vi.fn()

    render(
      <BrowserRouter>
        <NavBar onLogout={mockHandleLogout} />
      </BrowserRouter>
    )

    const requestLink = screen.getByText(/Request Shadowing/i)
    expect(requestLink).toBeInTheDocument()
    expect(requestLink.closest('a')).toHaveAttribute('href', '/appointments/book')
  })

  it('should show Manage Opportunities link for doctor role', () => {
    const mockUser = {
      fullName: 'Dr Smith',
      email: 'drsmith@example.com',
      role: 'doctor'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))

    const mockHandleLogout = vi.fn()

    render(
      <BrowserRouter>
        <NavBar onLogout=  {mockHandleLogout} />
      </BrowserRouter>
    )

    const manageLink = screen.getByText(/Manage Opportunities/i)
    expect(manageLink).toBeInTheDocument()
    expect(manageLink.closest('a')).toHaveAttribute('href', '/appointments/manage')
  })

  it('should not show doctor links for student role', () => {
    const mockUser = {
      fullName: 'Student User',
      email: 'student@example.com',
      role: 'student'
    }
    localStorage.setItem('sm_user', JSON.stringify(mockUser))

    const mockHandleLogout = vi.fn()

    render(
      <BrowserRouter>
        <NavBar onLogout={mockHandleLogout} />
      </BrowserRouter>
    )

    expect(screen.queryByText(/Post Opportunity/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Manage Opportunities/i)).not.toBeInTheDocument()
  })

  it('should call onLogout when logout button is clicked', () => {
    const mockHandleLogout = vi.fn()

    render(
      <BrowserRouter>
        <NavBar onLogout={mockHandleLogout} />
      </BrowserRouter>
    )

    const logoutButton = screen.getByText(/Log out/i)
    fireEvent.click(logoutButton)

    expect(mockHandleLogout).toHaveBeenCalled()
  })
})
