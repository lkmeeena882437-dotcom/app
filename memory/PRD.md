# Oculux AI Glasses — Flagship E-commerce Storefront

## Original Problem Statement
Build an ultra-premium, flagship-level e-commerce storefront for "Oculux AI Glasses" benchmarked against Ray-Ban Meta + Oakley. Three audience tiers (Kids, Youth/Professionals, Seniors). Cinematic 4K/8K aesthetic, dark mode foundation with subtle cyber/AI cyan accents. Glass-morphic minimalist navigation, scroll-triggered tech-spec teardown, AR webcam try-on, social reels grid, 3D 360° viewer, floating support widget, Stripe-secured checkout, JWT auth.

## User Choices (1st session, Feb 2026)
1. Full functional storefront (catalog + cart + Stripe checkout + auth)
2. Stripe (test mode)
3. Real webcam-based AR overlay
4. Placeholder curated cinematic imagery (user provides assets later)
5. JWT-based custom auth

## Architecture
- **Frontend:** React 19 + craco + Tailwind + shadcn primitives + framer-motion + sonner. Routes under react-router-dom v7.
- **Backend:** FastAPI on `:8001`, all routes prefixed `/api`. Motor async MongoDB. JWT via `pyjwt` + bcrypt. Stripe via `emergentintegrations`.
- **Mongo collections:** `products`, `users`, `orders`, `payment_transactions`, `newsletter`.
- **Design system:** Obsidian Black palette (#050505) + Cyber Cyan accent (#00F0FF), Clash Display (headings) + Outfit (body) + JetBrains Mono (meta). Glass-morphism navigation, scroll-triggered teardown, marquee press strip.

## Implemented (Feb 15, 2026)
- Cinematic full-bleed hero, glass-morphic nav, 3-tier audience cards
- Scroll-triggered "teardown" tech spec section with pulsing hotspots
- Social Reels (vertical 9:16) grid
- Shop with tier-filter chips; PDP with 360° viewer, gallery thumbs, Add-to-cart & Buy now
- AR Try-On webcam + on-screen glasses overlay with scale & vertical sliders
- Cart drawer + Cart page, JWT signup/signin, Account + Orders
- Stripe Checkout session create + polling on success/cancel routes; idempotent order creation
- Newsletter signup, floating concierge support widget, footer marquee
- Backend seeded with 6 products across 3 tiers
- Tested: 20/20 backend pytest + full frontend E2E (100% pass)

## P0/P1/P2 Backlog
- **P1**: Replace placeholder reels with real vertical video assets; embed real cinematic hero video provided by user.
- **P1**: Real face-tracking AR (MediaPipe FaceMesh) for mesh-locked frame physics.
- **P2**: Admin dashboard for products/orders; saved frames per user; email receipts via SendGrid; order tracking.
- **P2**: Multi-currency + locale switcher; reviews & ratings; live concierge chat (LLM-powered).
- **P2**: Trade-in flow, prescription lens upgrade, financing (Affirm).

## Next Tasks
- Add cinematic hero video once user uploads media assets
- Wire MediaPipe FaceMesh into ARTryOn for true face-locked frames
- Add product reviews + “People also bought” recommendation strip
