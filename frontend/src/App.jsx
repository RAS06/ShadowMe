import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function App() {
  const navigate = useNavigate()

  return (
    <div className="font-sans p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">ShadowMe</h1>
      <p className="mt-2 text-gray-700">This is the ShadowMe landing page. Use the buttons below to sign in or create a new account.</p>

      <div className="flex gap-3 mt-6">
        <button onClick={() => navigate('/login')} className="px-4 py-2 text-base bg-blue-600 text-white rounded">Log in</button>
        <button onClick={() => navigate('/signup')} className="px-4 py-2 text-base bg-gray-200 rounded">Sign up</button>
      </div>
    </div>
  )
}
