from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import random
import asyncio
import bcrypt
import jwt
import resend
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest,
)
from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = os.environ.get("JWT_ALGO", "HS256")
JWT_EXPIRES_HOURS = int(os.environ.get("JWT_EXPIRES_HOURS", "168"))
STRIPE_API_KEY = os.environ["STRIPE_API_KEY"]
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@oculux.com").lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "OculuxAdmin#2026")
ADMIN_NAME = os.environ.get("ADMIN_NAME", "OculuxVision Admin")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "").strip()
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev").strip()
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "").strip()
TELEGRAM_HANDLE = os.environ.get("TELEGRAM_HANDLE", "OculuxVision")

if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="OculuxVision API")
api = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("oculuxvision")


# ============ Models ============
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OtpRequest(BaseModel):
    phone: str
    name: Optional[str] = None


class OtpVerify(BaseModel):
    phone: str
    code: str
    name: Optional[str] = None


class UserOut(BaseModel):
    id: str
    email: Optional[str] = None
    phone: Optional[str] = None
    name: str
    is_admin: bool = False


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class Product(BaseModel):
    id: str
    slug: str
    name: str
    tagline: str
    description: str
    price: float
    compare_at_price: Optional[float] = None
    currency: str = "inr"
    tier: str
    color: str
    image: str
    gallery: List[str] = []
    features: List[str] = []
    specs: Dict[str, str] = {}
    color_options: List[str] = []
    size_options: List[str] = []
    frame_designs: List[str] = []
    hd_camera: bool = True
    lens_quality: str = "Oakley/Meta-grade polycarbonate, anti-glare, UV400, 99.9% optical clarity"
    free_delivery: bool = True
    stock: int = 100


class ProductUpsert(BaseModel):
    slug: str
    name: str
    tagline: str
    description: str
    price: float
    compare_at_price: Optional[float] = None
    currency: str = "inr"
    tier: str
    color: str
    image: str
    gallery: List[str] = []
    features: List[str] = []
    specs: Dict[str, str] = {}
    color_options: List[str] = []
    size_options: List[str] = []
    frame_designs: List[str] = []
    hd_camera: bool = True
    lens_quality: str = "Oakley/Meta-grade polycarbonate, anti-glare, UV400, 99.9% optical clarity"
    free_delivery: bool = True
    stock: int = 100


class CartItem(BaseModel):
    product_id: str
    quantity: int = 1
    color: Optional[str] = None
    size: Optional[str] = None
    frame_design: Optional[str] = None


class ShippingInfo(BaseModel):
    full_name: str
    phone: str
    address: str
    pin: str
    city: str
    state: str


class CheckoutBody(BaseModel):
    items: List[CartItem]
    origin_url: str
    shipping: ShippingInfo
    payment_method: str = "stripe"  # stripe | upi | rupay | paytm (mock)


class NewsletterSignup(BaseModel):
    email: EmailStr


class SiteContent(BaseModel):
    hero_brand: str = "OculuxVision"
    hero_overline: str = "OculuxVision Series N3 · 2026"
    hero_headline_1: str = "See what you've"
    hero_headline_2: str = "been"
    hero_headline_emph: str = "missing."
    hero_subhead: str = "Flagship AI eyewear with integrated HD camera and Oakley/Meta-grade lens optics — built for kids, creators and elders."
    hero_cta_primary: str = "Shop the collection"
    hero_cta_secondary: str = "Try in AR"
    hero_image: str = "https://images.unsplash.com/photo-1508179522353-11ba468c4a1c?crop=entropy&cs=srgb&fm=jpg&q=85"
    section_tier_overline: str = "Three generations. One vision."
    section_tier_headline: str = "A frame for every face of your family."
    free_delivery_label: str = "Free Home Delivery across India"


class ChatBody(BaseModel):
    messages: List[Dict[str, str]]
    session_id: Optional[str] = None


# ============ Auth helpers ============
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(user_id: str, identity: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id, "ident": identity,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=JWT_EXPIRES_HOURS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Optional[dict]:
    if not creds:
        return None
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0, "otp": 0})
        return user
    except Exception:
        return None


async def require_user(user: Optional[dict] = Depends(current_user)) -> dict:
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user


