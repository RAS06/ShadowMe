# ShadowMe

Lightweight instructions to build and run the ShadowMe stack locally using Docker Compose.

Project structure (top-level):

```
ShadowMe/
├── backend/
├── frontend/
├── database/
├── docker-compose.yml
└── README.md
```

Quick start (build & run):

```bash
# build images and start services in the background
sudo docker compose up -d --build

## ShadowMe

ShadowMe is a small demo app for student/doctor appointment booking. This README documents how to run the project locally, the features implemented in the current sprint, how to use the app as a student/doctor/admin, and developer notes (tests, CI, debug helpers).

---

## Quick start (Docker Compose)

From the repository root:

```bash
# build images and start services in the background
sudo docker compose up -d --build

# view combined logs (follow)
sudo docker compose logs -f

# stop and remove containers and network
sudo docker compose down
```

Notes:
- The stack is built to run all services in containers. `sudo` may be required if your user is not in the `docker` group.
- Backend: http://localhost:3000
- Frontend: http://localhost:3001

---

## What was completed this sprint (features & use cases)

This section lists the user-visible and developer features implemented during the sprint and how to use them.

### 1) Student flows

- Search for nearby doctor openings by location and radius (UI uses kilometers):
	- Student Search controls input a radius in kilometers; the UI converts to meters before calling the backend.
	- API used: `GET /api/appointments/nearby?lat=<lat>&lng=<lng>&radius=<meters>`
	- The frontend components involved: `frontend/src/StudentSearchControls.jsx`, `frontend/src/StudentNearby.jsx`.

- Book an opening:
	- Students book via the UI which calls `POST /api/appointments/book/:doctorId` with `{ appointmentId }` or `{ start }` and `studentId` (or derived from JWT).
	- On success, the student appointment is added to the student's profile document in the DB and the doctor's opening is marked as booked.

- View and cancel your appointments:
	- The student's dashboard shows `StudentProfile` which fetches `/api/auth/me` and `/api/appointments/student`.
	- Cancel: the UI calls `DELETE /api/appointments/book/:doctorId` with `{ appointmentId }` or `{ start }`. The backend unbooks the doctor slot and removes the appointment from the student's appointments array.
	- Addresses: appointments render a human-readable `address` when available, otherwise fall back to `location` coordinates with links to Google Maps/OpenStreetMap.

### 2) Doctor flows

- Create appointment openings:
	- Doctors create openings via `POST /api/appointments/doctor/:doctorId/openings` with `start`, optional `end`, optional `location` (GeoJSON coordinates), and optional `address`.
	- Openings store `location` (Point) and optional `address` on the appointment subdocument.

- View bookings and mark completed:
	- Doctor endpoints return appointment lists with `address` (appointment.address || doctor's clinic address) and `bookedByName` when available (resolved from the `User` record linked to a student profile).
	- Doctor views use `frontend/src/DoctorOpenings.jsx` and `frontend/src/DoctorBookings.jsx`.

### 3) Authentication & profile

- JWT auth with refresh tokens:
	- Access tokens (`sm_token`) are short-lived JWTs stored client-side (example app stores in `localStorage`).
	- Refresh tokens are httpOnly cookies and are rotated when used.
	- Endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/revoke`, `/api/auth/me` (returns server-side user and linked profile info).

- Student profile name source:
	- The frontend prefers `/api/auth/me` as the source of truth for `fullName` / profile.name when rendering the student Name.
	- LocalStorage `sm_user` is used as a fallback when `/api/auth/me` fails.

### 4) Admin actions

- Promote a user to a doctor (admin-only): `POST /api/admin/promote`.
	- When `ADMIN_API_KEY` environment variable is set, use `x-admin-key` header to authenticate admin actions; otherwise the endpoint requires an admin JWT.

### 5) Developer / Debugging tools added

- Dev debug overlay: `frontend/src/DevDebug.jsx` (rendered from `main.jsx`) shows the current `sm_token` presence and parsed `sm_user` (development-only). Useful for reproducing auth-related issues.

- SPA routing fix: `frontend/server.js` now serves `dist/index.html` for unknown static routes so the SPA client-side router works when you visit deep links.

- Added server-side debug logging on key routes in development:
	- `GET /api/auth/me` logs the returned user shape when NODE_ENV !== 'production'.
	- `GET /api/appointments/student` logs the returned appointments when NODE_ENV !== 'production'.

### 6) Tests & CI

- Unit and integration tests:
	- Backend tests use Jest + Supertest and `mongodb-memory-server` for an in-memory MongoDB during tests.
	- Frontend tests use Vitest + Testing Library.

- CI (GitHub Actions): added `.github/workflows/ci.yml` which runs on `pull_request` and executes:
	- `backend` job: `npm ci` and `npm test -- --coverage` in `backend/` and uploads `backend/coverage/lcov.info` to Codecov.
	- `frontend` job: `npm ci` and `npm test -- --run --coverage` in `frontend/` and uploads `frontend/coverage/lcov.info` to Codecov.

	Notes: set `CODECOV_TOKEN` in repository Secrets if your repo is private.

---

## Development notes & commands

From project root:

- Build images and start locally (Docker Compose):

```bash
sudo docker compose up -d --build
```

- Rebuild only frontend and restart container (useful after changing React code):

```bash
docker compose build frontend && docker compose up -d frontend
```

- Rebuild backend after changes and restart:

```bash
docker compose build backend && docker compose up -d backend
```

- Run backend tests locally:

```bash
cd backend
npm ci
npm test
# with coverage
npm test -- --coverage
```

- Run frontend tests locally:

```bash
cd frontend
npm ci
npm test -- --run
# with coverage
npm test -- --run --coverage
```

---

## Data models (summary)

- `User` stores auth data and links to a profile via `profileId`. `User.fullName` is the canonical display name.
- `Doctor` stores clinic-level info and an `appointments` array as subdocuments. Appointment subdocuments include `appointmentId`, `start`, `end`, `location` (Point), optional `address`, `isBooked`, `bookedByStudentId`, and `isCompleted`.
- `Student` stores `address`, `location`, and a small `appointments` array of booked items (doctorId, start, end, optional location/address).

---

## Troubleshooting

- If the frontend returns `require is not defined` in the browser, make sure the frontend was built using the ESM Vite build and that the runtime `index-*.js` served by `frontend/server.js` contains no `require(...)` calls. Rebuild frontend with `docker compose build frontend` if necessary.

- If student names appear as `(not set)`:
	- Confirm `/api/auth/me` returns `user.fullName` and `user.profile.name`. Use the DevDebug overlay or the browser Network tab to inspect the `/api/auth/me` response.
	- If `/api/auth/me` is missing or returning incomplete info, check backend logs (backend has dev logging enabled for the `/me` route in development).

- If appointments lack addresses:
	- Backend maps appointment `address` to `appointment.address || doctor.address`. When booking, the student's copy of the appointment includes `address = slot.address || doc.address`.
	- If both are missing, the frontend will render location coordinates if available.

---

## Next steps / backlog suggestions

- Persist `bookedByName` at booking time to avoid repeated lookups on reads.
- Add integration tests that run against docker-compose services to verify end-to-end flows (booking, cancelling, admin promote).
- Improve token refresh on the frontend to gracefully handle expired access tokens and automatic refresh using the refresh-token cookie.
- Add richer address geocoding on the frontend when doctors create openings (help users provide human-friendly addresses).

---

If you'd like, I can also add a `CONTRIBUTING.md` that outlines the local dev workflow, branch naming, and PR expectations (tests passing + Codecov threshold).