# DevCollab — AI-Powered Developer Collaboration Platform

DevCollab is an AI-powered SaaS platform uniting project tracking, task Kanban boards, team discussions, GitHub activity, and embedded local AI intelligence (`qwen2.5:3b` via Ollama) into one developer-centric workflow.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v22 or higher
- **Python**: v3.12 or higher
- **Docker & Docker Compose**: (Required for containerized deployment)
- **Local Ollama**: (Optional for local AI developer-project matching)

---

## 🤖 Local Ollama Setup (Phase 9 AI Matching)

DevCollab utilizes a local open-weights LLM (`qwen2.5:3b`) running via Ollama for zero API cost.

1. **Install Ollama**: Download from [https://ollama.com/download/windows](https://ollama.com/download/windows)
2. **Pull the model**:
   ```bash
   ollama pull qwen2.5:3b
   ```
3. **Host Configuration**:
   - **Native Windows Django**: `OLLAMA_HOST=http://localhost:11434`
   - **Dockerized Django Container**: `OLLAMA_HOST=http://host.docker.internal:11434`

---

## ⚙️ Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Key environment variables in `.env`:
   - `SECRET_KEY`: Django application secret key.
   - `DEBUG`: `True` for development, `False` for production hardening.
   - `WEB_CONCURRENCY`: Gunicorn worker count (default: `1` for lightweight 8GB RAM machines).
   - `OLLAMA_HOST`: Set according to native vs Dockerized environment.

---

## 🐳 Running with Docker Compose (Recommended)

Start the production-ready stack (PostgreSQL 16 database, Gunicorn Django API backend, and Nginx React frontend):

```bash
# Build containers
docker compose build

# Start containers in detached mode
docker compose up -d

# Verify running container status
docker compose ps

# Stop stack
docker compose down
```

### Access Points
- **Frontend SPA**: [http://localhost:5173](http://localhost:5173) (served via Nginx)
- **Backend API**: [http://localhost:8000](http://localhost:8000) (served via Gunicorn)
- **Canonical Health Check**: [http://localhost:8000/api/health/](http://localhost:8000/api/health/)
- **PostgreSQL Database**: Port `5432`

---

## 💻 Running Locally (Native Development)

### 1. Backend (Django REST Framework)

```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver 8000
```

### 2. Frontend (React + Vite + TypeScript)

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

---

## 🏥 Health Check Endpoints

- **Canonical Health Check**: `GET /api/health/`
- **Backward Compatible Health Check**: `GET /api/v1/health/`
  - **Healthy Response (HTTP 200 OK)**:
    ```json
    {
      "status": "ok",
      "service": "DevCollab API",
      "timestamp": "2026-09-05T20:00:00.000000+00:00",
      "database": {
        "vendor": "postgresql",
        "status": "ok"
      }
    }
    ```
  - **Unhealthy Response (HTTP 503 Service Unavailable)**:
    ```json
    {
      "status": "error",
      "service": "DevCollab API",
      "timestamp": "2026-09-05T20:00:00.000000+00:00",
      "database": {
        "status": "unreachable"
      }
    }
    ```

---

## 🔄 Continuous Integration (CI)

Automated GitHub Actions CI workflows (`.github/workflows/ci.yml`) run on `push` and `pull_request`:
- **Backend Job**: System checks, migration verification (`makemigrations --check`), unit tests with PostgreSQL service.
- **Frontend Job**: TypeScript compilation check (`npx tsc --noEmit`), Vite production build (`npm run build`).

For detailed production deployment instructions, see [docs/deployment.md](file:///c:/Users/siddh/OneDrive/Desktop/devcollab/docs/deployment.md).