async def require_admin(user: dict = Depends(require_user)) -> dict:
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin only")
    return user


def normalize_phone(phone: str) -> str:
    return "".join(ch for ch in phone if ch.isdigit() or ch == "+")[-15:]


# ============ Email ============
def _build_receipt_html(order: Dict[str, Any]) -> str:
    rows = "".join(
        f"""
        <tr><td style="padding:12px 0;border-bottom:1px solid #eaeaea;">
            <table><tr><td style="padding-right:14px;"><img src="{i['image']}" width="64" height="64" style="border-radius:8px;display:block;"/></td>
            <td style="font-family:Helvetica;font-size:14px;color:#0a0a0b;"><div style="font-weight:600">{i['name']}</div>
            <div style="color:#6e6e73;font-size:12px;margin-top:4px;">Qty {i['quantity']} × ₹{i['price']:,.0f}</div></td></tr></table>
        </td><td style="text-align:right;font-size:14px;color:#0a0a0b;">₹{i['price']*i['quantity']:,.0f}</td></tr>
        """ for i in order.get("items", [])
    )
    return f"""<!doctype html><html><body style="margin:0;background:#f5f5f7;padding:48px 0;font-family:Helvetica,Arial,sans-serif;">
    <table align="center" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;border:1px solid #eaeaea;">
        <tr><td style="padding:36px 36px 0;"><div style="letter-spacing:.22em;font-size:11px;color:#6e6e73;text-transform:uppercase;">OculuxVision · Receipt</div>
        <h1 style="font-size:28px;letter-spacing:-0.02em;color:#0a0a0b;margin:6px 0 0;">Thank you for your order.</h1>
        <p style="color:#6e6e73;font-size:13px;margin-top:8px;">Order #{order.get('id','')[:8].upper()} · {order.get('created_at','')[:10]}</p></td></tr>
        <tr><td style="padding:24px 36px 0;"><table width="100%">{rows}</table></td></tr>
        <tr><td style="padding:18px 36px;"><table width="100%"><tr><td style="font-size:14px;color:#0a0a0b;font-weight:600;">Total</td>
        <td style="text-align:right;font-size:18px;color:#0a0a0b;font-weight:700;">₹{order.get('amount_total',0):,.0f} INR</td></tr></table></td></tr>
        <tr><td style="padding:24px 36px 36px;border-top:1px solid #eaeaea;color:#6e6e73;font-size:12px;line-height:1.6;">
        Free home delivery across India. Need help? Reply to this email or visit our concierge.</td></tr></table>
        <p style="text-align:center;color:#a1a1a6;font-size:11px;margin-top:18px;">© OculuxVision · Cinematic intelligence, worn beautifully.</p></body></html>"""


async def send_receipt_email(order: Dict[str, Any]) -> None:
    if not RESEND_API_KEY or not order.get("user_email"):
        logger.info("Receipt email skipped (no API key or no email).")
        return
    try:
        params = {
            "from": SENDER_EMAIL, "to": [order["user_email"]],
            "subject": f"Your OculuxVision order #{order['id'][:8].upper()}",
            "html": _build_receipt_html(order),
        }
        await asyncio.to_thread(resend.Emails.send, params)
    except Exception as e:
        logger.warning("Receipt email error: %s", e)


# ============ Seed ============
COLOR_OPTS = ["Matte Onyx", "Brushed Titanium", "Pearl Champagne"]
SIZE_OPTS = ["S", "M", "L"]
FRAME_OPTS = ["Aviator", "Wayfarer", "Pilot"]

