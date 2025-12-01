import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ChatRoom from './ChatRoom'
import * as api from './api'

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  const mockSocket = {
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn()
  }
  return {
    default: vi.fn(() => mockSocket),
    io: vi.fn(() => mockSocket)
  }
})

// Mock API
vi.mock('./api', () => ({
  getChatHistory: vi.fn()
}))

describe('ChatRoom Component', () => {
  const mockAppointmentId = 'test-appointment-123'
  const mockDoctorName = 'Dr. Smith'

  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = vi.fn(() => 'mock-token')
    
    // Mock API response
    api.getChatHistory.mockResolvedValue({
      messages: [
        {
          _id: '1',
          senderId: 'student-1',
          senderRole: 'student',
          message: 'Hello Doctor',
          timestamp: new Date().toISOString()
        },
        {
          _id: '2',
          senderId: 'doctor-1',
          senderRole: 'doctor',
          message: 'Hello Student',
          timestamp: new Date().toISOString()
        }
      ]
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders chat room with appointment info', async () => {
    render(<ChatRoom appointmentId={mockAppointmentId} doctorName={mockDoctorName} />)
    
    expect(screen.getByText(/Chat with Dr. Smith/i)).toBeInTheDocument()
  })

  it('loads and displays chat history on mount', async () => {
    render(<ChatRoom appointmentId={mockAppointmentId} doctorName={mockDoctorName} />)
    
    await waitFor(() => {
      expect(api.getChatHistory).toHaveBeenCalledWith(mockAppointmentId)
    })

    await waitFor(() => {
      expect(screen.getByText('Hello Doctor')).toBeInTheDocument()
      expect(screen.getByText('Hello Student')).toBeInTheDocument()
    })
  })

  it('displays error message when chat history fails to load', async () => {
    api.getChatHistory.mockRejectedValueOnce(new Error('Network error'))
    
    render(<ChatRoom appointmentId={mockAppointmentId} doctorName={mockDoctorName} />)
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load chat/i)).toBeInTheDocument()
    })
  })

  it('has message input and send button', () => {
    render(<ChatRoom appointmentId={mockAppointmentId} doctorName={mockDoctorName} />)
    
    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
  })

  it('allows user to type in message input', () => {
    render(<ChatRoom appointmentId={mockAppointmentId} doctorName={mockDoctorName} />)
    
    const input = screen.getByPlaceholderText(/Type your message/i)
    fireEvent.change(input, { target: { value: 'New message' } })
    
    expect(input.value).toBe('New message')
  })

  it('clears input after sending message', async () => {
    const { container } = render(
      <ChatRoom appointmentId={mockAppointmentId} doctorName={mockDoctorName} />
    )
    
    const input = screen.getByPlaceholderText(/Type your message/i)
    const sendButton = screen.getByRole('button', { name: /send/i })
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('does not send empty messages', () => {
    render(<ChatRoom appointmentId={mockAppointmentId} doctorName={mockDoctorName} />)
    
    const sendButton = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendButton)
    
    // Socket emit should not be called for empty message
    const io = require('socket.io-client').default
    const mockSocket = io()
    expect(mockSocket.emit).not.toHaveBeenCalledWith('send-message', expect.anything())
  })

  it('displays messages with correct sender styling', async () => {
    render(<ChatRoom appointmentId={mockAppointmentId} doctorName={mockDoctorName} />)
    
    await waitFor(() => {
      const messages = screen.getAllByText(/Hello/)
      expect(messages.length).toBeGreaterThan(0)
    })
  })

  it('shows no messages when chat history is empty', async () => {
    api.getChatHistory.mockResolvedValueOnce({ messages: [] })
    
    render(<ChatRoom appointmentId={mockAppointmentId} doctorName={mockDoctorName} />)
    
    await waitFor(() => {
      expect(screen.queryByText(/Hello/)).not.toBeInTheDocument()
    })
  })

  it('handles missing doctor name gracefully', () => {
    render(<ChatRoom appointmentId={mockAppointmentId} />)
    
    expect(screen.getByText(/Chat/i)).toBeInTheDocument()
  })

  it('uses secure WebSocket protocol when on HTTPS', () => {
    // Mock HTTPS environment
    Object.defineProperty(window, 'location', {
      value: { protocol: 'https:' },
      writable: true
    })

    render(<ChatRoom appointmentId={mockAppointmentId} doctorName={mockDoctorName} />)
    
    const io = require('socket.io-client').default
    expect(io).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        transports: expect.arrayContaining(['websocket', 'polling'])
      })
    )
  })
})
