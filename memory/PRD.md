# OculuxVision — Flagship E-commerce Storefront

## Original Problem Statement (latest)
Brand rebrand to "OculuxVision" with huge centered hero brand. INR pricing (Adults ₹20k–₹50k, Kids ₹6k–₹30k) + Compare-at discounts. Product variations (Color/Size/FrameDesign). Mandatory HD camera + Oakley/Meta-grade lens on every product. CMS for editing homepage content from admin. JWT-protected admin (`/admin`). Multilingual AI sales assistant (Hindi/English). Mandatory PIN code + HTML5 Geolocation in cart. Free Home Delivery tags. Mobile+OTP customer auth. Mock UPI/RuPay/Paytm + Real Stripe payments. Telegram support link in footer. Light-mode aesthetic retained.

## Iteration Log
### Iteration 1 — MVP (dark theme, USD, 6 products, slider AR)
### Iteration 2 — Full light-mode overhaul + MediaPipe FaceMesh AR + Admin dashboard + Resend wired
### Iteration 3 — OculuxVision rebrand
**Backend**
- 9 products seeded in INR with `compare_at_price`, `color_options`, `size_options`, `frame_designs`, `hd_camera`, `lens_quality`, `free_delivery` fields
- CMS collection `site_content`: GET `/api/site/content` (public), PUT `/api/admin/site/content` (admin)
- Mobile OTP auth (`/api/auth/otp/request` returns `dev_otp` — MOCKED) and `/api/auth/otp/verify`
- AI sales assistant: POST `/api/ai/chat` streams Claude Sonnet 4.5 via Emergent LLM key, with system-prompt injection of live catalog, multilingual auto-detect, product links rendered as Markdown
- Mock UPI / RuPay / Paytm payment methods alongside real Stripe (test mode) — auto-create orders + decrement stock
- Shipping validation (mandatory `pin` ≥ 5 numeric digits)
- TTL index on `otp_codes`

**Frontend**
- Brand rename everywhere (Nav, Footer, hero, emails, AskAI welcome)
- Massive centered `OculuxVision` brand text on home (font-size: clamp(3.5rem, 13vw, 11rem))
- Home is now fully CMS-driven (`/api/site/content`)
- ₹ formatter (`formatINR`) used across Shop / PDP / Cart / Admin
- PDP variation Pills (color/size/frame) with INR + Compare-at strikethrough + "Save ₹X" badge + HD Camera & Free-Home-Delivery chips
- Cart: shipping form (6 fields, PIN-validated), "Detect my location" → OpenStreetMap Nominatim reverse-geocode → auto-fills PIN/city/state/address, payment-method selector (4 tiles), Free Home Delivery badge
- Auth: Mobile+OTP (default) tab with dev-OTP banner; Admin tab (email/password)
- AskAI floating widget: streaming Markdown chat, suggestion chips, multilingual placeholder
- Footer: brand + Telegram support link to `t.me/OculuxVision`
- Admin: new "Site Content (CMS)" tab with full ContentEditor (hero brand/overline/headlines/subhead/CTA labels/image URL/section titles); ProductForm extended for compare_at_price + color/size/frame variation arrays + lens_quality + free_delivery + INR

**Verification**
- Backend: **21/21 pytest pass** (full INR + variations + OTP + CMS + mock payments + AI streaming + admin guards)
- Frontend: **100% pass** on Iteration-4 retest — cart→shipping→UPI mock checkout, OTP login, CMS publish, all flows green
- AI assistant: manually verified — English and Hindi prompts each return correct multilingual product recommendations with linked slugs, ₹ pricing, and Free-Home-Delivery callout

## Test Credentials
- Admin: `admin@oculux.com` / `OculuxAdmin#2026`
- Customer OTP: any phone (e.g. `+919999988877`); the 6-digit code is returned in the API response (MOCKED — switch to Twilio later)
- Stripe test card: `4242 4242 4242 4242`

## What's MOCKED (and how to un-mock)
| Feature | Status | To activate real |
|---|---|---|
| OTP delivery | dev_otp in response | Wire Twilio (env: TWILIO_SID/AUTH/FROM) + remove `dev_otp` field from response |
| UPI / RuPay / Paytm | server creates order directly | Integrate Razorpay/Cashfree |
| Email receipts | logs "skipped" if RESEND_API_KEY=='' | Add real Resend API key to backend/.env |

## P0/P1/P2 Backlog
- **P1**: Wire real Twilio SMS for OTP; switch dev_otp to log-only
- **P1**: Real Razorpay for UPI/RuPay/Paytm
- **P1**: Real cinematic 4K hero video from user
- **P2**: AskAI conversation cache (currently replays history each call)
- **P2**: Split `server.py` into `routers/{auth,products,checkout,admin,ai,cms}.py`
- **P2**: Reviews & ratings; "People also bought" recs; saved frames per user; financing