SEED_PRODUCTS: List[Dict[str, Any]] = [
    # PRO — ₹20k–₹50k
    {
        "id": "p-pro-onyx", "slug": "oculux-pro-onyx", "name": "OculuxVision Pro Onyx",
        "tagline": "Flagship AI vision with integrated HD camera.",
        "description": "Featherweight titanium frame, 12MP HD camera, 8-core neural engine, and Oakley-grade Plutonite® lens optics. Built for the modern creator and executive.",
        "price": 49999, "compare_at_price": 59999, "currency": "inr", "tier": "pro", "color": "Matte Onyx",
        "image": "https://images.unsplash.com/photo-1634457000710-8ab0e71b2b87?crop=entropy&cs=srgb&fm=jpg&q=85",
        "gallery": [
            "https://images.unsplash.com/photo-1764179627974-25d96c2a1e97?crop=entropy&cs=srgb&fm=jpg&q=85",
            "https://images.unsplash.com/photo-1762314908505-24bccd998715?crop=entropy&cs=srgb&fm=jpg&q=85",
        ],
        "features": ["Integrated 12MP HD camera", "Oakley/Meta-grade Plutonite® lens", "8-core Neural Engine", "Open-ear bone conduction"],
        "specs": {"Weight": "32g", "Battery": "14h", "Camera": "12MP / 4K60 HD", "Lens": "Plutonite® Oakley-grade", "Chip": "Oculux N3 NPU"},
        "color_options": COLOR_OPTS, "size_options": SIZE_OPTS, "frame_designs": FRAME_OPTS,
        "stock": 120,
    },
    {
        "id": "p-pro-titan", "slug": "oculux-pro-titan", "name": "OculuxVision Pro Titan",
        "tagline": "Aerospace titanium meets cinematic HD capture.",
        "description": "Built around an aerospace-grade titanium chassis and a 12MP HD camera, with Oakley/Meta-grade lens technology for boardrooms, runways, and racetracks.",
        "price": 39999, "compare_at_price": 47999, "currency": "inr", "tier": "pro", "color": "Brushed Titanium",
        "image": "https://images.unsplash.com/photo-1762314908505-24bccd998715?crop=entropy&cs=srgb&fm=jpg&q=85",
        "gallery": [],
        "features": ["Integrated 12MP HD camera", "Titanium frame", "Adaptive AI assistant", "Oakley-grade lens"],
        "specs": {"Weight": "29g", "Battery": "12h", "Camera": "12MP / 4K60 HD", "Frame": "Titanium"},
        "color_options": COLOR_OPTS, "size_options": SIZE_OPTS, "frame_designs": FRAME_OPTS,
        "stock": 60,
    },
    {
        "id": "p-pro-aviate", "slug": "oculux-pro-aviate", "name": "OculuxVision Pro Aviate",
        "tagline": "Pilot aesthetic. Studio-grade HD imaging.",
        "description": "A pilot-silhouette frame engineered for creators — Meta-grade dual lens, 12MP HD camera, and on-device 4K60 capture.",
        "price": 29999, "compare_at_price": 36999, "currency": "inr", "tier": "pro", "color": "Pearl Champagne",
        "image": "https://images.unsplash.com/photo-1764179627974-25d96c2a1e97?crop=entropy&cs=srgb&fm=jpg&q=85",
        "gallery": [],
        "features": ["Integrated 12MP HD camera", "Meta-grade lens optics", "Hands-free filming", "Wireless dock included"],
        "specs": {"Weight": "30g", "Battery": "13h", "Camera": "12MP / 4K60 HD"},
        "color_options": COLOR_OPTS, "size_options": SIZE_OPTS, "frame_designs": FRAME_OPTS,
        "stock": 80,
    },
    {
        "id": "p-pro-studio", "slug": "oculux-pro-studio", "name": "OculuxVision Pro Studio",
        "tagline": "Entry flagship with HD imaging built-in.",
        "description": "The accessible flagship — integrated HD camera, AI translation, and Oakley/Meta-grade lens clarity in a slim, all-day frame.",
        "price": 19999, "compare_at_price": 24999, "currency": "inr", "tier": "pro", "color": "Matte Onyx",
        "image": "https://images.unsplash.com/photo-1762314908505-24bccd998715?crop=entropy&cs=srgb&fm=jpg&q=85",
        "gallery": [],
        "features": ["Integrated 12MP HD camera", "Oakley-grade lens", "Live translate", "Open-ear audio"],
        "specs": {"Weight": "28g", "Battery": "11h", "Camera": "12MP HD"},
        "color_options": COLOR_OPTS, "size_options": SIZE_OPTS, "frame_designs": FRAME_OPTS,
        "stock": 200,
    },
    # KIDS — ₹6k–₹30k
    {
        "id": "p-kids-aurora", "slug": "oculuxvision-kids-aurora", "name": "OculuxVision Kids Aurora",
        "tagline": "Safe, curious, brilliant — with HD memories.",
        "description": "Durable smart frame with integrated HD camera, AR storytime, live location, voice tutor and Meta-grade shatter-resistant lenses for ages 6–12.",
        "price": 14999, "compare_at_price": 19999, "currency": "inr", "tier": "kids", "color": "Aurora Blue",
        "image": "https://images.unsplash.com/photo-1702284970879-4a0f0b76cee5?crop=entropy&cs=srgb&fm=jpg&q=85",
        "gallery": [],
        "features": ["Integrated HD camera", "Meta-grade shatter-resistant lens", "Live location safety", "AR learning games"],
        "specs": {"Weight": "26g", "Battery": "10h", "Camera": "8MP HD", "Lens": "Shatter-proof polycarbonate"},
        "color_options": ["Aurora Blue", "Nova Coral", "Mint Green"], "size_options": ["XS", "S"], "frame_designs": ["Round", "Square"],
        "stock": 180,
    },
    {
        "id": "p-kids-nova", "slug": "oculuxvision-kids-nova", "name": "OculuxVision Kids Nova",
        "tagline": "Their first adventure in AI — with HD memories.",
        "description": "Bright, tough, packed with story-time AR, audio companion and a kid-safe HD camera for capturing the everyday magic.",
        "price": 8999, "compare_at_price": 11999, "currency": "inr", "tier": "kids", "color": "Nova Coral",
        "image": "https://images.unsplash.com/photo-1702284970879-4a0f0b76cee5?crop=entropy&cs=srgb&fm=jpg&q=85",
        "gallery": [],
        "features": ["Integrated HD camera", "Storytime AR", "Voice tutor", "Anti-glare blue-light lens"],
        "specs": {"Weight": "24g", "Battery": "9h", "Camera": "5MP HD"},
        "color_options": ["Nova Coral", "Aurora Blue"], "size_options": ["XS", "S"], "frame_designs": ["Round", "Square"],
        "stock": 240,
    },
    {
        "id": "p-kids-spark", "slug": "oculuxvision-kids-spark", "name": "OculuxVision Kids Spark",
        "tagline": "Light, fun, and HD-ready.",
        "description": "The entry kids frame with Meta-grade lens, geo-fence safety, and a built-in HD camera for school adventures.",
        "price": 5999, "compare_at_price": 7999, "currency": "inr", "tier": "kids", "color": "Mint Green",
        "image": "https://images.unsplash.com/photo-1702284970879-4a0f0b76cee5?crop=entropy&cs=srgb&fm=jpg&q=85",
        "gallery": [],
        "features": ["Integrated HD camera", "Geo-fence alerts", "Parental controls", "Anti-glare lens"],
        "specs": {"Weight": "22g", "Battery": "9h", "Camera": "5MP HD"},
        "color_options": ["Mint Green", "Aurora Blue", "Nova Coral"], "size_options": ["XS", "S"], "frame_designs": ["Round"],
        "stock": 300,
    },
    # SENIOR — ₹20k–₹50k
    {
        "id": "p-senior-clarity", "slug": "oculuxvision-senior-clarity", "name": "OculuxVision Senior Clarity",
        "tagline": "Vision assist with HD memory keeping.",
        "description": "Continuous health monitoring, vision augmentation, and an HD camera for capturing grandkids' moments — with Oakley-grade adaptive lenses.",
        "price": 34999, "compare_at_price": 41999, "currency": "inr", "tier": "senior", "color": "Pearl Graphite",
        "image": "https://images.unsplash.com/photo-1716236086408-feca5a7c682c?crop=entropy&cs=srgb&fm=jpg&q=85",
        "gallery": [],
        "features": ["Integrated HD camera", "Oakley-grade adaptive lens", "Continuous HR monitor", "Fall detection"],
        "specs": {"Weight": "31g", "Battery": "16h", "Camera": "12MP HD", "Sensors": "PPG, IMU, Ambient"},
        "color_options": COLOR_OPTS, "size_options": ["M", "L"], "frame_designs": ["Wayfarer", "Round"],
        "stock": 90,
    },
    {
        "id": "p-senior-haven", "slug": "oculuxvision-senior-haven", "name": "OculuxVision Senior Haven",
        "tagline": "A guardian in every glance — with HD vision.",
        "description": "Calm companion frame with integrated HD camera, wellness tracking, SOS button, and Meta-grade adaptive optics.",
        "price": 24999, "compare_at_price": 29999, "currency": "inr", "tier": "senior", "color": "Soft Champagne",
        "image": "https://images.unsplash.com/photo-1716236086408-feca5a7c682c?crop=entropy&cs=srgb&fm=jpg&q=85",
        "gallery": [],
        "features": ["Integrated HD camera", "Meta-grade adaptive lens", "SOS button", "Family circle"],
        "specs": {"Weight": "30g", "Battery": "18h", "Camera": "8MP HD"},
        "color_options": COLOR_OPTS, "size_options": ["M", "L"], "frame_designs": ["Wayfarer", "Pilot"],
        "stock": 75,
    },
]


