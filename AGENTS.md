# Upiti — Agent Guide

## Commands
```bash
npm run dev          # dev server
npm run build        # production build
npm run dev:mobile   # expose on LAN (192.168.x.x:3000) for phone testing
npm run lint         # ESLint
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier write
npm run typecheck    # tsc --noEmit
npm run validate     # lint + format:check + typecheck
npm run clean        # rimraf .next (fixes stale-cache bugs)
```

## Stack
- Next.js 16 App Router, **JavaScript** (not TS; tsconfig exists for typecheck only)
- Tailwind CSS v4 (`@tailwindcss/postcss`, no `tailwind.config.js`)
- Supabase (Auth, PostgreSQL, Storage buckets: `avatars`, `products`, `banners`)
- react-hook-form + `@hookform/resolvers` + zod for forms
- framer-motion for animations, embla-carousel for carousels
- Husky pre-commit hook runs `lint-staged` (ESLint fix + Prettier)

## Route Structure
| Path | File |
|---|---|
| `/` | `src/app/page.js` — product listing with Hero |
| `/login` | `src/app/login/page.js` |
| `/register` | `src/app/register/page.js` — multi-step form |
| `/dashboard` | `src/app/dashboard/page.js` — seller panel + admin panel + add product form |
| `/dashboard/perfil` | `src/app/dashboard/perfil/page.js` — profile edit |
| `/producto/[slug]` | `src/app/producto/[slug]/page.js` — public product detail (backward compat con UUID) |
| `/vendedor/[slug]` | `src/app/vendedor/[slug]/page.js` — public seller profile + reviews (backward compat con UUID) |
| `/terminos` | `src/app/terminos/page.js` |
| `/privacidad` | `src/app/privacidad/page.js` |

## Key Conventions
- **All pages are `"use client"`** — even ones that could be server components
- **`@next/next/no-img-element` is OFF** — always use `<img>` not `<Image>`
- **Path alias** `@/*` → `./src/*` (jsconfig.json), but most files use relative `../../../lib/` paths
- **React Compiler** enabled (`reactCompiler: true` in next.config.mjs)
- **Text inputs** must use `maxLength` + Zod `.max()` + `.trim()` — every schema field is bounded (50–1000 chars depending on field)
- **WhatsApp**: stored as 3 separate columns (`whatsapp_region`, `whatsapp_area`, `whatsapp_number_local`), concatenated via `concatParts()` in `src/lib/phone.js`
- **Niches**: stored as comma-separated text column, displayed as pills
- **Social links**: stored as JSON array `[{label, url}]` in `social_links` column
- **Delivery option**: `delivery_option` column, values `"delivery"` / `"pickup"`
- **Rating**: DB reviews use 1–5 scale; display max is 5.5 (percentage = avg / 5.5 × 100)

## Database Migrations
- All in `supabase/migrations/`, numbered `001_*` to `012_*`
- Must be applied **in order** via Supabase SQL Editor
- Key tables: `profiles`, `products`, `reviews`, `store_config`
- Admin role set via SQL: `UPDATE public.profiles SET role = 'admin', is_verified = true WHERE email = '...'`

## Env Variables (all `NEXT_PUBLIC_*`)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_STORE_NAME
NEXT_PUBLIC_WHATSAPP_NUMBER
NEXT_PUBLIC_CURRENCY          # default "$"
NEXT_PUBLIC_MAIN_COLOR        # default "#ed355d"
```
`.env*` files are gitignored; `.env.local` exists locally.

## Build / Deploy
- `next build` succeeds with zero errors (verify before committing)
- Deployed on Vercel via `npx vercel` (preview) / `npx vercel --prod`
- **No tests** exist — no test framework, no test files
