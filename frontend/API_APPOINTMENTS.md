# Appointment Creation API Specification

## Endpoint
`POST /api/appointments`

## Authentication
Requires Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Request Body
```json
{
  "patientName": "John Doe",
  "patientEmail": "patient@example.com",
  "appointmentDate": "2025-11-15",
  "appointmentTime": "14:30",
  "reason": "checkup",
  "notes": "Optional additional notes"
}
```

## Field Validations

### patientName (required)
- Type: string
- Min length: 2 characters
- Example: "John Doe"

### patientEmail (required)
- Type: string
- Format: valid email
- Example: "patient@example.com"

### appointmentDate (required)
- Type: string (ISO date format)
- Format: YYYY-MM-DD
- Validation: Cannot be in the past
- Example: "2025-11-15"

### appointmentTime (required)
- Type: string
- Format: HH:mm (24-hour)
- Example: "14:30"

### reason (required)
- Type: string
- Allowed values:
  - "checkup" - Regular Checkup
  - "consultation" - Consultation
  - "follow-up" - Follow-up Visit
  - "emergency" - Emergency
  - "vaccination" - Vaccination
  - "other" - Other

### notes (optional)
- Type: string
- Additional information about the appointment

## Success Response
**Status Code:** 200 or 201

```json
{
  "message": "Appointment created successfully",
  "appointmentId": "507f1f77bcf86cd799439011",
  "appointment": {
    "patientName": "John Doe",
    "patientEmail": "patient@example.com",
    "appointmentDate": "2025-11-15",
    "appointmentTime": "14:30",
    "reason": "checkup",
    "notes": "",
    "doctorId": "507f1f77bcf86cd799439012",
    "createdAt": "2025-11-06T10:30:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input data",
  "details": [
    {
      "field": "patientEmail",
      "message": "Please enter a valid email address"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 500 Internal Server Error
```json
{
  "error": "Failed to create appointment"
}
```

## Frontend Implementation Notes

- Uses React Hook Form for form validation
- Uses Axios for HTTP requests
- Shows success message for 3 seconds after successful creation
- Form clears after successful submission
- All form fields are validated before submission
- Real-time validation errors displayed to user
