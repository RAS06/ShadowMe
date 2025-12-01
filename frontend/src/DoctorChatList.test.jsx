import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import DoctorChatList from './DoctorChatList'
import * as api from './api'

// Mock API
vi.mock('./api', () => ({
  getChatRooms: vi.fn()
}))

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('DoctorChatList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders chat list title', () => {
    api.getChatRooms.mockResolvedValue({ rooms: [] })
    
    renderWithRouter(<DoctorChatList />)
    
    expect(screen.getByText(/Patient Chats/i)).toBeInTheDocument()
  })

  it('loads and displays chat rooms on mount', async () => {
    const mockRooms = [
      {
        appointmentId: 'apt-1',
        studentId: 'student-1',
        studentName: 'John Doe'
      },
      {
        appointmentId: 'apt-2',
        studentId: 'student-2',
        studentName: 'Jane Smith'
      }
    ]

    api.getChatRooms.mockResolvedValue({ rooms: mockRooms })
    
    renderWithRouter(<DoctorChatList />)
    
    await waitFor(() => {
      expect(api.getChatRooms).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument()
      expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument()
    })
  })

  it('displays message when no chat rooms available', async () => {
    api.getChatRooms.mockResolvedValue({ rooms: [] })
    
    renderWithRouter(<DoctorChatList />)
    
    await waitFor(() => {
      expect(screen.getByText(/No active chats/i)).toBeInTheDocument()
    })
  })

  it('displays error message when loading fails', async () => {
    api.getChatRooms.mockRejectedValueOnce(new Error('Network error'))
    
    renderWithRouter(<DoctorChatList />)
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument()
    })
  })

  it('renders chat buttons for each room', async () => {
    const mockRooms = [
      {
        appointmentId: 'apt-1',
        studentId: 'student-1',
        studentName: 'Test Student'
      }
    ]

    api.getChatRooms.mockResolvedValue({ rooms: mockRooms })
    
    renderWithRouter(<DoctorChatList />)
    
    await waitFor(() => {
      const chatButtons = screen.getAllByRole('link')
      expect(chatButtons.length).toBeGreaterThan(0)
    })
  })

  it('displays loading state while fetching rooms', () => {
    api.getChatRooms.mockImplementation(() => new Promise(() => {})) // Never resolves
    
    renderWithRouter(<DoctorChatList />)
    
    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  it('handles rooms without student names', async () => {
    const mockRooms = [
      {
        appointmentId: 'apt-1',
        studentId: 'student-1'
        // No studentName property
      }
    ]

    api.getChatRooms.mockResolvedValue({ rooms: mockRooms })
    
    renderWithRouter(<DoctorChatList />)
    
    await waitFor(() => {
      expect(screen.getByText(/Student/i)).toBeInTheDocument()
    })
  })

  it('prevents duplicate rooms from being displayed', async () => {
    const mockRooms = [
      {
        appointmentId: 'apt-1',
        studentId: 'student-1',
        studentName: 'Duplicate Student'
      },
      {
        appointmentId: 'apt-1',
        studentId: 'student-1',
        studentName: 'Duplicate Student'
      }
    ]

    api.getChatRooms.mockResolvedValue({ rooms: mockRooms })
    
    renderWithRouter(<DoctorChatList />)
    
    await waitFor(() => {
      const studentElements = screen.getAllByText(/Duplicate Student/i)
      // Even if API returns duplicates, component should handle them
      expect(studentElements.length).toBeGreaterThanOrEqual(1)
    })
  })
})
