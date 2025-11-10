# Admin API Documentation

## Authentication

All admin endpoints require an admin API key to be passed in the request headers.

**Header:** `X-Admin-API-Key: your-admin-key-here`

**Default API Key (development):** `shadowme-admin-key-2025-secure`

> **⚠️ Security Note:** In production, use a strong, randomly generated API key and store it securely in environment variables.

---

## Endpoints

### 1. Promote User to Doctor

Promotes a user from student role to doctor role.

**Endpoint:** `POST /api/admin/users/:userId/promote-to-doctor`

**Headers:**
```
X-Admin-API-Key: shadowme-admin-key-2025-secure
Content-Type: application/json
```

**URL Parameters:**
- `userId` - The user's UUID

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/admin/users/12345678-1234-1234-1234-123456789abc/promote-to-doctor \
  -H "X-Admin-API-Key: shadowme-admin-key-2025-secure"
```

**Success Response (200):**
```json
{
  "message": "User successfully promoted to doctor",
  "user": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "email": "jane@example.com",
    "fullName": "Jane Doe",
    "role": "doctor",
    "updatedAt": "2025-11-06T10:30:00.000Z"
  }
}
```

**Error Responses:**

**400 - User Already a Doctor:**
```json
{
  "error": "User is already a doctor",
  "message": "User Jane Doe (jane@example.com) is already marked as a doctor"
}
```

**404 - User Not Found:**
```json
{
  "error": "User not found",
  "message": "No user found with ID: 12345678-1234-1234-1234-123456789abc"
}
```

**401 - Missing API Key:**
```json
{
  "error": "Admin API key required",
  "message": "Please provide X-Admin-API-Key header"
}
```

**403 - Invalid API Key:**
```json
{
  "error": "Invalid admin API key",
  "message": "The provided API key is not valid"
}
```

---

### 2. Demote Doctor to Student

Demotes a user from doctor role back to student role.

**Endpoint:** `POST /api/admin/users/:userId/demote-to-student`

**Headers:**
```
X-Admin-API-Key: shadowme-admin-key-2025-secure
Content-Type: application/json
```

**URL Parameters:**
- `userId` - The user's UUID

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/admin/users/12345678-1234-1234-1234-123456789abc/demote-to-student \
  -H "X-Admin-API-Key: shadowme-admin-key-2025-secure"
```

**Success Response (200):**
```json
{
  "message": "User successfully demoted to student",
  "user": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "email": "jane@example.com",
    "fullName": "Jane Doe",
    "role": "student",
    "updatedAt": "2025-11-06T10:35:00.000Z"
  }
}
```

**Error Responses:**

**403 - Cannot Demote Admin:**
```json
{
  "error": "Cannot demote admin users",
  "message": "Admin users cannot be demoted through this endpoint"
}
```

---

### 3. Get User by Email

Find a user by their email address to get their userId.

**Endpoint:** `GET /api/admin/users/by-email/:email`

**Headers:**
```
X-Admin-API-Key: shadowme-admin-key-2025-secure
```

**URL Parameters:**
- `email` - The user's email address (URL encoded if necessary)

**Example Request:**
```bash
curl http://localhost:3000/api/admin/users/by-email/jane@example.com \
  -H "X-Admin-API-Key: shadowme-admin-key-2025-secure"
```

**Success Response (200):**
```json
{
  "user": {
    "id": "12345678-1234-1234-1234-123456789abc",
    "email": "jane@example.com",
    "fullName": "Jane Doe",
    "role": "student",
    "bio": "",
    "avatarUrl": "",
    "emailVerified": false,
    "lastLoginAt": "2025-11-06T10:00:00.000Z",
    "created_at": "2025-11-05T09:00:00.000Z",
    "updated_at": "2025-11-06T10:00:00.000Z"
  }
}
```

**Error Responses:**

**404 - User Not Found:**
```json
{
  "error": "User not found",
  "message": "No user found with email: jane@example.com"
}
```

---

### 4. List All Users

Get a list of all users, optionally filtered by role.

**Endpoint:** `GET /api/admin/users`

**Headers:**
```
X-Admin-API-Key: shadowme-admin-key-2025-secure
```

**Query Parameters:**
- `role` (optional) - Filter by role: `student`, `doctor`, or `admin`
- `limit` (optional) - Number of results to return (default: 50)
- `skip` (optional) - Number of results to skip for pagination (default: 0)

**Example Requests:**
```bash
# Get all users
curl http://localhost:3000/api/admin/users \
  -H "X-Admin-API-Key: shadowme-admin-key-2025-secure"

# Get only doctors
curl "http://localhost:3000/api/admin/users?role=doctor" \
  -H "X-Admin-API-Key: shadowme-admin-key-2025-secure"

# Get users with pagination
curl "http://localhost:3000/api/admin/users?limit=20&skip=0" \
  -H "X-Admin-API-Key: shadowme-admin-key-2025-secure"
```

**Success Response (200):**
```json
{
  "users": [
    {
      "id": "12345678-1234-1234-1234-123456789abc",
      "email": "jane@example.com",
      "fullName": "Jane Doe",
      "role": "doctor",
      "bio": "",
      "avatarUrl": "",
      "emailVerified": false,
      "lastLoginAt": "2025-11-06T10:00:00.000Z",
      "created_at": "2025-11-05T09:00:00.000Z",
      "updated_at": "2025-11-06T10:30:00.000Z"
    },
    {
      "id": "87654321-4321-4321-4321-cba987654321",
      "email": "john@example.com",
      "fullName": "John Smith",
      "role": "student",
      "bio": "",
      "avatarUrl": "",
      "emailVerified": false,
      "lastLoginAt": "2025-11-06T09:00:00.000Z",
      "created_at": "2025-11-04T08:00:00.000Z",
      "updated_at": "2025-11-06T09:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "skip": 0,
    "returned": 2
  }
}
```

---

## Common Workflow

### Promoting a User to Doctor

1. **Find the user by email:**
   ```bash
   curl http://localhost:3000/api/admin/users/by-email/jane@example.com \
     -H "X-Admin-API-Key: shadowme-admin-key-2025-secure"
   ```

2. **Copy the `id` from the response**

3. **Promote the user to doctor:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/users/<USER_ID>/promote-to-doctor \
     -H "X-Admin-API-Key: shadowme-admin-key-2025-secure"
   ```

4. **Verify the change:**
   ```bash
   curl "http://localhost:3000/api/admin/users?role=doctor" \
     -H "X-Admin-API-Key: shadowme-admin-key-2025-secure"
   ```

---

## Testing with Postman or Thunder Client

1. **Create a new request**
2. **Set method** to `POST` or `GET` depending on endpoint
3. **Set URL** to `http://localhost:3000/api/admin/users/...`
4. **Add Header:**
   - Key: `X-Admin-API-Key`
   - Value: `shadowme-admin-key-2025-secure`
5. **Send request**

---

## Security Best Practices

1. **Never commit the API key** to version control
2. **Use environment variables** for the API key
3. **Rotate the API key regularly** in production
4. **Log all admin actions** (already implemented - check backend logs)
5. **Use HTTPS** in production to encrypt the API key in transit
6. **Consider IP whitelisting** for admin endpoints
7. **Implement rate limiting** for admin endpoints

---

## Environment Variables

Set in `docker-compose.yml` or `.env`:

```
ADMIN_API_KEY=your-secure-random-key-here
```

Default: `shadowme-admin-key-2025-secure` (for development only)
