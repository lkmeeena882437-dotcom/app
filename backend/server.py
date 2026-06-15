from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import bcrypt
import jwt
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGO = os.environ.get("JWT_ALGO", "HS256")
JWT_EXPIRES_HOURS = int(os.environ.get("JWT_EXPIRES_HOURS", "168"))
STRIPE_API_KEY = os.environ["STRIPE_API_KEY"]

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Oculux AI Glasses API")
api = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("oculux")


# ============ Models ============
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str


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
    currency: str = "usd"
    tier: str  # kids | pro | senior
    color: str
    image: str
    gallery: List[str] = []
    features: List[str] = []
    specs: Dict[str, str] = {}


class CartItem(BaseModel):
    product_id: str
    quantity: int = 1


class CheckoutBody(BaseModel):
    items: List[CartItem]
    origin_url: str


class OrderItem(BaseModel):
    product_id: str
    name: str
    price: float
    quantity: int
    image: str


class NewsletterSignup(BaseModel):
    email: EmailStr


# ============ Auth helpers ============
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(user_id: str, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=JWT_EXPIRES_HOURS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Optional[dict]:
    if not creds:
        return None
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGO])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
        return user
    except Exception:
        return None


async def require_user(user: Optional[dict] = Depends(current_user)) -> dict:
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user


