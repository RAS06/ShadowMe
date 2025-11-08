import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, beforeEach, expect } from 'vitest'

// Mock the api module
vi.mock('./api', () => {
  return {
    default: vi.fn()
  }
})

import api from './api'
import StudentNearby from './StudentNearby'

describe('StudentNearby', () => {
  beforeEach(() => {
    // default mock: nearby returns empty list
    api.mockReset()
    // mock alerts to avoid noisy dialogs in test
    globalThis.alert = vi.fn()
  })

  it('renders and shows no doctors when API returns empty', async () => {
    api.mockResolvedValueOnce({ ok: true, json: async () => [] })
    render(<StudentNearby />)

    // initial loading state may show
    expect(await screen.findByText(/Find Nearby Doctors/i)).toBeInTheDocument()
    await waitFor(() => expect(api).toHaveBeenCalled())
    expect(screen.getByText(/No doctors found/i)).toBeInTheDocument()
  })

  it('lists doctors and allows booking', async () => {
    const doctors = [
      {
        id: 'doc1',
        clinicName: 'Test Clinic',
        address: '123 Main St',
        openings: [
          { appointmentId: 'a1', start: new Date().toISOString(), isBooked: false }
        ]
      }
    ]

  // First call: nearby endpoint
  api.mockResolvedValueOnce({ ok: true, json: async () => doctors })
  // Second call: booking endpoint returns success
  api.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) })
  // Third call: nearby refresh after booking
  api.mockResolvedValueOnce({ ok: true, json: async () => doctors })

    // seed a fake user into localStorage
    localStorage.setItem('sm_user', JSON.stringify({ profileId: 'student1' }))

    render(<StudentNearby />)

    // wait for nearby to load
    expect(await screen.findByText(/Test Clinic/i)).toBeInTheDocument()
    const bookButton = screen.getByRole('button', { name: /Book/i })
    expect(bookButton).toBeInTheDocument()

  await userEvent.click(bookButton)

  // booking triggered api again and nearby was refreshed: total calls = 3
  await waitFor(() => expect(api).toHaveBeenCalledTimes(3))
    // after booking it alerts "Booked!"; since alert is window.alert we can mock it
    // but here we at least ensure no errors occurred and that nearby was refreshed (api called twice)
  })
})
