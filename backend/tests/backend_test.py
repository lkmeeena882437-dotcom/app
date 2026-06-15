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



# ---------- Admin ----------
ADMIN_EMAIL = "admin@oculux.com"
ADMIN_PASSWORD = "OculuxAdmin#2026"


@pytest.fixture(scope="session")
def admin_headers(session):
    r = session.post(f"{API}/auth/login", json={
        "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
    })
    assert r.status_code == 200, f"admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert data["user"].get("is_admin") is True, f"admin user does not have is_admin=true: {data}"
    return {"Authorization": f"Bearer {data['token']}"}


class TestAdmin:
    def test_admin_login_has_is_admin(self, session):
        r = session.post(f"{API}/auth/login", json={
            "email": ADMIN_EMAIL, "password": ADMIN_PASSWORD
        })
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["is_admin"] is True

    def test_stats_requires_auth_401(self):
        r = requests.get(f"{API}/admin/stats")
        assert r.status_code == 401

    def test_stats_requires_admin_403_for_customer(self, session, auth_headers):
        r = session.get(f"{API}/admin/stats", headers=auth_headers)
        assert r.status_code == 403

    def test_admin_stats_ok(self, session, admin_headers):
        r = session.get(f"{API}/admin/stats", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        for k in ["orders", "users", "products", "revenue"]:
            assert k in data, f"missing key {k} in {data}"
        assert data["products"] >= 6

    def test_admin_list_products(self, session, admin_headers):
        r = session.get(f"{API}/admin/products", headers=admin_headers)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 6

    def test_admin_list_orders(self, session, admin_headers):
        r = session.get(f"{API}/admin/orders", headers=admin_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_admin_list_users_includes_admin(self, session, admin_headers):
        r = session.get(f"{API}/admin/users", headers=admin_headers)
        assert r.status_code == 200
        users = r.json()
        emails = [u["email"] for u in users]
        assert ADMIN_EMAIL in emails
        # passwords must not be exposed
        for u in users:
            assert "password" not in u
            assert "_id" not in u

    def test_admin_product_crud_and_duplicate_slug(self, session, admin_headers):
        slug = f"test-prod-{RAND}"
        payload = {
            "slug": slug,
            "name": "TEST_Product",
            "tagline": "Test",
            "description": "Test product",
            "price": 199.0,
            "tier": "pro",
            "color": "Black",
            "image": "https://example.com/x.jpg",
            "features": ["a", "b"],
            "specs": {"weight": "10g"},
            "stock": 50,
        }
        # CREATE
        r = session.post(f"{API}/admin/products", json=payload, headers=admin_headers)
        assert r.status_code == 200, f"create failed: {r.text}"
        created = r.json()
        assert created["slug"] == slug
        assert created["price"] == 199.0
        pid = created["id"]

        # GET via public endpoint - verify persistence
        r_get = session.get(f"{API}/products/{slug}")
        assert r_get.status_code == 200
        assert r_get.json()["id"] == pid

        # DUPLICATE slug
        r_dup = session.post(f"{API}/admin/products", json=payload, headers=admin_headers)
        assert r_dup.status_code == 400

        # UPDATE - change price
        upd_payload = dict(payload)
        upd_payload["price"] = 259.0
        r_upd = session.put(f"{API}/admin/products/{pid}", json=upd_payload, headers=admin_headers)
        assert r_upd.status_code == 200, r_upd.text
        assert r_upd.json()["price"] == 259.0

        # Verify update persisted
        r_get2 = session.get(f"{API}/products/{slug}")
        assert r_get2.json()["price"] == 259.0

        # DELETE
        r_del = session.delete(f"{API}/admin/products/{pid}", headers=admin_headers)
        assert r_del.status_code == 200
        assert r_del.json().get("ok") is True

        # Verify removed
        r_g = session.get(f"{API}/products/{slug}")
        assert r_g.status_code == 404
