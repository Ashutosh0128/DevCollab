# DevCollab — Phase 0 Technical Blueprint
### AI-Powered Developer Collaboration Platform
**Status:** Planning only — no application code included. Awaiting approval before Phase 1.

---

## 1. Product Overview

**What DevCollab is.** DevCollab is a full-stack SaaS platform where software teams manage projects, tasks, discussions, GitHub activity, and notifications in one place, with an AI assistant embedded directly into the workflow rather than bolted on as a separate chatbot.

**Problem it solves.** Developer teams typically stitch together a project tracker (Jira/Linear), a chat tool (Slack), GitHub itself, and a spreadsheet for reporting. Context is scattered: nobody has a single place that already knows what the code, the tasks, and the conversations say about a project's real status. DevCollab consolidates that context and lets an AI reason over it.

**Target users.** Small-to-mid-size dev teams and startups (5–50 engineers), freelance/agency developers managing multiple client projects, and engineering leads who need fast, accurate status reporting without manually collecting it.

**Main use cases**
- Planning and tracking work on a Kanban board tied to real GitHub activity.
- Team communication scoped to a project (discussions, mentions).
- Auto-generating subtasks and acceptance criteria from a one-line feature request.
- Getting an always-current project summary instead of writing one manually.
- Surfacing "what should I work on next" per developer.
- Understanding GitHub activity (commits/PRs/issues) without leaving the app.

**Differentiation from a basic PM tool.** Three things: (1) native GitHub integration as a first-class data source, not an afterthought; (2) an AI layer with access to structured project context (tasks, discussions, GitHub activity) rather than a generic prompt box; (3) audit-quality activity logs and analytics built from the same data model used for AI context, so AI answers and dashboard numbers never disagree.

**How the AI assistant adds value.** It removes three recurring chores: breaking down vague requirements into actionable tasks, writing status updates, and figuring out what to work on next. It does this by combining an LLM with structured, validated context pulled from DevCollab's own database — never by giving the model free rein over the data.

---

## 2. User Roles & Permissions

### 2.1 Roles

| Role | Scope | Summary |
|---|---|---|
| **Viewer** | Team or Project | Read-only. Can view projects, tasks, discussions, GitHub data, analytics they're granted access to. Cannot create/edit anything. |
| **Developer** | Team or Project | Standard contributor. Can create/edit tasks, comment, post discussions, use AI features on assigned projects, connect their own GitHub identity. |
| **Team Admin** | Team | Everything a Developer can do, plus manage team membership, invite/remove members (except the Owner), manage projects within the team, configure GitHub repo connections. |
| **Team Owner** | Team | Full control, including billing, deleting the team, transferring ownership, and irrevocable actions. Exactly one Owner per team. |

Roles are assigned **per team**; a user can hold different roles on different teams. Project-level access is derived from team role plus explicit `ProjectMembership`, so a Developer can be excluded from a specific project if needed.

### 2.2 Permission Matrix

| Capability | Viewer | Developer | Team Admin | Team Owner |
|---|:---:|:---:|:---:|:---:|
| View team/projects | ✅ | ✅ | ✅ | ✅ |
| Create project | ❌ | ❌ | ✅ | ✅ |
| Edit/archive project | ❌ | Only if assigned lead | ✅ | ✅ |
| Create/edit own tasks | ❌ | ✅ | ✅ | ✅ |
| Edit any task | ❌ | ❌ | ✅ | ✅ |
| Assign tasks | ❌ | ✅ (self) | ✅ | ✅ |
| Post/reply discussions | ❌ | ✅ | ✅ | ✅ |
| Delete others' discussion posts | ❌ | ❌ | ✅ | ✅ |
| Connect GitHub repo | ❌ | ❌ | ✅ | ✅ |
| View GitHub activity | ✅ | ✅ | ✅ | ✅ |
| Upload/download files | ✅ (download only) | ✅ | ✅ | ✅ |
| Delete files | ❌ | Own files only | ✅ | ✅ |
| Use AI features | ❌ | ✅ | ✅ | ✅ |
| Invite/remove team members | ❌ | ❌ | ✅ (not Owner) | ✅ |
| Change team settings | ❌ | ❌ | ✅ | ✅ |
| Billing / delete team | ❌ | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ | ✅ |

Enforcement happens at the API layer via DRF permission classes checked against `TeamMembership.role` and `ProjectMembership`, never in the frontend alone.

---

## 3. Core Feature Modules