@app.on_event("startup")
async def on_startup():
    # Replace seed: upsert with new INR pricing & variations
    for p in SEED_PRODUCTS:
        await db.products.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
    # Remove legacy USD-priced docs that are not in seed
    seed_ids = [p["id"] for p in SEED_PRODUCTS]
    await db.products.delete_many({"id": {"$nin": seed_ids}, "currency": {"$ne": "inr"}})

    # Admin seed
    if not await db.users.find_one({"email": ADMIN_EMAIL}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()), "email": ADMIN_EMAIL, "name": ADMIN_NAME,
            "password": hash_password(ADMIN_PASSWORD), "is_admin": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    else:
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"is_admin": True}})

    # Site content seed (CMS)
    default_content = SiteContent().model_dump()
    await db.site_content.update_one(
        {"key": "home"},
        {"$setOnInsert": {"key": "home", **default_content}},
        upsert=True,
    )

    # Indexes — tolerate existing legacy unique-email index from prior runs.
    try:
        await db.users.drop_index("email_1")
    except Exception:
        pass
    try:
        await db.users.create_index("email", sparse=True)
        await db.users.create_index("phone", sparse=True)
    except Exception as e:
        logger.warning("users index: %s", e)
    await db.orders.create_index("user_id")
    try:
        await db.payment_transactions.create_index("session_id", unique=True)
    except Exception:
        pass
    try:
        await db.otp_codes.create_index("expires_at", expireAfterSeconds=0)
    except Exception:
        pass
    logger.info("OculuxVision startup complete: %d products.", len(SEED_PRODUCTS))


