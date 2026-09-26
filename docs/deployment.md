# DevCollab — Production Deployment & Infrastructure Guide

This document details the production architecture, Docker containerization, security hardening, environment setup, and CI pipeline for **DevCollab**.

---

## 🏗️ Architecture Overview

```text
               ┌────────────────────────────────────────────────────────┐
               │                     Windows Host                       │
               │                                                        │
               │  ┌────────────────┐                                    │
               │  │  Ollama Host   │                                    │
               │  │  (qwen2.5:3b)  │                                    │
               │  └───────▲────────┘                                    │
               │          │ HTTP (host.docker.internal:11434)           │
               │          │                                             │
               │  ┌───────┴──────────────────────────────────────────┐  │
               │  │              Docker Environment                  │  │
               │  │                                                  │  │
               │  │  ┌──────────────┐     ┌───────────────────────┐  │  │
               │  │  │  Frontend    │     │  Backend (Gunicorn)   │  │  │
               │  │  │ (Nginx :80)  │────>│  (Python 3.12 :8000)  │  │  │
               │  │  └──────────────┘     └───────────┬───────────┘  │  │
               │  │                                   │              │  │
               │  │                                   ▼              │  │
               │  │                       ┌───────────────────────┐  │  │
               │  │                       │ PostgreSQL 16 DB      │  │  │
               │  │                       │ (devcollab_db:5432)   │  │  │
               │  │                       └───────────────────────┘  │  │
               │  └──────────────────────────────────────────────────┘  │
               └────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Hardening Checklist

When deploying to production with `DEBUG=False`:

1. **SECRET_KEY**:
   - Set a strong, randomly generated 50+ character string.
   - The application will refuse to boot if `SECRET_KEY` starts with `django-insecure` when `DEBUG=False`.
2. **Security Headers**:
   - `SECURE_CONTENT_TYPE_NOSNIFF = True`
   - `X_FRAME_OPTIONS = 'DENY'`
   - `SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'`
   - `SECURE_HSTS_SECONDS` (configurable in `.env`)
3. **CORS & CSRF**:
   - Explicitly list permitted production origins in `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`.
   - Never use wildcard `*` origins in production.
4. **Non-Root Container User**:
   - The backend container runs as dedicated non-root user `appuser` (UID 1000).

---

## 🐳 Docker Deployment Commands

```bash
# 1. Build images
docker compose build

# 2. Start stack in background
docker compose up -d

# 3. View running container status
docker compose ps

# 4. View container logs
docker compose logs -f backend

# 5. Stop container stack
docker compose down
```

---

## 🤖 Ollama Host Connection

Dockerized Django reaches Ollama on the Windows host via `host.docker.internal`:

- **Docker Compose Extra Host Mapping**:
  `docker-compose.yml` maps `host.docker.internal:host-gateway`.
- **Environment Variable**:
  Set `OLLAMA_HOST=http://host.docker.internal:11434` in the backend environment.
- **Graceful Fallback**:
  If Ollama is offline or unreachable, Django catches connection timeouts and falls back to deterministic match explanations without failing API requests.

---

## 🔄 GitHub Actions CI Pipeline

The CI workflow `.github/workflows/ci.yml` runs automated checks on every push and pull request:

1. **Backend Job**:
   - Spawns a PostgreSQL 16 service container.
   - Executes `python manage.py check`.
   - Executes `python manage.py makemigrations --check` to ensure no uncommitted model changes.
   - Executes `python manage.py test` (Ollama HTTP requests are mocked during unit testing).
2. **Frontend Job**:
   - Sets up Node.js 22 environment.
   - Runs `npm ci`.
   - Runs `npx tsc --noEmit` to verify type safety.
   - Runs `npm run build` to verify Vite bundle output.
