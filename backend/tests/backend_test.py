"""
OculuxVision Iteration 3 Backend Test Suite
Covers: INR products w/ variations, CMS, OTP auth, mock + Stripe checkout,
admin login, AI streaming chat.
"""
import os
import uuid
import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

RAND = uuid.uuid4().hex[:8]
ADMIN_EMAIL = "admin@oculux.com"
ADMIN_PASSWORD = "OculuxAdmin#2026"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


@pytest.fixture(scope="session")
def admin_token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["is_admin"] is True
    return data["token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- Products: INR + variations ----------
class TestProducts:
    def test_list_returns_9_inr_with_variations(self, s):
        r = s.get(f"{API}/products")
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) == 9, f"Expected 9 products, got {len(items)}"
        for p in items:
            assert "_id" not in p
            assert p.get("currency") == "inr"
            assert isinstance(p.get("color_options"), list) and len(p["color_options"]) >= 1
            assert isinstance(p.get("size_options"), list) and len(p["size_options"]) >= 1
            assert isinstance(p.get("frame_designs"), list) and len(p["frame_designs"]) >= 1
            assert p.get("hd_camera") is True
            assert isinstance(p.get("lens_quality"), str) and len(p["lens_quality"]) > 5
            assert p.get("free_delivery") is True
            cap = p.get("compare_at_price")
            assert cap is None or cap >= p["price"], f"compare_at_price < price for {p['slug']}"

    def test_price_ranges_per_tier(self, s):
        r = s.get(f"{API}/products")
        items = r.json()
        adults = [p for p in items if p["tier"] in ("pro", "senior")]
        kids = [p for p in items if p["tier"] == "kids"]
        assert adults, "no adult products"
        assert kids, "no kids products"
        for p in adults:
            assert 19999 <= p["price"] <= 49999, f"adult price out of range: {p['slug']}={p['price']}"
        for p in kids:
            assert 5999 <= p["price"] <= 14999, f"kids price out of range: {p['slug']}={p['price']}"

    def test_get_product_by_slug(self, s):
        r = s.get(f"{API}/products/oculux-pro-onyx")
        assert r.status_code == 200
        p = r.json()
        assert p["slug"] == "oculux-pro-onyx"
        assert p["currency"] == "inr"


# ---------- CMS ----------
class TestCMS:
    def test_get_site_content_defaults(self, s):
        r = s.get(f"{API}/site/content")
        assert r.status_code == 200
        d = r.json()
        assert d.get("hero_brand") == "OculuxVision"
        for k in ["hero_overline", "hero_headline_1", "hero_headline_2", "hero_headline_emph",
                  "hero_subhead", "hero_cta_primary", "hero_cta_secondary",
                  "section_tier_overline", "section_tier_headline"]:
            assert k in d, f"missing CMS key: {k}"

    def test_cms_update_requires_admin(self, s):
        r = s.put(f"{API}/admin/site/content", json={"hero_brand": "Hacker"})
        assert r.status_code in (401, 403)

    def test_cms_admin_update_and_restore(self, s, admin_headers):
        # GET current
        r0 = s.get(f"{API}/site/content").json()
        new_payload = dict(r0)
        new_payload["hero_brand"] = "TestBrand"
        # PUT update
        r1 = s.put(f"{API}/admin/site/content", json=new_payload, headers=admin_headers)
        assert r1.status_code == 200, r1.text
        # GET verify
        r2 = s.get(f"{API}/site/content")
        assert r2.json()["hero_brand"] == "TestBrand"
        # Restore
        r0["hero_brand"] = "OculuxVision"
        r3 = s.put(f"{API}/admin/site/content", json=r0, headers=admin_headers)
        assert r3.status_code == 200
        assert s.get(f"{API}/site/content").json()["hero_brand"] == "OculuxVision"


