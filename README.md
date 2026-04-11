# SPK Kelayakan Tenant

Sistem Pendukung Keputusan (DSS) untuk menentukan kelayakan calon tenant menggunakan metode **TOPSIS** (Technique for Order of Preference by Similarity to Ideal Solution).

---

## Daftar Isi

- [Fitur](#fitur)
- [Tech Stack](#tech-stack)
- [Arsitektur Sistem](#arsitektur-sistem)
- [Algoritma TOPSIS](#algoritma-topsis)
- [Cara Menjalankan](#cara-menjalankan)
- [Cara Penggunaan](#cara-penggunaan)
- [API Reference](#api-reference)
- [CI/CD](#cicd)
- [Environment Variables](#environment-variables)
- [Struktur Project](#struktur-project)

---

## Fitur

- **Master Kriteria** — CRUD kriteria penilaian (benefit/cost) beserta bobot
- **Data Tenant** — CRUD data tenant + input nilai per kriteria
- **Kalkulasi TOPSIS** — Proses perangkingan otomatis via background worker
- **Laporan PDF** — Generate & download laporan hasil perangkingan
- **Dashboard** — Ringkasan statistik dan ranking terakhir

---

## Tech Stack

| Layer | Teknologi |
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

## Arsitektur Sistem

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

## Algoritma TOPSIS

TOPSIS adalah metode pengambilan keputusan multi-kriteria yang menentukan alternatif terbaik berdasarkan kedekatan dengan solusi ideal positif dan jauhan dari solusi ideal negatif.

### Langkah-langkah

**1. Matriks Keputusan**

Susun nilai setiap tenant (alternatif) terhadap setiap kriteria:

```
         C1       C2       C3       C4
A1  [ x11     x12     x13     x14  ]
A2  [ x21     x22     x23     x24  ]
A3  [ x31     x32     x33     x34  ]
```

**2. Normalisasi Matriks**

```
r[i][j] = x[i][j] / sqrt( sum(x[k][j]^2) )
```

**3. Normalisasi Terbobot**

```
y[i][j] = w[j] × r[i][j]
```

dimana `w[j]` adalah bobot kriteria ke-j (total bobot = 1.0)

**4. Solusi Ideal Positif (A+) dan Negatif (A-)**

```
A+[j] = max(y[i][j])  jika Benefit
        min(y[i][j])  jika Cost

A-[j] = min(y[i][j])  jika Benefit
        max(y[i][j])  jika Cost
```

**5. Jarak ke Solusi Ideal**

```
D+[i] = sqrt( sum( (y[i][j] - A+[j])^2 ) )
D-[i] = sqrt( sum( (y[i][j] - A-[j])^2 ) )
```

**6. Nilai Preferensi**

```
V[i] = D-[i] / ( D+[i] + D-[i] )
```

Nilai V berkisar antara 0–1. **Semakin besar V, semakin layak tenant tersebut.**

**7. Perangkingan**

Urutkan tenant berdasarkan nilai V secara descending. Tenant dengan V ≥ threshold (default: 0.5) dinyatakan **LAYAK**.

---

## Cara Menjalankan

### Prasyarat

- Docker >= 24
- Docker Compose >= v2

### 1. Clone repository

```bash
git clone https://github.com/SuicidalDream29/spk-kelayakan-tenant.git
cd spk-kelayakan-tenant
```

### 2. Setup environment

```bash
cp .env.example .env
# Edit .env sesuai kebutuhan
```

### 3. Jalankan semua service

```bash
docker compose up --build -d
```

### 4. Jalankan database migration

```bash
docker compose exec api alembic upgrade head
```

### 5. Akses aplikasi

| URL | Keterangan |
|---|---|
| `http://localhost` | Frontend (Dashboard) |
| `http://localhost/docs` | Swagger UI (API docs) |
| `http://localhost/kriteria.html` | Master Kriteria |
| `http://localhost/tenants.html` | Data Tenant |
| `http://localhost/topsis.html` | Kalkulasi & Ranking |

---

## Cara Penggunaan

Ikuti urutan berikut untuk hasil yang optimal:

### Step 1 — Buat Kriteria

Masuk ke halaman **Kriteria**, klik **+ Tambah Kriteria**.

Contoh kriteria yang umum digunakan:

| Kriteria | Bobot | Jenis |
|---|---|---|
| Penghasilan per Bulan | 0.35 | Benefit |
| Lama Kontrak (bulan) | 0.25 | Benefit |
| Jumlah Tanggungan | 0.20 | Cost |
| Usia | 0.20 | Benefit |

> **Penting:** Total bobot semua kriteria sebaiknya = 1.0

### Step 2 — Daftarkan Tenant

Masuk ke halaman **Tenant**, klik **+ Tambah Tenant**, isi data diri.

### Step 3 — Input Nilai per Tenant

Di tabel Tenant, klik ikon **clipboard** (Input Nilai) pada setiap tenant, lalu isi nilai untuk setiap kriteria.

> Minimal **2 tenant** harus memiliki nilai lengkap sebelum kalkulasi.

### Step 4 — Hitung TOPSIS

Masuk ke halaman **TOPSIS & Ranking**, klik **Hitung TOPSIS**.  
Kalkulasi berjalan di background — hasil muncul otomatis dalam beberapa detik.

### Step 5 — Lihat & Cetak Laporan

Hasil perangkingan tampil di halaman TOPSIS.  
Klik **Download PDF** untuk mencetak laporan resmi.

---

## API Reference

Dokumentasi interaktif tersedia di `http://localhost/docs`

### Kriteria

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/kriteria/` | List semua kriteria |
| POST | `/kriteria/` | Tambah kriteria baru |
| PUT | `/kriteria/{id}` | Update kriteria |
| DELETE | `/kriteria/{id}` | Hapus kriteria |

### Tenant

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/tenants/` | List semua tenant |
| POST | `/tenants/` | Tambah tenant baru |
| GET | `/tenants/{id}` | Detail tenant |
| PUT | `/tenants/{id}` | Update tenant |
| DELETE | `/tenants/{id}` | Hapus tenant |
| POST | `/tenants/{id}/nilai` | Input nilai kriteria |

### TOPSIS

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/topsis/hitung` | Trigger kalkulasi (async) |
| GET | `/topsis/hasil` | Ambil hasil perangkingan |

### Laporan

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/laporan/pdf` | Download laporan PDF |

---

## CI/CD

Pipeline berjalan otomatis via **GitHub Actions** di setiap push ke branch `main`.

```
push to main
     │
     ▼
  [CI] Lint (ruff)
  [CI] Test (pytest)
     │
     ▼ (jika semua pass)
  [CD] SSH ke server
       git pull
       docker compose up --build
       alembic upgrade head
       docker image prune
```

### Setup CD ke server baru

Tambahkan secrets berikut di GitHub → Settings → Secrets → Actions:

| Secret | Nilai |
|---|---|
| `DEPLOY_HOST` | IP atau domain server |
| `DEPLOY_USER` | Username SSH (misal: `root`) |
| `DEPLOY_SSH_KEY` | Private key SSH (isi konten `~/.ssh/id_rsa`) |

---

## Environment Variables

Lihat `.env.example` untuk daftar lengkap:

| Variable | Default | Keterangan |
|---|---|---|
| `POSTGRES_USER` | — | Username PostgreSQL |
| `POSTGRES_PASSWORD` | — | Password PostgreSQL |
| `POSTGRES_DB` | — | Nama database |
| `DATABASE_URL` | — | Full connection string |
| `REDIS_URL` | `redis://redis:6379/0` | URL Redis broker |
| `SECRET_KEY` | — | Secret key aplikasi |
| `THRESHOLD_LAYAK` | `0.5` | Batas nilai V dinyatakan LAYAK |

---

## Struktur Project

```
spk-kelayakan-tenant/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── schemas.py           # Pydantic schemas
│   │   ├── database.py          # DB connection
│   │   ├── deps.py              # Dependency injection
│   │   ├── topsis_engine.py     # Algoritma TOPSIS
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
│   │   ├── utils.js             # Toast, modal helpers
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

## Lisensi

MIT License — bebas digunakan dan dimodifikasi.
