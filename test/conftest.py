import uuid
import pytest
import requests

BASE_URL = "http://localhost:3001/api"

ADMIN_EMAIL    = "admin@company.com"
ADMIN_PASSWORD = "password"
VIEWER_EMAIL    = "viewer@company.com"
VIEWER_PASSWORD = "password"


# ── token fixtures (session-scoped — login once per run) ────────────────────

@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.text}"
    return r.json()["accessToken"]


@pytest.fixture(scope="session")
def viewer_token():
    r = requests.post(f"{BASE_URL}/auth/login", json={"email": VIEWER_EMAIL, "password": VIEWER_PASSWORD})
    assert r.status_code == 200, f"Viewer login failed: {r.text}"
    return r.json()["accessToken"]


# ── header shortcuts ─────────────────────────────────────────────────────────

@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def viewer_headers(viewer_token):
    return {"Authorization": f"Bearer {viewer_token}"}


# ── reusable helpers ─────────────────────────────────────────────────────────

def unique_email():
    return f"test-{uuid.uuid4().hex[:8]}@test.com"


def unique_name():
    return f"Test User {uuid.uuid4().hex[:6]}"


def unique_dept():
    return f"Dept-{uuid.uuid4().hex[:6]}"


# ── shared fixture: first department id from the DB ──────────────────────────

@pytest.fixture(scope="session")
def engineering_dept_id(admin_token):
    r = requests.get(
        f"{BASE_URL}/departments",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert r.status_code == 200
    depts = r.json()
    dept = next((d for d in depts if d["name"] == "Engineering"), depts[0])
    return dept["id"]
