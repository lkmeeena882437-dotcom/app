# Oculux AI Glasses — Flagship E-commerce Storefront

## Original Problem Statement
Build an ultra-premium, flagship-level e-commerce storefront for "Oculux AI Glasses" benchmarked against Ray-Ban Meta + Oakley. Three audience tiers (Kids, Youth/Professionals, Seniors). Cinematic 4K/8K aesthetic.

## Iteration Log

### Iteration 1 (Feb 15, 2026) — MVP
- Dark cinematic theme; cyan glow accents; cinematic hero, glass-morphic nav, 3-tier audience cards
- Scroll-triggered "teardown" tech-spec section; Social Reels grid (9:16)
- Shop + PDP + 360° viewer; slider-based AR overlay; Cart drawer + Cart page
- JWT signup/signin + Account/Orders; Stripe Checkout (test mode) + polling on success/cancel
- Newsletter signup, concierge support widget
- 6 seeded products across 3 tiers
- **Tests: 20/20 backend + full frontend E2E**

### Iteration 2 (Feb 15, 2026) — Light-mode + AR + Admin + Email
- **Full Light-Mode Overhaul**: every page re-themed to Apple/premium-auto aesthetic
  - Background palette: `#FFFFFF` + `#F5F5F7` soft floors
  - Typography: Clash Display + Outfit on near-black `#0A0A0B`/`#1D1D1F`
  - Removed all cyan/neon; replaced with matte silver borders + ink black CTAs
- **Real MediaPipe FaceMesh AR Try-On**: `@mediapipe/tasks-vision@0.10.14` loaded via CDN ESM at runtime; face-locked glasses overlay tracks eye landmarks (33/263) with rotation; size & bridge fine-tune sliders for personal preference
- **Admin Dashboard** (`/admin`): Overview stats (revenue/orders/products/users), Products CRUD with modal form, Orders table, Users table. Role-gated via `is_admin` JWT claim; seeded admin `admin@oculux.com` / `OculuxAdmin#2026`
- **Resend email receipts**: HTML receipt fires async on payment confirmation; gracefully no-ops when `RESEND_API_KEY` is empty
- Backend endpoints added: `/api/admin/{stats,products,orders,users}` (GET) + product `POST/PUT/DELETE`
- Stock decrement on order; order persistence keyed to session_id (idempotent)
- **Tests: 28/28 backend + frontend ~90%** (only test-ergonomics items, no real bugs). Added data-testids on Admin tabs, form fields, row actions.

## P0/P1/P2 Backlog
- **P1**: Real cinematic hero video once user uploads assets
- **P1**: Re-hash admin password on startup if `ADMIN_PASSWORD` env differs
- **P1**: Admin offline-fallback message if MediaPipe CDN is blocked
- **P2**: Reviews & ratings; "People also bought" recs; email beyond receipts (shipped/refund)
- **P2**: Currency + locale switcher; trade-in flow; financing (Affirm)
- **P2**: Split server.py into `routers/{admin,payments,email,products}.py`

## Test Credentials (current)
- Admin: `admin@oculux.com` / `OculuxAdmin#2026`
- Customer: register fresh; Stripe test card: `4242 4242 4242 4242`

## Next Tasks
- Add cinematic hero video / 4K product photography from user
- Drop in real Resend API key → email receipts will activate automatically
- Optional: split backend into routers for clarity
