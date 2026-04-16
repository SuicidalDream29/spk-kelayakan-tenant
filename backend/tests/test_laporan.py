import pytest
from helpers import factory_tenant


class TestLaporanPDF:
    def test_no_auth_returns_401(self, client):
        assert client.get("/laporan/pdf").status_code == 401

    def test_no_hasil_returns_404(self, client, auth_headers):
        r = client.get("/laporan/pdf", headers=auth_headers)
        assert r.status_code == 404
        assert "hasil" in r.json()["detail"].lower()

    def test_returns_pdf_when_hasil_exists(self, client, auth_headers, db):
        from app import models
        from datetime import datetime, timezone

        t = models.Tenant(nama="Joko", nik="1234567890123456", no_telp="08000", alamat="Jl.")
        db.add(t)
        db.commit()
        db.refresh(t)

        hasil = models.HasilTopsis(
            tenant_id=t.id,
            nilai_preferensi=0.82,
            ranking=1,
            status="LAYAK",
            dihitung_at=datetime.now(timezone.utc),
        )
        db.add(hasil)
        db.commit()

        r = client.get("/laporan/pdf", headers=auth_headers)
        assert r.status_code == 200
        assert r.headers["content-type"] == "application/pdf"
        assert "laporan_topsis.pdf" in r.headers["content-disposition"]
        assert len(r.content) > 100  # non-empty PDF

    def test_pdf_content_is_valid_pdf_magic_bytes(self, client, auth_headers, db):
        from app import models
        from datetime import datetime, timezone

        t = models.Tenant(nama="Sari", nik="9876543210987654", no_telp="08000", alamat="Jl.")
        db.add(t)
        db.commit()
        db.refresh(t)
        db.add(models.HasilTopsis(
            tenant_id=t.id, nilai_preferensi=0.4, ranking=1,
            status="TIDAK LAYAK", dihitung_at=datetime.now(timezone.utc),
        ))
        db.commit()

        r = client.get("/laporan/pdf", headers=auth_headers)
        assert r.status_code == 200
        # PDF files start with %PDF
        assert r.content[:4] == b"%PDF"
