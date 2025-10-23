import React, {useState} from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: "Passwords don't match",
})

export default function Signup() {
  const [serverError, setServerError] = useState(null)
  const [loading, setLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values) => {
    setServerError(null)
    setLoading(true)
    try {
      // send only necessary fields
      const payload = { name: values.name, email: values.email, password: values.password }
      const resp = await axios.post('/signup', payload)
      // Expect 2xx on success
      if (resp.status >= 200 && resp.status < 300) {
        reset()
        alert('Signup successful — you can now log in')
      } else {
        setServerError('Unexpected server response')
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setServerError(err.response.data.error)
      } else if (err.message) {
        setServerError(err.message)
      } else {
        setServerError('An unknown error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{maxWidth: 420}} noValidate>
      <label style={{display: 'block', marginBottom: 8}}>
        Name
        <input {...register('name')} placeholder="Full name" style={{display: 'block', width: '100%', padding: 8}} />
        {errors.name && <div style={{color: 'crimson', marginTop: 6}}>{errors.name.message}</div>}
      </label>

      <label style={{display: 'block', marginBottom: 8}}>
        Email
        <input {...register('email')} placeholder="you@example.com" type="email" style={{display: 'block', width: '100%', padding: 8}} />
        {errors.email && <div style={{color: 'crimson', marginTop: 6}}>{errors.email.message}</div>}
      </label>

      <label style={{display: 'block', marginBottom: 8}}>
        Password
        <input {...register('password')} placeholder="At least 8 characters" type="password" style={{display: 'block', width: '100%', padding: 8}} />
        {errors.password && <div style={{color: 'crimson', marginTop: 6}}>{errors.password.message}</div>}
      </label>

      <label style={{display: 'block', marginBottom: 8}}>
        Confirm Password
        <input {...register('confirmPassword')} placeholder="Repeat password" type="password" style={{display: 'block', width: '100%', padding: 8}} />
        {errors.confirmPassword && <div style={{color: 'crimson', marginTop: 6}}>{errors.confirmPassword.message}</div>}
      </label>

      {serverError && <div style={{color: 'crimson', marginBottom: 8}}>{serverError}</div>}

      <button type="submit" disabled={loading} style={{padding: '10px 16px'}}>
        {loading ? 'Signing up...' : 'Create account'}
      </button>
    </form>
  )
}
