# ShadowMe

[![CI - Unit Tests](https://github.com/RAS06/ShadowMe/actions/workflows/ci.yml/badge.svg)](https://github.com/RAS06/ShadowMe/actions/workflows/ci.yml)
[![Pull Request Checks](https://github.com/RAS06/ShadowMe/actions/workflows/pr-checks.yml/badge.svg)](https://github.com/RAS06/ShadowMe/actions/workflows/pr-checks.yml)

Medical student shadowing opportunity platform - connecting students with doctors for clinical observation experiences.

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

## Testing

The project includes comprehensive automated testing:

**Backend Tests (Jest):** 63/63 passing ✅
```bash
cd backend
npm test
```

**Frontend Tests (Vitest):** 19/51 passing ⚠️
```bash
cd frontend
npm test
```

**CI/CD:** Tests run automatically on every pull request via GitHub Actions.

## Project Structure

```
ShadowMe/
├── backend/          # Express.js REST API
│   ├── test/        # Jest unit tests
│   └── routes/      # API endpoints
├── frontend/        # React + Vite application
│   ├── src/test/   # Vitest component tests
│   └── src/        # React components
├── database/        # MongoDB with init scripts
├── .github/         # GitHub Actions workflows
│   └── workflows/  # CI/CD configuration
└── docker-compose.yml
```

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