@api.get("/")
async def root():
    return {"app": "OculuxVision", "status": "ok", "currency": "INR"}


# ============ Auth — Email/Password (Admin) ============
@api.post("/auth/register", response_model=AuthResponse)
async def register(body: UserCreate):
    if await db.users.find_one({"email": body.email.lower()}):
        raise HTTPException(status_code=400, detail="Email already registered")
    uid = str(uuid.uuid4())
    doc = {
        "id": uid, "email": body.email.lower(), "name": body.name.strip(),
        "password": hash_password(body.password), "is_admin": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    return AuthResponse(
        token=make_token(uid, doc["email"]),
        user=UserOut(id=uid, email=doc["email"], name=doc["name"], is_admin=False),
    )


@api.post("/auth/login", response_model=AuthResponse)
async def login(body: UserLogin):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not user.get("password") or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return AuthResponse(
        token=make_token(user["id"], user["email"]),
        user=UserOut(
            id=user["id"], email=user.get("email"), phone=user.get("phone"),
            name=user["name"], is_admin=user.get("is_admin", False),
        ),
    )


@api.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(require_user)):
    return UserOut(
        id=user["id"], email=user.get("email"), phone=user.get("phone"),
        name=user["name"], is_admin=user.get("is_admin", False),
    )


# ============ Auth — Mobile OTP (Customer) ============
@api.post("/auth/otp/request")
async def otp_request(body: OtpRequest):
    phone = normalize_phone(body.phone)
    if len(phone) < 10:
        raise HTTPException(status_code=400, detail="Invalid phone")
    code = f"{random.randint(0, 999999):06d}"
    expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    await db.otp_codes.update_one(
        {"phone": phone},
        {"$set": {"phone": phone, "code": code, "expires_at": expires, "attempts": 0}},
        upsert=True,
    )
    logger.info("OTP for %s = %s (MOCKED — would be SMS in prod)", phone, code)
    # MOCKED: return code in response so the UI can auto-display it.
    return {"sent": True, "phone": phone, "dev_otp": code, "mocked": True}