### 3.1 Authentication
Registration, login, logout, JWT (access + refresh, refresh rotation), forgot/reset password via emailed token, email verification, profile (avatar, bio, skills as tags). **MVP:** registration, login/logout, JWT, password reset, basic profile. **V2:** email verification enforcement, social login.

### 3.2 Teams
Create team, invite by email (pending `Invitation` record with expiring token), accept/decline, remove member, change role, team settings (name, description, avatar). **MVP:** create/invite/accept/roles. **V2:** bulk invites, invite links.

### 3.3 Projects
Create/edit/archive, status (Planning/Active/On Hold/Completed/Archived), description, tech stack (tags), start date/deadline, member list, single GitHub repo link. **MVP:** full CRUD + status. **V2:** multiple linked repos per project.

### 3.4 Tasks (Kanban)
**Statuses:** Backlog → Todo → In Progress → In Review → Done.
**Fields:** title, description, status, priority (Low/Medium/High/Urgent), assignee, reporter, labels, due date, comments, attachments, activity history.
**MVP:** full CRUD, drag-and-drop status change, comments, labels, due dates, assignment.
**V2:** subtasks, task dependencies (blocks/blocked-by), full task history timeline UI.
**Advanced:** dependency graph visualization, auto-scheduling suggestions.

### 3.5 Discussions
Posts, threaded replies, @mentions (trigger notification), reactions (emoji), attachments, edit/delete with edit history flag. **MVP:** posts, replies, mentions. **V2:** reactions, rich attachments.

### 3.6 GitHub Integration
OAuth connect, repo linking, pull of commits/branches/PRs/issues/contributors, webhook-driven activity feed, rate-limit-aware polling fallback, encrypted token storage. **MVP:** OAuth, repo connect, commit/PR/issue read views. **V2:** webhooks for real-time sync, contributor stats. **Advanced:** cross-repo analytics.

### 3.7 Notifications
Triggers: task assigned, task updated, new comment, mention, team invitation, GitHub event (new PR/issue on watched repo), approaching deadline. In-app unread count + history; **V2** adds email digest.

### 3.8 Analytics
Project progress %, task counts by status, overdue tasks, team activity feed, per-developer contribution (tasks closed, comments, commits), commit/PR/issue counts over time. **MVP:** basic counts and progress bar. **V2:** trend charts. **Advanced:** predictive velocity/burndown.

### 3.9 Search
Global search across users, teams, projects, tasks, discussions, GitHub activity, scoped to what the requesting user can access. **MVP:** simple `icontains`/Postgres full-text search. **Advanced:** ranked relevance, typo tolerance.

### 3.10 File Attachments
Upload/download, MIME + size validation (configurable limit, e.g. 25MB), storage via S3-compatible object storage in production (local disk in dev), signed URLs for secure access, soft-delete then hard-delete after retention window.

### 3.11 Activity / Audit Logs
Append-only log of: project created, task created/assigned/status changed, member added/removed, GitHub connected, settings changed. Stored as structured `ActivityLog` rows (actor, verb, target, metadata JSON, timestamp) — this is also a primary data source for AI project summaries.

---

## 4. AI Assistant — Capability Design

The AI assistant is scoped to specific, structured tasks rather than open-ended chat, so each capability has a defined input, a defined output shape, and a defined data source.

| Capability | Input | Output | Primary Data Source |
|---|---|---|---|
| **AI Task Generator** | Short feature request, e.g. "Implement JWT authentication" | List of structured subtasks (title, description, suggested priority, suggested order) | User prompt + project tech-stack context |
| **AI Task Description Generator** | A task title | Description, acceptance criteria list, suggested priority | Task title + project context |
| **AI Project Summary** | Project ID | Progress, completed work, current work, blockers, risks, next steps | Tasks, ActivityLog, GitHub activity for that project |
| **AI Work Recommendation** | User ID (implicit) | Ranked list of 1–5 suggested tasks with reasoning | User's assigned tasks: priority, deadline, status, dependencies, project progress |
| **AI Discussion Summarizer** | Discussion thread ID | Summary, decisions, action items, open questions | All posts/replies in the thread |
| **GitHub Activity Summary** | Repository ID + date range | Summary of commits, PRs, issues, and overall development progress | GitHubCommit, GitHubPullRequest, GitHubIssue records |
| **Project AI Assistant (Q&A)** | Free-text question + project ID | Grounded answer, or "I don't have enough information" | Retrieved subset of project's tasks/discussions/GitHub data relevant to the question |

All outputs are **structured JSON**, validated server-side against a schema before being persisted or shown to the user (see Section 5).

---

## 5. AI Architecture

### 5.1 Pipeline

