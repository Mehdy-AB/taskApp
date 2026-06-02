"""
Tests for:
  GET  /api/departments
  POST /api/departments
"""
import requests
import pytest
from conftest import BASE_URL, unique_dept


LIST_URL   = f"{BASE_URL}/departments"
CREATE_URL = f"{BASE_URL}/departments"


class TestListDepartments:
    def test_returns_list(self, admin_headers):
        r = requests.get(LIST_URL, headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) >= 5  # seed creates 5 departments

    def test_each_item_has_expected_fields(self, admin_headers):
        r = requests.get(LIST_URL, headers=admin_headers)
        for dept in r.json():
            assert "id" in dept
            assert "name" in dept
            assert "createdAt" in dept

    def test_viewer_can_list(self, viewer_headers):
        r = requests.get(LIST_URL, headers=viewer_headers)
        assert r.status_code == 200

    def test_no_token_returns_401(self):
        r = requests.get(LIST_URL)
        assert r.status_code == 401

    def test_sorted_alphabetically(self, admin_headers):
        r = requests.get(LIST_URL, headers=admin_headers)
        names = [d["name"] for d in r.json()]
        assert names == sorted(names)


class TestCreateDepartment:
    def test_admin_can_create(self, admin_headers):
        name = unique_dept()
        r = requests.post(CREATE_URL, json={"name": name}, headers=admin_headers)
        assert r.status_code == 201
        body = r.json()
        assert body["name"] == name
        assert "id" in body

    def test_duplicate_name_returns_409(self, admin_headers):
        name = unique_dept()
        requests.post(CREATE_URL, json={"name": name}, headers=admin_headers)
        r = requests.post(CREATE_URL, json={"name": name}, headers=admin_headers)
        assert r.status_code == 409

    def test_missing_name_returns_400(self, admin_headers):
        r = requests.post(CREATE_URL, json={}, headers=admin_headers)
        assert r.status_code == 400

    def test_empty_name_returns_400(self, admin_headers):
        r = requests.post(CREATE_URL, json={"name": ""}, headers=admin_headers)
        assert r.status_code == 400

    def test_viewer_cannot_create_returns_403(self, viewer_headers):
        r = requests.post(CREATE_URL, json={"name": unique_dept()}, headers=viewer_headers)
        assert r.status_code == 403

    def test_no_token_returns_401(self):
        r = requests.post(CREATE_URL, json={"name": unique_dept()})
        assert r.status_code == 401

    def test_created_dept_appears_in_list(self, admin_headers):
        name = unique_dept()
        requests.post(CREATE_URL, json={"name": name}, headers=admin_headers)
        r = requests.get(LIST_URL, headers=admin_headers)
        names = [d["name"] for d in r.json()]
        assert name in names
