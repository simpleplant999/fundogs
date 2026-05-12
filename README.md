# FunDogs

Two **independent** npm packages: **`frontend/`** (Next.js) and **`backend/`** (NestJS + Prisma SQLite). Optional **Supabase** SQL remains in `supabase/migrations/` if you later move the database to Postgres.

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

## Production notes

- Change **`JWT_SECRET`** and admin password; prefer Postgres (`DATABASE_URL`) over SQLite for production.
- Move off `localStorage` for tokens if you need httpOnly cookies / SSR auth.