```
React (AI panel/component)
   │  POST /api/v1/ai/<capability>/
   ▼
Django API (DRF view)
   │  auth + permission check + rate-limit check
   ▼
AI Service Layer (Python module, not exposed directly to frontend)
   │  1. Context Builder — pulls ONLY the DB rows needed for this request,
   │     via existing Django ORM querysets (read-only, scoped to user's permissions)
   │  2. Prompt Manager — selects a versioned prompt template, injects context
   │     as data (not as instructions the model should "obey")
   ▼
LLM API (external call, e.g. Anthropic API)
   │  returns text/JSON
   ▼
Response Validator — parses expected JSON schema (pydantic or DRF serializer),
   rejects/retries on malformed output, strips anything resembling
   injected instructions before it's stored or rendered
   ▼
Django — persists AIConversation/AIMessage + AIUsage (tokens/cost), returns
   validated payload
   ▼
React — renders structured result (never renders raw model text as HTML)
```

**Key principle:** the LLM never receives direct database credentials or a raw SQL/ORM interface. It only ever sees a curated JSON context object assembled by the Context Builder, and it only ever returns data that passes schema validation before touching the rest of the system.

### 5.2 Components in detail

- **AI Service Layer**: a Django app (`ai/`) exposing internal Python functions per capability (e.g. `generate_subtasks(project, prompt)`), each calling the Context Builder, Prompt Manager, LLM client, and Validator in sequence. Views never call the LLM client directly.
- **Context Builder**: capability-specific functions that query only the fields relevant to that capability (e.g. project summary needs task counts + recent activity, not every historical comment). Enforces the same permission scoping as the REST API.
- **Prompt Management**: prompt templates versioned in code (not user-editable), with clear separation between system instructions and user/context data, to reduce prompt-injection risk from user-authored content (task titles, discussion text) that gets included in context.
- **Structured Output**: each capability defines a strict output schema (pydantic model or DRF serializer). Model is instructed to return JSON only; response is parsed and validated, with one retry on failure before surfacing a graceful error.
- **AI Response Validation**: schema validation, length limits, and a content filter pass before persistence; malformed responses are logged and retried once, then fail gracefully with a user-facing message.
- **Error Handling**: LLM timeouts/errors return a typed error to the frontend rather than a raw exception; failures are logged with request ID for debugging without logging full prompt/response content by default.
- **Token/Cost Management**: every call logged to `AIUsage` (user, capability, input/output tokens, estimated cost, timestamp) to support per-team usage limits later.
- **Rate Limiting**: per-user and per-team request caps on AI endpoints (e.g. DRF throttle classes), independent of general API rate limits.
- **Security**: no secrets or credentials ever included in context; PII minimization in prompts where feasible; explicit instruction boundaries in the system prompt to reduce injection via user content; all AI endpoints require authentication and the same permission checks as the underlying data.

### 5.3 Future extensions (not implemented now)
- **Embeddings + vector database**: store embeddings of tasks/discussions/docs for semantic search and better context retrieval.
- **RAG**: retrieve top-k relevant chunks (tasks, discussion posts, docs) into context instead of hand-picked queries, for the Project AI Assistant Q&A capability specifically.
- **Project document knowledge**: allow uploading docs (specs, READMEs) as an additional context source, chunked and embedded.
- **Tool/function calling**: let the model request specific, whitelisted read actions (e.g. "get task by ID") through a controlled function-calling interface instead of the Context Builder pre-fetching everything — useful once queries become more open-ended.

These are explicitly deferred to keep Phase 0–11 scope bounded.

---

## 6. Technology Stack

| Layer | Choice | Justification |
|---|---|---|
| Frontend | React + TypeScript + Vite | Fast dev server, strong typing reduces runtime errors in a data-heavy UI. |
| Styling | Tailwind CSS | Rapid, consistent styling without a heavy component library dependency. |
| Routing | React Router | Standard, well-supported. |
| Server state | TanStack Query | Handles caching/refetching for REST data far better than manual `useEffect` fetching; pairs well with DRF. |
| HTTP client | Axios | Interceptors make JWT refresh-on-401 straightforward. |
| Backend | Python + Django + DRF | Batteries-included (admin, ORM, auth) speeds up a broad-surface-area app like this; DRF gives a mature REST + permission framework. |
| Database | PostgreSQL | Relational integrity for the heavily-related entity graph (teams/projects/tasks/etc.), strong JSON support for activity metadata, full-text search built in. |
| Auth | JWT (access + refresh) | Stateless, works cleanly with SPA + future mobile client. |
| Realtime | Django Channels + WebSockets | Native Django ecosystem fit; avoids adding a separate realtime service for MVP scale. |
| DevOps | Docker, Docker Compose, GitHub Actions | Standard reproducible local dev + CI. |
| Cloud | AWS | Wide managed-service coverage (RDS, S3, ECS/App Runner) for the deployment phase. |
| External APIs | GitHub API, LLM API (Anthropic) | Core integrations per product requirements. |

