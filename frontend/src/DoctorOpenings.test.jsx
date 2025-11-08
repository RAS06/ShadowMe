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
  // doctor profile load (clinic info)
  api.mockResolvedValueOnce({ ok: true, json: async () => ({ clinicName: '', address: '' }) })
    // POST create returns ok
    api.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
    // refresh returns one opening
    const openings = [{ _id: 'op1', start: new Date().toISOString(), end: new Date(Date.now()+1800000).toISOString(), isBooked: false }]
    api.mockResolvedValueOnce({ ok: true, json: async () => ({ appointments: openings }) })

    render(<DoctorOpenings />)
    // wait initial load
    await waitFor(() => expect(api).toHaveBeenCalled())

    // prepare a fake geocode response for Nominatim
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ([{ lat: '37.7749', lon: '-122.4194' }]) })
    // fill start input and submit
    const startInput = screen.getByLabelText(/Start:/i)
    const createButton = screen.getByRole('button', { name: /Create Opening/i })
  await userEvent.type(startInput, '2025-10-30T20:00')
  const addrInputs = screen.getAllByLabelText(/Address:/i)
  const addrInput = addrInputs.find(input => input.closest('form')) // Select the Address input within the Create Opening form
  await userEvent.type(addrInput, '1 Dr Carlton B Goodlett Pl, San Francisco, CA')
    await userEvent.click(createButton)

  // api was called 4 times (load openings, load doctor profile, create, refresh)
  await waitFor(() => expect(api).toHaveBeenCalledTimes(4))
    expect(globalThis.alert).toHaveBeenCalledWith('Opening created')
    expect(screen.getByText(/available/i)).toBeInTheDocument()
  })
})
