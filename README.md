# ShadowMe

A full-stack application with Docker support.

## Project Structure

```
ShadowMe/
├── backend/           # Backend application
│   ├── Dockerfile    # Docker configuration for backend
│   └── README.md
├── frontend/          # Frontend application
│   ├── Dockerfile    # Docker configuration for frontend
│   └── README.md
├── database/          # Database files
│   ├── init/         # Database initialization scripts
│   └── README.md
├── docker-compose.yml # Docker Compose configuration
└── README.md
```

## Getting Started

### Prerequisites
- Docker
- Docker Compose

### Running with Docker

To start all services (backend, frontend, and database):
```bash
docker-compose up
```

To start services in detached mode:
```bash
docker-compose up -d
```

To stop all services:
```bash
docker-compose down
```

### Services

- **Backend**: Runs on `http://localhost:3000`
- **Frontend**: Runs on `http://localhost:3001`
- **Database**: PostgreSQL on `localhost:5432`

## Development

See individual README files in each directory for specific development instructions:
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Database README](./database/README.md)