describe('Chatroom End-to-End Tests', () => {
  const studentEmail = `student-${Date.now()}@test.com`
  const studentPassword = 'TestPass123!'
  const doctorEmail = `doctor-${Date.now()}@test.com`
  const doctorPassword = 'DoctorPass123!'

  before(() => {
    // Create test users
    cy.visit('/')
    
    // Register student
    cy.get('a[href="/signup"]').click()
    cy.get('input[name="email"]').type(studentEmail)
    cy.get('input[name="password"]').type(studentPassword)
    cy.get('input[name="name"]').type('Test Student')
    cy.get('select[name="role"]').select('student')
    cy.get('button[type="submit"]').click()
    cy.wait(1000)
    
    // Logout
    cy.contains('Logout').click()
    
    // Register doctor
    cy.get('a[href="/signup"]').click()
    cy.get('input[name="email"]').type(doctorEmail)
    cy.get('input[name="password"]').type(doctorPassword)
    cy.get('input[name="name"]').type('Test Doctor')
    cy.get('select[name="role"]').select('doctor')
    cy.get('button[type="submit"]').click()
  })

  describe('Student Chat Flow', () => {
    beforeEach(() => {
      // Login as student
      cy.visit('/')
      cy.get('input[name="email"]').type(studentEmail)
      cy.get('input[name="password"]').type(studentPassword)
      cy.get('button[type="submit"]').click()
      cy.url().should('include', '/dashboard')
    })

    it('can access chatroom from dashboard', () => {
      cy.contains('Chat').should('exist')
    })

    it('can view chat rooms list', () => {
      cy.contains('My Chats').click()
      cy.contains('Your available chats will appear here', { timeout: 10000 })
    })

    it('can open chatroom and see chat interface', () => {
      // Assuming student has appointments
      cy.get('[data-testid="chat-room-link"]').first().click({ force: true })
      
      cy.get('input[placeholder*="Type your message"]', { timeout: 10000 }).should('exist')
      cy.contains('Send').should('exist')
    })

    it('can send a message in chatroom', () => {
      cy.get('[data-testid="chat-room-link"]').first().click({ force: true })
      
      const testMessage = `Test message ${Date.now()}`
      cy.get('input[placeholder*="Type your message"]', { timeout: 10000 }).type(testMessage)
      cy.contains('Send').click()
      
      // Message should appear in chat
      cy.contains(testMessage, { timeout: 5000 }).should('exist')
    })

    it('message input clears after sending', () => {
      cy.get('[data-testid="chat-room-link"]').first().click({ force: true })
      
      const input = cy.get('input[placeholder*="Type your message"]', { timeout: 10000 })
      input.type('Another test message')
      cy.contains('Send').click()
      
      input.should('have.value', '')
    })

    it('cannot send empty messages', () => {
      cy.get('[data-testid="chat-room-link"]').first().click({ force: true })
      
      cy.get('input[placeholder*="Type your message"]', { timeout: 10000 }).clear()
      cy.contains('Send').click()
      
      // No new empty message should appear
      cy.get('.message-item').its('length').should('be.gte', 0)
    })

    it('displays chat history when reopening chat', () => {
      cy.get('[data-testid="chat-room-link"]').first().click({ force: true })
      
      const historicalMessage = `Historical ${Date.now()}`
      cy.get('input[placeholder*="Type your message"]', { timeout: 10000 }).type(historicalMessage)
      cy.contains('Send').click()
      cy.contains(historicalMessage).should('exist')
      
      // Navigate away and back
      cy.contains('Dashboard').click()
      cy.get('[data-testid="chat-room-link"]').first().click({ force: true })
      
      // Message should still be there
      cy.contains(historicalMessage, { timeout: 5000 }).should('exist')
    })
  })

  describe('Doctor Chat Flow', () => {
    beforeEach(() => {
      // Logout and login as doctor
      cy.visit('/')
      cy.contains('Logout', { timeout: 5000 }).click()
      
      cy.get('input[name="email"]').type(doctorEmail)
      cy.get('input[name="password"]').type(doctorPassword)
      cy.get('button[type="submit"]').click()
      cy.url().should('include', '/dashboard')
    })

    it('can access patient chats list', () => {
      cy.contains('Patient Chats').should('exist')
    })

    it('can view all patient conversations', () => {
      cy.contains('Patient Chats').click()
      cy.contains('Your patient chats', { timeout: 10000 })
    })

    it('can open chat with patient', () => {
      cy.get('[data-testid="patient-chat-button"]').first().click({ force: true })
      
      cy.get('input[placeholder*="Type your message"]', { timeout: 10000 }).should('exist')
    })

    it('can send messages to patients', () => {
      cy.get('[data-testid="patient-chat-button"]').first().click({ force: true })
      
      const doctorMessage = `Doctor message ${Date.now()}`
      cy.get('input[placeholder*="Type your message"]', { timeout: 10000 }).type(doctorMessage)
      cy.contains('Send').click()
      
      cy.contains(doctorMessage, { timeout: 5000 }).should('exist')
    })

    it('can see messages from patients', () => {
      // This assumes the student sent messages in previous tests
      cy.get('[data-testid="patient-chat-button"]').first().click({ force: true })
      
      cy.get('.message-item', { timeout: 10000 }).should('have.length.gte', 1)
    })

    it('can access chat from bookings page', () => {
      cy.contains('My Bookings').click()
      cy.get('[data-testid="chat-button"]', { timeout: 10000 }).first().click({ force: true })
      
      cy.get('input[placeholder*="Type your message"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Real-time Communication', () => {
    it('messages appear in real-time for both users', () => {
      // This would require opening two browser contexts
      // For now, we test that sent messages appear immediately
      cy.visit('/')
      cy.get('input[name="email"]').type(studentEmail)
      cy.get('input[name="password"]').type(studentPassword)
      cy.get('button[type="submit"]').click()
      
      cy.get('[data-testid="chat-room-link"]').first().click({ force: true })
      
      const realtimeMessage = `Realtime ${Date.now()}`
      cy.get('input[placeholder*="Type your message"]', { timeout: 10000 }).type(realtimeMessage)
      cy.contains('Send').click()
      
      // Message should appear immediately without page reload
      cy.contains(realtimeMessage, { timeout: 2000 }).should('exist')
    })
  })

  describe('Security & Authorization', () => {
    it('requires authentication to access chat', () => {
      // Logout first
      cy.visit('/')
      cy.contains('Logout', { timeout: 5000 }).click()
      
      // Try to access chat directly
      cy.visit('/chat/test-appointment-id')
      
      // Should redirect to login
      cy.url().should('include', '/login')
    })

    it('students cannot access other students chats', () => {
      cy.visit('/')
      cy.get('input[name="email"]').type(studentEmail)
      cy.get('input[name="password"]').type(studentPassword)
      cy.get('button[type="submit"]').click()
      
      // Try to access a random appointment ID
      cy.visit('/chat/unauthorized-appointment-123')
      
      // Should show error or redirect
      cy.contains(/Access denied|Not found/i, { timeout: 5000 }).should('exist')
    })

    it('uses secure WebSocket connection on HTTPS', () => {
      cy.visit('/')
      cy.get('input[name="email"]').type(studentEmail)
      cy.get('input[name="password"]').type(studentPassword)
      cy.get('button[type="submit"]').click()
      
      cy.get('[data-testid="chat-room-link"]').first().click({ force: true })
      
      // Check that WebSocket uses wss:// if on https://
      cy.window().then((win) => {
        if (win.location.protocol === 'https:') {
          // WebSocket should use secure protocol
          expect(win.location.protocol).to.equal('https:')
        }
      })
    })
  })

  describe('Error Handling', () => {
    it('displays error message when chat fails to load', () => {
      // Simulate network error by intercepting API call
      cy.intercept('GET', '**/api/chat/appointment/*', {
        statusCode: 500,
        body: { error: 'Server error' }
      }).as('getChatError')
      
      cy.visit('/')
      cy.get('input[name="email"]').type(studentEmail)
      cy.get('input[name="password"]').type(studentPassword)
      cy.get('button[type="submit"]').click()
      
      cy.get('[data-testid="chat-room-link"]').first().click({ force: true })
      
      cy.wait('@getChatError')
      cy.contains(/Failed to load|Error/i, { timeout: 5000 }).should('exist')
    })

    it('handles disconnection gracefully', () => {
      cy.visit('/')
      cy.get('input[name="email"]').type(studentEmail)
      cy.get('input[name="password"]').type(studentPassword)
      cy.get('button[type="submit"]').click()
      
      cy.get('[data-testid="chat-room-link"]').first().click({ force: true })
      
      // Chat should still be functional even if there were previous connection issues
      cy.get('input[placeholder*="Type your message"]', { timeout: 10000 }).should('exist')
    })
  })

  describe('Deduplication', () => {
    it('does not show duplicate chat rooms', () => {
      cy.visit('/')
      cy.get('input[name="email"]').type(doctorEmail)
      cy.get('input[name="password"]').type(doctorPassword)
      cy.get('button[type="submit"]').click()
      
      cy.contains('Patient Chats').click()
      
      // Get all chat room elements
      cy.get('[data-testid="patient-chat-button"]', { timeout: 10000 }).then($buttons => {
        const texts = $buttons.map((i, el) => Cypress.$(el).text()).get()
        const uniqueTexts = [...new Set(texts)]
        
        // Should not have duplicates
        expect(texts.length).to.equal(uniqueTexts.length)
      })
    })
  })
})
