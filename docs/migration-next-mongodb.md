# Next App Router API + MongoDB migration

Branch: `feat/next-api-mongodb`

## Goal

1. Move the NestJS API into Next.js App Router Route Handlers under `frontend/src/app/api/**`.
2. Replace Supabase-hosted Postgres with **MongoDB** (Prisma 6 + MongoDB provider).

Prisma **7 does not support MongoDB yet** — this app pins `@prisma/client` / `prisma` to **6.19.x**.

## Status

### Done (~59 Route Handlers)

- Auth: register, login, me, profile-photo
- Campaigns: list/create/me/update, images upload, slug detail, donors, comments, updates
- Creator: bank-account, withdrawals, updates CRUD
- Donations: manual + Stripe (intent/checkout/sync) + PayMongo (qr/card/sync)
- Support FunDogs PayMongo flows
- Webhooks: Stripe + PayMongo (raw body)
- Organizations (public) + organization-membership (edit, members, photo uploads)
- Users public profile
- Admin: summary, users, orgs, campaigns, comments, contact-messages, withdrawals
- Contact form
- Seed: `frontend/prisma/seed.ts`
- Frontend default API base: `/api`

### Still optional / Nest leftovers

- Keep `backend/` until production cutover is verified
- Point Stripe/PayMongo webhook URLs at the Next deploy:  
  `https://YOUR_DOMAIN/api/webhooks/stripe` and `.../paymongo`
- Mobile app: set API URL to the Next origin + `/api`
- Uploads live on local/ephemeral disk under `public/uploads/` — use object storage for production

## Local setup

```bash
cd frontend
cp .env.example .env.local   # or edit .env
# DATABASE_URL=mongodb+srv://.../fundogs?retryWrites=true&w=majority
# JWT_SECRET=...
npx prisma db push
npm run db:seed
npm run dev
```

Smoke: `http://localhost:3000/api/campaigns` and `/admin` (admin user).

## Vercel: hung login / register / donate

Those routes wait on MongoDB. If Atlas cannot be reached, the request spins until the browser times out.

1. **Vercel → Project → Settings → Environment Variables** (Production): `DATABASE_URL`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL=/api`. Redeploy after changing env vars.
2. **MongoDB Atlas → Network Access**: add `0.0.0.0/0` (Allow access from anywhere). Vercel functions do not use a single IP.
3. **Atlas connection string** must include a database name: `...mongodb.net/fundogs?...`
4. Check `https://YOUR_DOMAIN/api/health` — it should return `{ "ok": true, "database": "connected" }` instead of hanging.
