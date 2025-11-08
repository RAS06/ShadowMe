import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

vi.mock('./api', () => ({ default: vi.fn() }))
import api from './api'
import StudentProfile from './StudentProfile'

describe('StudentProfile', () => {
  beforeEach(() => {
    api.mockReset()
    globalThis.alert = vi.fn()
    const user = { profileId: 'stu1', name: 'Alice', email: 'alice@example.com' }
    localStorage.setItem('sm_user', JSON.stringify(user))
  })

  it('shows profile and no appointments', async () => {
    api.mockResolvedValueOnce({ ok: true, json: async () => ({ appointments: [] }) })
    render(<StudentProfile />)
    await waitFor(() => expect(api).toHaveBeenCalled())
    expect(screen.getByText(/Your Profile/i)).toBeInTheDocument()
  // avoid matching the email; assert exact name text node
  expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText(/No appointments/i)).toBeInTheDocument()
  })

  it('edits and saves profile name', async () => {
    api.mockResolvedValueOnce({ ok: true, json: async () => ({ appointments: [] }) })
    render(<StudentProfile />)
    await waitFor(() => expect(api).toHaveBeenCalled())
    const editBtn = screen.getByRole('button', { name: /Edit/i })
    await userEvent.click(editBtn)
    const input = screen.getByLabelText(/Name:/i)
    await userEvent.clear(input)
    await userEvent.type(input, 'Bob')
    const saveBtn = screen.getByRole('button', { name: /Save/i })
    await userEvent.click(saveBtn)
    expect(globalThis.alert).toHaveBeenCalledWith('Profile saved')
    const stored = JSON.parse(localStorage.getItem('sm_user'))
    expect(stored.name).toBe('Bob')
  })

  it('lists appointments and cancels one', async () => {
    const appt = { appointmentId: 'a1', start: new Date().toISOString(), doctorId: 'doc1' }
    api.mockResolvedValueOnce({ ok: true, json: async () => ({ appointments: [appt] }) })
    // cancel endpoint
    api.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })

    render(<StudentProfile />)
    await waitFor(() => expect(api).toHaveBeenCalled())
    expect(screen.getByText(/Cancel/i)).toBeInTheDocument()
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i })
    await userEvent.click(cancelBtn)
    await waitFor(() => expect(api).toHaveBeenCalledTimes(2))
    expect(globalThis.alert).toHaveBeenCalledWith('Cancelled')
  })
})
