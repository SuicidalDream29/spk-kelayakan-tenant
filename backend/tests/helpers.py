"""Shared test factory functions."""
from datetime import datetime, timedelta, timezone
from jose import jwt
from app.config import settings


def make_token(username: str | None = None, delta: timedelta | None = None) -> str:
    exp = datetime.now(timezone.utc) + (delta or timedelta(hours=1))
    return jwt.encode(
        {"sub": username or settings.admin_username, "exp": exp},
        settings.secret_key,
        algorithm="HS256",
    )


def factory_kriteria(client, headers, **kwargs):
    data = {"nama": "Penghasilan", "bobot": 0.3, "jenis": "benefit", **kwargs}
    r = client.post("/kriteria/", json=data, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()


def factory_tenant(client, headers, **kwargs):
    data = {
        "nama": "Budi Santoso",
        "nik": "3201010101010001",
        "no_telp": "081234567890",
        "alamat": "Jl. Test No.1",
        **kwargs,
    }
    r = client.post("/tenants/", json=data, headers=headers)
    assert r.status_code == 201, r.text
    return r.json()
