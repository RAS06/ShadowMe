describe('Frontend API-driven geo E2E', () => {
  const base = 'http://localhost:3000'
  const docId = 'cypress-dev-doc'
  const coords = [-122.419415, 37.7749295]

  it('creates doctor & opening then student nearby finds it', () => {
    // get dev seed token
    cy.request(`${base}/api/dev/seed-token`).then(seed => {
      expect(seed.status).to.eq(200)
      const token = seed.body.token
      expect(token).to.be.a('string')

      // create doctor via dev route
      cy.request({
        method: 'POST',
        url: `${base}/api/dev/create-doctor`,
        body: { id: docId, clinicName: 'Cypress Clinic', address: '1 Cypress St', doctorName: 'Dr Cypress', location: { coordinates: coords } }
      }).then(cr => {
        expect(cr.status).to.eq(200)

        // create opening as doctor (use seed token)
        cy.request({
          method: 'POST',
          url: `${base}/api/appointments/doctor/${docId}/openings`,
          headers: { Authorization: `Bearer ${token}` },
          body: { start: new Date(Date.now() + 24*60*60*1000).toISOString(), location: { coordinates: coords } }
        }).then(or => {
          expect(or.status).to.eq(200)

          // register a student nearby
          const sEmail = `cypress_student_${Date.now()}@example.com`
          cy.request({
            method: 'POST',
            url: `${base}/api/auth/register`,
            body: { email: sEmail, password: 'Testpass!@12', fullName: 'Cypress Student', profile: { address: '1 Cypress St', location: { coordinates: coords } } }
          }).then(sr => {
            expect(sr.status).to.eq(200)
            const sToken = sr.body.token
            expect(sToken).to.be.a('string')

            // nearby query as student
            cy.request({
              method: 'GET',
              url: `${base}/api/appointments/nearby`,
              headers: { Authorization: `Bearer ${sToken}` },
              qs: { lat: coords[1], lng: coords[0], radius: 500 }
            }).then(nr => {
              expect(nr.status).to.eq(200)
              expect(Array.isArray(nr.body)).to.be.true
              const found = nr.body.find(d => d.id === docId)
              expect(found).to.exist
              const opening = (found.openings || []).find(o => o.location && Array.isArray(o.location.coordinates))
              expect(opening).to.exist
              expect(opening.location.coordinates[0]).to.be.closeTo(coords[0], 0.0000001)
              expect(opening.location.coordinates[1]).to.be.closeTo(coords[1], 0.0000001)
            })
          })
        })
      })
    })
  })
})
