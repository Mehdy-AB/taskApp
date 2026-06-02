"""
Tests for:
  GET  /api/activity-logs
  GET  /api/activity-logs?action=CREATE
  GET  /api/activity-logs?page=1&pageSize=5
  Auth guards: unauthenticated → 401
"""
import requests
import pytest
from conftest import BASE_URL, unique_email, unique_name

LIST_URL = f"{BASE_URL}/activity-logs"


# ── helpers ───────────────────────────────────────────────────────────────────

def _create_employee(admin_headers, dept_id: int) -> int:
    """Creates a throwaway employee and returns its id."""
    r = requests.post(
        f"{BASE_URL}/employees",
        json={
            "fullName":     unique_name(),
            "email":        unique_email(),
            "departmentId": dept_id,
            "jobTitle":     "Temp",
        },
        headers=admin_headers,
    )
    assert r.status_code == 201
    return r.json()["id"]


# ── auth guard ────────────────────────────────────────────────────────────────

def test_unauthenticated_returns_401():
    r = requests.get(LIST_URL)
    assert r.status_code == 401


# ── basic listing ─────────────────────────────────────────────────────────────

def test_list_returns_paginated_shape(admin_headers):
    r = requests.get(LIST_URL, headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert "data"       in body
    assert "total"      in body
    assert "page"       in body
    assert "pageSize"   in body
    assert "totalPages" in body
    assert isinstance(body["data"], list)


def test_viewer_can_read_logs(viewer_headers):
    r = requests.get(LIST_URL, headers=viewer_headers)
    assert r.status_code == 200


# ── log entry shape ───────────────────────────────────────────────────────────

def test_log_entry_shape(admin_headers, engineering_dept_id):
    _create_employee(admin_headers, engineering_dept_id)

    r = requests.get(f"{LIST_URL}?action=CREATE&pageSize=1", headers=admin_headers)
    assert r.status_code == 200
    data = r.json()["data"]
    assert len(data) >= 1

    entry = data[0]
    assert "id"        in entry
    assert "action"    in entry
    assert "user"      in entry
    assert "createdAt" in entry
    assert "id"    in entry["user"]
    assert "email" in entry["user"]


# ── action filter ─────────────────────────────────────────────────────────────

@pytest.mark.parametrize("action", ["CREATE", "UPDATE", "DELETE"])
def test_filter_by_action(admin_headers, action):
    r = requests.get(f"{LIST_URL}?action={action}", headers=admin_headers)
    assert r.status_code == 200
    for entry in r.json()["data"]:
        assert entry["action"] == action


def test_invalid_action_returns_400(admin_headers):
    r = requests.get(f"{LIST_URL}?action=INVALID", headers=admin_headers)
    assert r.status_code == 400


# ── pagination ────────────────────────────────────────────────────────────────

def test_pagination_page_size(admin_headers):
    r = requests.get(f"{LIST_URL}?page=1&pageSize=3", headers=admin_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["pageSize"] == 3
    assert len(body["data"]) <= 3


def test_pagination_second_page_differs(admin_headers, engineering_dept_id):
    for _ in range(4):
        _create_employee(admin_headers, engineering_dept_id)

    r1 = requests.get(f"{LIST_URL}?page=1&pageSize=2", headers=admin_headers)
    r2 = requests.get(f"{LIST_URL}?page=2&pageSize=2", headers=admin_headers)
    assert r1.status_code == 200
    assert r2.status_code == 200

    ids1 = {e["id"] for e in r1.json()["data"]}
    ids2 = {e["id"] for e in r2.json()["data"]}
    assert ids1.isdisjoint(ids2), "Pages should not overlap"
