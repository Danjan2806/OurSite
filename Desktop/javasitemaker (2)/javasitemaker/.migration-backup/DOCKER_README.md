# lilluucore — Local Docker Deployment

This guide explains how to run the full **lilluucore** stack (React frontend + Spring Boot backend + PostgreSQL) locally using Docker Compose.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows / macOS / Linux)
- At least **4 GB RAM** allocated to Docker
- Ports **80** and **8080** free on your machine

## Quick Start

```bash
# 1. Clone / download the project
git clone <your-repo-url>
cd <project-folder>

# 2. (Optional) Create a .env file to override defaults
cp .env.example .env
# Edit .env if needed

# 3. Build and start everything
docker compose up --build

# 4. Open in browser
# Frontend:  http://localhost
# Backend:   http://localhost:8080/api/health
```

The **first build** takes ~5–10 minutes (downloads Java 21, Maven dependencies, Node modules).  
Subsequent builds are fast due to Docker layer caching.

## Environment Variables

Create a `.env` file in the project root (optional — defaults work for development):

```env
# PostgreSQL password
DB_PASSWORD=postgres

# JWT secret (change this in production!)
SESSION_SECRET=my-super-secret-key-change-me-in-prod

# API URL the frontend uses (must be reachable from the browser)
VITE_API_URL=http://localhost:8080
```

## Services

| Service    | Port | Description                         |
|------------|------|-------------------------------------|
| frontend   | 80   | React app served via nginx          |
| backend    | 8080 | Spring Boot API                     |
| postgres   | —    | PostgreSQL 16 (internal only)       |

## Stopping

```bash
docker compose down        # Stop containers, keep data
docker compose down -v     # Stop containers AND delete all data (DB + uploads)
```

## Rebuilding After Code Changes

```bash
docker compose up --build
```

## Data Persistence

- **Database**: stored in the `postgres_data` Docker volume — survives container restarts
- **Uploaded files**: stored in the `uploads_data` Docker volume

## Admin Account

To create an admin user, register normally, then update the role directly in the database:

```bash
docker compose exec postgres psql -U postgres -d lilluucore \
  -c "UPDATE users SET role='admin' WHERE email='your@email.com';"
```

## Logs

```bash
docker compose logs -f backend    # Spring Boot logs
docker compose logs -f frontend   # nginx logs
docker compose logs -f postgres   # PostgreSQL logs
```

## Production Notes

- Change `SESSION_SECRET` to a long random string
- Change `DB_PASSWORD` to a strong password
- Set `VITE_API_URL` to your actual backend domain/IP
- Consider adding HTTPS via a reverse proxy (Traefik, Caddy, nginx)
- The `spring.jpa.hibernate.ddl-auto=update` setting auto-creates/migrates tables on startup

## Architecture

```
Browser
  └─> nginx (port 80) — serves React SPA
        └─> (API calls) ─> Spring Boot (port 8080)
                              └─> PostgreSQL (internal)
```
