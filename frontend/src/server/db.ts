import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function mongodbUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error(
      "DATABASE_URL is not set. Add your MongoDB Atlas connection string in Vercel → Environment Variables.",
    );
  }
  const timeoutParams = "serverSelectionTimeoutMS=5000&connectTimeoutMS=5000";
  if (/serverSelectionTimeoutMS=/i.test(raw)) return raw;
  return raw.includes("?") ? `${raw}&${timeoutParams}` : `${raw}?${timeoutParams}`;
}

if (process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = mongodbUrl();
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;

/** Fail an API handler if Prisma/Mongo never answers (Atlas IP block hangs otherwise). */
export async function withDbTimeout<T>(work: Promise<T>, ms = 8000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new Error(
              "Database connection timed out. In MongoDB Atlas → Network Access, allow 0.0.0.0/0. On Vercel, set DATABASE_URL (with /fundogs in the path) for Production and redeploy.",
            ),
          );
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
