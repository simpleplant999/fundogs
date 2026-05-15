/**
 * Render build step: apply Prisma schema after nest build.
 * Requires DIRECT_URL (direct/session Postgres) — not the transaction pooler on :6543.
 */
import { execSync } from 'node:child_process';

const direct = process.env.DIRECT_URL?.trim();
if (!direct) {
  console.error(
    [
      '[render-db-push] DIRECT_URL is not set.',
      'Prisma db push needs a direct Postgres connection (see backend/.env.example).',
      'Supabase: use db.<ref>.supabase.co:5432 or session pooler host:5432.',
      'Do not use the transaction pooler (:6543?pgbouncer=true) as DIRECT_URL.',
    ].join('\n'),
  );
  process.exit(1);
}

if (/pgbouncer=true|:6543\b/i.test(direct)) {
  console.warn(
    '[render-db-push] Warning: DIRECT_URL looks like a transaction pooler. db push may hang or fail.',
  );
}

console.log('[render-db-push] Applying schema (prisma db push)...');
execSync('npx prisma db push', { stdio: 'inherit', env: process.env });
console.log('[render-db-push] Schema applied.');