No stack substitutions are recommended at this stage; the requested stack is coherent for the stated scope. If a specific choice (e.g. Channels vs. a dedicated realtime service) becomes a bottleneck at Phase 9, that tradeoff will be raised explicitly before switching.

---

## 7. System Architecture (High Level)

```
                     ┌─────────────────────┐
                     │   React SPA (Vite)   │
                     └──────────┬───────────┘
                                │ HTTPS (REST) + WSS
                     ┌──────────▼───────────┐
                     │   Django REST API     │
                     │  (DRF + Channels)     │
                     └──┬────────┬───────┬──┘
             ┌───────────┘        │        └────────────┐
   ┌─────────▼─────┐   ┌──────────▼─────────┐  ┌─────────▼────────┐
   │ PostgreSQL     │   │ AI Service Layer    │  │ Background Jobs  │
   │ (primary DB)   │   │ → LLM API           │  │ (Celery, if req'd)│
   └────────────────┘   └─────────────────────┘  └───────────────────┘
             │                                             │
   ┌─────────▼─────┐   ┌─────────────────────┐  ┌─────────▼────────┐
   │ File Storage   │   │ GitHub API           │  │ Email Service     │
   │ (S3-compatible)│   │ (OAuth + REST/Webhook)│  │ (SMTP/SES)        │
   └────────────────┘   └─────────────────────┘  └───────────────────┘
```

**Communication:** React talks to Django exclusively over versioned REST endpoints and one WebSocket connection (Channels) for realtime events. Django is the only component that talks to PostgreSQL, the LLM API, and the GitHub API — the frontend never calls external services directly, which keeps API keys and GitHub tokens server-side only. Background jobs (Celery + Redis, introduced when GitHub webhook processing or scheduled analytics need async handling) are optional at MVP and can start as synchronous Django views.

---

## 8. Database Architecture (Entity Planning)

Below: purpose, key fields, and relationships per entity. No Django models are written yet — this is the conceptual schema.

**User** — core auth identity. Fields: email (unique), password hash, is_active, is_verified, date_joined. 1:1 with **Profile**.

**Profile** — extends User. Fields: display_name, avatar_url, bio, skills (array/tags), timezone.

**Team** — top-level org unit. Fields: name, slug, description, avatar_url, created_by (FK User), created_at.

**TeamMembership** — join table User↔Team. Fields: user (FK), team (FK), role (enum: viewer/developer/admin/owner), joined_at. Unique constraint on (user, team).

**Invitation** — pending team invite. Fields: team (FK), email, role, token (unique), status (pending/accepted/declined/expired), invited_by (FK User), expires_at.

**Project** — Fields: team (FK), name, description, status (enum), tech_stack (array), start_date, deadline, github_repository (FK, nullable), created_by, created_at. Indexed on (team, status).

**ProjectMembership** — join table User↔Project. Fields: user (FK), project (FK), role_override (nullable — falls back to team role if null).

**Task** — Fields: project (FK), title, description, status (enum), priority (enum), assignee (FK User, nullable), reporter (FK User), due_date, created_at, updated_at. Indexed on (project, status), (assignee, status).

**SubTask** — Fields: parent_task (FK Task), title, is_done (bool), order.

**Label** — Fields: project (FK), name, color. **TaskLabel** — join table Task↔Label (M2M).

**TaskComment** — Fields: task (FK), author (FK User), body, created_at, edited_at (nullable).

**TaskAttachment** — Fields: task (FK), uploaded_by (FK User), file_url, filename, size_bytes, mime_type, created_at.

**Discussion** — Fields: project (FK), title, created_by (FK User), created_at, is_locked (bool).

**DiscussionReply** — Fields: discussion (FK), parent_reply (FK, nullable, for threading), author (FK User), body, created_at, edited_at.

**Notification** — Fields: recipient (FK User), verb, target_type, target_id (generic FK pattern), is_read (bool), created_at. Indexed on (recipient, is_read).

**ActivityLog** — Fields: team (FK), project (FK, nullable), actor (FK User), verb, target_type, target_id, metadata (JSONB), created_at. Indexed on (project, created_at).

**GitHubAccount** — Fields: user (FK, 1:1), github_username, access_token (encrypted at rest), refresh_token (encrypted), connected_at.

