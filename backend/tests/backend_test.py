"""
Oculux AI Glasses Backend API Test Suite
Tests: root, products, auth (register/login/me), checkout/session+status,
newsletter, orders (auth-protected).
"""
import os
import uuid
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load frontend .env for REACT_APP_BACKEND_URL
load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

# Unique test user per run
RAND = uuid.uuid4().hex[:8]
TEST_EMAIL = f"tester+{RAND}@oculux.com"
TEST_PASSWORD = "oculux-test-2026!"
TEST_NAME = "Oculux Tester"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def registered_user(session):
    r = session.post(f"{API}/auth/register", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "name": TEST_NAME,
    })
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user" in data
    return data


@pytest.fixture(scope="session")
def auth_headers(registered_user):
    return {"Authorization": f"Bearer {registered_user['token']}"}


# ---------- Misc ----------
class TestRoot:
    def test_root_info(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        data = r.json()
        assert data.get("app") == "Oculux AI Glasses"
        assert data.get("status") == "ok"


# ---------- Products ----------
class TestProducts:
    def test_list_all_products(self, session):
        r = session.get(f"{API}/products")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) == 6, f"Expected 6 products, got {len(items)}"
        # Validate required fields
        for p in items:
            assert "id" in p and "slug" in p and "price" in p and "tier" in p
            assert "_id" not in p

    @pytest.mark.parametrize("tier,expected", [("pro", 2), ("kids", 2), ("senior", 2)])
    def test_filter_by_tier(self, session, tier, expected):
        r = session.get(f"{API}/products", params={"tier": tier})
        assert r.status_code == 200
        items = r.json()
        assert len(items) == expected
        assert all(p["tier"] == tier for p in items)

    def test_get_product_by_slug(self, session):
        r = session.get(f"{API}/products/oculux-pro-onyx")
        assert r.status_code == 200
        p = r.json()
        assert p["slug"] == "oculux-pro-onyx"
        assert p["id"] == "p-pro-onyx"
        assert p["price"] == 599.0

    def test_get_product_unknown_slug_404(self, session):
        r = session.get(f"{API}/products/does-not-exist")
        assert r.status_code == 404


# ---------- Auth ----------
class TestAuth:
    def test_register_and_returns_jwt(self, registered_user):
        assert isinstance(registered_user["token"], str)
        assert len(registered_user["token"]) > 20
        assert registered_user["user"]["email"] == TEST_EMAIL
        assert registered_user["user"]["name"] == TEST_NAME
        assert "id" in registered_user["user"]

    def test_register_duplicate_email_400(self, session, registered_user):
        r = session.post(f"{API}/auth/register", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD, "name": TEST_NAME
        })
        assert r.status_code == 400

    def test_login_success(self, session, registered_user):
        r = session.post(f"{API}/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        assert r.status_code == 200
        data = r.json()
        assert "token" in data
        assert data["user"]["email"] == TEST_EMAIL

    def test_login_wrong_password_401(self, session, registered_user):
        r = session.post(f"{API}/auth/login", json={
            "email": TEST_EMAIL, "password": "wrong-password!"
        })
        assert r.status_code == 401

    def test_me_with_token(self, session, auth_headers, registered_user):
        r = session.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == TEST_EMAIL

    def test_me_without_token_401(self, session):
        # Use bare request to avoid session auth headers
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---------- Newsletter ----------
class TestNewsletter:
    def test_signup_and_idempotent(self, session):
        email = f"news+{RAND}@oculux.com"
        r1 = session.post(f"{API}/newsletter", json={"email": email})
        assert r1.status_code == 200
        assert r1.json().get("ok") is True
        # Same email again - should still be ok (upsert idempotent)
        r2 = session.post(f"{API}/newsletter", json={"email": email})
        assert r2.status_code == 200


# ---------- Checkout ----------
class TestCheckout:
    def test_checkout_empty_cart_400(self, session):
        r = session.post(f"{API}/checkout/session", json={
            "items": [], "origin_url": BASE_URL
        })
        assert r.status_code == 400

    def test_checkout_invalid_product_400(self, session):
        r = session.post(f"{API}/checkout/session", json={
            "items": [{"product_id": "bogus-id", "quantity": 1}],
            "origin_url": BASE_URL
        })
        assert r.status_code == 400

    def test_checkout_session_create_and_status(self, session):
        # Create checkout for a real product
        r = session.post(f"{API}/checkout/session", json={
            "items": [{"product_id": "p-pro-onyx", "quantity": 2}],
            "origin_url": BASE_URL
        })
        assert r.status_code == 200, f"checkout failed: {r.text}"
        data = r.json()
        assert "url" in data and "session_id" in data
        assert data["url"].startswith("http")
        session_id = data["session_id"]

        # Status endpoint
        r2 = session.get(f"{API}/checkout/status/{session_id}")
        assert r2.status_code == 200
        s = r2.json()
        assert s["session_id"] == session_id
        assert "payment_status" in s
        assert "items" in s and len(s["items"]) == 1
        assert s["items"][0]["product_id"] == "p-pro-onyx"
        assert s["items"][0]["quantity"] == 2

    def test_checkout_status_unknown_404(self, session):
        r = session.get(f"{API}/checkout/status/sess_nonexistent_{RAND}")
        assert r.status_code == 404


# ---------- Orders ----------
class TestOrders:
    def test_orders_requires_auth(self, session):
        r = requests.get(f"{API}/orders")
        assert r.status_code == 401

    def test_orders_empty_for_new_user(self, session, auth_headers):
        r = session.get(f"{API}/orders", headers=auth_headers)
        assert r.status_code == 200
        orders = r.json()
        assert isinstance(orders, list)
        assert orders == []
