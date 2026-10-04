# AURA Dynamic QR & Scan Analytics Subsystem

A lightweight, production-grade dynamic QR redirect, privacy-preserving scan analytics, and customizer styling subsystem for the AURA Next.js + Supabase platform. Adapted from proven architectural patterns in QRForge and QR Track.

---

## 1. Architecture Overview

The system strictly decouples **Routing & Tracking** from **QR Visual Styling**:

```text
Printed QR (Encodes: https://join-aura.vercel.app/r/aura)
  │
  ▼
GET /r/[code] (Next.js Route Handler)
  ├── 1. Rate limiting check (sliding window in memory)
  ├── 2. Safe format validation (reject invalid slugs)
  ├── 3. Query dynamic destination from public.qr_codes (Supabase)
  ├── 4. Server-side metadata extraction (Geo via Vercel, UA, Bot detection)
  ├── 5. Ephemeral salted hash (IP + UA -> visitor_hash; raw IP discarded)
  ├── 6. Non-blocking scan event write to public.qr_scans
  └── 7. 302 Temporary Redirect to destination URL
```

The printed QR code remains permanent and valid even when the destination URL, marketing campaign, or club recruitment portal updates.

### File Tree

```text
aura_club_web/
├── app/
│   ├── r/
│   │   └── [code]/
│   │       └── route.ts            # Fast 302 redirect & scan ingestion
│   └── qr/
│       └── page.tsx                # Studio page hosting QR Customizer
├── components/
│   └── qr/
│       └── QrCustomizer.tsx        # Client visual QR styling studio
├── qr/
│   ├── types.ts                    # TypeScript data contracts & DTOs
│   ├── tracking.ts                 # Vercel Geo, UA parsing, privacy hashing
│   ├── analytics.ts                # Server-only Supabase queries & aggregations
│   ├── generator.ts                # qr-code-styling wrapper & contrast checker
│   └── README.md                   # Architecture & operations documentation
└── supabase/
    └── migrations/
        └── 0002_qr_tracking.sql    # Schema, indexes, RLS, and seed data
```

---

## 2. Privacy & Deterministic Visitor Hashing

To strictly adhere to GDPR, privacy standards, and data minimization:

1. **Zero Raw IP Persistence**:
   - Client IP addresses are extracted transiently in memory solely to compute `visitor_hash`.
   - Raw IP addresses are **never** passed to the database, logged to persistent disks, or exposed in analytics.
2. **Salted Hashing Strategy**:
   - `user_agent_hash`: `SHA-256(User-Agent)`
   - `visitor_hash`: `SHA-256(QR_SALT + ":" + Client-IP + ":" + User-Agent)`
   - Using a server-side secret salt (`QR_SALT` or fallback to secret key) prevents rainbow-table correlation attacks.
3. **Honest Metric Representation**:
   - Dashboards and analytics represent distinct `visitor_hash` values as **"Estimated Unique Devices"**, never as verified individual human beings.
4. **Bot Detection**:
   - Known search engines, preview crawlers (Slack, WhatsApp, Twitter, LinkedIn), and HTTP clients (curl, python) are flagged with `is_bot = true` and tallied separately from human engagement.

---

## 3. Vercel Hobby Plan & Edge/Serverless Quota Impact

### Does this impact Vercel free tier limits?
- **Vercel Hobby Plan Quota**: 1,000,000 Serverless/Edge Function Invocations per month (under Vercel Fluid Compute).
- **Execution Overhead**:
  - `/r/[code]` runs as a fast Node.js route handler (`export const runtime = "nodejs"`).
  - Average execution duration: **20ms - 45ms**.
  - Database queries are indexed (`qr_codes_code_idx`).
  - Scan insertions are fast, single-row writes.
- **Why Cache-Control is No-Store**:
  - The redirect response explicitly sends `Cache-Control: private, no-cache, no-store, must-revalidate`.
  - Statically caching redirects on a CDN would prevent subsequent scans from hitting the server, breaking analytics accuracy.
- **Capacity**:
  - 1M invocations / month allows **~33,300 QR scans per day** on the free tier.
  - Generous in-memory sliding-window rate limit (`redirectLimiter`: 120 requests/min per IP) shields the endpoint from malicious loops or bot flood spikes.

---

## 4. Security & Row Level Security (RLS)

1. **Database Isolation**:
   - Both `public.qr_codes` and `public.qr_scans` have Row Level Security enabled.
   - `revoke all on public.qr_codes from anon, authenticated;`
   - `revoke all on public.qr_scans from anon, authenticated;`
   - Public anon API clients cannot read scan logs, scrape visitor counts, or edit destinations.
2. **Elevated Server Access Only**:
   - Scan recording and analytics queries execute exclusively via `getSupabaseAdmin()` using `SUPABASE_SERVICE_ROLE_KEY`.
   - The service role key is marked server-only and is never bundled in client code.
3. **Redirect URL Validation**:
   - `isValidDestinationUrl()` validates all URLs:
     - Only `http:` and `https:` schemes permitted.
     - Dangerous schemes (`javascript:`, `data:`, `file:`, `vbscript:`, `blob:`) are blocked.
     - Maximum URL length capped at 2,048 characters.
     - Control characters and newlines are rejected.

---

## 5. Visual Customizer Engine (`qr/generator.ts`)

- Powered by `qr-code-styling` without custom manual rendering math.
- Features:
  - **Frames**: None, Top Banner, Bottom Banner, Club Badge, Polaroid Card, Phone Mockup.
  - **Shapes**: Square, Circular Dots, Rounded, Classy, Classy Rounded, Extra Rounded.
  - **Corners**: Eye frame & eye ball shapes and color customization.
  - **Colors**: Foreground, background, dual-color linear/radial gradients.
  - **Logos**: AURA emblem preset or custom image upload with size & margin controls.
  - **CTA Text**: Customizable callout text, font colors, and frame background colors.
  - **Contrast & Scannability Warning**:
    - Calculates WCAG 2.1 relative luminance and contrast ratios in real time.
    - Warns if contrast ratio < 4.0:1 or if colors are inverted (light QR on dark background).
    - Ensures Error Correction Level `'H'` (30% recovery) so center logos never compromise barcode scannability.
  - **Export**: Instant SVG or PNG download.

---

## 6. Supabase Migration & Operational Setup

### Running the Migration

Run `supabase/migrations/0002_qr_tracking.sql` directly in your Supabase project:

1. Open your Supabase Dashboard: `https://supabase.com/dashboard/project/nsssdbepokzmbpeyqsqd/sql`
2. Paste the contents of `supabase/migrations/0002_qr_tracking.sql`.
3. Click **Run**.

Alternatively, if Supabase CLI is authenticated:
```bash
supabase db push
```

### Environment Variables

In `.env.local` (and Vercel Project Settings for Production):

```env
SUPABASE_URL=https://nsssdbepokzmbpeyqsqd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret_key
NEXT_PUBLIC_SUPABASE_URL=https://nsssdbepokzmbpeyqsqd.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
QR_SALT=your_random_secret_salt_string
```

### Verification & Testing

Execute the comprehensive test suite verifying all 15 acceptance criteria:

```bash
node scripts/verify-qr-subsystem.mjs --gate all
```
