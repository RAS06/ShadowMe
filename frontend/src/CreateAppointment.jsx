import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import NavBar from './NavBar'
import { useNavigate } from 'react-router-dom'

export default function CreateAppointment() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  function handleLogout() {
    localStorage.removeItem('sm_token')
    localStorage.removeItem('sm_user')
    navigate('/login')
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)

    try {
      const token = localStorage.getItem('sm_token')
      
      const response = await axios.post(
        `${API_URL}/api/appointments`,
        {
          specialty: data.specialty,
          description: data.description,
          date: data.date,
          availableSlots: parseInt(data.availableSlots),
          location: data.location || '',
          requirements: data.requirements || ''
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.status === 200 || response.status === 201) {
        setSubmitSuccess(true)
        reset() // Clear the form
        
        // Show success message for 3 seconds, then optionally redirect
        setTimeout(() => {
          setSubmitSuccess(false)
          navigate('/appointments/manage')
        }, 2000)
      }
    } catch (error) {
      console.error('Error creating opportunity:', error)
      
      if (error.response) {
        // Server responded with error
        const errorMsg = error.response.data.message || error.response.data.error || 'Failed to create opportunity'
        setSubmitError(errorMsg)
        
        // Special handling for doctor access error
        if (error.response.status === 403) {
          setTimeout(() => {
            navigate('/dashboard')
          }, 3000)
        }
      } else if (error.request) {
        // Request made but no response
        setSubmitError('No response from server. Please try again.')
      } else {
        // Something else happened
        setSubmitError('Failed to create opportunity. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <NavBar onLogout={handleLogout} />
      
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h2>Post Shadowing Opportunity</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>
          Create a new shadowing opportunity for medical students.
        </p>

        {submitSuccess && (
          <div
            style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: 16,
              borderRadius: 4,
              marginBottom: 20,
              border: '1px solid #c3e6cb'
            }}
          >
            ✓ Opportunity posted successfully! Redirecting to management page...
          </div>
        )}

        {submitError && (
          <div
            style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: 16,
              borderRadius: 4,
              marginBottom: 20,
              border: '1px solid #f5c6cb'
            }}
          >
            ✗ {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 16 }}>
          {/* Specialty */}
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Specialty <span style={{ color: 'red' }}>*</span>
            </label>
            <select
              {...register('specialty', {
                required: 'Please select a specialty'
              })}
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                borderRadius: 4,
                border: errors.specialty ? '2px solid #dc3545' : '1px solid #ccc'
              }}
            >
              <option value="">-- Select Specialty --</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Emergency Medicine">Emergency Medicine</option>
              <option value="Family Medicine">Family Medicine</option>
              <option value="Internal Medicine">Internal Medicine</option>
              <option value="Neurology">Neurology</option>
              <option value="Obstetrics and Gynecology">Obstetrics and Gynecology</option>
              <option value="Oncology">Oncology</option>
              <option value="Ophthalmology">Ophthalmology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Psychiatry">Psychiatry</option>
              <option value="Radiology">Radiology</option>
              <option value="Surgery">Surgery</option>
              <option value="Other">Other</option>
            </select>
            {errors.specialty && (
              <span style={{ color: '#dc3545', fontSize: 14, marginTop: 4, display: 'block' }}>
                {errors.specialty.message}
              </span>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Description <span style={{ color: 'red' }}>*</span>
            </label>
            <textarea
              {...register('description', {
                required: 'Description is required',
                minLength: {
                  value: 20,
                  message: 'Description must be at least 20 characters'
                }
              })}
              rows={4}
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                borderRadius: 4,
                border: errors.description ? '2px solid #dc3545' : '1px solid #ccc',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              placeholder="Describe the shadowing opportunity, what students will learn, typical cases, etc..."
            />
            {errors.description && (
              <span style={{ color: '#dc3545', fontSize: 14, marginTop: 4, display: 'block' }}>
                {errors.description.message}
              </span>
            )}
          </div>

          {/* Date */}
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Date <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="date"
              {...register('date', {
                required: 'Date is required',
                validate: (value) => {
                  const selectedDate = new Date(value)
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return selectedDate >= today || 'Date cannot be in the past'
                }
              })}
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                borderRadius: 4,
                border: errors.date ? '2px solid #dc3545' : '1px solid #ccc'
              }}
            />
            {errors.date && (
              <span style={{ color: '#dc3545', fontSize: 14, marginTop: 4, display: 'block' }}>
                {errors.date.message}
              </span>
            )}
          </div>

          {/* Available Slots */}
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Available Slots <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="number"
              min="1"
              max="20"
              {...register('availableSlots', {
                required: 'Number of slots is required',
                min: {
                  value: 1,
                  message: 'Must have at least 1 slot'
                },
                max: {
                  value: 20,
                  message: 'Maximum 20 slots allowed'
                }
              })}
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                borderRadius: 4,
                border: errors.availableSlots ? '2px solid #dc3545' : '1px solid #ccc'
              }}
              placeholder="e.g., 3"
            />
            {errors.availableSlots && (
              <span style={{ color: '#dc3545', fontSize: 14, marginTop: 4, display: 'block' }}>
                {errors.availableSlots.message}
              </span>
            )}
          </div>

          {/* Location (Optional) */}
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Location
            </label>
            <input
              type="text"
              {...register('location')}
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                borderRadius: 4,
                border: '1px solid #ccc'
              }}
              placeholder="e.g., City Hospital - Cardiology Wing"
            />
          </div>

          {/* Requirements (Optional) */}
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
              Requirements
            </label>
            <textarea
              {...register('requirements')}
              rows={3}
              style={{
                width: '100%',
                padding: 10,
                fontSize: 16,
                borderRadius: 4,
                border: '1px solid #ccc',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
              placeholder="e.g., Professional attire required, vaccination records, etc..."
            />
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                fontSize: 16,
                fontWeight: 600,
                backgroundColor: isSubmitting ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Posting...' : 'Post Opportunity'}
            </button>

            <button
              type="button"
              onClick={() => reset()}
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                fontSize: 16,
                backgroundColor: 'white',
                color: '#6c757d',
                border: '1px solid #ccc',
                borderRadius: 4,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Clear Form
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
