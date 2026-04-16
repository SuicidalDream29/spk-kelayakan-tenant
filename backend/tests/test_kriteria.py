import pytest
from helpers import factory_kriteria


class TestListKriteria:
    def test_no_auth_returns_401(self, client):
        assert client.get("/kriteria/").status_code == 401

    def test_empty_list(self, client, auth_headers):
        r = client.get("/kriteria/", headers=auth_headers)
        assert r.status_code == 200
        assert r.json() == []

    def test_returns_created_items(self, client, auth_headers):
        factory_kriteria(client, auth_headers, nama="K1")
        factory_kriteria(client, auth_headers, nama="K2", bobot=0.5, jenis="cost")
        r = client.get("/kriteria/", headers=auth_headers)
        assert r.status_code == 200
        assert len(r.json()) == 2


class TestCreateKriteria:
    def test_valid_benefit(self, client, auth_headers):
        r = client.post(
            "/kriteria/",
            json={"nama": "Penghasilan", "bobot": 0.4, "jenis": "benefit"},
            headers=auth_headers,
        )
        assert r.status_code == 201
        body = r.json()
        assert body["nama"] == "Penghasilan"
        assert body["bobot"] == 0.4
        assert body["jenis"] == "benefit"
        assert "id" in body

    def test_valid_cost(self, client, auth_headers):
        r = client.post(
            "/kriteria/",
            json={"nama": "Tanggungan", "bobot": 0.2, "jenis": "cost"},
            headers=auth_headers,
        )
        assert r.status_code == 201
        assert r.json()["jenis"] == "cost"

    def test_bobot_boundary_exactly_1_is_valid(self, client, auth_headers):
        r = client.post(
            "/kriteria/",
            json={"nama": "K", "bobot": 1.0, "jenis": "benefit"},
            headers=auth_headers,
        )
        assert r.status_code == 201

    def test_bobot_zero_returns_422(self, client, auth_headers):
        r = client.post(
            "/kriteria/",
            json={"nama": "K", "bobot": 0.0, "jenis": "benefit"},
            headers=auth_headers,
        )
        assert r.status_code == 422

    def test_bobot_above_1_returns_422(self, client, auth_headers):
        r = client.post(
            "/kriteria/",
            json={"nama": "K", "bobot": 1.1, "jenis": "benefit"},
            headers=auth_headers,
        )
        assert r.status_code == 422

    def test_bobot_negative_returns_422(self, client, auth_headers):
        r = client.post(
            "/kriteria/",
            json={"nama": "K", "bobot": -0.1, "jenis": "benefit"},
            headers=auth_headers,
        )
        assert r.status_code == 422

    def test_invalid_jenis_returns_422(self, client, auth_headers):
        r = client.post(
            "/kriteria/",
            json={"nama": "K", "bobot": 0.3, "jenis": "invalid"},
            headers=auth_headers,
        )
        assert r.status_code == 422

    def test_missing_nama_returns_422(self, client, auth_headers):
        r = client.post(
            "/kriteria/",
            json={"bobot": 0.3, "jenis": "benefit"},
            headers=auth_headers,
        )
        assert r.status_code == 422

    def test_missing_bobot_returns_422(self, client, auth_headers):
        r = client.post(
            "/kriteria/",
            json={"nama": "K", "jenis": "benefit"},
            headers=auth_headers,
        )
        assert r.status_code == 422

    def test_no_auth_returns_401(self, client):
        r = client.post("/kriteria/", json={"nama": "K", "bobot": 0.3, "jenis": "benefit"})
        assert r.status_code == 401


class TestUpdateKriteria:
    def test_valid_update(self, client, auth_headers):
        k = factory_kriteria(client, auth_headers)
        r = client.put(
            f"/kriteria/{k['id']}",
            json={"nama": "Updated", "bobot": 0.5, "jenis": "cost"},
            headers=auth_headers,
        )
        assert r.status_code == 200
        assert r.json()["nama"] == "Updated"
        assert r.json()["jenis"] == "cost"

    def test_not_found_returns_404(self, client, auth_headers):
        r = client.put(
            "/kriteria/9999",
            json={"nama": "X", "bobot": 0.5, "jenis": "benefit"},
            headers=auth_headers,
        )
        assert r.status_code == 404

    def test_no_auth_returns_401(self, client):
        r = client.put("/kriteria/1", json={"nama": "X", "bobot": 0.5, "jenis": "benefit"})
        assert r.status_code == 401


class TestDeleteKriteria:
    def test_valid_delete(self, client, auth_headers):
        k = factory_kriteria(client, auth_headers)
        r = client.delete(f"/kriteria/{k['id']}", headers=auth_headers)
        assert r.status_code == 204
        # Confirm gone
        r2 = client.get("/kriteria/", headers=auth_headers)
        assert r2.json() == []

    def test_not_found_returns_404(self, client, auth_headers):
        r = client.delete("/kriteria/9999", headers=auth_headers)
        assert r.status_code == 404

    def test_no_auth_returns_401(self, client):
        assert client.delete("/kriteria/1").status_code == 401
