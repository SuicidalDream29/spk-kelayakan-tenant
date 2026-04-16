import pytest
from unittest.mock import patch
from helpers import factory_kriteria, factory_tenant


class TestHitungTopsis:
    def test_no_auth_returns_401(self, client):
        assert client.post("/topsis/hitung").status_code == 401

    def test_less_than_2_kriteria_returns_400(self, client, auth_headers):
        factory_kriteria(client, auth_headers)
        factory_tenant(client, auth_headers, nik="1111111111111111")
        factory_tenant(client, auth_headers, nik="2222222222222222")
        r = client.post("/topsis/hitung", headers=auth_headers)
        assert r.status_code == 400
        assert "kriteria" in r.json()["detail"].lower()

    def test_less_than_2_tenants_returns_400(self, client, auth_headers):
        factory_kriteria(client, auth_headers, nama="K1")
        factory_kriteria(client, auth_headers, nama="K2", bobot=0.5)
        factory_tenant(client, auth_headers)
        r = client.post("/topsis/hitung", headers=auth_headers)
        assert r.status_code == 400
        assert "tenant" in r.json()["detail"].lower()

    def test_zero_kriteria_returns_400(self, client, auth_headers):
        r = client.post("/topsis/hitung", headers=auth_headers)
        assert r.status_code == 400

    def test_valid_queues_task(self, client, auth_headers):
        factory_kriteria(client, auth_headers, nama="K1", bobot=0.5)
        factory_kriteria(client, auth_headers, nama="K2", bobot=0.5, jenis="cost")
        factory_tenant(client, auth_headers, nik="1111111111111111")
        factory_tenant(client, auth_headers, nik="2222222222222222")
        with patch("app.routers.topsis.task_hitung_topsis.delay") as mock_delay:
            r = client.post("/topsis/hitung", headers=auth_headers)
        assert r.status_code == 202
        assert r.json()["status"] == "queued"
        mock_delay.assert_called_once()


class TestHasilTopsis:
    def test_no_auth_returns_401(self, client):
        assert client.get("/topsis/hasil").status_code == 401

    def test_no_results_returns_404(self, client, auth_headers):
        r = client.get("/topsis/hasil", headers=auth_headers)
        assert r.status_code == 404
        assert "hitung" in r.json()["detail"].lower()

    def test_returns_results_when_exists(self, client, auth_headers, db):
        from app import models
        from datetime import datetime, timezone

        # Seed tenant + hasil directly via db
        t = models.Tenant(nama="Test", nik="9999999999999999", no_telp="08000", alamat="Jl.")
        db.add(t)
        db.commit()
        db.refresh(t)

        hasil = models.HasilTopsis(
            tenant_id=t.id,
            nilai_preferensi=0.75,
            ranking=1,
            status="LAYAK",
            dihitung_at=datetime.now(timezone.utc),
        )
        db.add(hasil)
        db.commit()

        r = client.get("/topsis/hasil", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) == 1
        assert r.json()[0]["ranking"] == 1
        assert r.json()[0]["status"] == "LAYAK"
        assert r.json()[0]["tenant"]["nama"] == "Test"
