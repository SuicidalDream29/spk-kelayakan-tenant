import pytest
from helpers import make_token
from datetime import timedelta


class TestLogin:
    def test_valid_credentials_returns_token(self, client):
        r = client.post(
            "/auth/login",
            data={"username": "admin", "password": "admin123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert r.status_code == 200
        body = r.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert len(body["access_token"]) > 20

    def test_wrong_username_returns_401(self, client):
        r = client.post(
            "/auth/login",
            data={"username": "hacker", "password": "admin123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert r.status_code == 401
        assert "salah" in r.json()["detail"].lower()

    def test_wrong_password_returns_401(self, client):
        r = client.post(
            "/auth/login",
            data={"username": "admin", "password": "wrongpass"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert r.status_code == 401

    def test_missing_username_returns_422(self, client):
        r = client.post(
            "/auth/login",
            data={"password": "admin123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert r.status_code == 422

    def test_missing_password_returns_422(self, client):
        r = client.post(
            "/auth/login",
            data={"username": "admin"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        assert r.status_code == 422

    def test_empty_body_returns_422(self, client):
        r = client.post("/auth/login", data={},
                        headers={"Content-Type": "application/x-www-form-urlencoded"})
        assert r.status_code == 422


class TestMe:
    def test_valid_token_returns_username(self, client, auth_headers):
        r = client.get("/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["username"] == "admin"

    def test_no_auth_header_returns_401(self, client):
        r = client.get("/auth/me")
        assert r.status_code == 401

    def test_invalid_token_returns_401(self, client):
        r = client.get("/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
        assert r.status_code == 401

    def test_expired_token_returns_401(self, client, expired_token):
        r = client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
        assert r.status_code == 401

    def test_malformed_header_returns_401(self, client):
        r = client.get("/auth/me", headers={"Authorization": "NotBearer sometoken"})
        assert r.status_code == 401

    def test_wrong_secret_token_returns_401(self, client):
        from jose import jwt
        from datetime import datetime, timezone
        bad_token = jwt.encode(
            {"sub": "admin", "exp": datetime.now(timezone.utc).timestamp() + 3600},
            "wrong-secret-key",
            algorithm="HS256",
        )
        r = client.get("/auth/me", headers={"Authorization": f"Bearer {bad_token}"})
        assert r.status_code == 401
