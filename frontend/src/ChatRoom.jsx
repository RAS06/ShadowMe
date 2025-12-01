import React, { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

export default function ChatRoom({ appointmentId, doctorName, otherPartyName, onClose }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
  
  // Use otherPartyName if provided, otherwise fall back to doctorName for backwards compatibility
  const displayName = otherPartyName || doctorName || 'Other Party'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Get auth token
    const token = localStorage.getItem('token')
    if (!token) {
      console.error('No auth token found')
      return
    }

    // Connect to Socket.io - use secure WebSocket in production
    const socketUrl = window.location.protocol === 'https:' 
      ? window.location.origin 
      : 'http://localhost:3000'
    
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      console.log('Connected to chat server')
      setIsConnected(true)
      newSocket.emit('join-room', appointmentId)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from chat server')
      setIsConnected(false)
    })

    newSocket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message])
    })

    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    setSocket(newSocket)

    // Fetch chat history
    fetch(`/api/chat/appointment/${appointmentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.messages) {
          setMessages(data.messages)
        }
      })
      .catch(err => console.error('Failed to fetch chat history:', err))

    return () => {
      if (newSocket) {
        newSocket.emit('leave-room', appointmentId)
        newSocket.disconnect()
      }
    }
  }, [appointmentId])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !socket) return

    socket.emit('send-message', {
      appointmentId,
      message: newMessage.trim()
    })

    setNewMessage('')
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-3/4 flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Chat with {displayName}</h2>
            <p className="text-sm opacity-90">
              {isConnected ? '● Connected' : '○ Disconnected'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500 mt-8">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg, idx) => {
              const isOwnMessage = msg.senderId === currentUser.id
              return (
                <div
                  key={idx}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1">
                      {isOwnMessage ? 'You' : displayName}
                    </p>
                    <p className="break-words">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!isConnected || !newMessage.trim()}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