@api.post("/auth/otp/verify", response_model=AuthResponse)
async def otp_verify(body: OtpVerify):
    phone = normalize_phone(body.phone)
    record = await db.otp_codes.find_one({"phone": phone})
    if not record or record.get("code") != body.code.strip():
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
    exp = record.get("expires_at")
    if isinstance(exp, datetime) and exp.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="OTP expired")

    user = await db.users.find_one({"phone": phone})
    if not user:
        uid = str(uuid.uuid4())
        user = {
            "id": uid, "phone": phone, "name": (body.name or "OculuxVision Customer").strip(),
            "is_admin": False, "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
    await db.otp_codes.delete_one({"phone": phone})

    return AuthResponse(
        token=make_token(user["id"], phone),
        user=UserOut(id=user["id"], phone=phone, name=user["name"], is_admin=user.get("is_admin", False)),
    )


# ============ Products ============
@api.get("/products", response_model=List[Product])
async def list_products(tier: Optional[str] = None):
    q: Dict[str, Any] = {}
    if tier: q["tier"] = tier
    return await db.products.find(q, {"_id": 0}).to_list(200)


@api.get("/products/{slug}", response_model=Product)
async def get_product(slug: str):
    doc = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return doc


# ============ Site Content (CMS) ============
@api.get("/site/content")
async def site_content_get():
    doc = await db.site_content.find_one({"key": "home"}, {"_id": 0, "key": 0})
    if not doc:
        return SiteContent().model_dump()
    return doc


@api.put("/admin/site/content")
async def site_content_put(body: SiteContent, _: dict = Depends(require_admin)):
    payload = body.model_dump()
    await db.site_content.update_one({"key": "home"}, {"$set": {"key": "home", **payload}}, upsert=True)
    return payload


# ============ Newsletter ============
@api.post("/newsletter")
async def newsletter(body: NewsletterSignup):
    await db.newsletter.update_one(
        {"email": body.email.lower()},
        {"$set": {"email": body.email.lower(), "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True}


# ============ Checkout ============
@api.post("/checkout/session")
async def create_checkout(body: CheckoutBody, request: Request, user: Optional[dict] = Depends(current_user)):
    if not body.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    if not (body.shipping.pin and body.shipping.pin.strip().isdigit() and len(body.shipping.pin.strip()) >= 5):
        raise HTTPException(status_code=400, detail="Valid PIN code is required")

    product_ids = [i.product_id for i in body.items]
    products = await db.products.find({"id": {"$in": product_ids}}, {"_id": 0}).to_list(200)
    by_id = {p["id"]: p for p in products}
    if len(by_id) != len(set(product_ids)):
        raise HTTPException(status_code=400, detail="Invalid product in cart")

    total = 0.0
    order_items: List[Dict[str, Any]] = []
    for item in body.items:
        prod = by_id[item.product_id]
        qty = max(1, min(10, item.quantity))
        total += float(prod["price"]) * qty
        order_items.append({
            "product_id": prod["id"], "name": prod["name"], "price": float(prod["price"]),
            "quantity": qty, "image": prod["image"],
            "color": item.color, "size": item.size, "frame_design": item.frame_design,
        })
    amount = round(total, 2)

    # MOCKED non-Stripe payments — return a mock success URL directly
    if body.payment_method in {"upi", "rupay", "paytm"}:
        order_id = str(uuid.uuid4())
        await db.orders.insert_one({
            "id": order_id, "session_id": f"mock_{order_id}",
            "user_id": (user or {}).get("id"),
            "user_email": (user or {}).get("email"),
            "user_phone": (user or {}).get("phone"),
            "shipping": body.shipping.model_dump(),
            "payment_method": body.payment_method,
            "items": order_items,
            "amount_total": amount, "currency": "inr",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "paid",
        })
        for it in order_items:
            await db.products.update_one({"id": it["product_id"]}, {"$inc": {"stock": -int(it["quantity"])}})
        return {
            "url": f"{body.origin_url.rstrip('/')}/checkout/success?mock=1&order_id={order_id}&method={body.payment_method}",
            "session_id": f"mock_{order_id}",
            "mocked": True,
        }

    # Real Stripe (test) flow
    origin = body.origin_url.rstrip("/")
    success_url = f"{origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/checkout/cancel"
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    metadata = {
        "source": "oculuxvision_web",
        "user_id": (user or {}).get("id", "guest"),
        "user_phone": (user or {}).get("phone", ""),
        "shipping_pin": body.shipping.pin,
        "shipping_city": body.shipping.city,
    }
    req = CheckoutSessionRequest(amount=amount, currency="inr", success_url=success_url, cancel_url=cancel_url, metadata=metadata)
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(req)

    await db.payment_transactions.insert_one({
        "session_id": session.session_id, "amount": amount, "currency": "inr",
        "metadata": metadata, "items": order_items,
        "user_id": (user or {}).get("id"), "user_email": (user or {}).get("email"),
        "user_phone": (user or {}).get("phone"),
        "shipping": body.shipping.model_dump(), "payment_method": "stripe",
        "payment_status": "initiated", "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"url": session.url, "session_id": session.session_id}


@api.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request):
    # Mock order path
    if session_id.startswith("mock_"):
        order = await db.orders.find_one({"session_id": session_id}, {"_id": 0})
        if not order:
            raise HTTPException(status_code=404, detail="Session not found")
        return {
            "session_id": session_id, "payment_status": "paid", "status": "complete",
            "amount_total": int(order.get("amount_total", 0) * 100), "currency": "inr",
            "items": order.get("items", []),
        }

    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Session not found")

    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    cs: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)

    already_paid = tx.get("payment_status") == "paid"
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": {
        "payment_status": cs.payment_status, "status": cs.status, "amount_total": cs.amount_total,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }})

    if cs.payment_status == "paid" and not already_paid:
        order = {
            "id": str(uuid.uuid4()), "session_id": session_id,
            "user_id": tx.get("user_id"), "user_email": tx.get("user_email"), "user_phone": tx.get("user_phone"),
            "shipping": tx.get("shipping"), "payment_method": "stripe",
            "items": tx.get("items", []),
            "amount_total": (cs.amount_total or 0) / 100.0, "currency": cs.currency,
            "created_at": datetime.now(timezone.utc).isoformat(), "status": "paid",
        }
        await db.orders.insert_one(order)
        for it in order["items"]:
            await db.products.update_one({"id": it["product_id"]}, {"$inc": {"stock": -int(it["quantity"])}})
        asyncio.create_task(send_receipt_email(order))

    return {
        "session_id": session_id, "payment_status": cs.payment_status, "status": cs.status,
        "amount_total": cs.amount_total, "currency": cs.currency, "items": tx.get("items", []),
    }


@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    try:
        ev = await stripe_checkout.handle_webhook(body, sig)
        await db.payment_transactions.update_one(
            {"session_id": ev.session_id},
            {"$set": {"payment_status": ev.payment_status, "webhook_event": ev.event_type}},
        )
    except Exception as e:
        logger.warning("Webhook error: %s", e)
    return {"received": True}


# ============ Orders ============
@api.get("/orders")
async def list_orders(user: dict = Depends(require_user)):
    return await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)


