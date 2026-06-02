"""
Tests for:
  POST /api/auth/login
  GET  /api/auth/me
"""
import requests
import pytest
from conftest import BASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD


class TestLogin:
    URL = f"{BASE_URL}/auth/login"

    def test_admin_login_returns_token(self):
        r = requests.post(self.URL, json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        body = r.json()
        assert "accessToken" in body
        assert body["user"]["email"] == ADMIN_EMAIL
        assert body["user"]["role"] == "ADMIN"

    def test_viewer_login_returns_token(self):
        r = requests.post(self.URL, json={"email": "viewer@company.com", "password": "password"})
        assert r.status_code == 200
        body = r.json()
        assert "accessToken" in body
        assert body["user"]["role"] == "VIEWER"

    def test_wrong_password_returns_401(self):
        r = requests.post(self.URL, json={"email": ADMIN_EMAIL, "password": "wrongpassword"})
        assert r.status_code == 401

    def test_unknown_email_returns_401(self):
        r = requests.post(self.URL, json={"email": "nobody@nowhere.com", "password": "password"})
        assert r.status_code == 401

    def test_missing_email_returns_400(self):
        r = requests.post(self.URL, json={"password": ADMIN_PASSWORD})
        assert r.status_code == 400

    def test_missing_password_returns_400(self):
        r = requests.post(self.URL, json={"email": ADMIN_EMAIL})
        assert r.status_code == 400

    def test_invalid_email_format_returns_400(self):
        r = requests.post(self.URL, json={"email": "not-an-email", "password": ADMIN_PASSWORD})
        assert r.status_code == 400

    def test_short_password_returns_400(self):
        r = requests.post(self.URL, json={"email": ADMIN_EMAIL, "password": "abc"})
        assert r.status_code == 400

    def test_extra_fields_rejected(self):
        """ValidationPipe forbidNonWhitelisted:true rejects unknown fields with 400."""
        r = requests.post(self.URL, json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "role": "SUPERADMIN",  # unknown field — rejected, not stripped
        })
        assert r.status_code == 400

    def test_empty_body_returns_400(self):
        r = requests.post(self.URL, json={})
        assert r.status_code == 400


class TestMe:
    URL = f"{BASE_URL}/auth/me"

    def test_me_returns_current_user(self, admin_headers):
        r = requests.get(self.URL, headers=admin_headers)
        assert r.status_code == 200
        body = r.json()
        assert body["email"] == ADMIN_EMAIL
        assert body["role"] == "ADMIN"
        assert "id" in body
        assert "passwordHash" not in body

    def test_me_without_token_returns_401(self):
        r = requests.get(self.URL)
        assert r.status_code == 401

    def test_me_with_invalid_token_returns_401(self):
        r = requests.get(self.URL, headers={"Authorization": "Bearer invalid.token.here"})
        assert r.status_code == 401

    def test_me_with_malformed_header_returns_401(self):
        r = requests.get(self.URL, headers={"Authorization": "NotBearer sometoken"})
        assert r.status_code == 401

    def test_viewer_me_returns_viewer_role(self, viewer_headers):
        r = requests.get(self.URL, headers=viewer_headers)
        assert r.status_code == 200
        assert r.json()["role"] == "VIEWER"
