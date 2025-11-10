import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import axios from 'axios'
import NavBar from './NavBar'

// Zod schema for editing opportunities
const opportunitySchema = z.object({
  specialty: z.string().min(2, 'Specialty must be at least 2 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  date: z.string().refine((date) => {
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return selectedDate >= today
  }, 'Date cannot be in the past'),
  availableSlots: z.coerce.number().min(1, 'Must have at least 1 slot').max(20, 'Maximum 20 slots'),
  location: z.string().optional(),
  requirements: z.string().optional()
})

function ManageAppointments() {
  const navigate = useNavigate()
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [editingId, setEditingId] = useState(null)

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: zodResolver(opportunitySchema)
  })

  // Check if user is a doctor
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('sm_user') || '{}')
    if (user.role !== 'doctor') {
      setError('Only doctors can access this page')
      setTimeout(() => navigate('/dashboard'), 2000)
      return
    }
    fetchOpportunities()
  }, [navigate])

  const fetchOpportunities = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('sm_token')
      const response = await axios.get('http://localhost:3000/api/appointments/my-opportunities', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setOpportunities(response.data.opportunities || [])
      setError('')
    } catch (err) {
      console.error('Error fetching opportunities:', err)
      setError(err.response?.data?.error || 'Failed to load your opportunities')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (opportunity) => {
    setEditingId(opportunity.id)
    setValue('specialty', opportunity.specialty)
    setValue('description', opportunity.description)
    setValue('date', opportunity.date)
    setValue('availableSlots', opportunity.availableSlots)
    setValue('location', opportunity.location || '')
    setValue('requirements', opportunity.requirements || '')
    setSuccessMessage('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    reset()
    setError('')
  }

  const onSubmit = async (data) => {
    try {
      const token = localStorage.getItem('sm_token')
      await axios.put(
        `http://localhost:3000/api/appointments/${editingId}`,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSuccessMessage('Opportunity updated successfully!')
      setEditingId(null)
      reset()
      fetchOpportunities()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Error updating opportunity:', err)
      setError(err.response?.data?.error || 'Failed to update opportunity')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this opportunity? This cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('sm_token')
      await axios.delete(`http://localhost:3000/api/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccessMessage('Opportunity deleted successfully!')
      fetchOpportunities()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Error deleting opportunity:', err)
      setError(err.response?.data?.error || 'Failed to delete opportunity')
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'closed' : 'available'
    
    try {
      const token = localStorage.getItem('sm_token')
      await axios.patch(
        `http://localhost:3000/api/appointments/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSuccessMessage(`Opportunity ${newStatus === 'available' ? 'reopened' : 'closed'} successfully!`)
      fetchOpportunities()
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      console.error('Error updating status:', err)
      setError(err.response?.data?.error || 'Failed to update status')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('sm_token')
    localStorage.removeItem('sm_user')
    navigate('/login')
  }

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <NavBar onLogout={handleLogout} />
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <h2>Loading your opportunities...</h2>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <NavBar onLogout={handleLogout} />
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Manage Your Shadowing Opportunities</h1>
      
      {error && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c33'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: '#efe',
          border: '1px solid #cfc',
          borderRadius: '4px',
          color: '#3c3'
        }}>
          <strong>Success:</strong> {successMessage}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/appointments/create')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          + Create New Opportunity
        </button>
      </div>

      {opportunities.length === 0 ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
        }}>
          <h3>No opportunities yet</h3>
          <p>Create your first shadowing opportunity to get started!</p>
        </div>
      ) : (
        <div>
          <h2>Your Opportunities ({opportunities.length})</h2>
          {opportunities.map((opp) => (
            <div
              key={opp.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '20px',
                backgroundColor: editingId === opp.id ? '#f8f9fa' : 'white'
              }}
            >
              {editingId === opp.id ? (
                // Edit Form
                <form onSubmit={handleSubmit(onSubmit)}>
                  <h3>Edit Opportunity</h3>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Specialty *
                    </label>
                    <input
                      {...register('specialty')}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '16px'
                      }}
                    />
                    {errors.specialty && (
                      <span style={{ color: 'red', fontSize: '14px' }}>{errors.specialty.message}</span>
                    )}
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Description *
                    </label>
                    <textarea
                      {...register('description')}
                      rows={4}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '16px',
                        fontFamily: 'inherit'
                      }}
                    />
                    {errors.description && (
                      <span style={{ color: 'red', fontSize: '14px' }}>{errors.description.message}</span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Date *
                      </label>
                      <input
                        type="date"
                        {...register('date')}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '16px'
                        }}
                      />
                      {errors.date && (
                        <span style={{ color: 'red', fontSize: '14px' }}>{errors.date.message}</span>
                      )}
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Available Slots *
                      </label>
                      <input
                        type="number"
                        {...register('availableSlots')}
                        min="1"
                        max="20"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '16px'
                        }}
                      />
                      {errors.availableSlots && (
                        <span style={{ color: 'red', fontSize: '14px' }}>{errors.availableSlots.message}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Location
                    </label>
                    <input
                      {...register('location')}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '16px'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Requirements
                    </label>
                    <textarea
                      {...register('requirements')}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '16px',
                        fontFamily: 'inherit'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="submit"
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                // View Mode
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 10px 0' }}>
                        {opp.specialty}
                        <span style={{
                          marginLeft: '10px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: opp.status === 'available' ? '#d4edda' : '#f8d7da',
                          color: opp.status === 'available' ? '#155724' : '#721c24'
                        }}>
                          {opp.status === 'available' ? '✓ Open' : '✕ Closed'}
                        </span>
                      </h3>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Date:</strong> {new Date(opp.date).toLocaleDateString()}
                      </p>
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Available Slots:</strong> {opp.availableSlots}
                      </p>
                      {opp.location && (
                        <p style={{ margin: '5px 0', color: '#666' }}>
                          <strong>Location:</strong> {opp.location}
                        </p>
                      )}
                      <p style={{ margin: '10px 0' }}>{opp.description}</p>
                      {opp.requirements && (
                        <p style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}>
                          <strong>Requirements:</strong> {opp.requirements}
                        </p>
                      )}
                      <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#999' }}>
                        Created: {new Date(opp.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button
                      onClick={() => handleEdit(opp)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(opp.id, opp.status)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: opp.status === 'available' ? '#ffc107' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {opp.status === 'available' ? 'Close' : 'Reopen'}
                    </button>
                    <button
                      onClick={() => handleDelete(opp.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

export default ManageAppointments