**GitHubRepository** — Fields: project (FK, 1:1 for MVP), full_name (owner/repo), github_id, default_branch, connected_by (FK User), webhook_secret (encrypted).

**GitHubCommit**, **GitHubPullRequest**, **GitHubIssue** — each: repository (FK), github_id, author info, title/message, state, created_at, url — cached copies of GitHub data, refreshed via webhook or polling. Indexed on (repository, created_at).

**AIConversation** — Fields: user (FK), project (FK, nullable), capability (enum), created_at.

**AIMessage** — Fields: conversation (FK), role (user/assistant), content (JSONB for structured output), created_at.

**AIUsage** — Fields: user (FK), capability, input_tokens, output_tokens, estimated_cost, created_at. Indexed on (user, created_at) for usage rollups.

**Constraints/notes:** cascade-delete task-dependent children (comments, attachments, subtasks) when a Task is deleted; soft-delete preferred for Discussion/Task to preserve ActivityLog integrity; encrypted-field handling for GitHub tokens via a field-level encryption library, not plaintext columns.

---

## 9. API Architecture (Planning Level)

Base path: `/api/v1/`. All endpoints require JWT auth unless noted; permission requirement references Section 2's matrix.

| Module | Example Endpoint | Method | Purpose | Auth | Permission |
|---|---|---|---|---|---|
| auth | `/auth/register/` | POST | Create account | No | — |
| auth | `/auth/login/` | POST | Obtain JWT pair | No | — |
| auth | `/auth/token/refresh/` | POST | Refresh access token | No (refresh token) | — |
| auth | `/auth/password/reset/` | POST | Request reset email | No | — |
| users | `/users/me/` | GET/PATCH | View/update own profile | Yes | Self only |
| teams | `/teams/` | GET/POST | List/create teams | Yes | POST: any authenticated user |
| teams | `/teams/{id}/invitations/` | POST | Invite member | Yes | Admin/Owner |
| teams | `/teams/{id}/members/{user_id}/` | PATCH/DELETE | Change role / remove | Yes | Admin/Owner |
| projects | `/projects/` | GET/POST | List/create projects | Yes | POST: Admin/Owner |
| projects | `/projects/{id}/` | GET/PATCH/DELETE | View/edit/archive | Yes | View: member; Edit: Admin/Owner/lead |
| tasks | `/projects/{id}/tasks/` | GET/POST | List/create tasks | Yes | Create: Developer+ |
| tasks | `/tasks/{id}/` | PATCH/DELETE | Update/delete task | Yes | Assignee/reporter/Admin+ |
| tasks | `/tasks/{id}/comments/` | GET/POST | Task comments | Yes | Developer+ |
| discussions | `/projects/{id}/discussions/` | GET/POST | List/create | Yes | Developer+ |
| discussions | `/discussions/{id}/replies/` | POST | Reply | Yes | Developer+ |
| notifications | `/notifications/` | GET | List (with unread count) | Yes | Self only |
| notifications | `/notifications/{id}/read/` | POST | Mark read | Yes | Self only |
| github | `/github/oauth/connect/` | GET | Start OAuth flow | Yes | Self only |
| github | `/projects/{id}/github/repository/` | POST | Link repo | Yes | Admin/Owner |
| github | `/projects/{id}/github/commits/` | GET | List cached commits | Yes | Project member |
| analytics | `/projects/{id}/analytics/overview/` | GET | Progress/task stats | Yes | Project member |
| ai | `/ai/tasks/generate/` | POST | AI task generator | Yes | Developer+, rate-limited |
| ai | `/ai/projects/{id}/summary/` | POST | AI project summary | Yes | Project member, rate-limited |
| search | `/search/?q=` | GET | Global scoped search | Yes | Scoped to accessible entities |

Full endpoint enumeration (all CRUD verbs per resource) will be detailed in `docs/API.md` during implementation; this table establishes the pattern and permission model.

---

## 10. Frontend Architecture

**Suggested folder structure:**

```
src/
├── app/                 # app shell, router, providers
├── pages/                # route-level components (DashboardPage, ProjectPage, ...)
├── components/
│   ├── ui/               # generic reusable UI (Button, Modal, Badge...)
│   └── features/         # feature-specific (TaskCard, KanbanBoard, AIPanel...)
├── layouts/              # AppLayout, AuthLayout
├── hooks/                # useAuth, useWebSocket, useTasks, ...
├── services/             # api/ (axios instance + per-module API functions)
├── store/                # auth state (e.g. Zustand or Context), minimal global state
├── types/                # shared TypeScript types/interfaces (mirrors DRF serializers)
├── utils/                # formatting, validation helpers
└── routes/               # ProtectedRoute, RoleGuard
```

