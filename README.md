# FunDogs

Two **independent** npm packages: **`frontend/`** (Next.js) and **`backend/`** (NestJS + Prisma + Postgres). Optional **Supabase** SQL remains in `supabase/migrations/` if you later move the database to Postgres.

## Prerequisites

- Node.js 20+

## Backend (`fundogs-backend`)

```bash
cd backend
cp .env.example .env   # edit JWT_SECRET, DATABASE_URL, FRONTEND_ORIGIN, ADMIN_* as needed
npm install
npx prisma db push
npm run db:seed
npm run start:dev
```

API base URL: **`http://localhost:4000/api`** (see `PORT` in `.env`).

### Auth & roles

- **USER** — register at `/auth/register`; can **create campaigns** (pending admin approval) and **comment** on approved & published campaigns.
- **ADMIN** — created by **seed** using `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (defaults in `.env.example`). Can **approve/reject campaigns** and **moderate comments** via `/admin/*` API routes (wired in the frontend under `/admin`).

### Main API routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create USER account, returns JWT |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | Bearer | Current user |
| GET | `/api/campaigns` | — | Public approved campaigns |
| GET | `/api/campaigns/me` | Bearer | Your campaigns (all states) |
| POST | `/api/campaigns` | Bearer | Submit new campaign (pending approval) |
| GET | `/api/campaigns/:slug` | Optional Bearer | Public, or author/admin preview |
| GET/POST | `/api/campaigns/:slug/comments` | GET optional / POST Bearer | Comments |
| POST | `/api/campaigns/:slug/donations` | — | Manual donation row |
| GET | `/api/admin/campaigns/pending` | Admin | Queue |
| PATCH | `/api/admin/campaigns/:id/approve` | Admin | Approve → published |
| PATCH | `/api/admin/campaigns/:id/reject` | Admin | Reject |
| GET | `/api/admin/comments/pending` | Admin | Queue |
| PATCH | `/api/admin/comments/:id` | Admin | Body `{ "status": "visible" \| "rejected" }` |

JWT: send `Authorization: Bearer <token>` (frontend stores token in `localStorage`).

## Frontend (`fundogs-frontend`)

```bash
cd frontend
cp .env.example .env.local
# set NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev
```

Without `NEXT_PUBLIC_API_URL`, the donate/home pages fall back to local mock data in `src/lib/data.ts`. With it set, lists load from the API; **login, register, campaign pages, admin, and “my campaigns” require the API**.

## Deploy to production

Typical split: **Render** for the API, **Vercel** for the Next.js app. Both need a hosted **Postgres** database (Render Postgres or Supabase). Copy connection strings from `backend/.env.example`; URL-encode special characters in the database password.

Schema changes use `npx prisma db push` (there is no Prisma migration history in this repo yet).

### Render (backend)

Create a **Web Service** from this repo.

| Setting | Value |
|--------|--------|
| Root Directory | `backend` |
| Runtime | Node 20+ |
| Build Command | `npm install && npm run build && npx prisma db push` |
| Start Command | `node dist/src/main` |

Do not set `PORT`; Render provides it. The compiled entrypoint is `dist/src/main.js` (not `dist/main.js`).

**Environment variables** (see `backend/.env.example`):

- `DATABASE_URL`, `DIRECT_URL`
- `JWT_SECRET`
- `FRONTEND_ORIGIN` — comma-separated browser origins, no trailing slash (e.g. `https://your-app.vercel.app` and any preview URLs you use)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` — for the first `npm run db:seed` only
- `PAYMONGO_SECRET_KEY`, `PAYMONGO_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — if payments are enabled

After the first successful deploy, run **`npm run db:seed`** once (Render Shell or a machine that can reach the DB with the same env).

Payment webhooks must use the public API base and the `/api` prefix, for example `https://your-api.onrender.com/api/webhooks/stripe` and `https://your-api.onrender.com/api/webhooks/paymongo`.

Uploaded images are stored on the service filesystem under `uploads/`. Render’s default disk is ephemeral, so files can disappear on redeploy unless you add persistent storage or move uploads to object storage.

### Vercel (frontend)

Import the repo and create a project with **Root Directory** `frontend`.

| Setting | Value |
|--------|--------|
| Framework Preset | Next.js |
| Build Command | `npm run build` (default) |
| Output | Next.js default |

Set **Environment Variables** before the first production build (see `frontend/.env.example`):

- `NEXT_PUBLIC_API_URL` — `https://your-api.onrender.com/api` (or `https://your-api.onrender.com`; the app adds `/api` when needed)
- `NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY` — publishable key (`pk_test_…` / `pk_live_…`), not a secret key or PaymentIntent client key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — if you use Stripe in the browser

Redeploy after changing any `NEXT_PUBLIC_*` value; those are baked in at build time.

### Wire-up order

1. Provision Postgres and deploy the **Render** backend; confirm `https://your-api.onrender.com/api/campaigns` responds.
2. Set `NEXT_PUBLIC_API_URL` on **Vercel** and deploy the frontend.
3. Set `FRONTEND_ORIGIN` on **Render** to your Vercel URL(s) and redeploy the backend so CORS allows the browser origin.
4. Smoke-test login, campaigns, uploads, and donations.

### Production notes

- Change **`JWT_SECRET`** and the seeded admin password before going live.
- Move off `localStorage` for tokens if you need httpOnly cookies or SSR auth.
