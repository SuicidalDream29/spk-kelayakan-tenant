import pytest
from helpers import factory_kriteria, factory_tenant

TENANT_PAYLOAD = {
    "nama": "Budi Santoso",
    "nik": "3201010101010001",
    "no_telp": "081234567890",
    "alamat": "Jl. Merdeka No.1",
}


class TestListTenants:
    def test_no_auth_returns_401(self, client):
        assert client.get("/tenants/").status_code == 401

    def test_empty_list(self, client, auth_headers):
        r = client.get("/tenants/", headers=auth_headers)
        assert r.status_code == 200
        assert r.json() == []

    def test_returns_created_tenants(self, client, auth_headers):
        factory_tenant(client, auth_headers)
        factory_tenant(client, auth_headers, nik="3201010101010002", nama="Sari")
        r = client.get("/tenants/", headers=auth_headers)
        assert len(r.json()) == 2


class TestGetTenant:
    def test_valid_returns_tenant(self, client, auth_headers):
        t = factory_tenant(client, auth_headers)
        r = client.get(f"/tenants/{t['id']}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["nama"] == t["nama"]

    def test_not_found_returns_404(self, client, auth_headers):
        r = client.get("/tenants/9999", headers=auth_headers)
        assert r.status_code == 404

    def test_no_auth_returns_401(self, client):
        assert client.get("/tenants/1").status_code == 401


class TestCreateTenant:
    def test_valid_creates_tenant(self, client, auth_headers):
        r = client.post("/tenants/", json=TENANT_PAYLOAD, headers=auth_headers)
        assert r.status_code == 201
        body = r.json()
        assert body["nama"] == TENANT_PAYLOAD["nama"]
        assert body["nik"] == TENANT_PAYLOAD["nik"]
        assert "id" in body

    def test_duplicate_nik_returns_400(self, client, auth_headers):
        client.post("/tenants/", json=TENANT_PAYLOAD, headers=auth_headers)
        r = client.post("/tenants/", json=TENANT_PAYLOAD, headers=auth_headers)
        assert r.status_code == 400
        assert "NIK" in r.json()["detail"]

    def test_missing_nama_returns_422(self, client, auth_headers):
        payload = {k: v for k, v in TENANT_PAYLOAD.items() if k != "nama"}
        assert client.post("/tenants/", json=payload, headers=auth_headers).status_code == 422

    def test_missing_nik_returns_422(self, client, auth_headers):
        payload = {k: v for k, v in TENANT_PAYLOAD.items() if k != "nik"}
        assert client.post("/tenants/", json=payload, headers=auth_headers).status_code == 422

    def test_empty_body_returns_422(self, client, auth_headers):
        assert client.post("/tenants/", json={}, headers=auth_headers).status_code == 422

    def test_no_auth_returns_401(self, client):
        assert client.post("/tenants/", json=TENANT_PAYLOAD).status_code == 401


class TestUpdateTenant:
    def test_valid_update(self, client, auth_headers):
        t = factory_tenant(client, auth_headers)
        updated = {**TENANT_PAYLOAD, "nama": "Nama Baru", "nik": TENANT_PAYLOAD["nik"]}
        r = client.put(f"/tenants/{t['id']}", json=updated, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["nama"] == "Nama Baru"

    def test_nik_conflict_with_other_tenant_returns_400(self, client, auth_headers):
        t1 = factory_tenant(client, auth_headers, nik="1111111111111111")
        t2 = factory_tenant(client, auth_headers, nik="2222222222222222")
        # Try to update t2 with t1's NIK
        payload = {**TENANT_PAYLOAD, "nik": "1111111111111111"}
        r = client.put(f"/tenants/{t2['id']}", json=payload, headers=auth_headers)
        assert r.status_code == 400
        assert "NIK" in r.json()["detail"]

    def test_same_nik_on_same_tenant_is_ok(self, client, auth_headers):
        t = factory_tenant(client, auth_headers)
        r = client.put(f"/tenants/{t['id']}", json=TENANT_PAYLOAD, headers=auth_headers)
        assert r.status_code == 200

    def test_not_found_returns_404(self, client, auth_headers):
        r = client.put("/tenants/9999", json=TENANT_PAYLOAD, headers=auth_headers)
        assert r.status_code == 404

    def test_no_auth_returns_401(self, client):
        assert client.put("/tenants/1", json=TENANT_PAYLOAD).status_code == 401


class TestDeleteTenant:
    def test_valid_delete(self, client, auth_headers):
        t = factory_tenant(client, auth_headers)
        r = client.delete(f"/tenants/{t['id']}", headers=auth_headers)
        assert r.status_code == 204
        assert client.get(f"/tenants/{t['id']}", headers=auth_headers).status_code == 404

    def test_not_found_returns_404(self, client, auth_headers):
        assert client.delete("/tenants/9999", headers=auth_headers).status_code == 404

    def test_no_auth_returns_401(self, client):
        assert client.delete("/tenants/1").status_code == 401


class TestNilaiTenant:
    def test_get_nilai_empty(self, client, auth_headers):
        t = factory_tenant(client, auth_headers)
        r = client.get(f"/tenants/{t['id']}/nilai", headers=auth_headers)
        assert r.status_code == 200
        assert r.json() == []

    def test_get_nilai_tenant_not_found(self, client, auth_headers):
        assert client.get("/tenants/9999/nilai", headers=auth_headers).status_code == 404

    def test_post_nilai_valid(self, client, auth_headers):
        k = factory_kriteria(client, auth_headers)
        t = factory_tenant(client, auth_headers)
        r = client.post(
            f"/tenants/{t['id']}/nilai",
            json={"nilai": [{"kriteria_id": k["id"], "nilai": 5000000.0}]},
            headers=auth_headers,
        )
        assert r.status_code == 201
        assert "berhasil" in r.json()["message"].lower()

    def test_post_nilai_overwrites_previous(self, client, auth_headers):
        k = factory_kriteria(client, auth_headers)
        t = factory_tenant(client, auth_headers)
        # Post first time
        client.post(
            f"/tenants/{t['id']}/nilai",
            json={"nilai": [{"kriteria_id": k["id"], "nilai": 1.0}]},
            headers=auth_headers,
        )
        # Post second time — should overwrite
        client.post(
            f"/tenants/{t['id']}/nilai",
            json={"nilai": [{"kriteria_id": k["id"], "nilai": 99.0}]},
            headers=auth_headers,
        )
        r = client.get(f"/tenants/{t['id']}/nilai", headers=auth_headers)
        assert len(r.json()) == 1
        assert r.json()[0]["nilai"] == 99.0

    def test_post_nilai_tenant_not_found(self, client, auth_headers):
        r = client.post(
            "/tenants/9999/nilai",
            json={"nilai": [{"kriteria_id": 1, "nilai": 5.0}]},
            headers=auth_headers,
        )
        assert r.status_code == 404

    def test_post_nilai_invalid_kriteria_id(self, client, auth_headers):
        t = factory_tenant(client, auth_headers)
        r = client.post(
            f"/tenants/{t['id']}/nilai",
            json={"nilai": [{"kriteria_id": 9999, "nilai": 5.0}]},
            headers=auth_headers,
        )
        assert r.status_code == 404

    def test_get_nilai_no_auth(self, client):
        assert client.get("/tenants/1/nilai").status_code == 401

    def test_post_nilai_no_auth(self, client):
        assert client.post("/tenants/1/nilai", json={"nilai": []}).status_code == 401
