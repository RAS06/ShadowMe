import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

vi.mock('./api', () => ({ default: vi.fn() }))
import api from './api'
import DoctorOpenings from './DoctorOpenings'

describe('DoctorOpenings', () => {
  beforeEach(() => {
    api.mockReset()
    globalThis.alert = vi.fn()
    // seed doctor profile
    localStorage.setItem('sm_user', JSON.stringify({ profileId: 'doc1' }))
  })

  it('renders no openings when API returns empty', async () => {
    api.mockResolvedValueOnce({ ok: true, json: async () => ({ appointments: [] }) })
    render(<DoctorOpenings />)
    expect(await screen.findByText(/Your Openings/i)).toBeInTheDocument()
    await waitFor(() => expect(api).toHaveBeenCalled())
    expect(screen.getByText(/No openings yet/i)).toBeInTheDocument()
  })

  it('creates an opening and refreshes list', async () => {
    // initial load
    api.mockResolvedValueOnce({ ok: true, json: async () => ({ appointments: [] }) })
    // POST create returns ok
    api.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    // refresh returns one opening
    const openings = [{ _id: 'op1', start: new Date().toISOString(), end: new Date(Date.now()+1800000).toISOString(), isBooked: false }]
    api.mockResolvedValueOnce({ ok: true, json: async () => ({ appointments: openings }) })

    render(<DoctorOpenings />)
    // wait initial load
    await waitFor(() => expect(api).toHaveBeenCalled())

    // fill start input and submit
    const startInput = screen.getByLabelText(/Start:/i)
    const createButton = screen.getByRole('button', { name: /Create Opening/i })
  await userEvent.type(startInput, '2025-10-30T20:00')
  const latInput = screen.getByLabelText(/Location Lat:/i)
  const lngInput = screen.getByLabelText(/Lng:/i)
  await userEvent.type(latInput, '37.7749')
  await userEvent.type(lngInput, '-122.4194')
    await userEvent.click(createButton)

    // api was called 3 times (load, create, refresh)
    await waitFor(() => expect(api).toHaveBeenCalledTimes(3))
    expect(globalThis.alert).toHaveBeenCalledWith('Opening created')
    expect(screen.getByText(/available/i)).toBeInTheDocument()
  })
})