- **State management:** server state via TanStack Query (tasks, projects, etc.); minimal client-only state (auth token, UI toggles) via React Context or a lightweight store — no heavy global state library needed at this scale.
- **Authentication state:** access token held in memory/context, refresh token flow handled via Axios interceptor; route guards check auth + role before rendering protected pages.
- **Error handling:** a shared API error boundary/toast pattern; TanStack Query's error states drive inline UI feedback.
- **Loading states:** skeleton components for lists/boards; TanStack Query's `isLoading`/`isFetching` drive these consistently.
- **Types:** TypeScript interfaces generated/maintained to mirror DRF serializers, kept in `types/`, single source of truth per entity.

---

## 11. Realtime Architecture

```
React (WebSocket hook) ⇄ Django Channels (per-team/per-project consumer groups)
```

Planned realtime channels: notifications (per-user group), discussion updates (per-discussion group), task updates (per-project group, drives live Kanban board updates), activity feed (per-project group), online presence (per-project group, heartbeat-based). Each Channels consumer authenticates the WebSocket connection via the JWT, joins the relevant groups based on team/project membership, and Django broadcasts group messages on relevant model changes (via signals or explicit service-layer calls). No implementation in this phase — this defines the intended consumer/group topology only.

---

## 12. Security Architecture

- **AuthN/AuthZ:** JWT access + refresh with short-lived access tokens; RBAC enforced via DRF permission classes checked against `TeamMembership`/`ProjectMembership`, never trusted from the client.
- **Passwords:** Django's built-in PBKDF2/Argon2 hashing, standard complexity validation.
- **CORS/CSRF:** strict CORS allowlist for the frontend origin; CSRF protection on any cookie-based flows (JWT-in-header avoids most CSRF surface, but session-based admin access still needs it).
- **XSS:** React's default escaping + strict avoidance of `dangerouslySetInnerHTML`, especially for AI-generated or user-generated content.
- **SQL injection:** Django ORM parameterizes queries by default; raw SQL avoided or parameterized explicitly.
- **File uploads:** MIME/type allowlist, size limits, virus-scan hook placeholder for production, storage outside the web root (S3), signed URLs for access.
- **Rate limiting:** DRF throttling per-endpoint, stricter limits on auth and AI endpoints specifically.
- **GitHub OAuth tokens:** encrypted at rest (field-level encryption), never sent to the frontend, never included in AI context.
- **Environment variables:** all secrets (DB creds, JWT signing key, LLM API key, GitHub OAuth secret) via env vars / a secrets manager in production, never committed.
- **AI prompt injection:** system/user separation in prompts, context data treated as data not instructions, output schema validation as a second line of defense, no execution of anything the model returns.
- **Sensitive info to LLMs:** context builders exclude tokens, password hashes, and other secrets by construction (allowlist fields, not denylist).
- **Audit logs:** ActivityLog captures security-relevant events (role changes, member removal, GitHub connect/disconnect) for later review.

---

## 13. Testing Strategy

**Backend:** unit tests per model/service (Django TestCase/pytest-django), API tests per endpoint (status codes, payload shape), dedicated authentication tests (login/refresh/expiry), permission tests per role per endpoint (matrix-driven), integration tests for multi-step flows (e.g. invite → accept → team membership).

**Frontend:** component tests (React Testing Library) for key components (KanbanBoard, TaskCard, AIPanel), integration tests for page-level flows using mocked API responses.

**End-to-end (Playwright/Cypress) critical flows:** registration → login, team creation → invite → accept, project creation → task creation → status change, AI task generation end-to-end, GitHub OAuth connect → repo link → commit list appears.

Tests are expected to run after each roadmap phase per the Vibe Coding Rules (Section 19), not just at the end.

---

## 14. Docker & DevOps Architecture

**Local development:** `docker-compose.yml` with services for `backend` (Django), `frontend` (Vite dev server), `db` (PostgreSQL), and later `redis` (if Celery/Channels layer needs it). Environment-specific `.env` files, never committed.

**CI/CD (future):**
```
GitHub → GitHub Actions → Lint/Test (backend + frontend) → Build images → Deploy
```
No production deployment config is created in this phase — only the intended pipeline shape.

---

## 15. AWS Deployment Architecture (Future)

