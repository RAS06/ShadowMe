import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

vi.mock('./api', () => ({ default: vi.fn() }))
import api from './api'
import DoctorBookings from './DoctorBookings'

describe('DoctorBookings', () => {
  beforeEach(() => {
    api.mockReset()
    globalThis.alert = vi.fn()
    localStorage.setItem('sm_user', JSON.stringify({ profileId: 'doc1' }))
  })

  it('shows no booked appointments when none exist', async () => {
    api.mockResolvedValueOnce({ ok: true, json: async () => ({ appointments: [] }) })
    render(<DoctorBookings />)
    await waitFor(() => expect(api).toHaveBeenCalled())
    expect(screen.getByText(/No booked appointments/i)).toBeInTheDocument()
  })

  it('lists booked appointments and marks completed', async () => {
    const booked = [{ _id: 'b1', start: new Date().toISOString(), end: new Date(Date.now()+1800000).toISOString(), isBooked: true, appointmentId: 'a1', isCompleted: false }]
    // initial load
    api.mockResolvedValueOnce({ ok: true, json: async () => ({ appointments: booked }) })
    // mark completed returns appointment
    api.mockResolvedValueOnce({ ok: true, json: async () => ({ appointment: { ...booked[0], isCompleted: true } }) })

    render(<DoctorBookings />)
    await waitFor(() => expect(api).toHaveBeenCalled())
    expect(screen.getByText(/Mark completed/i)).toBeInTheDocument()
    const markBtn = screen.getByRole('button', { name: /Mark completed/i })
    await userEvent.click(markBtn)
    await waitFor(() => expect(api).toHaveBeenCalledTimes(2))
    expect(globalThis.alert).toHaveBeenCalledWith('Marked completed')
  })
})
