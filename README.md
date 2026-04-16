# SPK Kelayakan Tenant

A Decision Support System (DSS) for determining tenant rental eligibility using the **TOPSIS** method (Technique for Order of Preference by Similarity to Ideal Solution).

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [TOPSIS Algorithm](#topsis-algorithm)
- [Getting Started](#getting-started)
- [How to Use](#how-to-use)
- [API Reference](#api-reference)
- [Authentication](#authentication)
- [Security](#security)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Changelog](#changelog)

---

## Features

- **Authentication** — JWT-based login, all pages and APIs protected
- **Criteria Management** — CRUD evaluation criteria (benefit/cost) with weights
- **Tenant Data** — CRUD tenant records + input values per criteria
- **Nilai Kontrak** — Pivot table view of all tenant × criteria values at a glance
- **TOPSIS Calculation** — Automatic ranking via background worker queue
- **PDF Report** — Generate and download ranking result report
- **Dashboard** — Summary statistics and latest ranking overview
- **Search & Sort** — Real-time filter and column sorting on all tables

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | FastAPI (Python 3.12) |
| Database | PostgreSQL 16 |
| ORM + Migrations | SQLAlchemy + Alembic |
| Background Queue | Celery + Redis |
| Reverse Proxy | Nginx |
| Frontend | HTML + Vanilla JS + Bootstrap Icons |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Testing | pytest + httpx (71 tests) |

---

## System Architecture

```
Client (Browser)
      │
      ▼
   Nginx :80
   ├── Static files (HTML/CSS/JS)     → /usr/share/nginx/html
   └── API proxy (/auth, /tenants...) → FastAPI :8000
                                              │
                             ┌────────────────┴────────────────┐
                             ▼                                  ▼
                        PostgreSQL                            Redis
                       (data store)                    (message broker)
                                                              │
                                                              ▼
                                                       Celery Worker
                                                   (background TOPSIS)

Networks:
  frontend  — nginx ↔ api
  backend   — api ↔ db ↔ redis ↔ worker  (internal, not reachable from nginx)
```

---

## TOPSIS Algorithm

TOPSIS is a multi-criteria decision-making method that determines the best alternative based on its proximity to the positive ideal solution and distance from the negative ideal solution.

### Steps

**1. Decision Matrix**

```
         C1       C2       C3       C4
A1  [ x11     x12     x13     x14  ]
A2  [ x21     x22     x23     x24  ]
A3  [ x31     x32     x33     x34  ]
```

**2. Matrix Normalization**

```
r[i][j] = x[i][j] / sqrt( sum(x[k][j]^2) )
```

**3. Weighted Normalized Matrix**

```
y[i][j] = w[j] × r[i][j]
```

where `w[j]` is the weight of criterion j (total weights should sum to 1.0)

**4. Positive (A+) and Negative (A-) Ideal Solutions**

```
A+[j] = max(y[i][j])  if Benefit,   min(y[i][j])  if Cost
A-[j] = min(y[i][j])  if Benefit,   max(y[i][j])  if Cost
```

**5. Distance to Ideal Solutions**

```
D+[i] = sqrt( sum( (y[i][j] - A+[j])^2 ) )
D-[i] = sqrt( sum( (y[i][j] - A-[j])^2 ) )
```

**6. Preference Value**

```
V[i] = D-[i] / ( D+[i] + D-[i] )
```

V ranges from 0 to 1. **The higher the V value, the more eligible the tenant.**

**7. Ranking**

Sort tenants by V descending. Tenants with V ≥ threshold (default: 0.5) → **ELIGIBLE**.

---

## Getting Started

### Prerequisites

- Docker >= 24
- Docker Compose >= v2

### 1. Clone the repository

```bash
git clone https://github.com/SuicidalDream29/spk-kelayakan-tenant.git
cd spk-kelayakan-tenant
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — at minimum set:
```env
POSTGRES_USER=spkuser
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=spk_tenant
DATABASE_URL=postgresql://spkuser:<strong-password>@db:5432/spk_tenant
SECRET_KEY=<random-32-byte-hex>          # python3 -c "import secrets; print(secrets.token_hex(32))"
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH_B64=<bcrypt-hash>    # see Authentication section
```

### 3. Start all services

```bash
docker compose up --build -d
```

### 4. Run database migrations

```bash
docker compose exec api alembic upgrade head
```

### 5. Access the application

| URL | Description |
|---|---|
| `http://localhost/login.html` | Login page |
| `http://localhost` | Dashboard (requires login) |
| `http://localhost/docs` | Swagger UI (API docs) |
| `http://localhost/kriteria.html` | Criteria Management |
| `http://localhost/tenants.html` | Tenant Data |
| `http://localhost/kontrak.html` | Nilai Kontrak (pivot table) |
| `http://localhost/topsis.html` | Calculation & Ranking |

---

## How to Use

### Step 1 — Login

Open `http://localhost/login.html`. Default credentials: `admin` / `admin123`.
> Change the default password in production — see [Authentication](#authentication).

### Step 2 — Create Criteria

Go to **Criteria** → **+ Add Criteria**.

Example criteria:

| Criteria | Weight | Type |
|---|---|---|
| Monthly Income | 0.35 | Benefit |
| Contract Duration (months) | 0.25 | Benefit |
| Number of Dependants | 0.20 | Cost |
| Age | 0.20 | Benefit |

> Total weights should sum to 1.0

### Step 3 — Register Tenants

Go to **Tenant** → **+ Add Tenant**, fill in personal data.

### Step 4 — Input Criteria Values

In the Tenant table, click the **clipboard** icon for each tenant and fill in all criteria values.

> Check the **Nilai Kontrak** page to see all tenants and their values in one matrix view.
> Tenants with incomplete values will be skipped during calculation (shown with **Belum** badge).

### Step 5 — Run TOPSIS

Go to **TOPSIS & Ranking** → **Calculate TOPSIS**.
Calculation runs in the background — results appear automatically within seconds.

### Step 6 — Download Report

Click **Download PDF** to export the ranking as a PDF report.

---

## API Reference

All endpoints (except `/auth/login`) require a Bearer token.

```http
Authorization: Bearer <token>
```

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | No | Login, returns JWT token |
| GET | `/auth/me` | Yes | Verify token, returns username |

### Criteria

| Method | Endpoint | Description |
|---|---|---|
| GET | `/kriteria/` | List all criteria |
| POST | `/kriteria/` | Create new criteria |
| PUT | `/kriteria/{id}` | Update criteria |
| DELETE | `/kriteria/{id}` | Delete criteria |

### Tenants

| Method | Endpoint | Description |
|---|---|---|
| GET | `/tenants/` | List all tenants |
| POST | `/tenants/` | Create new tenant |
| GET | `/tenants/{id}` | Get tenant detail |
| PUT | `/tenants/{id}` | Update tenant |
| DELETE | `/tenants/{id}` | Delete tenant |
| GET | `/tenants/{id}/nilai` | Get stored criteria values |
| POST | `/tenants/{id}/nilai` | Input / update criteria values |

### TOPSIS

| Method | Endpoint | Description |
|---|---|---|
| POST | `/topsis/hitung` | Trigger calculation (async, returns 202) |
| GET | `/topsis/hasil` | Get ranking results |

### Report

| Method | Endpoint | Description |
|---|---|---|
| GET | `/laporan/pdf` | Download PDF report |

---

## Authentication

The app uses **JWT (HS256)** with a single admin user stored in `.env`.

### Generating a password hash

```bash
docker compose exec api python3 -c "
import bcrypt, base64
h = bcrypt.hashpw(b'your-new-password', bcrypt.gensalt()).decode()
print(base64.b64encode(h.encode()).decode())
"
```

Paste the output as `ADMIN_PASSWORD_HASH_B64` in `.env`, then restart the API:

```bash
docker compose up -d api
```

### Environment variables

| Variable | Description |
|---|---|
| `ADMIN_USERNAME` | Login username (default: `admin`) |
| `ADMIN_PASSWORD_HASH_B64` | Base64-encoded bcrypt hash of the password |
| `SECRET_KEY` | JWT signing key — **must be changed in production** |
| `TOKEN_EXPIRE_HOURS` | Token lifetime in hours (default: `8`) |

### Token lifetime

Tokens expire after `TOKEN_EXPIRE_HOURS` hours (default: 8). The frontend auto-redirects to `/login.html` on 401.

---

## Security

### Implemented controls

| Control | Implementation |
|---|---|
| Authentication | JWT HS256, bcrypt password hashing |
| Brute-force protection | Nginx rate limit: 5 req/min on `/auth/login` |
| Security headers | `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Content-Security-Policy`, `Referrer-Policy` |
| XSS prevention | `escHtml()` on all dynamic frontend output |
| SQL injection | SQLAlchemy ORM only — no raw queries |
| Container hardening | Non-root `appuser`, pinned image digests, no bind mounts |
| Network isolation | `backend` network is `internal: true` (db/redis unreachable from nginx) |
| Resource limits | `mem_limit` + `cpus` on all services |
| Log rotation | `max-size: 10m`, `max-file: 3` |
| Secret management | Credentials via `.env` (gitignored), no hardcoded secrets |
| Dependencies | 0 known CVEs across all 15 production packages |

### Known limitations

| Item | Notes |
|---|---|
| HTTPS / TLS | Not configured — add a reverse proxy (Caddy / Certbot) before exposing to the internet |
| Single admin user | No user management — suitable for homelab / internal use |
| JWT in localStorage | Mitigated by CSP header; use HttpOnly cookies for higher security environments |

---

## Testing

The test suite uses **pytest + httpx** with an in-memory SQLite database — no external services required.

```bash
# Run all tests inside the container
docker compose exec api python -m pytest tests/ -v -p no:cacheprovider
```

### Coverage

| File | Tests | Covers |
|---|---|---|
| `test_auth.py` | 12 | Login, JWT validation, expired/invalid/malformed tokens |
| `test_kriteria.py` | 12 | CRUD + bobot boundary (0, 1.0, 1.1), invalid jenis |
| `test_tenants.py` | 24 | CRUD + NIK uniqueness, NIK conflict on update, nilai overwrite |
| `test_topsis.py` | 8 | Auth guard, min criteria/tenant validation, Celery mock, empty results |
| `test_laporan.py` | 4 | Auth guard, 404 on empty results, PDF response, `%PDF` magic bytes |
| **Total** | **71** | **All passing** |

---

## CI/CD

The pipeline runs automatically via **GitHub Actions** on every push to `main`.

```
push to main
     │
     ├── [lint]  ruff check backend/
     ├── [test]  pytest tests/ (71 tests)
     │
     └── [deploy] (on main branch, if lint+test pass)
           SSH → server
           git pull
           docker compose up --build -d
           alembic upgrade head
           docker image prune -f
```

### Setting Up CD

Add these secrets in **GitHub → Settings → Secrets → Actions**:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | Server IP or domain |
| `DEPLOY_USER` | SSH username (e.g. `root`) |
| `DEPLOY_SSH_KEY` | SSH private key content |

---

## Environment Variables

See `.env.example` for the full list:

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | — | PostgreSQL username |
| `POSTGRES_PASSWORD` | — | PostgreSQL password |
| `POSTGRES_DB` | — | Database name |
| `DATABASE_URL` | — | Full connection string |
| `REDIS_URL` | `redis://redis:6379/0` | Redis broker URL |
| `SECRET_KEY` | — | JWT signing key (generate with `secrets.token_hex(32)`) |
| `THRESHOLD_LAYAK` | `0.5` | Minimum V value to be marked ELIGIBLE |
| `ADMIN_USERNAME` | `admin` | Login username |
| `ADMIN_PASSWORD_HASH_B64` | — | Base64-encoded bcrypt hash |
| `TOKEN_EXPIRE_HOURS` | `8` | JWT expiry in hours |

---

## Project Structure

```
spk-kelayakan-tenant/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint + router registration
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── database.py          # DB connection + session
│   │   ├── config.py            # Pydantic settings (reads .env)
│   │   ├── deps.py              # get_db + get_current_user (JWT guard)
│   │   ├── topsis_engine.py     # TOPSIS algorithm (7 steps)
│   │   ├── routers/
│   │   │   ├── auth.py          # POST /auth/login, GET /auth/me
│   │   │   ├── kriteria.py      # CRUD /kriteria
│   │   │   ├── tenants.py       # CRUD /tenants + /nilai
│   │   │   ├── topsis.py        # POST /topsis/hitung, GET /hasil
│   │   │   └── laporan.py       # GET /laporan/pdf
│   │   └── tasks/
│   │       └── topsis_task.py   # Celery background task
│   ├── tests/
│   │   ├── conftest.py          # SQLite fixture + auth helpers
│   │   ├── helpers.py           # Factory functions
│   │   ├── test_auth.py
│   │   ├── test_kriteria.py
│   │   ├── test_tenants.py
│   │   ├── test_topsis.py
│   │   └── test_laporan.py
│   ├── alembic/                 # Database migrations
│   ├── celery_worker.py         # Celery app config
│   ├── Dockerfile               # API container (non-root, no test deps)
│   ├── Dockerfile.worker        # Worker container
│   ├── requirements.txt         # Production dependencies
│   └── requirements-test.txt   # Test dependencies (pytest, httpx)
├── frontend/
│   ├── css/style.css
│   ├── js/
│   │   ├── api.js               # HTTP client + Bearer token injection
│   │   ├── auth.js              # Token check + logout + username display
│   │   ├── utils.js             # Toast, modal, TableManager (sort+filter)
│   │   ├── kriteria.js
│   │   ├── tenants.js
│   │   ├── kontrak.js           # Pivot table (nilai kontrak)
│   │   └── topsis.js
│   ├── index.html               # Dashboard
│   ├── login.html               # Login page
│   ├── kriteria.html
│   ├── tenants.html
│   ├── kontrak.html             # Nilai Kontrak pivot table
│   └── topsis.html
├── nginx/nginx.conf             # Rate limiting + security headers
├── .github/workflows/ci.yml    # CI/CD pipeline
├── docker-compose.yml
├── .env.example
├── CHANGELOG.md
└── README.md
```

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for full version history.

---

## License

MIT License — free to use and modify.