Planned production shape, not implemented now:
- **Compute:** containerized Django app on ECS Fargate or App Runner; static frontend build on S3 + CloudFront.
- **Database:** RDS for PostgreSQL, multi-AZ for production.
- **Object storage:** S3 for file attachments, private bucket + signed URLs.
- **Secrets:** AWS Secrets Manager or SSM Parameter Store for API keys/DB credentials.
- **Domain/HTTPS:** Route 53 + ACM certificate, CloudFront/ALB termination.
- **Monitoring/Logging:** CloudWatch for logs/metrics; optional Sentry for error tracking at the app layer.

---

## 16. MVP Definition

**MVP:** Auth (register/login/JWT/reset), Teams (create/invite/roles), Projects (CRUD/status), Tasks (Kanban CRUD/comments/labels/due dates), Discussions (posts/replies/mentions), Notifications (in-app, core triggers), basic Analytics (progress + counts), GitHub (OAuth connect, repo link, read-only commit/PR/issue views), File attachments, Activity log, AI: Task Generator + Task Description Generator + Project Summary + Work Recommendation.

**Version 2:** Task dependencies/subtasks UI, discussion reactions, email notification digest, GitHub webhooks (real-time sync), trend analytics, AI Discussion Summarizer, AI GitHub Activity Summary, realtime WebSocket layer, global search.

**Advanced:** RAG-based project Q&A, embeddings/vector DB, advanced GitHub analytics (contributor trends, code-frequency), advanced online presence, predictive analytics.

---

## 17. Development Roadmap

| Phase | Goal | Key Features | Dependencies | Output | Testing |
|---|---|---|---|---|---|
| 0 | Planning | This blueprint | — | Approved docs | N/A |
| 1 | Project setup | Django + React scaffolding, Docker Compose, repo structure | Phase 0 approval | Running skeleton app | Smoke test (both servers boot) |
| 2 | Authentication | Register/login/JWT/reset/profile | Phase 1 | Working auth flow | Auth unit + API tests |
| 3 | Teams & roles | Team CRUD, invitations, RBAC | Phase 2 | Team management working | Permission matrix tests |
| 4 | Projects | Project CRUD, membership | Phase 3 | Projects usable per team | API + permission tests |
| 5 | Tasks & Kanban | Task CRUD, board UI, comments, labels | Phase 4 | Functional Kanban board | Component + API tests |
| 6 | Discussions | Posts/replies/mentions | Phase 4 | Discussion threads working | API + component tests |
| 7 | Notifications | In-app notifications, unread count | Phases 5–6 | Notification center | API tests |
| 8 | GitHub integration | OAuth, repo link, commit/PR/issue read views | Phase 4 | GitHub data visible in-app | Integration tests w/ mocked GitHub API |
| 9 | Realtime | Channels setup, live board/notifications | Phases 5,7 | Live updates | Manual + integration tests |
| 10 | Analytics | Progress, task stats, contribution stats | Phases 5,8 | Analytics dashboard | API tests |
| 11 | AI Assistant | All AI capabilities per Section 4/5 | Phases 5,6,8,10 | AI features live | AI service unit tests, schema validation tests |
| 12 | File storage | Uploads/downloads, S3 integration | Phase 5 | Attachments working | Upload/validation tests |
| 13 | Testing | Fill gaps, E2E suite | All prior | Full test coverage report | E2E suite green |
| 14 | Docker | Finalize dev Docker setup | Phase 1 (ongoing) | Reproducible local env | Compose up smoke test |
| 15 | GitHub Actions | CI pipeline | Phase 13 | Automated CI on PRs | CI green on sample PR |
| 16 | AWS deployment | Production infra per Section 15 | Phase 15 | Live deployed app | Staging smoke tests |
| 17 | Security audit | Review Section 12 checklist against real code | Phase 16 | Audit report | Pen-test/checklist pass |
| 18 | Performance optimization | Query optimization, caching, bundle size | Phase 17 | Measured improvements | Load test results |
| 19 | Documentation & portfolio prep | Finalize docs/, README, demo | All prior | Publishable project | Docs review |

Per the Vibe Coding Rules, each phase stops for approval before the next begins.

---

## 18. Documentation Plan

