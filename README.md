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

# view combined logs (follow)
sudo docker compose logs -f

# stop and remove containers and network
sudo docker compose down
```

Notes:
- The stack is built to run all services in containers. `sudo` may be required if your user is not in the `docker` group.
- Backend: http://localhost:3000
- Frontend: http://localhost:3001

Admin API key (promote users to doctor)
-------------------------------------

The backend exposes an admin endpoint to promote a registered user to a doctor role: `POST /api/admin/promote`.
For production safety, set an `ADMIN_API_KEY` environment variable in `backend/.env` and include it on requests via the
`x-admin-key` header. Example:

```http
POST /api/admin/promote
x-admin-key: <your-admin-api-key>
Content-Type: application/json

{
	"userId": "<user-id>",
	"clinicName": "Clinic Name",
	"address": "123 Main St",
	"location": { "coordinates": [lng, lat] }
}
```

If `ADMIN_API_KEY` is not configured the endpoint requires an authenticated JWT that belongs to a user with the `admin` role.
Make sure to keep the API key secret and rotate it periodically. Don't commit real keys to git.


Database credentials (MongoDB created by init script in `database/init`):
- admin user (root): admin / adminpass
- app user on `shadowme` DB: shadowuser / shadowpass

Backend connection string (used in compose):
```
MONGODB_URI=mongodb://shadowuser:shadowpass@database:27017/shadowme?authSource=shadowme
```

If you want to avoid `sudo` for Docker, add your user to the docker group and re-login:

```bash
sudo usermod -aG docker $USER
# then either run `newgrp docker` or log out and back in
```

See the subfolder READMEs for per-service development notes.