# ============ Seed Products ============
SEED_PRODUCTS: List[Dict[str, Any]] = [
    {
        "id": "p-pro-onyx",
        "slug": "oculux-pro-onyx",
        "name": "Oculux Pro Onyx",
        "tagline": "Flagship AI vision for professionals.",
        "description": "The Oculux Pro Onyx fuses an 8-core neural processor, 12MP cinema sensor, and bone-conduction audio into a featherweight titanium frame. Built for the modern creator and executive.",
        "price": 599.0,
        "currency": "usd",
        "tier": "pro",
        "color": "Matte Onyx",
        "image": "https://images.unsplash.com/photo-1634457000710-8ab0e71b2b87?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwyfHx5b3VuZyUyMHByb2Zlc3Npb25hbCUyMHdlYXJpbmclMjBzbWFydCUyMGdsYXNzZXMlMjBkYXJrJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3ODE0OTMxNDJ8MA&ixlib=rb-4.1.0&q=85",
        "gallery": [
            "https://images.unsplash.com/photo-1764179627974-25d96c2a1e97?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwyfHxsdXh1cnklMjBzdW5nbGFzc2VzJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzgxNDkzMTQyfDA&ixlib=rb-4.1.0&q=85",
            "https://images.unsplash.com/photo-1762314908505-24bccd998715?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBzdW5nbGFzc2VzJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzgxNDkzMTQyfDA&ixlib=rb-4.1.0&q=85",
        ],
        "features": [
            "8-core Neural Engine",
            "12MP cinema-grade camera",
            "Open-ear bone conduction audio",
            "All-day 14h battery",
        ],
        "specs": {
            "Weight": "32g",
            "Battery": "14 hours",
            "Camera": "12MP / 4K60",
            "Audio": "Open-ear dual driver",
            "Connectivity": "Wi-Fi 7, BT 5.4",
            "Chip": "Oculux N2 NPU",
        },
    },
    {
        "id": "p-pro-titan",
        "slug": "oculux-pro-titan",
        "name": "Oculux Pro Titan",
        "tagline": "Brushed titanium. Limitless intelligence.",
        "description": "Aerospace-grade titanium meets adaptive AI assistance for boardrooms, runways, and racetracks.",
        "price": 749.0,
        "currency": "usd",
        "tier": "pro",
        "color": "Titanium",
        "image": "https://images.unsplash.com/photo-1762314908505-24bccd998715?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwzfHxsdXh1cnklMjBzdW5nbGFzc2VzJTIwZGFyayUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzgxNDkzMTQyfDA&ixlib=rb-4.1.0&q=85",
        "gallery": [],
        "features": ["Titanium frame", "Adaptive AI assistant", "Cinematic 4K HDR", "Wireless charging"],
        "specs": {"Weight": "29g", "Battery": "12 hours", "Camera": "12MP / 4K60", "Frame": "Titanium"},
    },
    {
        "id": "p-kids-aurora",
        "slug": "oculux-kids-aurora",
        "name": "Oculux Kids Aurora",
        "tagline": "Safe, curious, brilliant.",
        "description": "A playful, durable smart frame with live location, voice assistant and interactive AR learning modes for ages 6-12.",
        "price": 299.0,
        "currency": "usd",
        "tier": "kids",
        "color": "Aurora Blue",
        "image": "https://images.unsplash.com/photo-1702284970879-4a0f0b76cee5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHwxfHxjaGlsZCUyMHdlYXJpbmclMjBzdW5nbGFzc2VzJTIwY2luZW1hdGljfGVufDB8fHx8MTc4MTQ5MzE0Mnww&ixlib=rb-4.1.0&q=85",
        "gallery": [],
        "features": ["Live location safety", "AR learning games", "Parental controls", "Shatter-resistant lens"],
        "specs": {"Weight": "26g", "Battery": "10 hours", "Lens": "Shatter-proof polycarbonate"},
    },
    {
        "id": "p-kids-nova",
        "slug": "oculux-kids-nova",
        "name": "Oculux Kids Nova",
        "tagline": "Their first adventure in AI.",
        "description": "Bright, tough, packed with story-time AR and audio companionship for the brave young minds.",
        "price": 249.0,
        "currency": "usd",
        "tier": "kids",
        "color": "Nova Coral",
        "image": "https://images.unsplash.com/photo-1702284970879-4a0f0b76cee5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHwxfHxjaGlsZCUyMHdlYXJpbmclMjBzdW5nbGFzc2VzJTIwY2luZW1hdGljfGVufDB8fHx8MTc4MTQ5MzE0Mnww&ixlib=rb-4.1.0&q=85",
        "gallery": [],
        "features": ["Storytime AR", "Voice tutor", "Geo-fence alerts", "Anti-glare blue light"],
        "specs": {"Weight": "24g", "Battery": "9 hours"},
    },
    {
        "id": "p-senior-clarity",
        "slug": "oculux-senior-clarity",
        "name": "Oculux Senior Clarity",
        "tagline": "Vision assist, heart at ease.",
        "description": "Continuous health monitoring, gentle audio prompts, and pristine vision augmentation for confident, independent days.",
        "price": 449.0,
        "currency": "usd",
        "tier": "senior",
        "color": "Pearl Graphite",
        "image": "https://images.unsplash.com/photo-1716236086408-feca5a7c682c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwyfHxzZW5pb3IlMjB3ZWFyaW5nJTIwc3VuZ2xhc3NlcyUyMGNpbmVtYXRpY3xlbnwwfHx8fDE3ODE0OTMxNDJ8MA&ixlib=rb-4.1.0&q=85",
        "gallery": [],
        "features": ["Continuous HR monitor", "Fall detection", "Vision augmentation", "Voice navigation"],
        "specs": {"Weight": "31g", "Battery": "16 hours", "Sensors": "PPG, IMU, Ambient"},
    },
    {
        "id": "p-senior-haven",
        "slug": "oculux-senior-haven",
        "name": "Oculux Senior Haven",
        "tagline": "A guardian in every glance.",
        "description": "A calm companion frame that quietly tracks wellness, hears what matters, and connects you to family with a tap.",
        "price": 399.0,
        "currency": "usd",
        "tier": "senior",
        "color": "Soft Champagne",
        "image": "https://images.unsplash.com/photo-1716236086408-feca5a7c682c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwyfHxzZW5pb3IlMjB3ZWFyaW5nJTIwc3VuZ2xhc3NlcyUyMGNpbmVtYXRpY3xlbnwwfHx8fDE3ODE0OTMxNDJ8MA&ixlib=rb-4.1.0&q=85",
        "gallery": [],
        "features": ["SOS button", "Family circle", "Voice-only UX", "Adaptive lenses"],
        "specs": {"Weight": "30g", "Battery": "18 hours"},
    },
]


