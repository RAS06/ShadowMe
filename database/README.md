# Database Directory

This directory contains database-related files for the ShadowMe project.

## Structure

- `init/` - Database initialization scripts (SQL files run on first container start)
- `data/` - PostgreSQL data directory (excluded from git via .gitignore)

## Usage

The database is configured in the docker-compose.yml file and uses PostgreSQL 15.
Data persists between container restarts in the `data/` directory.
