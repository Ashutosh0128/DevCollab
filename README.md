# DevCollab — AI-Powered Developer Collaboration Platform

DevCollab is an AI-powered SaaS platform uniting project tracking, task Kanban boards, team discussions, GitHub activity, and embedded AI intelligence into one developer-centric workflow.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v20 or higher
- **Python**: v3.11 or higher
- **Docker & Docker Compose**: (Optional for containerized development)

---

## ⚙️ Environment Configuration

1. Copy `.env.example` to create your local `.env` file:
   ```bash
   cp .env.example .env
   ```
2. The default values in `.env` are configured for local development. Never commit real credentials or production secrets to Git.

---

## 🐳 Running with Docker Compose (Recommended)

To start the entire stack (PostgreSQL database, Django API backend, and React Vite frontend) in development mode:

```bash
docker compose up --build
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:8000/api/v1/health/](http://localhost:8000/api/v1/health/)
- **PostgreSQL Database**: Port `5432`

---

## 💻 Running Locally (Native)

### 1. Backend (Django REST Framework)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver 8000
```

Backend will be accessible at `http://localhost:8000`.

### 2. Frontend (React + Vite + TypeScript)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Frontend will be accessible at `http://localhost:5173`.

---

## 🏥 Health Check Endpoints

- **Backend Health Check**: `GET /api/v1/health/`
  - Returns:
    ```json
    {
      "status": "ok",
      "service": "DevCollab API",
      "timestamp": "2026-09-03T20:00:00.000000+00:00",
      "database": {
        "vendor": "postgresql",
        "status": "ok"
      }
    }
    ```

---

## 🛠️ Development Workflow & Branching Rules
- **Working Branch**: `siddhi-work`
- **Main Branch**: `main` (Protected)
- Always work on your designated feature branch and verify health checks before opening a pull request.
