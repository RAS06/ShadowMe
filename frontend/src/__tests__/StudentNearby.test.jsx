import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import StudentNearby from '../StudentNearby'

describe('StudentNearby', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows results after search by address', async () => {
    // mock geocode
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => [{ lat: '37.78', lon: '-122.42' }] })
    // mock nearby API
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => [{ id: 'd1', clinicName: 'Clinic', openings: [{ appointmentId: 'a1', start: new Date().toISOString(), location: { coordinates: [-122.42, 37.78] } }] }] })

    render(<StudentNearby />)

    // type address into search control
    const input = screen.getByLabelText(/Address:/i)
    fireEvent.change(input, { target: { value: '123 Test St' } })
    const btn = screen.getByText(/Search/i)
    fireEvent.click(btn)

    await waitFor(() => {
      expect(screen.getByText(/Clinic/)).toBeInTheDocument()
    })
  })
})
