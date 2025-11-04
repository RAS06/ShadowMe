# Backend

This directory contains the backend application for ShadowMe.

## Getting Started

### With Docker
```bash
docker-compose up backend
```

### Local Development
```bash
npm install
npm start
```

## Structure

The backend application will be built here using Node.js.

## Appointments API

New routes added under `/api/appointments`:

- GET `/api/appointments/nearby?lat=<lat>&lng=<lng>&radius=<meters>`
	- Returns nearby doctors with available openings (not booked).
- POST `/api/appointments/doctor/:doctorId/openings`
	- Doctor creates an opening. Body: { start: ISODateString, end?: ISODateString }
- POST `/api/appointments/book/:doctorId`
	- Student books an opening. Body: { start: ISODateString, studentId: <student id> }
- GET `/api/appointments/doctor/:doctorId`
	- Doctor lists their appointments.

Notes:
- All endpoints require the Authorization: Bearer <token> header (JWT).
- Doctor and Student profiles are stored in `doctors` and `students` collections.

