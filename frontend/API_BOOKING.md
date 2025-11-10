# Student Appointment Booking API Specification

## Endpoint
`POST /api/appointments/book`

## Authentication
Requires Bearer token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Request Body
```json
{
  "studentName": "Jane Doe",
  "studentEmail": "jane@example.com",
  "appointmentDate": "2025-11-15",
  "appointmentTime": "14:30",
  "appointmentType": "illness",
  "concernDescription": "I've been experiencing headaches for the past few days",
  "preferredDoctor": "dr-smith"
}
```

## Field Validations

### studentName (required)
- Type: string
- Automatically filled from logged-in user's profile
- Example: "Jane Doe"

### studentEmail (required)
- Type: string
- Format: valid email
- Automatically filled from logged-in user's profile
- Example: "jane@example.com"

### appointmentDate (required)
- Type: string (ISO date format)
- Format: YYYY-MM-DD
- Validation: Cannot be in the past
- Example: "2025-11-15"

### appointmentTime (required)
- Type: string
- Format: HH:mm (24-hour)
- Example: "14:30"

### appointmentType (required)
- Type: string
- Allowed values:
  - "general-checkup" - General Checkup
  - "illness" - Illness/Symptoms
  - "injury" - Injury
  - "mental-health" - Mental Health Support
  - "vaccination" - Vaccination
  - "prescription-refill" - Prescription Refill
  - "follow-up" - Follow-up Visit
  - "other" - Other

### concernDescription (required)
- Type: string
- Min length: 10 characters
- Description of symptoms or reason for visit
- Example: "I've been experiencing headaches for the past few days along with some dizziness"

### preferredDoctor (optional)
- Type: string
- Default: "Any Available"
- Allowed values:
  - "" (empty) - Any Available
  - "dr-smith" - Dr. Sarah Smith - General Practice
  - "dr-johnson" - Dr. Michael Johnson - Internal Medicine
  - "dr-williams" - Dr. Emily Williams - Mental Health
  - "dr-brown" - Dr. James Brown - Sports Medicine

## Success Response
**Status Code:** 201

```json
{
  "message": "Appointment booked successfully",
  "bookingId": "BK-1699276800000",
  "appointmentId": "1699276800000",
  "appointment": {
    "id": "1699276800000",
    "bookingId": "BK-1699276800000",
    "studentName": "Jane Doe",
    "studentEmail": "jane@example.com",
    "appointmentDate": "2025-11-15",
    "appointmentTime": "14:30",
    "appointmentType": "illness",
    "concernDescription": "I've been experiencing headaches for the past few days",
    "preferredDoctor": "dr-smith",
    "studentId": "507f1f77bcf86cd799439012",
    "status": "pending",
    "bookedAt": "2025-11-06T10:30:00.000Z"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields",
  "required": ["studentName", "studentEmail", "appointmentDate", "appointmentTime", "appointmentType", "concernDescription"]
}
```

```json
{
  "error": "Invalid email address"
}
```

```json
{
  "error": "Appointment date/time cannot be in the past"
}
```

```json
{
  "error": "Please provide a more detailed reason for your visit (at least 10 characters)"
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
  "error": "Failed to book appointment"
}
```

## Frontend Implementation Notes

- Uses React Hook Form for form validation
- Uses Axios for HTTP requests
- Auto-fills student name and email from localStorage (user profile)
- Shows booking confirmation with booking ID
- Success message stays visible and allows booking another appointment
- Form includes helpful info box about confirmation process
- Professional, student-friendly UI with clear sections
- Real-time validation errors displayed to user
- Textarea for detailed concern description
- Optional preferred doctor selection
