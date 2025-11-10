import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import NavBar from './NavBar'
import { useNavigate } from 'react-router-dom'

export default function RequestShadowing() {
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [requestId, setRequestId] = useState(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  function handleLogout() {
    localStorage.removeItem('sm_token')
    localStorage.removeItem('sm_user')
    navigate('/login')
  }

  // Get user info from localStorage
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('sm_user')
      if (userStr) {
        return JSON.parse(userStr)
      }
    } catch (e) {
      console.error('Error parsing user info:', e)
    }
    return null
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setSubmitError('')
    setSubmitSuccess(false)

    try {
      const token = localStorage.getItem('sm_token')
      const user = getUserInfo()
      
      const response = await axios.post(
        `${API_URL}/api/shadowing/request`,
        {
          studentName: user?.fullName || data.studentName,
          studentEmail: user?.email || data.studentEmail,
          school: data.school,
          yearOfStudy: data.yearOfStudy,
          preferredDate: data.preferredDate,
          duration: data.duration,
          specialty: data.specialty,
          reasonForShadowing: data.reasonForShadowing,
          preferredDoctor: data.preferredDoctor || 'Any Available'
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
        setRequestId(response.data.requestId)
        reset() // Clear the form
      }
    } catch (error) {
      console.error('Error booking appointment:', error)
      
      if (error.response) {
        // Server responded with error
        setSubmitError(error.response.data.error || 'Failed to submit shadowing request')
      } else if (error.request) {
        // Request made but no response
        setSubmitError('No response from server. Please try again.')
      } else {
        // Something else happened
        setSubmitError('Failed to submit shadowing request. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const user = getUserInfo()

  return (
    <div style={{ padding: 24, minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <NavBar onLogout={handleLogout} />
      
      <div style={{ maxWidth: 700, margin: '0 auto', backgroundColor: 'white', padding: 32, borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2 style={{ marginBottom: 8, color: '#333' }}>🩺 Request Shadowing Opportunity</h2>
        <p style={{ color: '#666', marginBottom: 24, fontSize: 15 }}>
          Request to shadow a physician and gain valuable clinical experience. Complete the form below to submit your request.
        </p>

        {submitSuccess && (
          <div
            style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: 20,
              borderRadius: 6,
              marginBottom: 24,
              border: '1px solid #c3e6cb'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 24 }}>✓</span>
              <strong style={{ fontSize: 18 }}>Shadowing Request Submitted!</strong>
            </div>
            <p style={{ margin: '8px 0 0 32px', fontSize: 14 }}>
              Your shadowing request has been submitted. The physician will review and respond soon.
              {requestId && (
                <span style={{ display: 'block', marginTop: 4 }}>
                  Request ID: <strong>{requestId}</strong>
                </span>
              )}
            </p>
            <button
              onClick={() => setSubmitSuccess(false)}
              style={{
                marginTop: 12,
                marginLeft: 32,
                padding: '6px 14px',
                fontSize: 14,
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Submit Another Request
            </button>
          </div>
        )}

        {submitError && (
          <div
            style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: 16,
              borderRadius: 6,
              marginBottom: 20,
              border: '1px solid #f5c6cb'
            }}
          >
            <strong>✗ Error:</strong> {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: 20 }}>
          {/* Student Info Section */}
          <div style={{ backgroundColor: '#f8f9fa', padding: 16, borderRadius: 6, border: '1px solid #dee2e6' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: 16, color: '#495057' }}>Your Information</h3>
            
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                  Full Name <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  defaultValue={user?.fullName || ''}
                  {...register('studentName', {
                    required: 'Your name is required'
                  })}
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    borderRadius: 4,
                    border: errors.studentName ? '2px solid #dc3545' : '1px solid #ced4da',
                    backgroundColor: user?.fullName ? '#e9ecef' : 'white'
                  }}
                  placeholder="Your full name"
                  readOnly={!!user?.fullName}
                />
                {errors.studentName && (
                  <span style={{ color: '#dc3545', fontSize: 13, marginTop: 4, display: 'block' }}>
                    {errors.studentName.message}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                  Email Address <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="email"
                  defaultValue={user?.email || ''}
                  {...register('studentEmail', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address'
                    }
                  })}
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    borderRadius: 4,
                    border: errors.studentEmail ? '2px solid #dc3545' : '1px solid #ced4da',
                    backgroundColor: user?.email ? '#e9ecef' : 'white'
                  }}
                  placeholder="your.email@example.com"
                  readOnly={!!user?.email}
                />
                {errors.studentEmail && (
                  <span style={{ color: '#dc3545', fontSize: 13, marginTop: 4, display: 'block' }}>
                    {errors.studentEmail.message}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                    Medical School <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="text"
                    {...register('school', {
                      required: 'Medical school is required'
                    })}
                    style={{
                      width: '100%',
                      padding: 10,
                      fontSize: 15,
                      borderRadius: 4,
                      border: errors.school ? '2px solid #dc3545' : '1px solid #ced4da'
                    }}
                    placeholder="e.g., Harvard Medical School"
                  />
                  {errors.school && (
                    <span style={{ color: '#dc3545', fontSize: 13, marginTop: 4, display: 'block' }}>
                      {errors.school.message}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                    Year of Study <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    {...register('yearOfStudy', {
                      required: 'Year of study is required'
                    })}
                    style={{
                      width: '100%',
                      padding: 10,
                      fontSize: 15,
                      borderRadius: 4,
                      border: errors.yearOfStudy ? '2px solid #dc3545' : '1px solid #ced4da'
                    }}
                  >
                    <option value="">-- Select Year --</option>
                    <option value="ms1">MS1 (First Year)</option>
                    <option value="ms2">MS2 (Second Year)</option>
                    <option value="ms3">MS3 (Third Year)</option>
                    <option value="ms4">MS4 (Fourth Year)</option>
                    <option value="premed">Pre-Med</option>
                  </select>
                  {errors.yearOfStudy && (
                    <span style={{ color: '#dc3545', fontSize: 13, marginTop: 4, display: 'block' }}>
                      {errors.yearOfStudy.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Shadowing Details Section */}
          <div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16, color: '#495057' }}>Shadowing Request Details</h3>

            <div style={{ display: 'grid', gap: 16 }}>
              {/* Date and Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                    Preferred Start Date <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    type="date"
                    {...register('preferredDate', {
                      required: 'Please select a start date',
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
                      fontSize: 15,
                      borderRadius: 4,
                      border: errors.preferredDate ? '2px solid #dc3545' : '1px solid #ced4da'
                    }}
                  />
                  {errors.preferredDate && (
                    <span style={{ color: '#dc3545', fontSize: 13, marginTop: 4, display: 'block' }}>
                      {errors.preferredDate.message}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                    Duration <span style={{ color: 'red' }}>*</span>
                  </label>
                  <select
                    {...register('duration', {
                      required: 'Please select duration'
                    })}
                    style={{
                      width: '100%',
                      padding: 10,
                      fontSize: 15,
                      borderRadius: 4,
                      border: errors.duration ? '2px solid #dc3545' : '1px solid #ced4da'
                    }}
                  >
                    <option value="">-- Select Duration --</option>
                    <option value="half-day">Half Day (4 hours)</option>
                    <option value="full-day">Full Day (8 hours)</option>
                    <option value="1-week">1 Week</option>
                    <option value="2-weeks">2 Weeks</option>
                    <option value="1-month">1 Month</option>
                    <option value="flexible">Flexible</option>
                  </select>
                  {errors.duration && (
                    <span style={{ color: '#dc3545', fontSize: 13, marginTop: 4, display: 'block' }}>
                      {errors.duration.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Specialty */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                  Specialty of Interest <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  {...register('specialty', {
                    required: 'Please select a specialty'
                  })}
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    borderRadius: 4,
                    border: errors.specialty ? '2px solid #dc3545' : '1px solid #ced4da'
                  }}
                >
                  <option value="">-- Select Specialty --</option>
                  <option value="family-medicine">Family Medicine</option>
                  <option value="internal-medicine">Internal Medicine</option>
                  <option value="pediatrics">Pediatrics</option>
                  <option value="surgery">Surgery</option>
                  <option value="emergency-medicine">Emergency Medicine</option>
                  <option value="psychiatry">Psychiatry</option>
                  <option value="obstetrics-gynecology">Obstetrics & Gynecology</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="orthopedics">Orthopedics</option>
                  <option value="radiology">Radiology</option>
                  <option value="anesthesiology">Anesthesiology</option>
                  <option value="other">Other</option>
                </select>
                {errors.specialty && (
                  <span style={{ color: '#dc3545', fontSize: 13, marginTop: 4, display: 'block' }}>
                    {errors.specialty.message}
                  </span>
                )}
              </div>

              {/* Preferred Doctor */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                  Preferred Physician (Optional)
                </label>
                <select
                  {...register('preferredDoctor')}
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    borderRadius: 4,
                    border: '1px solid #ced4da'
                  }}
                >
                  <option value="">Any Available</option>
                  <option value="dr-smith">Dr. Sarah Smith - Family Medicine</option>
                  <option value="dr-johnson">Dr. Michael Johnson - Internal Medicine</option>
                  <option value="dr-williams">Dr. Emily Williams - Psychiatry</option>
                  <option value="dr-brown">Dr. James Brown - Surgery</option>
                </select>
              </div>

              {/* Reason for Shadowing */}
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
                  Why do you want to shadow? <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  {...register('reasonForShadowing', {
                    required: 'Please explain your interest in shadowing',
                    minLength: {
                      value: 20,
                      message: 'Please provide at least 20 characters'
                    }
                  })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 15,
                    borderRadius: 4,
                    border: errors.reasonForShadowing ? '2px solid #dc3545' : '1px solid #ced4da',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  placeholder="Describe your interest in this specialty, what you hope to learn, and why you want to shadow this physician..."
                />
                {errors.reasonForShadowing && (
                  <span style={{ color: '#dc3545', fontSize: 13, marginTop: 4, display: 'block' }}>
                    {errors.reasonForShadowing.message}
                  </span>
                )}
                <span style={{ fontSize: 13, color: '#6c757d', marginTop: 4, display: 'block' }}>
                  This helps physicians understand your goals and learning objectives.
                </span>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingTop: 16, borderTop: '1px solid #dee2e6' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '14px 32px',
                fontSize: 16,
                fontWeight: 600,
                backgroundColor: isSubmitting ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
                flex: 1
              }}
            >
              {isSubmitting ? 'Submitting Request...' : '🩺 Submit Shadowing Request'}
            </button>

            <button
              type="button"
              onClick={() => reset()}
              disabled={isSubmitting}
              style={{
                padding: '14px 24px',
                fontSize: 16,
                backgroundColor: 'white',
                color: '#6c757d',
                border: '1px solid #ced4da',
                borderRadius: 6,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              Clear
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div style={{ marginTop: 24, padding: 16, backgroundColor: '#e7f3ff', borderRadius: 6, border: '1px solid #b3d9ff' }}>
          <p style={{ margin: 0, fontSize: 14, color: '#004085' }}>
            <strong>📌 Important:</strong> Your request will be reviewed by the physician. You'll receive an email confirmation 
            if your shadowing request is approved. Please be professional and punctual if approved.
          </p>
        </div>
      </div>
    </div>
  )
}
