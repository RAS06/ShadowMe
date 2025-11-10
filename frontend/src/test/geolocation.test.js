import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Geolocation API Mock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have geolocation API available', () => {
    expect(navigator.geolocation).toBeDefined()
    expect(navigator.geolocation.getCurrentPosition).toBeDefined()
    expect(navigator.geolocation.watchPosition).toBeDefined()
    expect(navigator.geolocation.clearWatch).toBeDefined()
  })

  it('should successfully get current position', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    }

    navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition)
    })

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          expect(position.coords.latitude).toBe(40.7128)
          expect(position.coords.longitude).toBe(-74.0060)
          expect(position.coords.accuracy).toBe(10)
          resolve()
        }
      )
    })
  })

  it('should handle geolocation permission denied', async () => {
    const mockError = {
      code: 1, // PERMISSION_DENIED
      message: 'User denied geolocation'
    }

    navigator.geolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError)
    })

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          throw new Error('Should not succeed')
        },
        (error) => {
          expect(error.code).toBe(1)
          expect(error.message).toBe('User denied geolocation')
          resolve()
        }
      )
    })
  })

  it('should handle geolocation position unavailable', async () => {
    const mockError = {
      code: 2, // POSITION_UNAVAILABLE
      message: 'Position unavailable'
    }

    navigator.geolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError)
    })

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          throw new Error('Should not succeed')
        },
        (error) => {
          expect(error.code).toBe(2)
          expect(error.message).toBe('Position unavailable')
          resolve()
        }
      )
    })
  })

  it('should handle geolocation timeout', async () => {
    const mockError = {
      code: 3, // TIMEOUT
      message: 'Geolocation timeout'
    }

    navigator.geolocation.getCurrentPosition.mockImplementation((success, error) => {
      error(mockError)
    })

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          throw new Error('Should not succeed')
        },
        (error) => {
          expect(error.code).toBe(3)
          expect(error.message).toBe('Geolocation timeout')
          resolve()
        }
      )
    })
  })

  it('should support watchPosition', () => {
    const mockWatchId = 123
    navigator.geolocation.watchPosition.mockReturnValue(mockWatchId)

    const successCallback = vi.fn()
    const errorCallback = vi.fn()

    const watchId = navigator.geolocation.watchPosition(successCallback, errorCallback)

    expect(watchId).toBe(mockWatchId)
    expect(navigator.geolocation.watchPosition).toHaveBeenCalledWith(
      successCallback,
      errorCallback
    )
  })

  it('should support clearWatch', () => {
    const mockWatchId = 123

    navigator.geolocation.clearWatch(mockWatchId)

    expect(navigator.geolocation.clearWatch).toHaveBeenCalledWith(mockWatchId)
  })

  it('should parse position with all coordinate properties', async () => {
    const mockPosition = {
      coords: {
        latitude: 34.0522,
        longitude: -118.2437,
        accuracy: 5,
        altitude: 100,
        altitudeAccuracy: 2,
        heading: 90,
        speed: 10
      },
      timestamp: Date.now()
    }

    navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition)
    })

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition((position) => {
        expect(position.coords).toEqual(mockPosition.coords)
        expect(position.timestamp).toBeDefined()
        resolve()
      })
    })
  })

  it('should handle multiple successive position requests', () => {
    let callCount = 0
    const positions = [
      { coords: { latitude: 40.7128, longitude: -74.0060, accuracy: 10 }, timestamp: Date.now() },
      { coords: { latitude: 34.0522, longitude: -118.2437, accuracy: 8 }, timestamp: Date.now() },
      { coords: { latitude: 51.5074, longitude: -0.1278, accuracy: 12 }, timestamp: Date.now() }
    ]

    navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
      success(positions[callCount])
      callCount++
    })

    positions.forEach(() => {
      navigator.geolocation.getCurrentPosition(() => {})
    })

    expect(callCount).toBe(positions.length)
  })
})
