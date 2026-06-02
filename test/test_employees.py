"""
Tests for:
  GET    /api/employees
  GET    /api/employees/:id
  POST   /api/employees
  PATCH  /api/employees/:id
  DELETE /api/employees/:id
"""
import requests
import pytest
from conftest import BASE_URL, unique_email, unique_name


LIST_URL = f"{BASE_URL}/employees"


def url(emp_id: int) -> str:
    return f"{LIST_URL}/{emp_id}"


# ── fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def new_employee(admin_headers, engineering_dept_id):
    """Creates a fresh employee and yields its response body. Cleans up after."""
    payload = {
        "fullName":     unique_name(),
        "email":        unique_email(),
        "departmentId": engineering_dept_id,
        "jobTitle":     "Test Engineer",
        "status":       "ACTIVE",
    }
    r = requests.post(LIST_URL, json=payload, headers=admin_headers)
    assert r.status_code == 201, f"Setup failed: {r.text}"
    emp = r.json()
    yield emp
    # cleanup — soft-delete so the test email doesn't cause conflicts on re-run
    requests.delete(url(emp["id"]), headers=admin_headers)


# ── GET /api/employees ────────────────────────────────────────────────────────

class TestListEmployees:
    def test_returns_paginated_response(self, admin_headers):
        r = requests.get(LIST_URL, headers=admin_headers)
        assert r.status_code == 200
        body = r.json()
        assert "data" in body
        assert "total" in body
        assert "page" in body
        assert "pageSize" in body
        assert "totalPages" in body

    def test_data_is_list_of_employees(self, admin_headers):
        r = requests.get(LIST_URL, headers=admin_headers)
        for emp in r.json()["data"]:
            assert "id" in emp
            assert "fullName" in emp
            assert "email" in emp
            assert "department" in emp
            assert "departmentId" in emp
            assert "jobTitle" in emp
            assert "status" in emp
            assert "createdBy" in emp
            assert "createdAt" in emp

    def test_default_page_size_is_ten(self, admin_headers):
        r = requests.get(LIST_URL, headers=admin_headers)
        assert len(r.json()["data"]) <= 10

    def test_pagination_page_and_size(self, admin_headers):
        r = requests.get(LIST_URL, params={"page": 1, "pageSize": 5}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["pageSize"] == 5
        assert len(r.json()["data"]) <= 5

    def test_page_2_different_from_page_1(self, admin_headers):
        p1 = requests.get(LIST_URL, params={"page": 1, "pageSize": 5}, headers=admin_headers).json()["data"]
        p2 = requests.get(LIST_URL, params={"page": 2, "pageSize": 5}, headers=admin_headers).json()["data"]
        ids_p1 = {e["id"] for e in p1}
        ids_p2 = {e["id"] for e in p2}
        assert ids_p1.isdisjoint(ids_p2)

    def test_search_by_name(self, admin_headers):
        r = requests.get(LIST_URL, params={"search": "alice"}, headers=admin_headers)
        assert r.status_code == 200
        for emp in r.json()["data"]:
            assert "alice" in emp["fullName"].lower() or "alice" in emp["email"].lower()

    def test_search_by_email(self, admin_headers):
        r = requests.get(LIST_URL, params={"search": "alice.j@company"}, headers=admin_headers)
        assert r.status_code == 200
        assert len(r.json()["data"]) >= 1

    def test_filter_by_status_active(self, admin_headers):
        r = requests.get(LIST_URL, params={"status": "ACTIVE", "pageSize": 100}, headers=admin_headers)
        assert r.status_code == 200
        for emp in r.json()["data"]:
            assert emp["status"] == "ACTIVE"

    def test_filter_by_status_inactive(self, admin_headers):
        r = requests.get(LIST_URL, params={"status": "INACTIVE", "pageSize": 100}, headers=admin_headers)
        assert r.status_code == 200
        for emp in r.json()["data"]:
            assert emp["status"] == "INACTIVE"

    def test_filter_by_department(self, admin_headers):
        r = requests.get(LIST_URL, params={"department": "Engineering", "pageSize": 100}, headers=admin_headers)
        assert r.status_code == 200
        assert len(r.json()["data"]) > 0
        for emp in r.json()["data"]:
            assert emp["department"] == "Engineering"

    def test_sort_by_full_name_asc(self, admin_headers):
        r = requests.get(LIST_URL, params={"sortBy": "fullName", "sortDir": "asc", "pageSize": 20}, headers=admin_headers)
        names = [e["fullName"] for e in r.json()["data"]]
        assert names == sorted(names, key=str.lower)

    def test_sort_by_full_name_desc(self, admin_headers):
        r = requests.get(LIST_URL, params={"sortBy": "fullName", "sortDir": "desc", "pageSize": 20}, headers=admin_headers)
        names = [e["fullName"] for e in r.json()["data"]]
        assert names == sorted(names, key=str.lower, reverse=True)

    def test_viewer_can_list(self, viewer_headers):
        r = requests.get(LIST_URL, headers=viewer_headers)
        assert r.status_code == 200

    def test_no_token_returns_401(self):
        r = requests.get(LIST_URL)
        assert r.status_code == 401

    def test_invalid_status_returns_400(self, admin_headers):
        r = requests.get(LIST_URL, params={"status": "UNKNOWN"}, headers=admin_headers)
        assert r.status_code == 400

    def test_search_with_no_match_returns_empty(self, admin_headers):
        r = requests.get(LIST_URL, params={"search": "xyzzy-no-match-9999"}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["total"] == 0
        assert r.json()["data"] == []


# ── GET /api/employees/:id ────────────────────────────────────────────────────

class TestGetEmployee:
    def test_returns_employee(self, admin_headers, new_employee):
        r = requests.get(url(new_employee["id"]), headers=admin_headers)
        assert r.status_code == 200
        body = r.json()
        assert body["id"] == new_employee["id"]
        assert body["email"] == new_employee["email"]

    def test_viewer_can_get(self, viewer_headers, new_employee):
        r = requests.get(url(new_employee["id"]), headers=viewer_headers)
        assert r.status_code == 200

    def test_nonexistent_id_returns_404(self, admin_headers):
        r = requests.get(url(999999), headers=admin_headers)
        assert r.status_code == 404

    def test_no_token_returns_401(self, new_employee):
        r = requests.get(url(new_employee["id"]))
        assert r.status_code == 401


# ── POST /api/employees ───────────────────────────────────────────────────────

class TestCreateEmployee:
    def test_admin_creates_employee(self, admin_headers, engineering_dept_id):
        email = unique_email()
        payload = {
            "fullName":     unique_name(),
            "email":        email,
            "departmentId": engineering_dept_id,
            "jobTitle":     "Software Engineer",
        }
        r = requests.post(LIST_URL, json=payload, headers=admin_headers)
        assert r.status_code == 201
        body = r.json()
        assert body["email"] == email
        assert body["departmentId"] == engineering_dept_id
        assert body["status"] == "ACTIVE"  # default
        # cleanup
        requests.delete(url(body["id"]), headers=admin_headers)

    def test_default_status_is_active(self, admin_headers, engineering_dept_id):
        payload = {
            "fullName":     unique_name(),
            "email":        unique_email(),
            "departmentId": engineering_dept_id,
            "jobTitle":     "Tester",
        }
        r = requests.post(LIST_URL, json=payload, headers=admin_headers)
        assert r.json()["status"] == "ACTIVE"
        requests.delete(url(r.json()["id"]), headers=admin_headers)

    def test_can_set_status_inactive(self, admin_headers, engineering_dept_id):
        payload = {
            "fullName":     unique_name(),
            "email":        unique_email(),
            "departmentId": engineering_dept_id,
            "jobTitle":     "Tester",
            "status":       "INACTIVE",
        }
        r = requests.post(LIST_URL, json=payload, headers=admin_headers)
        assert r.status_code == 201
        assert r.json()["status"] == "INACTIVE"
        requests.delete(url(r.json()["id"]), headers=admin_headers)

    def test_duplicate_email_returns_409(self, admin_headers, new_employee):
        payload = {
            "fullName":     unique_name(),
            "email":        new_employee["email"],  # same email
            "departmentId": new_employee["departmentId"],
            "jobTitle":     "Duplicate",
        }
        r = requests.post(LIST_URL, json=payload, headers=admin_headers)
        assert r.status_code == 409

    def test_missing_full_name_returns_400(self, admin_headers, engineering_dept_id):
        r = requests.post(LIST_URL, json={
            "email": unique_email(),
            "departmentId": engineering_dept_id,
            "jobTitle": "Tester",
        }, headers=admin_headers)
        assert r.status_code == 400

    def test_missing_email_returns_400(self, admin_headers, engineering_dept_id):
        r = requests.post(LIST_URL, json={
            "fullName":     unique_name(),
            "departmentId": engineering_dept_id,
            "jobTitle":     "Tester",
        }, headers=admin_headers)
        assert r.status_code == 400

    def test_invalid_email_format_returns_400(self, admin_headers, engineering_dept_id):
        r = requests.post(LIST_URL, json={
            "fullName":     unique_name(),
            "email":        "not-an-email",
            "departmentId": engineering_dept_id,
            "jobTitle":     "Tester",
        }, headers=admin_headers)
        assert r.status_code == 400

    def test_nonexistent_department_returns_400(self, admin_headers):
        r = requests.post(LIST_URL, json={
            "fullName":     unique_name(),
            "email":        unique_email(),
            "departmentId": 999999,
            "jobTitle":     "Tester",
        }, headers=admin_headers)
        assert r.status_code == 400

    def test_invalid_status_returns_400(self, admin_headers, engineering_dept_id):
        r = requests.post(LIST_URL, json={
            "fullName":     unique_name(),
            "email":        unique_email(),
            "departmentId": engineering_dept_id,
            "jobTitle":     "Tester",
            "status":       "PENDING",
        }, headers=admin_headers)
        assert r.status_code == 400

    def test_viewer_cannot_create_returns_403(self, viewer_headers, engineering_dept_id):
        r = requests.post(LIST_URL, json={
            "fullName":     unique_name(),
            "email":        unique_email(),
            "departmentId": engineering_dept_id,
            "jobTitle":     "Tester",
        }, headers=viewer_headers)
        assert r.status_code == 403

    def test_no_token_returns_401(self, engineering_dept_id):
        r = requests.post(LIST_URL, json={
            "fullName":     unique_name(),
            "email":        unique_email(),
            "departmentId": engineering_dept_id,
            "jobTitle":     "Tester",
        })
        assert r.status_code == 401

    def test_response_has_all_fields(self, admin_headers, engineering_dept_id):
        r = requests.post(LIST_URL, json={
            "fullName":     unique_name(),
            "email":        unique_email(),
            "departmentId": engineering_dept_id,
            "jobTitle":     "QA",
        }, headers=admin_headers)
        body = r.json()
        for field in ("id", "fullName", "email", "department", "departmentId", "jobTitle", "status", "createdBy", "createdAt"):
            assert field in body, f"Missing field: {field}"
        requests.delete(url(body["id"]), headers=admin_headers)


# ── PATCH /api/employees/:id ──────────────────────────────────────────────────

class TestUpdateEmployee:
    def test_update_full_name(self, admin_headers, new_employee):
        new_name = unique_name()
        r = requests.patch(url(new_employee["id"]), json={"fullName": new_name}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["fullName"] == new_name

    def test_update_status(self, admin_headers, new_employee):
        r = requests.patch(url(new_employee["id"]), json={"status": "INACTIVE"}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "INACTIVE"

    def test_update_job_title(self, admin_headers, new_employee):
        r = requests.patch(url(new_employee["id"]), json={"jobTitle": "Senior Tester"}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["jobTitle"] == "Senior Tester"

    def test_update_email(self, admin_headers, new_employee):
        new_email = unique_email()
        r = requests.patch(url(new_employee["id"]), json={"email": new_email}, headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["email"] == new_email

    def test_update_nonexistent_returns_404(self, admin_headers):
        r = requests.patch(url(999999), json={"jobTitle": "Ghost"}, headers=admin_headers)
        assert r.status_code == 404

    def test_duplicate_email_on_update_returns_409(self, admin_headers, new_employee):
        r = requests.patch(
            url(new_employee["id"]),
            json={"email": "alice.j@company.com"},  # already taken by seed
            headers=admin_headers,
        )
        assert r.status_code == 409

    def test_invalid_email_format_returns_400(self, admin_headers, new_employee):
        r = requests.patch(url(new_employee["id"]), json={"email": "bad"}, headers=admin_headers)
        assert r.status_code == 400

    def test_viewer_cannot_update_returns_403(self, viewer_headers, new_employee):
        r = requests.patch(url(new_employee["id"]), json={"jobTitle": "Hacked"}, headers=viewer_headers)
        assert r.status_code == 403

    def test_no_token_returns_401(self, new_employee):
        r = requests.patch(url(new_employee["id"]), json={"jobTitle": "Ghost"})
        assert r.status_code == 401

    def test_empty_patch_returns_unchanged_employee(self, admin_headers, new_employee):
        r = requests.patch(url(new_employee["id"]), json={}, headers=admin_headers)
        assert r.status_code == 200
        body = r.json()
        assert body["fullName"] == new_employee["fullName"]


# ── DELETE /api/employees/:id ─────────────────────────────────────────────────

class TestDeleteEmployee:
    def test_admin_can_delete(self, admin_headers, engineering_dept_id):
        # create a dedicated employee for this test
        emp = requests.post(LIST_URL, json={
            "fullName":     unique_name(),
            "email":        unique_email(),
            "departmentId": engineering_dept_id,
            "jobTitle":     "To Be Deleted",
        }, headers=admin_headers).json()

        r = requests.delete(url(emp["id"]), headers=admin_headers)
        assert r.status_code == 204

    def test_deleted_employee_not_in_list(self, admin_headers, engineering_dept_id):
        emp = requests.post(LIST_URL, json={
            "fullName":     unique_name(),
            "email":        unique_email(),
            "departmentId": engineering_dept_id,
            "jobTitle":     "Temp",
        }, headers=admin_headers).json()

        requests.delete(url(emp["id"]), headers=admin_headers)

        r = requests.get(url(emp["id"]), headers=admin_headers)
        assert r.status_code == 404

    def test_delete_nonexistent_returns_404(self, admin_headers):
        r = requests.delete(url(999999), headers=admin_headers)
        assert r.status_code == 404

    def test_double_delete_returns_404(self, admin_headers, engineering_dept_id):
        emp = requests.post(LIST_URL, json={
            "fullName":     unique_name(),
            "email":        unique_email(),
            "departmentId": engineering_dept_id,
            "jobTitle":     "Double Delete",
        }, headers=admin_headers).json()

        requests.delete(url(emp["id"]), headers=admin_headers)
        r = requests.delete(url(emp["id"]), headers=admin_headers)
        assert r.status_code == 404

    def test_viewer_cannot_delete_returns_403(self, viewer_headers, new_employee):
        r = requests.delete(url(new_employee["id"]), headers=viewer_headers)
        assert r.status_code == 403

    def test_no_token_returns_401(self, new_employee):
        r = requests.delete(url(new_employee["id"]))
        assert r.status_code == 401
