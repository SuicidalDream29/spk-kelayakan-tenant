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
- [CI/CD](#cicd)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)

---

## Features

- **Criteria Management** — CRUD evaluation criteria (benefit/cost) with weights
- **Tenant Data** — CRUD tenant records + input values per criteria
- **TOPSIS Calculation** — Automatic ranking via background worker queue
- **PDF Report** — Generate and download ranking result report
- **Dashboard** — Summary statistics and latest ranking overview

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

---

## System Architecture

```
Client (Browser)
      │
      ▼
   Nginx :80
   ├── Static files (HTML/CSS/JS)  → /usr/share/nginx/html
   └── API proxy                   → FastAPI :8000
                                         │
                          ┌──────────────┴──────────────┐
                          ▼                             ▼
                     PostgreSQL                       Redis
                    (data store)               (message broker)
                                                      │
                                                      ▼
                                               Celery Worker
                                           (background TOPSIS)
```

---

## TOPSIS Algorithm

TOPSIS is a multi-criteria decision-making method that determines the best alternative based on its proximity to the positive ideal solution and distance from the negative ideal solution.

### Steps

**1. Decision Matrix**

Construct a matrix of each tenant's (alternative) values against each criterion:

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
A+[j] = max(y[i][j])  if Benefit
        min(y[i][j])  if Cost

A-[j] = min(y[i][j])  if Benefit
        max(y[i][j])  if Cost
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

Sort tenants by V in descending order. Tenants with V ≥ threshold (default: 0.5) are marked as **ELIGIBLE**.

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
# Edit .env as needed
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
| `http://localhost` | Frontend (Dashboard) |
| `http://localhost/docs` | Swagger UI (API docs) |
| `http://localhost/kriteria.html` | Criteria Management |
| `http://localhost/tenants.html` | Tenant Data |
| `http://localhost/topsis.html` | Calculation & Ranking |

---

## How to Use

Follow this order for best results:

### Step 1 — Create Criteria

Go to the **Criteria** page, click **+ Add Criteria**.

Example criteria:

| Criteria | Weight | Type |
|---|---|---|
| Monthly Income | 0.35 | Benefit |
| Contract Duration (months) | 0.25 | Benefit |
| Number of Dependants | 0.20 | Cost |
| Age | 0.20 | Benefit |

> **Important:** Total weight of all criteria should equal 1.0

### Step 2 — Register Tenants

Go to the **Tenant** page, click **+ Add Tenant**, fill in the personal data.

### Step 3 — Input Values per Tenant

In the Tenant table, click the **clipboard** icon (Input Values) for each tenant, then fill in the value for each criterion.

> At least **2 tenants** must have complete values before calculation.

### Step 4 — Run TOPSIS

Go to the **TOPSIS & Ranking** page, click **Calculate TOPSIS**.  
Calculation runs in the background — results appear automatically within seconds.

### Step 5 — View & Print Report

Ranking results are displayed on the TOPSIS page.  
Click **Download PDF** to print the official report.

---

## API Reference

Interactive documentation available at `http://localhost/docs`

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
| POST | `/tenants/{id}/nilai` | Input criteria values |

### TOPSIS

| Method | Endpoint | Description |
|---|---|---|
| POST | `/topsis/hitung` | Trigger calculation (async) |
| GET | `/topsis/hasil` | Get ranking results |

### Report

| Method | Endpoint | Description |
|---|---|---|
| GET | `/laporan/pdf` | Download PDF report |

---

## CI/CD

The pipeline runs automatically via **GitHub Actions** on every push to `main`.

```
push to main
     │
     ▼
  [CI] Lint (ruff)
  [CI] Test (pytest)
     │
     ▼ (if all pass)
  [CD] SSH to server
       git pull
       docker compose up --build
       alembic upgrade head
       docker image prune
```

### Setting Up CD to a New Server

Add the following secrets in GitHub → Settings → Secrets → Actions:

| Secret | Value |
|---|---|
| `DEPLOY_HOST` | Server IP or domain |
| `DEPLOY_USER` | SSH username (e.g. `root`) |
| `DEPLOY_SSH_KEY` | SSH private key content (`~/.ssh/id_rsa`) |

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
| `SECRET_KEY` | — | Application secret key |
| `THRESHOLD_LAYAK` | `0.5` | Minimum V value to be marked ELIGIBLE |

---

## Project Structure

```
spk-kelayakan-tenant/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── database.py          # DB connection
│   │   ├── deps.py              # Dependency injection
│   │   ├── topsis_engine.py     # TOPSIS algorithm
│   │   ├── routers/
│   │   │   ├── kriteria.py
│   │   │   ├── tenants.py
│   │   │   ├── topsis.py
│   │   │   └── laporan.py
│   │   └── tasks/
│   │       └── topsis_task.py   # Celery background task
│   ├── alembic/                 # Database migrations
│   ├── celery_worker.py         # Celery app config
│   ├── Dockerfile               # API container
│   ├── Dockerfile.worker        # Worker container
│   └── requirements.txt
├── frontend/
│   ├── css/style.css
│   ├── js/
│   │   ├── api.js               # HTTP client
│   │   ├── utils.js             # Toast, modal, TableManager
│   │   ├── kriteria.js
│   │   ├── tenants.js
│   │   └── topsis.js
│   ├── index.html               # Dashboard
│   ├── kriteria.html
│   ├── tenants.html
│   └── topsis.html
├── nginx/nginx.conf
├── .github/workflows/ci.yml     # CI/CD pipeline
├── docker-compose.yml           # Development
├── docker-compose.prod.yml      # Production
├── .env.example
└── README.md
```

---

## License

MIT License — free to use and modify.
