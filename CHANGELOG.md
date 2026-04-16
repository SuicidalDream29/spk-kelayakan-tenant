# Changelog

All notable changes to this project are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.3.0] — 2026-04-16

### Added
- **JWT Authentication** — Login page, protected API endpoints, auto-redirect to `/login.html`
- **Nilai Kontrak page** — Pivot table showing all tenants × all criteria in one view, with inline edit
- **Status badge** on tenant list — shows "Lengkap / Belum" based on criteria completeness
- **Pre-fill nilai form** — Input Values modal now loads existing values instead of blank form
- **GET `/tenants/{id}/nilai`** endpoint to retrieve stored criteria values per tenant
- **71 automated tests** covering auth, CRUD, validation, edge cases, and PDF generation
- **Rate limiting** — 5 req/min on `/auth/login` (brute-force protection), 60 req/min on API
- **Security headers** — `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`, `Content-Security-Policy`, `Referrer-Policy`
- **`.dockerignore`** — prevents `.env`, `__pycache__`, `.pyc` from leaking into image layers
- **`requirements-test.txt`** — test dependencies separated from production

### Changed
- All containers now run as non-root `appuser`
- Docker image tags pinned to `@sha256` digests for reproducible builds
- Explicit `frontend` and `backend` networks — db/redis not reachable from nginx
- Resource limits added to all services (`mem_limit`, `cpus`)
- Log rotation configured (`max-size: 10m`, `max-file: 3`)
- `uvicorn --reload` replaced with `--workers 2` (production-safe)
- Bind mounts removed — code baked into image at build time
- `SECRET_KEY` default rotated from placeholder to random 32-byte hex
- `libpango` removed from API Dockerfile (unused since fpdf2 migration)

### Security
- Resolved: default `SECRET_KEY` allows JWT forgery (CRITICAL)
- Resolved: no brute-force protection on login endpoint (HIGH)
- Resolved: JWT stored in `localStorage` mitigated via CSP header (HIGH)
- Resolved: no security headers on nginx (MEDIUM)
- Resolved: test dependencies in production image (MEDIUM)
- Confirmed: 0 CVEs in all 15 production dependencies
- Confirmed: no SQL injection (full ORM), no command injection, no path traversal

---

## [1.2.0] — 2026-04-15

### Added
- Sortable columns on all tables (Kriteria, Tenant, TOPSIS results)
- Real-time search / filter on all tables via `TableManager` class
- `TableManager` utility class in `utils.js` — reusable sort + filter logic

### Changed
- Replaced inline `onclick` handlers with `data-action` event delegation
- Added `escHtml()` sanitization to all dynamic DOM output (XSS prevention)

---

## [1.1.0] — 2026-04-14

### Added
- Full frontend UI — Dashboard, Kriteria, Tenant, TOPSIS & Ranking pages
- Sidebar navigation with active state highlighting
- Toast notifications for success / error feedback
- Modal forms for create / edit operations
- Stat cards on Dashboard with live counts
- TOPSIS polling mechanism (1.5s interval, max 10 attempts)
- PDF download with validation (disabled when no results)
- CI/CD pipeline via GitHub Actions (lint → test → SSH deploy)
- `README.md` in English with architecture diagram and algorithm explanation

### Fixed
- `HasilTopsis.status` column truncation — `String(10)` → `String(15)` (`"TIDAK LAYAK"` was being cut)
- WeasyPrint replaced with `fpdf2` (no system library dependencies)
- Nginx routing — static files now served correctly alongside API proxy
- `/openapi.json` returning 404 — added explicit location block
- PUT `/tenants` allowing duplicate NIK on update
- `/laporan/pdf` returning empty PDF when no results — now returns 404

---

## [1.0.0] — 2026-04-13

### Added
- FastAPI backend with PostgreSQL database
- SQLAlchemy ORM + Alembic migrations
- TOPSIS algorithm engine (7-step: normalization, weighting, ideal solutions, distances, preference, ranking)
- Celery + Redis background task queue for async TOPSIS calculation
- Docker Compose orchestration (api, worker, db, redis, nginx)
- REST API: Kriteria, Tenant, Nilai, TOPSIS, Laporan PDF
- Pydantic schemas with bobot validation (0 < bobot ≤ 1)
- Health checks on PostgreSQL and Redis containers
- `restart: unless-stopped` on all services

---

[1.3.0]: https://github.com/SuicidalDream29/spk-kelayakan-tenant/compare/eedb25a...278df5e
[1.2.0]: https://github.com/SuicidalDream29/spk-kelayakan-tenant/compare/8e0deb9...af3476a
[1.1.0]: https://github.com/SuicidalDream29/spk-kelayakan-tenant/compare/792c58d...8e0deb9
[1.0.0]: https://github.com/SuicidalDream29/spk-kelayakan-tenant/releases/tag/792c58d