# ---------- OTP Auth (MOCKED) ----------
class TestOtpAuth:
    def test_otp_request_returns_dev_otp(self, s):
        phone = f"+9199999{RAND[:5]}"
        r = s.post(f"{API}/auth/otp/request", json={"phone": phone})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("sent") is True
        assert d.get("mocked") is True
        assert "dev_otp" in d and len(d["dev_otp"]) == 6 and d["dev_otp"].isdigit()

    def test_otp_request_invalid_phone_400(self, s):
        r = s.post(f"{API}/auth/otp/request", json={"phone": "123"})
        assert r.status_code == 400

    def test_otp_request_missing_phone_422_or_400(self, s):
        r = s.post(f"{API}/auth/otp/request", json={})
        assert r.status_code in (400, 422)

    def test_otp_verify_full_flow(self, s):
        phone = f"+9198888{RAND[:5]}"
        r = s.post(f"{API}/auth/otp/request", json={"phone": phone, "name": "TEST_OtpUser"})
        code = r.json()["dev_otp"]
        # Wrong code
        r_w = s.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": "000000" if code != "000000" else "111111"})
        assert r_w.status_code == 401
        # Correct code
        r_v = s.post(f"{API}/auth/otp/verify", json={"phone": phone, "code": code, "name": "TEST_OtpUser"})
        assert r_v.status_code == 200, r_v.text
        d = r_v.json()
        assert "token" in d and len(d["token"]) > 10
        assert d["user"].get("phone")
        assert "id" in d["user"]

    def test_admin_email_login_still_works(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert d["user"]["is_admin"] is True
        # token works against admin endpoint
        r2 = s.get(f"{API}/admin/stats", headers={"Authorization": f"Bearer {d['token']}"})
        assert r2.status_code == 200


# ---------- Checkout: PIN validation + mock + stripe ----------
def _shipping(pin="560001"):
    return {
        "full_name": "TEST User", "phone": "+919999988877",
        "address": "1 MG Road", "pin": pin, "city": "Bengaluru", "state": "KA",
    }


class TestCheckout:
    def test_pin_required_empty(self, s):
        r = s.post(f"{API}/checkout/session", json={
            "items": [{"product_id": "p-pro-onyx", "quantity": 1}],
            "origin_url": BASE_URL,
            "shipping": _shipping(pin=""),
            "payment_method": "stripe",
        })
        assert r.status_code == 400

    def test_pin_invalid_non_numeric(self, s):
        r = s.post(f"{API}/checkout/session", json={
            "items": [{"product_id": "p-pro-onyx", "quantity": 1}],
            "origin_url": BASE_URL,
            "shipping": _shipping(pin="ABC12"),
            "payment_method": "stripe",
        })
        assert r.status_code == 400

    def test_pin_too_short(self, s):
        r = s.post(f"{API}/checkout/session", json={
            "items": [{"product_id": "p-pro-onyx", "quantity": 1}],
            "origin_url": BASE_URL,
            "shipping": _shipping(pin="123"),
            "payment_method": "stripe",
        })
        assert r.status_code == 400

    def test_stripe_session_created(self, s):
        r = s.post(f"{API}/checkout/session", json={
            "items": [{"product_id": "p-pro-onyx", "quantity": 1, "color": "Onyx", "size": "M"}],
            "origin_url": BASE_URL,
            "shipping": _shipping(),
            "payment_method": "stripe",
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert "url" in d and "session_id" in d
        assert d["url"].startswith("http")

    @pytest.mark.parametrize("method", ["upi", "rupay", "paytm"])
    def test_mock_payment_creates_order_and_decrements_stock(self, s, admin_headers, method):
        # snapshot stock
        before = s.get(f"{API}/products/oculux-pro-onyx").json()["stock"]

        r = s.post(f"{API}/checkout/session", json={
            "items": [{"product_id": "p-pro-onyx", "quantity": 1, "color": "Onyx"}],
            "origin_url": BASE_URL,
            "shipping": _shipping(),
            "payment_method": method,
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("mocked") is True
        assert d["session_id"].startswith("mock_")
        assert "url" in d

        # stock decreased
        after = s.get(f"{API}/products/oculux-pro-onyx").json()["stock"]
        assert after == before - 1, f"stock not decremented for {method}: {before}->{after}"

        # admin orders contain it
        orders = s.get(f"{API}/admin/orders", headers=admin_headers).json()
        assert any(o.get("session_id") == d["session_id"] for o in orders), \
            f"order for {method} not in admin/orders"


# ---------- AI Chat (streaming) ----------
class TestAIChat:
    def _stream_text(self, payload):
        # Use raw requests for streaming
        r = requests.post(f"{API}/ai/chat", json=payload, timeout=60, stream=True)
        assert r.status_code == 200, f"status={r.status_code} body={r.text[:200]}"
        chunks = []
        for chunk in r.iter_content(chunk_size=None, decode_unicode=True):
            if chunk:
                chunks.append(chunk)
            if sum(len(c) for c in chunks) > 1500:
                break
        r.close()
        return "".join(chunks)

    def test_chat_english(self):
        text = self._stream_text({"messages": [
            {"role": "user", "content": "Tell me about Pro Onyx in one sentence."}
        ]})
        assert len(text.strip()) > 10, f"empty AI reply: {text!r}"
        assert "[error:" not in text, f"AI error in stream: {text}"

    def test_chat_hindi(self):
        text = self._stream_text({"messages": [
            {"role": "user", "content": "Pro Onyx के बारे में एक वाक्य में बताओ।"}
        ]})
        assert len(text.strip()) > 5, f"empty Hindi reply: {text!r}"
        assert "[error:" not in text, f"AI error in stream: {text}"

    def test_chat_empty_messages_400(self, s):
        r = s.post(f"{API}/ai/chat", json={"messages": []})
        assert r.status_code == 400