| Document | Contents |
|---|---|
| `PROJECT_PLAN.md` | This blueprint, kept current as scope evolves |
| `ARCHITECTURE.md` | System architecture, component responsibilities, data flow diagrams |
| `DATABASE.md` | Entity descriptions, ERD, indexes/constraints, migration notes |
| `API.md` | Full endpoint reference (method, auth, permissions, request/response shape) |
| `AUTHENTICATION.md` | JWT flow, token lifecycle, password reset flow |
| `TEAMS.md` | Team/role model, invitation flow |
| `PROJECTS.md` | Project lifecycle, membership rules |
| `TASKS.md` | Kanban model, statuses, dependency rules |
| `GITHUB_INTEGRATION.md` | OAuth flow, webhook handling, rate-limit strategy, data sync model |
| `WEBSOCKETS.md` | Channels topology, consumer groups, message formats |
| `AI.md` | Capability list, prompt/context design, validation rules, cost controls |
| `SECURITY.md` | Full security checklist mapped to Section 12, incident response notes |
| `TESTING.md` | Test strategy, coverage targets, how to run each suite |
| `DEPLOYMENT.md` | AWS deployment steps, environment variable reference, rollback procedure |
| `DEVELOPMENT_GUIDE.md` | Local setup, coding conventions, PR process, the Vibe Coding Rules |

---

## 19. Vibe Coding Rules (Confirmed)

These govern all future implementation phases with Claude:
1. Never generate the entire application at once — one phase at a time.
2. Inspect existing code before modifying it.
3. Explain which files will change before major implementation.
4. Don't modify unrelated files.
5. Don't delete working functionality without approval.
6. Never hardcode secrets — use environment variables.
7. Avoid unnecessary dependencies.
8. Follow the approved architecture; don't silently change it.
9. Reuse existing components/services.
10. Add validation and error handling.
11. Add tests for important functionality; run tests after each major phase.
12. Update documentation as the project evolves.
13. If there's a major architectural ambiguity, stop and ask.
14. After completing a phase, stop and wait for approval before continuing.

---

## 20. Final Planning Report Summary

**Product:** AI-powered developer collaboration platform combining project/task management, GitHub integration, discussions, and a context-grounded AI assistant.

**Roles:** Viewer, Developer, Team Admin, Team Owner — full permission matrix in Section 2.

**Stack:** React/TS/Vite/Tailwind frontend; Django/DRF/PostgreSQL backend; JWT auth; Django Channels for realtime; Docker/Compose/GitHub Actions for DevOps; AWS for hosting; GitHub API + LLM API as external integrations.

**Architecture:** React → Django REST API → PostgreSQL, with the AI Service Layer and GitHub integration as controlled side-channels off Django — the LLM never has direct database access (Section 5).

**Database:** ~24 core entities spanning identity, teams, projects, tasks, discussions, notifications, GitHub caching, and AI usage (Section 8).

**API:** Versioned under `/api/v1/`, organized by module, permission-checked per endpoint (Section 9).

**Frontend:** Feature-organized React app with TanStack Query for server state and route-level RBAC guards (Section 10).

**AI:** Seven scoped capabilities, all schema-validated, cost-tracked, and rate-limited; RAG/embeddings/tool-calling explicitly deferred (Sections 4–5).

**Security:** RBAC, encrypted GitHub tokens, prompt-injection-aware AI design, standard web hardening (Section 12).

**Testing:** Unit + API + permission tests on backend, component tests on frontend, E2E coverage of critical flows (Section 13).

**DevOps:** Docker Compose locally, GitHub Actions CI, AWS (ECS/RDS/S3/CloudFront) for production (Sections 14–15).

**MVP vs. later:** Core CRUD + basic AI (4 capabilities) ships first; realtime, webhooks, remaining AI capabilities, and RAG follow in V2/Advanced (Section 16).

**Roadmap:** 19 sequential phases from setup through portfolio prep, each gated on approval (Section 17).

### Major Risks
- **AI cost/latency at scale** — mitigated by usage tracking, rate limits, and capability-scoped (not open-ended) prompts.
- **GitHub API rate limits** — mitigated by caching commit/PR/issue data locally and preferring webhooks over polling once available.
- **Scope creep given the breadth of modules** — mitigated by the strict MVP/V2/Advanced split and phase-gated roadmap.
- **Prompt injection via user-authored content** (task titles, discussion text) flowing into AI context — mitigated by system/user separation and output validation, not eliminated entirely; worth revisiting once RAG is added.
- **Realtime complexity (Channels + WebSockets)** — sequenced late (Phase 9) and scoped to defined channels only, to avoid destabilizing earlier phases.

### Recommended Improvements (optional, for discussion)
- Consider starting background job infrastructure (Celery + Redis) earlier than "if required," since GitHub webhook processing benefits from async handling from the start.
- Consider a lightweight feature-flag mechanism so V2/Advanced features can be merged behind flags without disrupting MVP stability.

---

**This document is planning only. No application code, models, or infrastructure have been created.**
**Awaiting your approval to proceed to Phase 1 (Project Setup).**