# ============ Admin ============
@api.get("/admin/stats")
async def admin_stats(_: dict = Depends(require_admin)):
    total_orders = await db.orders.count_documents({})
    total_users = await db.users.count_documents({"is_admin": {"$ne": True}})
    total_products = await db.products.count_documents({})
    revenue_agg = await db.orders.aggregate([{"$group": {"_id": None, "sum": {"$sum": "$amount_total"}}}]).to_list(1)
    revenue = float(revenue_agg[0]["sum"]) if revenue_agg else 0.0
    return {"orders": total_orders, "users": total_users, "products": total_products, "revenue": round(revenue, 2), "currency": "INR"}


@api.get("/admin/orders")
async def admin_list_orders(_: dict = Depends(require_admin)):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api.get("/admin/products")
async def admin_list_products(_: dict = Depends(require_admin)):
    return await db.products.find({}, {"_id": 0}).to_list(500)


@api.post("/admin/products")
async def admin_create_product(body: ProductUpsert, _: dict = Depends(require_admin)):
    if await db.products.find_one({"slug": body.slug}):
        raise HTTPException(status_code=400, detail="Slug already exists")
    doc = body.model_dump()
    doc["id"] = f"p-{uuid.uuid4().hex[:10]}"
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/admin/products/{product_id}")
async def admin_update_product(product_id: str, body: ProductUpsert, _: dict = Depends(require_admin)):
    res = await db.products.update_one({"id": product_id}, {"$set": body.model_dump()})
    if not res.matched_count:
        raise HTTPException(status_code=404, detail="Product not found")
    return await db.products.find_one({"id": product_id}, {"_id": 0})


