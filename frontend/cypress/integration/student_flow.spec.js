describe('Student flow', () => {
  it('doctor saves clinic info and student searches and books', () => {
    // This is a lightweight, not fully end-to-end spec because the test environment here may not run the app.
    // It demonstrates the user interactions we'd expect in Cypress.

    // Visit the app
    cy.visit('/')

    // Developer: ensure a dev seed exists or log in as doctor first
    // Open doctor dashboard
    cy.contains('Doctor').click()

    // On doctor page, fill clinic name and address
    cy.get('input[value=""]').first().type('Cypress Clinic')
    cy.get('input').contains('Address').type('1 Market St, San Francisco')
    cy.contains('Save Clinic Info').click()

    // Now switch to student and search
    cy.visit('/student')
    cy.get('input[aria-label="Address:"]').type('1 Market St, San Francisco')
    cy.contains('Search').click()

    // Wait and expect results
    cy.contains('Cypress Clinic')

    // Click Book on first result
    cy.contains('Book').first().click()
    cy.contains('Booked!')
  })
})
