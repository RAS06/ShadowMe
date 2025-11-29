// Simple end-to-end script to exercise register -> promote -> create opening -> nearby -> book -> verify
// Run with: node scripts/e2e_test.js

const base = 'http://127.0.0.1:3000'

async function req(path, opts = {}) {
  const res = await fetch(base + path, opts)
  const text = await res.text()
  try { return { status: res.status, body: JSON.parse(text) } }
  catch (e) { return { status: res.status, body: text } }
}

function nowIso(daysFromNow=1, mins=0) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(10)
  d.setMinutes(mins)
  d.setSeconds(0)
  d.setMilliseconds(0)
  return d.toISOString()
}

async function main() {
  const uid = Date.now()
  const docEmail = `doc-${uid}@example.com`
  const studEmail = `stud-${uid}@example.com`
  const strongPwd = 'P@ssw0rd!!22'
  console.log('1) Register doctor', docEmail)
  let r = await req('/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: docEmail, password: strongPwd, fullName: 'Doc One' })
  })
  console.log('register doctor ->', r.status, r.body)

  console.log('2) Login doctor')
  r = await req('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: docEmail, password: strongPwd }) })
  console.log('login doctor ->', r.status, r.body)
  const docToken = r.body && r.body.token
  if (!docToken) throw new Error('doctor login failed')

  console.log('3) Promote to doctor using ADMIN_API_KEY env var')
  const adminKey = process.env.ADMIN_API_KEY || '(none)'
  const docUserId = r.body && r.body.user && r.body.user.id
  if (!docUserId) throw new Error('cannot find doctor user id for promote')
  r = await req('/api/admin/promote', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + docToken, 'x-admin-key': adminKey }, body: JSON.stringify({ userId: docUserId, role: 'doctor' }) })
  console.log('promote ->', r.status, r.body)

  console.log('4) Get my user info (doctor id)')
  // If promote returned a new token, use it
  const promoteToken = r.body && r.body.token
  const effectiveDocToken = promoteToken || docToken
  r = await req('/api/me', { headers: { Authorization: 'Bearer ' + effectiveDocToken } })
  console.log('me ->', r.status, r.body)
  // /api/me returns { user: { id, profileId } }
  const doctorId = (r.body && r.body.user && r.body.user.profileId) || (r.body && r.body.id)
  if (!doctorId) throw new Error('cannot get doctor id')

  console.log('5) Create opening with location')
  const start = nowIso(2, 0)
  const end = nowIso(2, 30)
  r = await req(`/api/appointments/doctor/${doctorId}/openings`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + docToken },
    body: JSON.stringify({ start, end, location: { type: 'Point', coordinates: [-122.4194, 37.7749] } })
  })
  console.log('create opening ->', r.status, r.body)

  console.log('6) Register student')
  console.log('6) Register student', studEmail)
  r = await req('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: studEmail, password: strongPwd, fullName: 'Stud One' }) })
  console.log('register student ->', r.status, r.body)

  console.log('7) Login student')
  r = await req('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: studEmail, password: strongPwd }) })
  console.log('login student ->', r.status, r.body)
  const studToken = r.body && r.body.token
  if (!studToken) throw new Error('student login failed')

  console.log('8) Nearby search (near the appointment)')
  r = await req('/api/appointments/nearby?lat=37.7750&lng=-122.4195&maxDistance=5000', { headers: { Authorization: 'Bearer ' + studToken } })
  console.log('nearby ->', r.status, JSON.stringify(r.body, null, 2))
  if (!Array.isArray(r.body) || r.body.length === 0) throw new Error('no nearby openings found')
  const first = r.body[0]
  const doctorIdFromNearby = first.id
  const slotId = first.openings && first.openings[0] && first.openings[0].appointmentId
  console.log('found slot', doctorIdFromNearby, slotId)

  console.log('9) Book the slot')
  r = await req(`/api/appointments/book/${doctorIdFromNearby}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + studToken }, body: JSON.stringify({ appointmentId: slotId }) })
  console.log('book ->', r.status, r.body)

  console.log('10) Verify student (via /api/me)')
  r = await req('/api/me', { headers: { Authorization: 'Bearer ' + studToken } })
  console.log('student me ->', r.status, JSON.stringify(r.body, null, 2))

  console.log('11) Verify doctor appointments (via /api/appointments/doctor/:doctorId)')
  r = await req(`/api/appointments/doctor/${doctorId}`, { headers: { Authorization: 'Bearer ' + docToken } })
  console.log('doctor appointments ->', r.status, JSON.stringify(r.body, null, 2))

  console.log('E2E done')
}

main().catch(err => { console.error('E2E error', err); process.exit(1) })