@app.on_event("startup")
async def on_startup():
    # Seed products idempotently
    for p in SEED_PRODUCTS:
        await db.products.update_one({"id": p["id"]}, {"$set": p}, upsert=True)
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.orders.create_index("user_id")
    await db.payment_transactions.create_index("session_id", unique=True)
    logger.info("Oculux startup complete: %d products seeded.", len(SEED_PRODUCTS))


# ============ Routes: misc ============
@api.get("/")
async def root():
    return {"app": "Oculux AI Glasses", "status": "ok"}


# ============ Routes: Auth ============
@api.post("/auth/register", response_model=AuthResponse)
async def register(body: UserCreate):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": body.email.lower(),
        "name": body.name.strip(),
        "password": hash_password(body.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = make_token(user_id, user_doc["email"])
    return AuthResponse(token=token, user=UserOut(id=user_id, email=user_doc["email"], name=user_doc["name"]))


@api.post("/auth/login", response_model=AuthResponse)
async def login(body: UserLogin):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = make_token(user["id"], user["email"])
    return AuthResponse(token=token, user=UserOut(id=user["id"], email=user["email"], name=user["name"]))


@api.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(require_user)):
    return UserOut(id=user["id"], email=user["email"], name=user["name"])


# ============ Routes: Products ============
@api.get("/products", response_model=List[Product])
async def list_products(tier: Optional[str] = None):
    q: Dict[str, Any] = {}
    if tier:
        q["tier"] = tier
    docs = await db.products.find(q, {"_id": 0}).to_list(200)
    return docs


@api.get("/products/{slug}", response_model=Product)
async def get_product(slug: str):
    doc = await db.products.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return doc


# ============ Routes: Newsletter ============
@api.post("/newsletter")
async def newsletter(body: NewsletterSignup):
    await db.newsletter.update_one(
        {"email": body.email.lower()},
        {"$set": {"email": body.email.lower(), "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True}


# ============ Routes: Checkout (Stripe) ============
@api.post("/checkout/session")
async def create_checkout(body: CheckoutBody, request: Request, user: Optional[dict] = Depends(current_user)):
    if not body.items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Server-side price calculation (security)
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
        line_total = float(prod["price"]) * qty
        total += line_total
        order_items.append(
            {
                "product_id": prod["id"],
                "name": prod["name"],
                "price": float(prod["price"]),
                "quantity": qty,
                "image": prod["image"],
            }
        )

    amount = round(total, 2)
    origin = body.origin_url.rstrip("/")
    success_url = f"{origin}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/checkout/cancel"

    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    metadata = {
        "source": "oculux_web",
        "user_id": (user or {}).get("id", "guest"),
        "user_email": (user or {}).get("email", "guest"),
    }
    req = CheckoutSessionRequest(
        amount=amount,
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(req)

    await db.payment_transactions.insert_one(
        {
            "session_id": session.session_id,
            "amount": amount,
            "currency": "usd",
            "metadata": metadata,
            "items": order_items,
            "user_id": (user or {}).get("id"),
            "user_email": (user or {}).get("email"),
            "payment_status": "initiated",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    return {"url": session.url, "session_id": session.session_id}


@api.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, request: Request):
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Session not found")

    host_url = str(request.base_url)
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    cs: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)

    # Idempotent update + order creation
    already_paid = tx.get("payment_status") == "paid"
    update = {
        "payment_status": cs.payment_status,
        "status": cs.status,
        "amount_total": cs.amount_total,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": update})

    if cs.payment_status == "paid" and not already_paid:
        order = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "user_id": tx.get("user_id"),
            "user_email": tx.get("user_email"),
            "items": tx.get("items", []),
            "amount_total": (cs.amount_total or 0) / 100.0,
            "currency": cs.currency,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "status": "paid",
        }
        await db.orders.insert_one(order)

    return {
        "session_id": session_id,
        "payment_status": cs.payment_status,
        "status": cs.status,
        "amount_total": cs.amount_total,
        "currency": cs.currency,
        "items": tx.get("items", []),
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


# ============ Routes: Orders ============
@api.get("/orders")
async def list_orders(user: dict = Depends(require_user)):
    docs = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return docs


# ============ Mount ============
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