@api.delete("/admin/products/{product_id}")
async def admin_delete_product(product_id: str, _: dict = Depends(require_admin)):
    res = await db.products.delete_one({"id": product_id})
    if not res.deleted_count:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


@api.get("/admin/users")
async def admin_list_users(_: dict = Depends(require_admin)):
    return await db.users.find({}, {"_id": 0, "password": 0, "otp": 0}).to_list(500)


# ============ AI Sales Assistant ============
def _system_prompt(products: List[Dict[str, Any]]) -> str:
    catalog = "\n".join(
        f"- {p['name']} (slug: {p['slug']}, tier: {p['tier']}, ₹{p['price']:,.0f}"
        + (f" was ₹{p['compare_at_price']:,.0f}" if p.get('compare_at_price') else "")
        + f"): {p['tagline']} | HD camera, {p.get('lens_quality','Oakley/Meta-grade lens')} | "
        + ", ".join(p.get("features", [])[:3])
        for p in products
    )
    return f"""You are the **OculuxVision Sales Assistant** — an elegant, helpful, multilingual concierge for OculuxVision AI-powered smart glasses.

CRITICAL RULES:
1. Automatically detect the user's language (English, Hindi, Hinglish, or any other) and ALWAYS reply in the SAME language they used.
2. Be warm, concise, and luxurious in tone — like an Apple Store specialist.
3. Use ONLY the catalog below to answer product questions. Never invent specs, prices, or features.
4. All prices are in Indian Rupees (₹). Mention "Free Home Delivery across India" when relevant.
5. Every OculuxVision product includes an integrated HD camera and Oakley/Meta-grade premium lens quality — remind the customer when helpful.
6. If asked about something outside our catalog (e.g., other brands, unrelated topics), politely steer back to OculuxVision.
7. Suggest 1–2 products by name (and slug) when intent is clear. Format slug as `[name](/product/slug)` to render a clickable link.
8. If the user asks how to buy, mention they can click the product link, choose colour/size/frame, and check out with UPI, RuPay, Paytm or card.

CATALOG (live):
{catalog}

Reply directly. Do not break character. Keep responses under 120 words unless the user asks for more detail."""


@api.post("/ai/chat")
async def ai_chat(body: ChatBody):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=503, detail="AI key not configured")
    if not body.messages:
        raise HTTPException(status_code=400, detail="No messages")

    products = await db.products.find({}, {"_id": 0}).to_list(200)
    sys = _system_prompt(products)
    session_id = body.session_id or str(uuid.uuid4())

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=sys,
    ).with_model("anthropic", "claude-sonnet-4-5-20250929")

    # Replay all prior messages so multi-turn works for stateless clients
    history = body.messages
    last = history[-1]
    if last.get("role") != "user":
        raise HTTPException(status_code=400, detail="Last message must be from user")

    async def event_gen():
        try:
            # Replay history (no streaming) except the last user msg
            for m in history[:-1]:
                if m.get("role") == "user":
                    await chat.send_message(UserMessage(text=m.get("content", "")))
            # Stream the final answer
            async for ev in chat.stream_message(UserMessage(text=last["content"])):
                if isinstance(ev, TextDelta):
                    yield ev.content
                elif isinstance(ev, StreamDone):
                    break
        except Exception as e:
            logger.exception("AI chat error")
            yield f"\n[error: {str(e)[:80]}]"

    return StreamingResponse(
        event_gen(), media_type="text/plain",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "X-Session-Id": session_id},
    )


# ============ Mount ============
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Session-Id"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
